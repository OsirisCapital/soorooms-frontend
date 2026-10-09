import { ApiError, getUploadSignature, type UploadPurpose } from "./api";

const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo

const ACCEPTED: Record<UploadPurpose, string[]> = {
  property_photo: ["image/jpeg", "image/png", "image/webp"],
  kyc_document: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  avatar: ["image/jpeg", "image/png", "image/webp"],
};

export const ACCEPT_ATTRIBUTE: Record<UploadPurpose, string> = {
  property_photo: "image/jpeg,image/png,image/webp",
  kyc_document: "image/jpeg,image/png,image/webp,application/pdf",
  avatar: "image/jpeg,image/png,image/webp",
};

/**
 * Envoie un fichier directement à Cloudinary avec une signature fournie par le
 * backend, et renvoie l'URL publique du fichier. Les contrôles de type et de
 * taille ici évitent un envoi voué à l'échec ; Cloudinary refait les siens.
 */
export async function uploadFile(file: File, purpose: UploadPurpose): Promise<string> {
  if (!ACCEPTED[purpose].includes(file.type)) {
    throw new Error(
      purpose === "kyc_document"
        ? "Format non pris en charge : choisissez une image (JPG, PNG, WebP) ou un PDF."
        : "Format non pris en charge : choisissez une image JPG, PNG ou WebP.",
    );
  }
  if (file.size > MAX_BYTES) throw new Error("Fichier trop lourd : 8 Mo maximum.");

  const signature = await getUploadSignature(purpose);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signature.apiKey);
  form.append("timestamp", String(signature.timestamp));
  form.append("signature", signature.signature);
  form.append("folder", signature.folder);
  form.append("allowed_formats", signature.allowedFormats);
  // Livraison privée (documents KYC) : le paramètre fait partie de la signature,
  // l'omettre ferait refuser l'envoi par Cloudinary.
  if (signature.type) form.append("type", signature.type);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new Error("Envoi impossible : vérifiez votre connexion et réessayez.");
  }

  const body = (await response.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!response.ok || !body?.secure_url) {
    throw new Error(body?.error?.message ?? "L'envoi du fichier a échoué.");
  }
  return body.secure_url;
}

export const uploadErrorMessage = (error: unknown) =>
  error instanceof ApiError || error instanceof Error ? error.message : "L'envoi du fichier a échoué.";
