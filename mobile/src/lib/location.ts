import * as Location from 'expo-location';

export type Coords = { lat: number; lng: number };

/**
 * Returns the device's current GPS position, or null if permission was denied
 * or the fix could not be read. Callers should show a clear message on null.
 * On web this uses the browser's geolocation API via expo-location.
 */
export async function getCurrentCoords(): Promise<Coords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
