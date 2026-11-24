import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Wifi, AlertTriangle, Activity, Shield, Power, Crown, ChevronDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { IMSITable } from '@/components/dashboard/IMSITable';
import { RadarDisplay } from '@/components/dashboard/RadarDisplay';
import { AlertsList } from '@/components/dashboard/AlertsList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IMSIRecord, Alert } from '@/types/signal';
import { useGeolocation } from '@/hooks/useGeolocation';
import { CROATIAN_FREQUENCY_BANDS } from '@/lib/croatianOperators';
import { cn } from '@/lib/utils';

const Index = () => {
  const isScanning = false;
  const [imsiRecords, setImsiRecords] = useState<IMSIRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const frequency = 'Unavailable';
  const [bandsOpen, setBandsOpen] = useState(false);
  const { hasRealLocation, latitude, longitude } = useGeolocation();

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleDismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const suspiciousCount = imsiRecords.filter(r => r.isSuspicious).length;
  const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.acknowledged).length;

  return (
    <MainLayout>
      <Header
        title="Signal Guardian"
        subtitle="Cellular telemetry is not connected — no live scan is running"
      />

      <div className="p-3 md:p-6 space-y-4">
        {/* Premium Banner - Compact */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border border-primary/30 p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">Upgrade to Pro</p>
                <p className="text-xs text-muted-foreground hidden sm:block">Native Android telemetry connection required</p>
              </div>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 shrink-0 h-8 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              €9.99/mo
            </Button>
          </div>
        </motion.div>

        {/* No connected device feed: counts must not imply a clean scan. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <StatsCard
            title="Signals"
            value="N/A"
            subtitle="No telemetry source"
            icon={Wifi}
            trend={{ value: 12, isPositive: true }}
            variant="primary"
          />
          <StatsCard
            title="Suspicious"
            value="N/A"
            subtitle="Analysis unavailable"
            icon={AlertTriangle}
            variant={suspiciousCount > 0 ? 'warning' : 'default'}
          />
          <StatsCard
            title="Critical"
            value="N/A"
            subtitle="No alert feed"
            icon={Activity}
            variant={criticalAlerts > 0 ? 'danger' : 'default'}
          />
          <StatsCard
            title="Status"
            value="Disconnected"
            subtitle="Not scanning"
            icon={Shield}
            variant="default"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* No fabricated IMSI records are rendered when no native telemetry source is connected. */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <IMSITable records={imsiRecords} maxRows={10} />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 order-1 lg:order-2">
            {/* Scan Control - Compact */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Radio className="w-4 h-4 text-primary" />
                    Scan Control
                  </CardTitle>

                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Radar */}
                <div className="flex items-center justify-center">
                <div className="scale-75 origin-center">
                    <RadarDisplay
                      isScanning={isScanning}
                      detectedCount={imsiRecords.length}
                      suspiciousCount={suspiciousCount}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-mono text-foreground">{frequency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={isScanning ? 'default' : 'secondary'} className="text-xs h-5">
                      {isScanning ? 'Scanning' : 'Idle'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="text-foreground text-xs font-mono">
                      {hasRealLocation ? `${latitude?.toFixed(2)}°, ${longitude?.toFixed(2)}°` : 'Unavailable'}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  disabled
                  variant="secondary"
                  className="w-full h-9"
                  size="sm"
                >
                  <Power className="w-4 h-4 mr-2" />
                  Cellular telemetry disconnected
                </Button>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertsList
                  alerts={alerts.slice(0, 3)}
                  onAcknowledge={handleAcknowledgeAlert}
                  onDismiss={handleDismissAlert}
                  compact
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Frequency Bands - Collapsible */}
        <Collapsible open={bandsOpen} onOpenChange={setBandsOpen}>
          <Card className="bg-card border-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Croatian LTE/5G Bands
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    bandsOpen && "rotate-180"
                  )} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CROATIAN_FREQUENCY_BANDS.slice(0, 8).map((band, idx) => (
                    <div
                      key={band.band}
                      className={cn(
                        "p-2 rounded-lg border text-center",
                        idx < 2
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-muted/30 border-border'
                      )}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="font-medium text-foreground text-xs">{band.band}</span>
                      </div>
                      <Badge variant={band.technology === '5G' ? 'default' : 'secondary'} className="text-[10px] h-4">
                        {band.technology}
                      </Badge>
                      <p className="text-[10px] font-mono text-muted-foreground mt-1">
                        {band.frequency}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </MainLayout>
  );
};

export default Index;
