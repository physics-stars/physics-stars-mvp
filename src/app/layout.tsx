import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadades globals del lloc. El joc "Physics Stars" es presenta sempre en català,
// ja que està pensat per a l'alumnat de 4rt d'ESO a Catalunya.
export const metadata: Metadata = {
  title: "Physics Stars",
  description:
    "Physics Stars — Aprèn física de manera interactiva a través d'una història i reptes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ca"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
