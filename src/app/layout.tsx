import type { Metadata } from "next";
import { Outfit, Inter, Modak, Mouse_Memoirs } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const modak = Modak({
  variable: "--font-modak",
  subsets: ["latin"],
  weight: ["400"],
});

const mouseMemoirs = Mouse_Memoirs({
  variable: "--font-mouse-memoirs",
  subsets: ["latin"],
  weight: ["400"],
});

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
      className={`${outfit.variable} ${inter.variable} ${modak.variable} ${mouseMemoirs.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#f5e3cd] text-[#1B4D3E] selection:bg-[#1B4D3E] selection:text-white">
        {children}
      </body>
    </html>
  );
}


