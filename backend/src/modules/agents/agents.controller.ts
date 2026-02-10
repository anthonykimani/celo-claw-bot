import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { SettleReserveDto } from './dto/settle-reserve.dto';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create (single) agent' })
  async create(@Body() dto: CreateAgentDto) {
    const agent = await this.agentsService.create(dto);
    return { success: true, data: agent };
  }

  @Get('public')
  @ApiOperation({ summary: 'List public agents' })
  @ApiResponse({ status: 200 })
  async listPublic(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.agentsService.listPublic(limit ? parseInt(limit, 10) : 50, offset ? parseInt(offset, 10) : 0);
  }

  @Post(':id/reserve/settle')
  @ApiOperation({ summary: 'Settle net USDC delta into cUSD reserve on Celo (MVP: direct cUSD transfer)' })
  async settleReserve(@Param('id') id: string, @Body() dto: SettleReserveDto) {
    const res = await this.agentsService.settleReserve(id, dto);
    return { success: true, data: res };
  }

  @Get(':id/reserve-events')
  @ApiOperation({ summary: 'List reserve events for an agent' })
  async listReserveEvents(@Param('id') id: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const res = await this.agentsService.listReserveEvents(id, limit ? parseInt(limit, 10) : 50, offset ? parseInt(offset, 10) : 0);
    return { success: true, ...res };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by id (internal)' })
  async get(@Param('id') id: string) {
    const agent = await this.agentsService.get(id);
    return { success: true, data: agent };
  }
}
