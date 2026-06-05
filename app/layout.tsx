import type { Metadata } from "next";
import "./globals.css";

// Runs before paint (no flash): apply dark only if the user explicitly chose it.
// Defaults to light — dark is opt-in via the header toggle.
const themeInit = `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Homeowner Dashboard",
  description: "Track your property, mortgage, and finances",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
