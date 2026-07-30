import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const MAX_WIDTH = 1280; // downscale big camera photos so uploads stay small

/**
 * Capture or pick a photo and return it as a compact base64 JPEG data URI
 * (works on web and native). Camera on native devices; file picker on web or
 * when source is 'library'. The image is downscaled to at most MAX_WIDTH and
 * re-compressed so a 12MP phone photo becomes a few hundred KB instead of
 * several MB. Returns null if the user cancels or denies permission.
 */
export async function pickImageDataUri(source: 'camera' | 'library' = 'camera'): Promise<string | null> {
  const useCamera = source === 'camera' && Platform.OS !== 'web';
  if (useCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
  }
  // Request base64 up front and a modest quality so that even if the resize
  // step below fails, the fallback still has a bounded-size image to send
  // instead of a raw multi-megabyte photo.
  const res = useCamera
    ? await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true })
    : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: true });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];

  // Downscale + recompress using the supported (SDK 54) contextual API. The old
  // manipulateAsync is deprecated and can misbehave on device, which previously
  // fell back to uploading the full multi-MB photo and failed the request.
  try {
    const context = ImageManipulator.manipulate(a.uri);
    if (a.width && a.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
    const rendered = await context.renderAsync();
    const out = await rendered.saveAsync({
      compress: 0.6,
      format: SaveFormat.JPEG,
      base64: true,
    });
    if (out.base64) return `data:image/jpeg;base64,${out.base64}`;
  } catch {
    // fall through to the un-resized original
  }

  if (a.base64) return `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}`;
  const blob = await (await fetch(a.uri)).blob();
  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}
