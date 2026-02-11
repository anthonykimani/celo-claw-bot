'use client';

import { useMemo } from 'react';
import { useAgent, useReserveEvents } from '@/lib/hooks/use-agents';
import { useUIStore } from '@/lib/store/ui-store';
import { formatDate, formatDateFull } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AgentDetail() {
  const { selectedAgentId, setSelectedAgentId } = useUIStore();
  const { data, isLoading, error } = useAgent(selectedAgentId);
  const { data: reserveEventsData, isLoading: reservesLoading } = useReserveEvents(selectedAgentId, {
    limit: 25,
    offset: 0,
  });

  const agent = data?.data;
  const reserveEvents = reserveEventsData?.data ?? [];

  const winRate = useMemo(() => {
    if (!agent) return 0;
    const parsed = parseFloat(agent.winRate);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [agent]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Card className="rounded-none">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedAgentId(null)}>
          Back to Agents
        </Button>
        <div className="p-4 text-destructive">Failed to load agent details.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{agent.name}</h2>
          <p className="text-sm text-muted-foreground">Created {formatDate(new Date(agent.createdAt))}</p>
        </div>
        <Button variant="outline" onClick={() => setSelectedAgentId(null)}>
          Back to Agents
        </Button>
      </div>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Performance Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Trading Status</div>
            <Badge variant={agent.tradingEnabled ? 'success' : 'secondary'}>
              {agent.tradingEnabled ? 'Trading On' : 'Trading Off'}
            </Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Strategy</div>
            <div className="font-medium">{agent.strategyType}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Risk Level</div>
            <div className="font-medium capitalize">{agent.riskLevel}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
            <div className="font-medium">{winRate.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Balance (USDC)</div>
            <div className="font-medium">{parseFloat(agent.lastTradingBalanceUsdc).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total PnL (USDC)</div>
            <div className="font-medium">{parseFloat(agent.totalPnlUsdc).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Trades</div>
            <div className="font-medium">{agent.totalTrades}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Winning Trades</div>
            <div className="font-medium">{agent.winningTrades}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Reserve Events</CardTitle>
        </CardHeader>
        <CardContent>
          {reservesLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : reserveEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground">No reserve events yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount (cUSD)</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reserveEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.amountCusd.toFixed(6)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {event.txHash ? event.txHash : '—'}
                    </TableCell>
                    <TableCell>{event.note ?? '—'}</TableCell>
                    <TableCell>{formatDateFull(new Date(event.createdAt))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 text-xs text-muted-foreground">
            Trade history is tracked in the Orders tab. Agent-specific trade attribution is not implemented yet.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
