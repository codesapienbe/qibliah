export function calculateQibla(lat: number, lng: number, kaabaLat: number, kaabaLng: number): number {
  // Convert degrees to radians
  const kaabaLatRad = kaabaLat * Math.PI / 180;
  const kaabaLngRad = kaabaLng * Math.PI / 180;
  const userLatRad = lat * Math.PI / 180;
  const userLngRad = lng * Math.PI / 180;
  const dLng = kaabaLngRad - userLngRad;
  const y = Math.sin(dLng);
  const x = Math.cos(userLatRad) * Math.tan(kaabaLatRad) - Math.sin(userLatRad) * Math.cos(dLng);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Returns distance in km
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
} 