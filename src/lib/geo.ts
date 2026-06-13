// Geospatial helpers shared by the map and the tactical radar.

const R = 6371000; // Earth radius in metres
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance between two coordinates, in metres. */
export const haversineMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

/** Initial bearing from point 1 to point 2, in degrees (0 = North, clockwise). */
export const bearingDegrees = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

export interface RadarTarget {
  id: string;
  /** Bearing from the user in degrees (0 = North). */
  bearing: number;
  /** Distance from the user in metres. */
  distance: number;
  suspicious: boolean;
  strength: number; // 0..1 normalised signal strength
}
