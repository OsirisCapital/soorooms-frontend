import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

// Poppins pour les titres (rond, chaleureux — proche de l'esprit du logo),
// Inter pour le corps de texte (lisible, neutre). Deux familles nettement
// distinctes, comme recommandé plutôt qu'une seule polyvalente partout.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SòôRooms — Hébergez. Voyagez. Vivez.",
  description:
    "Trouvez le logement idéal au Cameroun : hôtels, meublés, chambres d'hôtes et résidences étudiantes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SòôRooms",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf6f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${poppins.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-cream text-ink antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
