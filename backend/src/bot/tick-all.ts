import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AgentRepository } from '@database/repositories/agent.repository';
import { MarketRepository } from '@database/repositories/market.repository';
import { OrdersService } from '@modules/orders/orders.service';
import { OrderSide, OrderType, OrderOutcome } from '@database/entities/order.entity';

type StrategyParams = {
  minLiquidityUsd: number;
  maxMarkets: number;
  minEdgeBps: number;
  maxOrderNotionalUsd: number;
  maxOrdersPerTick: number;
};

function getArg(name: string): string | undefined {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function clampPrice(p: number): number {
  return Math.min(0.999, Math.max(0.001, p));
}

function defaultParamsForAgent(agentIndex: number): StrategyParams {
  // 10 agents: cycle through conservative/balanced/aggressive profiles.
  const profiles: StrategyParams[] = [
    { minLiquidityUsd: 5000, maxMarkets: 3, minEdgeBps: 60, maxOrderNotionalUsd: 5, maxOrdersPerTick: 1 }, // conservative
    { minLiquidityUsd: 2500, maxMarkets: 5, minEdgeBps: 35, maxOrderNotionalUsd: 7.5, maxOrdersPerTick: 1 }, // balanced
    { minLiquidityUsd: 1000, maxMarkets: 8, minEdgeBps: 20, maxOrderNotionalUsd: 10, maxOrdersPerTick: 2 }, // aggressive
  ];
  return profiles[agentIndex % profiles.length];
}

async function main() {
  const concurrency = parseInt(getArg('concurrency') ?? '3', 10);
  const limitAgents = parseInt(getArg('limitAgents') ?? '10', 10);

  // This runner is short-lived; disable the long-lived websocket feature to avoid hanging shutdown.
  process.env.POLYMARKET_WEBSOCKET_ENABLED = 'false';

  if (process.env.TRADING_DISABLED === 'true') {
    console.log('TRADING_DISABLED=true; exiting without trading.');
    process.exit(0);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const agentRepo = app.get(AgentRepository);
    const marketRepo = app.get(MarketRepository);
    const ordersService = app.get(OrdersService);

    const agents = await agentRepo.find({
      where: { tradingEnabled: true },
      order: { createdAt: 'ASC' },
      take: limitAgents,
    });

    if (agents.length === 0) {
      console.log('No trading-enabled agents found; nothing to do.');
      return;
    }

    console.log(`tick-all: agents=${agents.length}, concurrency=${concurrency}`);

    // Very small, safe concurrency pool
    const queue = [...agents.entries()];
    const workers = Array.from({ length: Math.max(1, Math.min(concurrency, agents.length)) }).map(async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) return;
        const [idx, agent] = next;

        const baseParams = defaultParamsForAgent(idx);
        const params: StrategyParams = {
          ...baseParams,
          ...(agent.strategyParams ?? {}),
        };

        const marketsQb = marketRepo
          .createQueryBuilder('market')
          .where('market.active = true')
          .andWhere('market.closed = false')
          .andWhere('market.condition_id IS NOT NULL');

        // Liquidity filter (nullable liquidity treated as 0)
        marketsQb.andWhere('COALESCE(market.liquidity, 0) >= :minLiquidity', { minLiquidity: params.minLiquidityUsd });
        marketsQb.orderBy('market.liquidity', 'DESC', 'NULLS LAST');
        marketsQb.take(params.maxMarkets);

        const markets = await marketsQb.getMany();

        if (markets.length === 0) {
          console.log(`agent=${agent.id} (${agent.name}): no eligible markets (minLiquidityUsd=${params.minLiquidityUsd})`);
          continue;
        }

        const now = new Date();
        const minuteKey = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

        let placed = 0;
        for (const market of markets) {
          if (placed >= params.maxOrdersPerTick) break;

          const yesPrice = parseFloat(market.outcomeYesPrice || '0');
          if (!Number.isFinite(yesPrice) || yesPrice <= 0) continue;

          const edge = params.minEdgeBps / 10000;
          const targetPrice = clampPrice(yesPrice - edge);

          // Notional-based sizing: quantity ~= notional / price
          const qty = params.maxOrderNotionalUsd / targetPrice;
          const quantity = qty.toFixed(6);

          const idempotencyKey = `bot:${agent.id}:${market.id}:${minuteKey}`;

          try {
            await ordersService.createOrder(
              {
                marketId: market.id,
                side: OrderSide.BUY,
                type: OrderType.LIMIT,
                outcome: OrderOutcome.YES,
                quantity,
                price: targetPrice.toFixed(4),
                agentId: agent.id,
                metadata: {
                  source: 'bot:tick-all',
                  minEdgeBps: params.minEdgeBps,
                  minLiquidityUsd: params.minLiquidityUsd,
                },
              } as any,
              idempotencyKey,
            );

            placed += 1;
          } catch (e) {
            console.warn(`agent=${agent.id}: failed to create order on market=${market.id}: ${(e as Error).message}`);
          }
        }

        console.log(`agent=${agent.id} (${agent.name}): placed=${placed}/${params.maxOrdersPerTick}, marketsScanned=${markets.length}`);
      }
    });

    await Promise.all(workers);
  } finally {
    await app.close();
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
