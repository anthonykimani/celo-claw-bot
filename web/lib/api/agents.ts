import { apiClient } from './client';
import type {
  AgentsListResponse,
  CreateAgentDto,
  CreateAgentResponse,
  AgentResponse,
  ReserveEventsResponse,
} from './types';

export interface GetAgentsParams {
  limit?: number;
  offset?: number;
}

export const agentsApi = {
  listPublic: async (params?: GetAgentsParams): Promise<AgentsListResponse> => {
    const response = await apiClient.get<AgentsListResponse>('/agents/public', { params });
    return response.data;
  },

  get: async (id: string): Promise<AgentResponse> => {
    const response = await apiClient.get<AgentResponse>(`/agents/${id}`);
    return response.data;
  },

  listReserveEvents: async (id: string, params?: GetAgentsParams): Promise<ReserveEventsResponse> => {
    const response = await apiClient.get<ReserveEventsResponse>(`/agents/${id}/reserve-events`, { params });
    return response.data;
  },

  create: async (payload: CreateAgentDto): Promise<CreateAgentResponse> => {
    const response = await apiClient.post<CreateAgentResponse>('/agents', payload);
    return response.data;
  },
};
