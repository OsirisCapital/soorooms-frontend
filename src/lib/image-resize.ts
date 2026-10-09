/**
 * Recadre une photo en carré et la réduit avant l'envoi : une photo de téléphone pèse plusieurs Mo,
 * un avatar n'en demande que quelques dizaines de Ko. Moins de données mobiles consommées, envoi plus rapide.
 * En cas de souci (navigateur trop ancien, image illisible), on renvoie le fichier d'origine sans bloquer.
 */
export async function squareThumbnail(file: File, size = 512): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const target = Math.min(size, side);
    const canvas = document.createElement("canvas");
    canvas.width = target;
    canvas.height = target;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, target, target);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
