import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { ReserveEvent } from './reserve-event.entity';

export const AgentRiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type AgentRiskLevel = (typeof AgentRiskLevel)[keyof typeof AgentRiskLevel];

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index('idx_agents_name')
  name: string;

  @Column({ name: 'strategy_type', length: 40, default: 'crypto' })
  strategyType: string;

  @Column({ name: 'risk_level', length: 10, default: AgentRiskLevel.MEDIUM })
  riskLevel: AgentRiskLevel;

  @Column({ name: 'personality', type: 'text', nullable: true })
  personality: string | null;

  @Column({ name: 'trading_enabled', type: 'boolean', default: true })
  tradingEnabled: boolean;

  @Column({ name: 'strategy_params', type: 'jsonb', nullable: true })
  strategyParams: Record<string, unknown> | null;

  // Snapshot of the Polymarket funder/trading wallet USDC balance, used for net-balance accounting.
  @Column({
    name: 'last_trading_balance_usdc',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: '0',
  })
  lastTradingBalanceUsdc: string;

  @Column({
    name: 'total_pnl_usdc',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: '0',
  })
  totalPnlUsdc: string;

  @Column({ name: 'total_trades', type: 'int', default: 0 })
  totalTrades: number;

  @Column({ name: 'winning_trades', type: 'int', default: 0 })
  winningTrades: number;

  @Column({ name: 'win_rate', type: 'decimal', precision: 6, scale: 2, default: '0' })
  winRate: string;

  @Column({ name: 'reserve_address', type: 'varchar', nullable: true })
  reserveAddress: string | null;

  @Column({ name: 'erc8004_agent_id', type: 'varchar', nullable: true })
  erc8004AgentId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ReserveEvent, (e) => e.agent)
  reserveEvents: ReserveEvent[];
}
