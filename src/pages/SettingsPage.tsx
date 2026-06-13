import { Save, Radio, Bell, Database, Shield, ShieldAlert, Satellite } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';

const SettingsPage = () => {
  const { settings, update } = useSettings();

  const handleSave = () => {
    // Settings persist automatically; this confirms the current state.
    toast.success('Settings saved');
  };

  return (
    <MainLayout>
      <Header
        title="Settings"
        subtitle="Configure scanner, security protections, and preferences"
      />

      <div className="p-3 md:p-6 space-y-6 max-w-4xl">
        {/* Live Data Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Satellite className="w-5 h-5 text-primary" />
              Live Tower Data
            </CardTitle>
            <CardDescription>
              Real cell-tower locations are sourced from the OpenCellID public database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">OpenCellID connection</p>
                <p className="text-xs text-muted-foreground">
                  Your API key is stored securely on the server and never exposed in the browser.
                </p>
              </div>
              <Badge className="shrink-0">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Get or manage a free key at{' '}
              <a
                href="https://opencellid.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
              >
                opencellid.org
              </a>
              . When live data is unavailable, the app falls back to a GPS-accurate simulation.
            </p>
          </CardContent>
        </Card>

        {/* Silent SMS Protection */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-warning" />
              Silent SMS Protection
            </CardTitle>
            <CardDescription>
              Detect suspected silent (Type-0) SMS — messages used to secretly locate a phone
              without any notification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label htmlFor="silent-detect">Enable silent SMS detection</Label>
                <p className="text-xs text-muted-foreground">
                  Flag suspected Type-0 SMS patterns in the live feed.
                </p>
              </div>
              <Switch
                id="silent-detect"
                checked={settings.silentSmsDetection}
                onCheckedChange={(checked) => update({ silentSmsDetection: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label htmlFor="silent-alerts">Alert on detection</Label>
                <p className="text-xs text-muted-foreground">
                  Raise a warning alert whenever a silent SMS is detected.
                </p>
              </div>
              <Switch
                id="silent-alerts"
                checked={settings.silentSmsAlerts}
                disabled={!settings.silentSmsDetection}
                onCheckedChange={(checked) => update({ silentSmsAlerts: checked })}
              />
            </div>

            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How to actually block silent SMS</p>
              A browser cannot block radio-level SMS. Real blocking needs device-level action —
              see the{' '}
              <a href="/protection" className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded">
                Protection Guide
              </a>{' '}
              for the step-by-step instructions.
            </div>
          </CardContent>
        </Card>

        {/* Scanner Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              Scanner Configuration
            </CardTitle>
            <CardDescription>
              RTL-SDR device and frequency scanning settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="frequency">Default Frequency (MHz)</Label>
                <Input
                  id="frequency"
                  type="number"
                  step="0.1"
                  value={settings.scanFrequency}
                  onChange={(e) => update({ scanFrequency: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gain">Device Gain (dB)</Label>
                <Input
                  id="gain"
                  type="number"
                  value={settings.deviceGain}
                  onChange={(e) => update({ deviceGain: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label htmlFor="autoscan">Auto-start scanning</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically begin scanning when application starts
                </p>
              </div>
              <Switch
                id="autoscan"
                checked={settings.autoScan}
                onCheckedChange={(checked) => update({ autoScan: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Alert Preferences
            </CardTitle>
            <CardDescription>
              Configure how and when you receive security alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label htmlFor="alerts">Enable alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Show notifications for suspicious activity
                </p>
              </div>
              <Switch
                id="alerts"
                checked={settings.alertsEnabled}
                onCheckedChange={(checked) => update({ alertsEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label htmlFor="sound">Sound alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Play audio notification for critical alerts
                </p>
              </div>
              <Switch
                id="sound"
                checked={settings.soundAlerts}
                onCheckedChange={(checked) => update({ soundAlerts: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Data Management
            </CardTitle>
            <CardDescription>
              Configure data storage and retention policies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="retention">Log retention period</Label>
              <Select
                value={settings.logRetention}
                onValueChange={(v) => update({ logRetention: v })}
              >
                <SelectTrigger id="retention">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="0">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button variant="outline">Export All Data</Button>
              <Button variant="destructive">Clear All Data</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-warning/10 border-warning/30">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Security & Privacy Notice
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your preferences are stored locally on your device. Tower locations come from the
                  public OpenCellID database via a secure server proxy. This tool is for passive,
                  defensive monitoring of your own devices and networks only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="min-h-11">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
