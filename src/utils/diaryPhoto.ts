const MAX_PHOTO_BYTES = 450_000;
const MAX_IMAGE_DIMENSION = 1440;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not read ${file.name} as an image.`));
    };
    image.src = objectUrl;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Could not prepare the selected picture.'));
    reader.onerror = () => reject(new Error('Could not prepare the selected picture.'));
    reader.readAsDataURL(blob);
  });
}

export async function compressDiaryPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 15_000_000) throw new Error('Choose an image under 15 MB.');

  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  let scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  let quality = 0.78;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot resize the selected picture.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('Could not compress the selected picture.');
    if (blob.size <= MAX_PHOTO_BYTES) return blobToDataUrl(blob);
    quality = Math.max(0.42, quality - 0.1);
    scale *= 0.82;
  }

  throw new Error('This picture is too large after compression. Choose a smaller image.');
}
