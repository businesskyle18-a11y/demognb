import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getActingUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GNB Dynamics — Unified Business Platform",
  description:
    "Demo MVP: Client → Job Order backbone across Sales, Operations, Accounting, Inventory, Purchasing, HR.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const actingUser = await getActingUser();
  const allUsers = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <AppShell actingUser={actingUser} allUsers={allUsers}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
