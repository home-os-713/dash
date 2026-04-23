import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homeowner Dashboard",
  description: "Track your property, mortgage, and finances",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
