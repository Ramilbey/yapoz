// Approximate centroids for Klang Valley districts, used for "near <district>" hiring filters.
export const DISTRICTS: Record<string, { lat: number; lng: number; aliases?: string[] }> = {
  Bangsar: { lat: 3.1305, lng: 101.6713, aliases: ["bangsar baru", "telawi"] },
  "Bangsar South": { lat: 3.1110, lng: 101.6655 },
  "Mid Valley": { lat: 3.1180, lng: 101.6770 },
  Seputeh: { lat: 3.1140, lng: 101.6830 },
  Brickfields: { lat: 3.1300, lng: 101.6850, aliases: ["kl sentral"] },
  "Damansara Heights": { lat: 3.1500, lng: 101.6600, aliases: ["bukit damansara"] },
  "Mont Kiara": { lat: 3.1700, lng: 101.6500, aliases: ["mont kiara", "mk"] },
  "Sri Hartamas": { lat: 3.1630, lng: 101.6500, aliases: ["hartamas"] },
  TTDI: { lat: 3.1400, lng: 101.6300, aliases: ["taman tun dr ismail", "taman tun"] },
  "Bukit Bintang": { lat: 3.1466, lng: 101.7100 },
  KLCC: { lat: 3.1579, lng: 101.7123 },
  "Chow Kit": { lat: 3.1650, lng: 101.6980 },
  Titiwangsa: { lat: 3.1780, lng: 101.7050 },
  Sentul: { lat: 3.1850, lng: 101.6900 },
  Setapak: { lat: 3.2000, lng: 101.7200 },
  "Wangsa Maju": { lat: 3.2050, lng: 101.7350 },
  Kepong: { lat: 3.2100, lng: 101.6350 },
  Ampang: { lat: 3.1500, lng: 101.7600 },
  Cheras: { lat: 3.0850, lng: 101.7450 },
  "Kuchai Lama": { lat: 3.0900, lng: 101.6850 },
  "Petaling Jaya": { lat: 3.1180, lng: 101.6220, aliases: ["pj", "ss2", "petaling jaya ss2"] },
  "Subang Jaya": { lat: 3.0450, lng: 101.5850, aliases: ["subang", "ss15"] },
  Puchong: { lat: 3.0200, lng: 101.6200 },
  "Shah Alam": { lat: 3.0730, lng: 101.5180 },
};

export function resolveDistrict(name: string | null | undefined): string | null {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  for (const [key, d] of Object.entries(DISTRICTS)) {
    if (key.toLowerCase() === n) return key;
    if (d.aliases?.some((a) => a === n)) return key;
  }
  for (const [key, d] of Object.entries(DISTRICTS)) {
    if (n.includes(key.toLowerCase()) || d.aliases?.some((a) => n.includes(a))) return key;
  }
  return null;
}

export function distanceKm(a: string | null | undefined, b: string | null | undefined): number | null {
  const ka = resolveDistrict(a);
  const kb = resolveDistrict(b);
  if (!ka || !kb) return null;
  const p = DISTRICTS[ka];
  const q = DISTRICTS[kb];
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(q.lat - p.lat);
  const dLng = toRad(q.lng - p.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p.lat)) * Math.cos(toRad(q.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}
