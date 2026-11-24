import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Search, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { AlertsList } from '@/components/dashboard/AlertsList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert } from '@/types/signal';
import { toast } from 'sonner';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAcknowledge = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleExport = () => {
    if (alerts.length === 0) {
      toast.info('No verified alert events are available to export.');
      return;
    }
    const data = JSON.stringify(alerts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Alerts exported successfully');
  };

  const handleClearAcknowledged = () => {
    if (!alerts.some(a => a.acknowledged)) {
      toast.info('There are no acknowledged alerts to clear.');
      return;
    }
    setAlerts(prev => prev.filter(a => !a.acknowledged));
    toast.success('Cleared acknowledged alerts');
  };

  const filteredAlerts = alerts
    .filter(a => filter === 'all' || a.type === filter)
    .filter(
      a =>
        searchQuery === '' ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
  };

  return (
    <MainLayout>
      <Header
        title="Alerts & Logs"
        subtitle="Verified alert events from connected telemetry sources"
      />

      <div className="p-6 space-y-6">
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 text-sm">
            <p className="font-semibold">Alert feed not connected</p>
            <p className="mt-1 text-muted-foreground">
              No device or backend event source is configured. The empty event list is not evidence that the environment is safe or free of threats.
            </p>
          </CardContent>
        </Card>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-mono text-destructive">{stats.critical}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-mono text-warning">{stats.warning}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-mono text-primary">{stats.info}</p>
              <p className="text-xs text-muted-foreground">Info</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{stats.unacknowledged}</p>
              <p className="text-xs text-muted-foreground">Unread</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={filter}
                  onValueChange={(v) => setFilter(v as typeof filter)}
                >
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClearAcknowledged} disabled={!alerts.some(a => a.acknowledged)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Read
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={alerts.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">
              Alert History ({filteredAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsList
              alerts={filteredAlerts}
              onAcknowledge={handleAcknowledge}
              onDismiss={handleDismiss}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AlertsPage;
