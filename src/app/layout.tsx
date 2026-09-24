import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Q1 Bowl | Artisan Cloud Kitchen & Meal Subscriptions",
  description: "Freshly prepared daily meals, customizable meal subscriptions, and express doorstep delivery. Order online today.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full antialiased scroll-smooth"
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Modak&family=Mouse+Memoirs&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#f5e3cd] text-[#1B4D3E] selection:bg-[#1B4D3E] selection:text-white">
        {children}
      </body>
    </html>
  );
}


