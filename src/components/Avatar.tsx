"use client";

import { useState } from "react";
import { optimizedImageUrl } from "@/lib/images";

type Props = {
  url: string | null | undefined;
  name: string;
  /** Côté en pixels. */
  size?: number;
  className?: string;
};

/** Photo de profil ronde ; l'initiale du prénom tient la place si la photo manque ou ne charge pas. */
export function Avatar({ url, name, size = 112, className = "" }: Props) {
  const [broken, setBroken] = useState<string | null>(null);
  const initial = name.trim().charAt(0).toUpperCase() || "·";
  const showPhoto = Boolean(url) && broken !== url;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-teal-100)] font-display font-bold text-[var(--color-teal)] ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {showPhoto && url ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo hébergée sur Cloudinary ou fournie par Google
        <img
          src={optimizedImageUrl(url, size * 2)}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setBroken(url)}
        />
      ) : (
        initial
      )}
    </div>
  );
}
