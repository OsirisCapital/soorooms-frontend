"use client";

import { useState, type ImgHTMLAttributes } from "react";
import { imageSrcSet, optimizedImageUrl } from "@/lib/images";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "onError"> & {
  /** Adresse d'origine de la photo (celle enregistrée en base). */
  url: string;
  /** Largeur demandée à Cloudinary pour l'image principale. */
  width: number;
  /** Largeurs proposées au navigateur (facultatif). */
  widths?: number[];
};

/**
 * Photo de logement dans la bonne taille, avec un filet de sécurité : si la version allégée ne se charge pas
 * (réglage Cloudinary, lien particulier…), on affiche l'image d'origine plutôt qu'un vide.
 */
export function PropertyPhoto({ url, width, widths, alt = "", ...rest }: Props) {
  const [original, setOriginal] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URLs Cloudinary saisies par les hôtes
    <img
      {...rest}
      key={url}
      src={original ? url : optimizedImageUrl(url, width)}
      srcSet={original || !widths ? undefined : imageSrcSet(url, widths)}
      alt={alt}
      onError={() => setOriginal(true)}
    />
  );
}
