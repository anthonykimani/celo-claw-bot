'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventsList } from '@/components/events/events-list';
import { EventDetail } from '@/components/events/event-detail';
import { MarketsList } from '@/components/markets/markets-list';
import { MarketDetail } from '@/components/markets/market-detail';
import { OrdersList } from '@/components/orders/orders-list';
import { OrderDetail } from '@/components/orders/order-detail';
import { CreateOrderForm } from '@/components/orders/create-order-form';
import { AgentsList } from '@/components/agents/agents-list';
import { AgentDetail } from '@/components/agents/agent-detail';
import { useUIStore } from '@/lib/store/ui-store';
import { WalletConnectButton } from '@/lib/wallet/wallet-connect';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    selectedEventId,
    selectedMarketId,
    selectedOrderId,
    selectedAgentId,
    setSelectedEventId,
    setSelectedMarketId,
    setSelectedOrderId,
    setSelectedAgentId,
  } = useUIStore();

  const handleTabChange = (value: string) => {
    const newTab = value as any;
    
    if (newTab === 'markets') {
      setSelectedMarketId(null);
    } else if (newTab === 'events') {
      setSelectedEventId(null);
    } else if (newTab === 'orders') {
      setSelectedOrderId(null);
    } else if (newTab === 'agents') {
      setSelectedAgentId(null);
    }
    
    if (newTab !== activeTab) {
      setSelectedMarketId(null);
      setSelectedEventId(null);
      setSelectedOrderId(null);
      setSelectedAgentId(null);
    }
    
    setActiveTab(newTab);
  };

  return (
    <div className="min-h-screen">
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,247,235,0.9),_rgba(247,242,233,0))]" />
        <div className="container mx-auto px-4 pb-16 pt-6 md:px-8 max-w-7xl relative">
          <header className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-semibold">
                PC
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-primary">Polyclaw for Celo</div>
                <h1 className="text-2xl md:text-3xl">Polymarket Trader</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <WalletConnectButton />
            </div>
          </header>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary/80 mb-3">Live market desk</p>
              <h2 className="text-3xl md:text-4xl">Trade prediction markets with agent-level visibility.</h2>
              <p className="mt-3 text-muted-foreground text-lg max-w-2xl">
                Monitor Polymarket events, manage orders, and track agents with reserve flows on Celo in one focused workspace.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm">CLOB-ready execution</span>
                <span className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm">Agent reserve tracking</span>
                <span className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm">Queue-backed orders</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] p-6">
              <div className="text-sm font-semibold">Desk status</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Sync workers refresh markets every 15 minutes, price polling every 5 minutes. Use the Agents tab to monitor reserve events.
              </p>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Default provider</span>
                  <span className="font-medium">Polymarket</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Order processing</span>
                  <span className="font-medium">BullMQ queues</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reserve currency</span>
                  <span className="font-medium">cUSD</span>
                </div>
              </div>
            </div>
          </section>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mt-10 grid w-full grid-cols-4 rounded-2xl border border-border/70 bg-white p-2 shadow-[0_10px_24px_rgba(15,23,42,0.1)]">
            <TabsTrigger 
              value="markets"
              onClick={() => {
                if (activeTab === 'markets' && selectedMarketId) {
                  setSelectedMarketId(null);
                }
              }}
            >
              Markets
            </TabsTrigger>
            <TabsTrigger 
              value="events"
              onClick={() => {
                if (activeTab === 'events' && selectedEventId) {
                  setSelectedEventId(null);
                }
              }}
            >
              Events
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              onClick={() => {
                if (activeTab === 'orders' && selectedOrderId) {
                  setSelectedOrderId(null);
                }
              }}
            >
              Orders
            </TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="mt-6">
            {selectedMarketId ? (
              <MarketDetail />
            ) : (
              <MarketsList />
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {selectedEventId ? (
              <EventDetail />
            ) : (
              <EventsList />
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {selectedOrderId ? (
              <OrderDetail />
            ) : (
              <OrdersList />
            )}
          </TabsContent>

          <TabsContent value="agents" className="mt-6">
            {selectedAgentId ? <AgentDetail /> : <AgentsList />}
          </TabsContent>
        </Tabs>

        <CreateOrderForm />
        </div>
      </div>
    </div>
  );
}
