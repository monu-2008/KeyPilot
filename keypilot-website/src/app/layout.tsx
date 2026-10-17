import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import "./keypilot-styles.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KeyPilot by AQERIONX — Premium keyboard navigation for quiz practice pages",
  description:
    "A smarter keyboard-navigation Chrome extension for supported quiz practice pages. Three premium themes, quick 1–4 shortcuts, built-in diagnostics, and a manual-install ZIP package.",
  keywords: [
    "KeyPilot",
    "AQERIONX",
    "Chrome extension",
    "keyboard navigation",
    "quiz shortcuts",
    "Manifest V3",
  ],
  authors: [{ name: "AQERIONX" }],
  icons: {
    icon: "/assets/keypilot-icon-48.png",
    apple: "/assets/keypilot-icon-128.png",
  },
  openGraph: {
    title: "KeyPilot by AQERIONX",
    description:
      "A smarter keyboard-navigation extension for supported quiz practice pages, with premium themes, quick shortcuts and built-in diagnostics.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KeyPilot by AQERIONX",
    description:
      "A smarter keyboard-navigation extension for supported quiz practice pages, with premium themes, quick shortcuts and built-in diagnostics.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
