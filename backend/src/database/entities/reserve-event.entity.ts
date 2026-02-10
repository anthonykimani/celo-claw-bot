import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Agent } from './agent.entity';

@Entity('reserve_events')
@Index('idx_reserve_events_agent_created', ['agentId', 'createdAt'])
export class ReserveEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId: string;

  @Column({
    name: 'amount_cusd',
    type: 'decimal',
    precision: 18,
    scale: 8,
  })
  amountCusd: string;

  @Column({ name: 'tx_hash', type: 'varchar', nullable: true })
  txHash: string | null;

  @Column({ name: 'note', type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Agent, (agent) => agent.reserveEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;
}
