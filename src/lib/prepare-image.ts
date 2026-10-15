// Jev limits: each side 256–1568 px, area >= 78,400 px, PNG/JPEG, EXIF orientation ignored.
const MAX_SIDE = 1024;
const MIN_SIDE = 280;

export async function prepareImage(file: File): Promise<Blob> {
  // Bakes EXIF rotation into the pixels; the API strips metadata.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = bitmap;

  let scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  if (Math.min(width, height) * scale < MIN_SIDE) {
    scale = MIN_SIDE / Math.min(width, height);
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      "image/jpeg",
      0.85,
    ),
  );
}
