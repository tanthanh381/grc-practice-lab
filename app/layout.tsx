import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GRC Practice Lab",
  description:
    "A hands-on governance, risk and compliance practice workspace with registers, mappings, evidence, reports and portfolio exports.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
