import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "voidchan",
  description: "Anonymous, ephemeral, real-time shared infinite canvas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
