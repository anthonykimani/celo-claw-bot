import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';

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

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by id (internal)' })
  async get(@Param('id') id: string) {
    const agent = await this.agentsService.get(id);
    return { success: true, data: agent };
  }
}
