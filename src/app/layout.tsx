import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// Keep Geist around for fallback / future pages
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MODID",
  description: "개인 작업, 사적인 용도 위주.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${archivo.variable} ${jetbrains.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" precedence="default" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" precedence="default" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Noto+Serif+KR:wght@400;500;600;700;900&display=swap"
        precedence="default"
      />
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
