import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM",
  description: "Klientë dhe shënime",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sq" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 flex flex-col">{children}</body>
    </html>
  );
}
