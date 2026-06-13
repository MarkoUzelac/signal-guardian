import { supabase } from '@/integrations/supabase/client';
import type { CellTower } from '@/types/signal';
import { analyzeTower, setKnownCountry, setKnownRegion } from '@/lib/anomalyEngine';
import {
  DEFAULT_COUNTRY,
  getOperatorsByMcc,
  type CountryOperators,
} from '@/lib/worldOperators';
import { bearingDegrees, haversineMeters, type RadarTarget } from '@/lib/geo';

export type TowerSource = 'opencellid' | 'fallback' | 'error';

interface RawTower {
  id: string;
  mcc: string;
  mnc: string;
  lac: string;
  cellId: string;
  lat: number;
  lng: number;
  signalStrength: number;
  technology: CellTower['technology'];
  range: number | null;
  samples: number;
}

export interface TowerFetchResult {
  source: TowerSource;
  towers: CellTower[];
  error?: string;
}

/** Resolve a friendly operator name from MCC/MNC using the world registry. */
const resolveOperatorName = (mcc: string, mnc: string, fallback: CountryOperators): string => {
  const country = getOperatorsByMcc(mcc);
  const op =
    country.operators.find((o) => o.mnc === mnc || o.mnc === mnc.padStart(2, '0')) ??
    fallback.operators.find((o) => o.mnc === mnc);
  return op?.name ?? `Unknown (${mcc}/${mnc})`;
};

/**
 * Fetch REAL cell towers near a location from the OpenCellID public database
 * (proxied through a secure edge function so the API key stays server-side).
 * Each tower is scored by the anomaly engine so suspicious markers reflect
 * real attributes (unknown MCC/MNC, strong 2G, out-of-region, etc).
 */
export const fetchTowersNear = async (
  lat: number,
  lng: number,
  radiusKm: number,
  country: CountryOperators = DEFAULT_COUNTRY,
): Promise<TowerFetchResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('opencellid-towers', {
      body: { lat, lng, radiusKm, limit: 200 },
    });

    if (error) {
      return { source: 'error', towers: [], error: error.message };
    }

    const source: TowerSource = data?.source ?? 'error';
    if (source !== 'opencellid' || !Array.isArray(data?.towers)) {
      return { source: 'error', towers: [], error: data?.error ?? 'No live data available' };
    }

    // Align anomaly detection with the user's region and country operators.
    setKnownCountry(country);
    setKnownRegion(lat, lng, Math.max(radiusKm * 3, 30));

    const raw = data.towers as RawTower[];

    // Build base list first so duplicate-cell-id detection can see all towers.
    const base: CellTower[] = raw.map((t) => ({
      id: t.id,
      mcc: t.mcc,
      mnc: t.mnc,
      lac: t.lac,
      cellId: t.cellId,
      lat: t.lat,
      lng: t.lng,
      signalStrength: t.signalStrength,
      operator: resolveOperatorName(t.mcc, t.mnc, country),
      technology: t.technology,
      lastSeen: new Date(),
      isSuspicious: false,
    }));

    const towers: CellTower[] = base.map((tower) => {
      // We cannot observe encryption from public data; assume encrypted to
      // avoid false positives, so encryption never inflates the score here.
      const report = analyzeTower(tower, base, true);
      return {
        ...tower,
        isSuspicious: report.score > 0.4,
        suspiciousReason: report.details[0],
      };
    });

    return { source: 'opencellid', towers };
  } catch (e) {
    return { source: 'error', towers: [], error: String(e) };
  }
};

/** Project towers into radar targets (bearing + distance) relative to the user. */
export const toRadarTargets = (
  towers: CellTower[],
  userLat: number,
  userLng: number,
): RadarTarget[] =>
  towers.map((t) => ({
    id: t.id,
    bearing: bearingDegrees(userLat, userLng, t.lat, t.lng),
    distance: haversineMeters(userLat, userLng, t.lat, t.lng),
    suspicious: t.isSuspicious,
    // -50 dBm (strong) -> 1, -110 dBm (weak) -> ~0
    strength: Math.max(0.15, Math.min(1, (t.signalStrength + 110) / 60)),
  }));
