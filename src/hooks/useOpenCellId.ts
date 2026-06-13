import { useCallback, useEffect, useState } from 'react';
import type { CellTower } from '@/types/signal';
import { fetchTowersNear, type TowerSource } from '@/lib/openCellId';
import { generateCellTowersAroundLocation } from '@/lib/mockData';
import { DEFAULT_COUNTRY, type CountryOperators } from '@/lib/worldOperators';

interface UseOpenCellIdResult {
  towers: CellTower[];
  source: TowerSource;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Loads REAL towers near the user from OpenCellID. If the live service is
 * unavailable (no key / quota / offline) it falls back to GPS-accurate
 * simulated towers so the map is never empty — clearly flagged via `source`.
 */
export const useOpenCellId = (
  lat: number | null,
  lng: number | null,
  radiusKm = 5,
  country: CountryOperators = DEFAULT_COUNTRY,
): UseOpenCellIdResult => {
  const [towers, setTowers] = useState<CellTower[]>([]);
  const [source, setSource] = useState<TowerSource>('opencellid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (lat === null || lng === null) return;
    setLoading(true);
    setError(null);

    const result = await fetchTowersNear(lat, lng, radiusKm, country);

    if (result.source === 'opencellid' && result.towers.length > 0) {
      setTowers(result.towers);
      setSource('opencellid');
    } else {
      // Fallback keeps the UI usable; flagged so the user knows it's simulated.
      setTowers(generateCellTowersAroundLocation(lat, lng, 15, country));
      setSource('fallback');
      if (result.error) setError(result.error);
    }
    setLoading(false);
  }, [lat, lng, radiusKm, country]);

  useEffect(() => {
    load();
  }, [load]);

  return { towers, source, loading, error, refetch: load };
};
