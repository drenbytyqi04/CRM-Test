import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ActivityTracker from "./activity-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM",
  description: "Takime dhe shënime",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sq" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 flex flex-col">
        {children}
        {/* Nuk vizaton asgjë; vetëm shënon kohën aktive. */}
        <ActivityTracker />
      </body>
    </html>
  );
}
