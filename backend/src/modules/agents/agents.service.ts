import { Injectable, BadRequestException } from '@nestjs/common';
import { AgentRepository, ReserveEventRepository } from '@database/repositories';
import { CreateAgentDto } from './dto/create-agent.dto';
import { Agent, AgentRiskLevel } from '@database/entities/agent.entity';
import { UsdcTokenService } from '@common/services/usdc-token.service';

@Injectable()
export class AgentsService {
  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly reserveRepo: ReserveEventRepository,
    private readonly usdcTokenService: UsdcTokenService,
  ) {}

  async create(dto: CreateAgentDto): Promise<Agent> {
    // Hackathon constraint: single agent. If one exists, reject.
    const existing = await this.agentRepo.find();
    if (existing.length > 0) {
      throw new BadRequestException('An agent already exists for this deployment');
    }

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

  async get(id: string): Promise<Agent> {
    const agent = await this.agentRepo.findOne({ where: { id } });
    if (!agent) throw new BadRequestException('Agent not found');
    return agent;
  }
}
