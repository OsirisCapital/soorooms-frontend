/** Carte publicitaire partageable d'un logement, dessinée dans un <canvas> (aucun serveur d'images). */

export type CardFormat = "story" | "post";

export const CARD_SIZE: Record<CardFormat, { width: number; height: number; label: string }> = {
  story: { width: 1080, height: 1920, label: "Story (WhatsApp, Facebook, Instagram)" },
  post: { width: 1080, height: 1350, label: "Publication (4:5)" },
};

export interface CardContent {
  title: string;
  city: string;
  quarter: string;
  /** Prix de la chambre la moins chère, par nuit ; null si aucune chambre. */
  fromPrice: number | null;
  verified: boolean;
  qrDataUrl: string | null;
  photo: HTMLImageElement | null;
  link: string;
}

const TEAL = "#1e4a4a";
const TERRACOTTA = "#c8553d";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Nécessaire pour pouvoir exporter le canvas en PNG (Cloudinary autorise le CORS).
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Photo illisible"));
    img.src = src;
  });
}

/** Découpe un texte en lignes qui tiennent dans maxWidth ; la dernière est tronquée par « … » au-delà de maxLines. */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  const consumed = lines.join(" ").split(/\s+/).length;
  if (consumed < words.length && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Réduit la taille de police jusqu'à ce que le texte tienne dans maxWidth. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, weight: number, family: string) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 20 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

export async function drawCard(canvas: HTMLCanvasElement, format: CardFormat, content: CardContent) {
  const { width, height } = CARD_SIZE[format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Fond : photo recadrée pour remplir, sinon dégradé de la marque.
  if (content.photo) {
    const img = content.photo;
    const scale = Math.max(width / img.width, height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  } else {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, TEAL);
    bg.addColorStop(1, "#2f6f6f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }

  // Voile sombre en bas (lisibilité du texte) et léger en haut (logo).
  const bottom = ctx.createLinearGradient(0, height * 0.35, 0, height);
  bottom.addColorStop(0, "rgba(0,0,0,0)");
  bottom.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 0, width, height);
  const top = ctx.createLinearGradient(0, 0, 0, 260);
  top.addColorStop(0, "rgba(0,0,0,0.5)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, width, 260);

  const margin = 72;
  ctx.textBaseline = "alphabetic";
  const sans = '"Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif';

  // Marque
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 54px ${sans}`;
  ctx.fillText("SòôRooms", margin, margin + 52);

  // Badge vérifié
  if (content.verified) {
    const text = "✓ Vérifié par SòôRooms";
    ctx.font = `600 34px ${sans}`;
    const tw = ctx.measureText(text).width;
    const bw = tw + 56;
    const bx = width - margin - bw;
    ctx.fillStyle = TEAL;
    roundRect(ctx, bx, margin + 6, bw, 64, 32);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, bx + 28, margin + 49);
  }

  // Bloc du bas
  const qrSize = format === "story" ? 260 : 220;
  const textWidth = width - margin * 2 - qrSize - 40;
  const baseY = height - margin;

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${format === "story" ? 76 : 68}px ${sans}`;
  const titleLines = wrapLines(ctx, content.title, textWidth, 3);
  const lineH = format === "story" ? 88 : 78;

  let y = baseY - 150 - (content.fromPrice != null ? 0 : 0);
  // On remonte depuis le bas : pied de page, puis prix, puis lieu, puis titre.
  ctx.font = `500 34px ${sans}`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(content.link.replace(/^https?:\/\//, ""), margin, baseY);

  if (content.fromPrice != null) {
    ctx.fillStyle = "#ffd9a8";
    const priceText = `dès ${fcfa(content.fromPrice)} / nuit`;
    fitFont(ctx, priceText, textWidth, format === "story" ? 64 : 56, 700, sans);
    ctx.fillText(priceText, margin, baseY - 70);
    y = baseY - 70 - (format === "story" ? 100 : 90);
  } else {
    y = baseY - 100;
  }

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `500 ${format === "story" ? 46 : 42}px ${sans}`;
  ctx.fillText(`${content.city} · ${content.quarter}`, margin, y);
  y -= 90;

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${format === "story" ? 76 : 68}px ${sans}`;
  for (let i = titleLines.length - 1; i >= 0; i--) {
    ctx.fillText(titleLines[i], margin, y);
    y -= lineH;
  }

  // QR code dans un cadre blanc, en bas à droite.
  if (content.qrDataUrl) {
    const qr = await loadImage(content.qrDataUrl);
    const pad = 20;
    const bx = width - margin - qrSize;
    const by = baseY - qrSize - 52;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, bx - pad, by - pad, qrSize + pad * 2, qrSize + pad * 2 + 52, 28);
    ctx.fill();
    ctx.drawImage(qr, bx, by, qrSize, qrSize);
    ctx.fillStyle = TERRACOTTA;
    fitFont(ctx, "Scannez pour réserver", qrSize, 30, 700, sans);
    ctx.textAlign = "center";
    ctx.fillText("Scannez pour réserver", bx + qrSize / 2, by + qrSize + 42);
    ctx.textAlign = "left";
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export impossible"))), "image/png");
  });
}
