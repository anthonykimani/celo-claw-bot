import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ReserveEvent } from '@database/entities/reserve-event.entity';

@Injectable()
export class ReserveEventRepository extends Repository<ReserveEvent> {
  constructor(dataSource: DataSource) {
    super(ReserveEvent, dataSource.createEntityManager());
  }

  async sumByAgent(agentId: string): Promise<string> {
    const res = await this.createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount_cusd), 0)', 'sum')
      .where('e.agent_id = :agentId', { agentId })
      .getRawOne<{ sum: string }>();
    return res?.sum ?? '0';
  }
}
