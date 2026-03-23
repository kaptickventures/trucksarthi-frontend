export type ReverseGeocodeResult = {
  formattedAddress: string;
  placeId?: string;
};

const getMapsApiKey = () =>
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  "";

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const mapsApiKey = getMapsApiKey();
  if (!mapsApiKey) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${mapsApiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const first = Array.isArray(data?.results) ? data.results[0] : null;
    if (!first?.formatted_address) return null;
    return {
      formattedAddress: String(first.formatted_address),
      placeId: first.place_id ? String(first.place_id) : undefined,
    };
  } catch {
    return null;
  }
}

