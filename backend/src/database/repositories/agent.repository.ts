import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Agent } from '@database/entities/agent.entity';

@Injectable()
export class AgentRepository extends Repository<Agent> {
  constructor(dataSource: DataSource) {
    super(Agent, dataSource.createEntityManager());
  }

  async findPublic(limit = 50, offset = 0): Promise<{ data: Agent[]; total: number }> {
    const [data, total] = await this.createQueryBuilder('agent')
      .orderBy('agent.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return { data, total };
  }
}
