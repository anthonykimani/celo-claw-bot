import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '../api/agents';
import type { GetAgentsParams } from '../api/agents';
import type { CreateAgentDto } from '../api/types';

export const useAgents = (params?: GetAgentsParams) => {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => agentsApi.listPublic(params),
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAgentDto) => agentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};

export const useAgent = (id: string | null) => {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => (id ? agentsApi.get(id) : null),
    enabled: !!id,
  });
};

export const useReserveEvents = (id: string | null, params?: GetAgentsParams) => {
  return useQuery({
    queryKey: ['reserve-events', id, params],
    queryFn: () => (id ? agentsApi.listReserveEvents(id, params) : null),
    enabled: !!id,
  });
};
