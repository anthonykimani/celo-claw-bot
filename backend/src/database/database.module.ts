import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { Market } from './entities/market.entity';
import { Token } from './entities/token.entity';
import { Order } from './entities/order.entity';
import { Agent } from './entities/agent.entity';
import { ReserveEvent } from './entities/reserve-event.entity';
import { EventRepository, MarketRepository, TokenRepository, OrderRepository, AgentRepository, ReserveEventRepository } from './repositories/index';
import { ProvidersModule } from '@providers/providers.module';

const entities = [Event, Market, Token, Order, Agent, ReserveEvent];

const repositories = [EventRepository, MarketRepository, TokenRepository, OrderRepository, AgentRepository, ReserveEventRepository];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(entities), ProvidersModule],
  providers: [...repositories],
  exports: [TypeOrmModule, ...repositories],
})
export class DatabaseModule {}
