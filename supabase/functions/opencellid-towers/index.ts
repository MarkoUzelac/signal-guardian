import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Maps OpenCellID radio types to the app's technology buckets.
const radioToTech = (radio: string): '2G' | '3G' | '4G' | '5G' => {
  switch ((radio || '').toUpperCase()) {
    case 'GSM':
    case 'CDMA':
      return '2G';
    case 'UMTS':
    case 'WCDMA':
      return '3G';
    case 'LTE':
      return '4G';
    case 'NR':
    case '5G':
      return '5G';
    default:
      return '4G';
  }
};

// Rough signal estimate (dBm) from the cell's reported coverage range.
const estimateSignal = (range: number, avg?: number): number => {
  if (typeof avg === 'number' && avg < 0) return Math.max(-120, Math.min(-40, avg));
  const r = Number.isFinite(range) && range > 0 ? range : 1000;
  const est = -55 - Math.min(55, r / 60);
  return Math.round(est);
};

// OpenCellID limits getInArea to a 4,000,000 m² (2km x 2km) bounding box, so we
// tile the requested radius into <=3.24 km² boxes and merge the results.
const TILE_KM = 1.8;
const MAX_TILES_PER_AXIS = 3;

const kmToLat = (km: number) => km / 111;
const kmToLng = (km: number, lat: number) => km / (111 * Math.cos((lat * Math.PI) / 180) || 1);

interface RawCell {
  lat: number;
  lng: number;
  mcc: string;
  mnc: string;
  lac: string;
  cellId: string;
  technology: '2G' | '3G' | '4G' | '5G';
  signalStrength: number;
  range: number | null;
  samples: number;
}

async function fetchTile(
  apiKey: string,
  lat: number,
  lng: number,
  limit: number,
): Promise<{ cells: RawCell[]; error?: string }> {
  const halfLat = kmToLat(TILE_KM / 2);
  const halfLng = kmToLng(TILE_KM / 2, lat);
  const bbox = `${lat - halfLat},${lng - halfLng},${lat + halfLat},${lng + halfLng}`;
  const url = `https://opencellid.org/cell/getInArea?key=${encodeURIComponent(apiKey)}` +
    `&BBOX=${bbox}&format=json&limit=${limit}`;

  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await resp.text();

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { cells: [], error: `Non-JSON response: ${text.slice(0, 120)}` };
  }

  if (parsed?.error || parsed?.code) {
    return { cells: [], error: String(parsed.error ?? `code ${parsed.code}`) };
  }

  const cells: RawCell[] = (Array.isArray(parsed?.cells) ? parsed.cells : [])
    .filter((c: any) => Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lon)))
    .map((c: any) => {
      const range = Number(c.range);
      return {
        lat: Number(c.lat),
        lng: Number(c.lon),
        mcc: String(c.mcc ?? ''),
        mnc: String(c.mnc ?? ''),
        lac: String(c.lac ?? c.area ?? ''),
        cellId: String(c.cellid ?? c.cid ?? ''),
        technology: radioToTech(String(c.radio ?? '')),
        signalStrength: estimateSignal(range, Number(c.averageSignalStrength)),
        range: Number.isFinite(range) ? range : null,
        samples: Number(c.samples) || 0,
      };
    });

  return { cells };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENCELLID_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ source: 'error', error: 'OpenCellID API key not configured', towers: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let body: { lat?: number; lng?: number; radiusKm?: number; limit?: number } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const radiusKm = Math.min(Math.max(Number(body.radiusKm) || 2, 0.5), 6);
    const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 500);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return new Response(
        JSON.stringify({ source: 'error', error: 'Invalid coordinates', towers: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build a centred grid of tile centres covering the requested radius.
    const tilesPerAxis = Math.min(
      Math.max(1, Math.round((radiusKm * 2) / TILE_KM)),
      MAX_TILES_PER_AXIS,
    );
    const start = -((tilesPerAxis - 1) / 2) * TILE_KM;
    const offsets: number[] = [];
    for (let i = 0; i < tilesPerAxis; i++) offsets.push(start + i * TILE_KM);

    const tilePromises: Promise<{ cells: RawCell[]; error?: string }>[] = [];
    for (const dLatKm of offsets) {
      for (const dLngKm of offsets) {
        const tLat = lat + kmToLat(dLatKm);
        const tLng = lng + kmToLng(dLngKm, lat);
        tilePromises.push(fetchTile(apiKey, tLat, tLng, limit));
      }
    }

    const results = await Promise.all(tilePromises);
    const firstError = results.find((r) => r.error)?.error;

    // Merge + dedupe by unique cell identity.
    const seen = new Set<string>();
    const merged: RawCell[] = [];
    for (const r of results) {
      for (const c of r.cells) {
        const key = `${c.mcc}-${c.mnc}-${c.lac}-${c.cellId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(c);
      }
    }

    if (merged.length === 0) {
      return new Response(
        JSON.stringify({
          source: 'error',
          error: firstError ?? 'No towers found in this area',
          towers: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const towers = merged.map((c, i) => ({
      id: `ocid-${c.mcc}-${c.mnc}-${c.lac}-${c.cellId}-${i}`,
      mcc: c.mcc,
      mnc: c.mnc,
      lac: c.lac,
      cellId: c.cellId,
      lat: c.lat,
      lng: c.lng,
      signalStrength: c.signalStrength,
      technology: c.technology,
      range: c.range,
      samples: c.samples,
    }));

    return new Response(
      JSON.stringify({ source: 'opencellid', count: towers.length, towers }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
        },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ source: 'error', error: String(e), towers: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
