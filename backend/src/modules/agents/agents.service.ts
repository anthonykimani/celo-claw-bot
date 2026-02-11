import { Injectable, BadRequestException } from '@nestjs/common';
import { AgentRepository, ReserveEventRepository } from '@database/repositories';
import { CreateAgentDto } from './dto/create-agent.dto';
import { Agent, AgentRiskLevel } from '@database/entities/agent.entity';
import { UsdcTokenService } from '@common/services/usdc-token.service';
import { CeloCusdService } from '@common/services/celo-cusd.service';
import { ConfigService } from '@nestjs/config';
import { SettleReserveDto } from './dto/settle-reserve.dto';

@Injectable()
export class AgentsService {
  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly reserveRepo: ReserveEventRepository,
    private readonly usdcTokenService: UsdcTokenService,
    private readonly celoCusdService: CeloCusdService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateAgentDto): Promise<Agent> {
    const agent = this.agentRepo.create({
      name: dto.name,
      strategyType: dto.strategyType ?? 'crypto',
      riskLevel: (dto.riskLevel ?? AgentRiskLevel.MEDIUM) as any,
      personality: dto.personality ?? null,
      tradingEnabled: dto.tradingEnabled ?? true,
      reserveAddress: dto.reserveAddress ?? null,
    });

    // Initialize lastTradingBalance to current funder balance (or 0 if unavailable).
    try {
      const funder = this.usdcTokenService.getFunderAddress();
      if (funder) {
        const bal = await this.usdcTokenService.getBalance(funder);
        agent.lastTradingBalanceUsdc = bal;
      }
    } catch {
      // ignore
    }

    return this.agentRepo.save(agent);
  }

  async listPublic(limit = 50, offset = 0) {
    const { data, total } = await this.agentRepo.findPublic(limit, offset);

    const mapped = await Promise.all(
      data.map(async (a) => {
        // Reserve total in cUSD (off-chain sum of on-chain tx receipts).
        const reserveTotal = await this.reserveRepo.sumByAgent(a.id);

        return {
          id: a.id,
          name: a.name,
          imageUrl: null,
          twitterHandle: null,
          strategy: a.strategyType,
          personality: a.personality,
          tradingEnabled: (a.tradingEnabled ? 1 : 0) as 0 | 1,
          balance: Number(a.lastTradingBalanceUsdc),
          totalPnL: Number(a.totalPnlUsdc),
          totalTrades: a.totalTrades,
          winningTrades: a.winningTrades,
          winRate: Number(a.winRate),
          token: {
            address: null,
            symbol: 'cUSD',
            priceUsd: 1,
            priceChange24h: 0,
            marketCap: Number(reserveTotal),
            volume24h: null,
          },
          createdAt: a.createdAt.getTime(),
        };
      }),
    );

    return {
      success: true,
      data: mapped,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async listReserveEvents(id: string, limit = 50, offset = 0) {
    // Validate agent exists
    await this.get(id);

    const { rows, total } = await this.reserveRepo.listByAgent(id, limit, offset);

    return {
      data: rows.map((e) => ({
        id: e.id,
        agentId: e.agentId,
        amountCusd: Number(e.amountCusd),
        txHash: e.txHash,
        note: e.note,
        createdAt: e.createdAt.getTime(),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async settleReserve(id: string, dto: SettleReserveDto) {
    const agent = await this.get(id);

    const minDelta = dto.minDeltaUsdc ? parseFloat(dto.minDeltaUsdc) : 1.0;

    // Compute net USDC delta against last baseline (funder balance)
    const funder = this.usdcTokenService.getFunderAddress();
    const currentUsdc = parseFloat(await this.usdcTokenService.getBalance(funder));
    const lastBaseline = parseFloat(agent.lastTradingBalanceUsdc ?? '0');

    const delta = currentUsdc - lastBaseline;

    if (delta < minDelta) {
      return {
        reserved: false,
        reason: `Delta ${delta.toFixed(6)} USDC is below threshold ${minDelta.toFixed(6)}`,
        funderAddress: funder,
        currentUsdc,
        lastBaseline,
        delta,
      };
    }

    const reserveAddress = dto.reserveAddress ?? agent.reserveAddress ?? this.configService.get<string>('celo.reserveAddress');

    if (!reserveAddress) {
      throw new BadRequestException('Reserve address not configured (set agent.reserveAddress or CELO_RESERVE_ADDRESS)');
    }

    const maxAmount = dto.maxAmountCusd ? parseFloat(dto.maxAmountCusd) : delta;
    const amountToReserve = Math.max(0, Math.min(delta, maxAmount));

    if (amountToReserve <= 0) {
      return {
        reserved: false,
        reason: 'Amount to reserve is 0',
        funderAddress: funder,
        currentUsdc,
        lastBaseline,
        delta,
      };
    }

    // MVP: assume 1 USDC ~= 1 cUSD and directly transfer cUSD from the Celo server wallet to the reserve wallet.
    // (This does NOT swap USDC->cUSD; you must keep the Celo server wallet funded with cUSD for now.)
    const txHash = await this.celoCusdService.transferToReserve(reserveAddress, amountToReserve.toFixed(6));

    const event = this.reserveRepo.create({
      agentId: agent.id,
      amountCusd: amountToReserve.toFixed(6),
      txHash,
      note: `Settled net USDC delta (${delta.toFixed(6)}) into cUSD reserve (MVP transfer).`,
    });
    await this.reserveRepo.save(event);

    // Update baseline so we don't repeatedly reserve the same delta.
    agent.lastTradingBalanceUsdc = currentUsdc.toFixed(8);
    await this.agentRepo.save(agent);

    return {
      reserved: true,
      funderAddress: funder,
      reserveAddress,
      currentUsdc,
      lastBaseline,
      delta,
      amountCusd: amountToReserve,
      txHash,
      reserveEventId: event.id,
    };
  }

  async get(id: string): Promise<Agent> {
    const agent = await this.agentRepo.findOne({ where: { id } });
    if (!agent) throw new BadRequestException('Agent not found');
    return agent;
  }
}
