'use client';

import { useState } from 'react';
import { useAgents, useCreateAgent } from '@/lib/hooks/use-agents';
import { normalizeError } from '@/lib/utils/error-normalizer';
import { formatDate } from '@/lib/utils/date';
import { useUIStore } from '@/lib/store/ui-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function AgentsList() {
  const { data, isLoading, error } = useAgents({ limit: 50, offset: 0 });
  const createAgentMutation = useCreateAgent();
  const setSelectedAgentId = useUIStore((state) => state.setSelectedAgentId);

  const [name, setName] = useState('');
  const [strategyType, setStrategyType] = useState('crypto');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [personality, setPersonality] = useState('');
  const [tradingEnabled, setTradingEnabled] = useState(true);
  const [reserveAddress, setReserveAddress] = useState('');

  const agents = data?.data ?? [];

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    try {
      await createAgentMutation.mutateAsync({
        name: name.trim(),
        strategyType: strategyType.trim() || undefined,
        riskLevel,
        personality: personality.trim() || undefined,
        tradingEnabled,
        reserveAddress: reserveAddress.trim() || undefined,
      });
      toast.success('Agent created');
      setName('');
      setPersonality('');
      setReserveAddress('');
    } catch (err) {
      const normalized = normalizeError(err);
      toast.error(normalized.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Create Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Agent name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#f4f6fb]"
              />
            </div>

            <div className="space-y-2">
              <Label>Strategy</Label>
              <Select value={strategyType} onValueChange={setStrategyType}>
                <SelectTrigger className="cursor-pointer bg-[#f4f6fb]">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="macro">Macro</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="politics">Politics</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Risk Level</Label>
              <Select value={riskLevel} onValueChange={(value) => setRiskLevel(value as 'low' | 'medium' | 'high')}>
                <SelectTrigger className="cursor-pointer bg-[#f4f6fb]">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reserve Address (optional)</Label>
              <Input
                placeholder="0x..."
                value={reserveAddress}
                onChange={(e) => setReserveAddress(e.target.value)}
                className="bg-[#f4f6fb]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Personality (optional)</Label>
            <Input
              placeholder="Describe trading personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="bg-[#f4f6fb]"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Switch checked={tradingEnabled} onCheckedChange={setTradingEnabled} />
              <span className="text-sm text-muted-foreground">Trading enabled</span>
            </div>
            <Button onClick={handleCreate} disabled={createAgentMutation.isPending}>
              {createAgentMutation.isPending ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Agents are used to track strategy performance and reserve activity.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 text-destructive">Error loading agents: {error.message}</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No agents found</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="cursor-pointer hover:border-foreground/50 transition-colors"
              onClick={() => setSelectedAgentId(agent.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">Created {formatDate(new Date(agent.createdAt))}</div>
                  </div>
                  <Badge variant="outline">{agent.strategy}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant={agent.tradingEnabled ? 'success' : 'secondary'}>
                    {agent.tradingEnabled ? 'Trading On' : 'Trading Off'}
                  </Badge>
                  <Badge variant="outline">{agent.strategy}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {agent.personality ? agent.personality : 'No personality set'}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Balance:</span> {agent.balance.toFixed(2)} USDC
                  </div>
                  <div>
                    <span className="text-muted-foreground">PnL:</span> {agent.totalPnL.toFixed(2)} USDC
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trades:</span> {agent.totalTrades}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Win Rate:</span> {agent.winRate.toFixed(2)}%
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Reserve total: {agent.token.marketCap?.toFixed(2) ?? '0.00'} {agent.token.symbol}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
