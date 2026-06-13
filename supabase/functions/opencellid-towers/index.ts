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
  // Larger coverage range -> weaker per-point signal estimate.
  const est = -55 - Math.min(55, r / 60);
  return Math.round(est);
};

// Convert a center + radius (km) into an OpenCellID BBOX (latmin,lonmin,latmax,lonmax).
const buildBBox = (lat: number, lng: number, radiusKm: number) => {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);
  return {
    latmin: lat - latDelta,
    lonmin: lng - lngDelta,
    latmax: lat + latDelta,
    lonmax: lng + lngDelta,
  };
};

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
    const radiusKm = Math.min(Math.max(Number(body.radiusKm) || 5, 0.5), 25);
    const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 500);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return new Response(
        JSON.stringify({ source: 'error', error: 'Invalid coordinates', towers: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { latmin, lonmin, latmax, lonmax } = buildBBox(lat, lng, radiusKm);
    const url = `https://opencellid.org/cell/getInArea?key=${encodeURIComponent(apiKey)}` +
      `&BBOX=${latmin},${lonmin},${latmax},${lonmax}&format=json&limit=${limit}`;

    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await resp.text();

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ source: 'error', error: `OpenCellID HTTP ${resp.status}`, detail: text.slice(0, 200), towers: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // OpenCellID can return an XML error envelope for invalid keys / quota.
      return new Response(
        JSON.stringify({ source: 'error', error: 'OpenCellID returned a non-JSON response (check API key / quota)', detail: text.slice(0, 200), towers: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('OpenCellID raw response:', text.slice(0, 500));
    const cells: any[] = Array.isArray(parsed?.cells) ? parsed.cells : [];
    const towers = cells
      .filter((c) => Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lon)))
      .map((c, i) => {
        const range = Number(c.range);
        return {
          id: `ocid-${c.mcc}-${c.mnc}-${c.lac}-${c.cellid}-${i}`,
          mcc: String(c.mcc ?? ''),
          mnc: String(c.mnc ?? ''),
          lac: String(c.lac ?? c.area ?? ''),
          cellId: String(c.cellid ?? c.cid ?? ''),
          lat: Number(c.lat),
          lng: Number(c.lon),
          signalStrength: estimateSignal(range, Number(c.averageSignalStrength)),
          technology: radioToTech(String(c.radio ?? '')),
          range: Number.isFinite(range) ? range : null,
          samples: Number(c.samples) || 0,
        };
      });

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
