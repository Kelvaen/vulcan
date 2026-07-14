import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Capture or pick a photo and return it as a base64 data URI (works on web and native).
 * Camera on native devices; file picker on web / when source is 'library'.
 * Returns null if the user cancels or denies permission.
 */
export async function pickImageDataUri(source: 'camera' | 'library' = 'camera'): Promise<string | null> {
  const useCamera = source === 'camera' && Platform.OS !== 'web';
  if (useCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
  }
  const res = useCamera
    ? await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true })
    : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  if (a.base64) return `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}`;
  // Web sometimes omits base64 — convert the blob URL instead.
  const blob = await (await fetch(a.uri)).blob();
  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}
