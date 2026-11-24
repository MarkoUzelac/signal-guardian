import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { TowerMap } from '@/components/map/TowerMap';
import { TriangulationForm } from '@/components/triangulation/TriangulationForm';
import { FakeStationDetector } from '@/components/map/FakeStationDetector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CellTower } from '@/types/signal';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCountry } from '@/hooks/useCountry';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, RefreshCw, Loader2, ChevronDown, Target, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const MapPage = () => {
  const towers: CellTower[] = [];
  const [selectedTower, setSelectedTower] = useState<CellTower | null>(null);
  const isLookingUp = false;
  const [operatorsOpen, setOperatorsOpen] = useState(false);
  const { latitude, longitude, loading: geoLoading, error: geoError, requestLocation, accuracy, hasRealLocation } = useGeolocation();
  const { country, countryName, loading: countryLoading } = useCountry(latitude, longitude);

  // Get map center based on user location
  const mapCenter: [number, number] = [
    latitude || 45.8150,
    longitude || 15.9819
  ];

  // User location for marker
  const userLocation = latitude && longitude ? { lat: latitude, lng: longitude } : null;

  // Geolocation is not cellular telemetry. Never synthesize cell IDs or tower coordinates.
  const handleTriangulation = (_data: {
    mcc: string;
    mnc: string;
    lac: string;
    cellId: string;
  }) => {
    toast.error('Cell tower lookup unavailable', {
      description: 'No authenticated OpenCellID provider or native Android radio feed is configured. No tower position has been estimated.',
    });
  };

  const handleRefreshTowers = () => {
    setSelectedTower(null);
    toast.info('No live cell-tower feed is connected. The map has no verified tower records to refresh.');
  };

  return (
    <MainLayout>
      <Header
        title="Cell Tower Map"
        subtitle="GPS map preview — cellular tower telemetry is not connected"
      />

      <div className="p-3 md:p-6 space-y-4">
        {/* Location Status Bar - Compact on mobile */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  hasRealLocation ? "bg-success/20" : "bg-warning/20"
                )}>
                  {geoLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : hasRealLocation ? (
                    <Target className="w-4 h-4 text-success" />
                  ) : (
                    <MapPin className="w-4 h-4 text-warning" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {geoLoading ? 'Detecting...' : 
                     hasRealLocation ? 'Your Exact Location' : 'Default (Zagreb)'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
                    {accuracy && <span className="ml-1">±{Math.round(accuracy)}m</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={requestLocation}
                  disabled={geoLoading}
                  className="flex-1 sm:flex-none h-9"
                >
                  <Navigation className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Locate</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshTowers}
                  disabled={!latitude}
                  className="flex-1 sm:flex-none h-9"
                >
                  <RefreshCw className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
            {geoError && (
              <p className="text-xs text-warning mt-2">⚠️ {geoError}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Live cell-tower data unavailable</p>
              <p className="text-xs text-muted-foreground mt-1">
                Browser GPS can provide device coordinates but cannot read cellular MCC/MNC, LAC, Cell ID, radio technology or signal strength. No synthetic towers are displayed. Connect the native Android telemetry collector or an authenticated provider to enable cell records.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Map - Full width, taller for better zoom exploration */}
        <div className="h-[350px] sm:h-[450px] lg:h-[550px]">
          <ErrorBoundary>
            <TowerMap
              towers={towers}
              center={mapCenter}
              zoom={hasRealLocation ? 14 : 11}
              onTowerClick={setSelectedTower}
              showRangeCircles
              userLocation={userLocation}
              showUserLocation={hasRealLocation}
              minZoom={3}
              maxZoom={19}
            />
          </ErrorBoundary>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Fake Station Detector */}
          <FakeStationDetector
            towers={towers}
            onTowerSelect={setSelectedTower}
            onRefresh={handleRefreshTowers}
          />
          {/* No numeric tower/security statistics are shown until a real feed exists. */}
          <Card className="border-warning/40 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cellular Data Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">Not connected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tower count, verification and threat status are unavailable. No assessment has been performed.
              </p>
            </CardContent>
          </Card>

          {/* Local Operators (based on user's country) - Collapsible */}
          <Collapsible open={operatorsOpen} onOpenChange={setOperatorsOpen}>
            <Card className="bg-card border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 rounded-t-lg transition-colors">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {countryLoading ? 'Detecting Operators…' : `${country.country} Operators`}
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      operatorsOpen && "rotate-180"
                    )} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-2">
                  <p className="text-xs text-muted-foreground pb-1">
                    MCC {country.mcc}{countryName ? ` · ${countryName}` : ''}
                  </p>
                  {country.operators.map(op => (
                    <div key={op.mnc} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/30">
                      <div 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: op.color }}
                      />
                      <span className="font-medium flex-1">{op.name}</span>
                      <span className="text-muted-foreground">MNC: {op.mnc}</span>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Selected Tower Info */}
          {selectedTower ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className={cn(
                'border',
                selectedTower.isSuspicious
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-card border-border'
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        selectedTower.isSuspicious ? 'bg-destructive' : 'bg-warning'
                      )}
                    />
                    {selectedTower.isSuspicious ? 'Suspicious Cell Record' : 'Unverified Cell Record'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operator</span>
                    <span className="font-mono">{selectedTower.operator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cell ID</span>
                    <span className="font-mono">{selectedTower.cellId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MCC/MNC</span>
                    <span className="font-mono">{selectedTower.mcc}/{selectedTower.mnc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Technology</span>
                    <Badge variant="secondary" className="text-xs h-5">{selectedTower.technology}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Signal</span>
                    <span className="font-mono">{selectedTower.signalStrength} dBm</span>
                  </div>
                  {selectedTower.suspiciousReason && (
                    <div className="mt-2 p-2 rounded bg-destructive/20 text-destructive">
                      ⚠️ {selectedTower.suspiciousReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No cell records are available because a live telemetry source is not connected.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Triangulation Form */}
        <TriangulationForm
          onSubmit={handleTriangulation}
          isLoading={isLookingUp}
        />
      </div>
    </MainLayout>
  );
};

export default MapPage;
