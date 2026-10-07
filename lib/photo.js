// Shrinks a photo in the browser before upload (max 1600px JPEG) — faster, and strips camera metadata like GPS.
export async function compress(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
}
export const isPhoto = (f) => /^image\/(jpeg|png|webp|heic|heif)$/.test(f.type) || /\.(heic|heif)$/i.test(f.name);
// Uploads into the player's own folder of the private meal-photos bucket → the storage path.
export async function uploadPlate(supabase, uid, file) {
  const blob = await compress(file);
  if (blob.size > 5 * 1024 * 1024) throw new Error('That photo is too big even after shrinking.');
  const path = `${uid}/${crypto.randomUUID()}.jpg`;
  const up = await supabase.storage.from('meal-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (up.error) throw new Error('The photo didn’t upload. Try again.');
  return path;
}
