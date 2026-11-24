// Turns a picture chosen by the user into a small JPEG data URL (stored directly in the database,
// so no extra Firebase Storage setup is needed). Max width 640 px, usually 30-90 KB.
export function fileToCover(file, maxW = 640) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Choose an image file (JPG, PNG, WEBP).'));
    if (file.size > 15 * 1024 * 1024) return reject(new Error('The image is too large (max 15 MB).'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxW / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let q = 0.78, out = c.toDataURL('image/jpeg', q);
      while (out.length > 260000 && q > 0.35) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image.')); };
    img.src = url;
  });
}
