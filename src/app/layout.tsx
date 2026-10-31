import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yapoz: every question, answered",
  description: "Yapoz is the AI front desk for any business: it answers your customers on WhatsApp and Telegram from your own prices and stock, turns chats into orders for your approval, and hands the tricky ones to you.",
  icons: { icon: "/yapoz.svg", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Yapoz" },
};

export const viewport: Viewport = { themeColor: "#0E0D0B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
