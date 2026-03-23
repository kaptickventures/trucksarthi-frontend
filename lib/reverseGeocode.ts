import API from "../app/api/axiosInstance";

export type ReverseGeocodeResult = {
  formattedAddress: string;
  placeId?: string;
};

const getMapsApiKey = () =>
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  "";

async function reverseGeocodeViaBackend(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const res = await API.get("/api/locations/reverse-geocode", {
      params: { lat: latitude, lng: longitude },
    });

    const formattedAddress = String(res?.data?.formattedAddress || "").trim();
    if (!formattedAddress) return null;
    return {
      formattedAddress,
      placeId: res?.data?.placeId ? String(res.data.placeId) : undefined,
    };
  } catch (error: any) {
    if (__DEV__) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.error || error?.message;
      console.warn("reverseGeocodeViaBackend failed", status, msg);
    }
    return null;
  }
}

async function reverseGeocodeViaGoogle(
  latitude: number,
  longitude: number,
  mapsApiKey: string
): Promise<ReverseGeocodeResult | null> {
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

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const viaBackend = await reverseGeocodeViaBackend(latitude, longitude);
  if (viaBackend) return viaBackend;

  const mapsApiKey = getMapsApiKey();
  if (mapsApiKey) {
    const viaGoogle = await reverseGeocodeViaGoogle(latitude, longitude, mapsApiKey);
    if (viaGoogle) return viaGoogle;
  }

  return null;
}
