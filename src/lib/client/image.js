async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" }); // respects phone-camera rotation
  } catch {
    return createImageBitmap(file);
  }
}

/** Center-crops to a square and re-encodes as JPEG, so uploads are small (~50–100 KB). */
export async function resizeImageToSquare(file, { size = 512, quality = 0.85 } = {}) {
  const bitmap = await decode(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // JPEG has no transparency
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);

    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not process the image."))),
        "image/jpeg",
        quality,
      ),
    );
  } finally {
    bitmap.close?.();
  }
}
