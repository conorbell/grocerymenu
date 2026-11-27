// Image helpers for profile photos.

const toJpeg = (canvas, quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process that image'))),
      'image/jpeg',
      quality
    )
  );

const loadBitmap = async (file) => {
  try {
    return await createImageBitmap(file); // respects EXIF rotation
  } catch {
    throw new Error("Couldn't read that photo. Try a JPEG or PNG.");
  }
};

// Shrink a photo (no crop): phones produce 3–10 MB images, a profile picture
// only needs ~640px. Returns a JPEG Blob.
export const resizeImage = async (file, maxSide = 640, quality = 0.85) => {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return toJpeg(canvas, quality);
};

// Cut out the area chosen in the cropper ({ x, y, width, height } in the
// photo's own pixels) and scale it to `outWidth` × `outHeight`.
export const cropImage = async (file, area, outWidth = 640, outHeight = 800, quality = 0.85) => {
  const bitmap = await loadBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, outWidth, outHeight);
  bitmap.close?.();
  return toJpeg(canvas, quality);
};
