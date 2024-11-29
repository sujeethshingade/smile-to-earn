import type { Metadata } from "next";
import "./globals.css";
import { Inter } from 'next/font/google';
import { twMerge } from "tailwind-merge";
import { ThemeProvider } from "@/context/Theme";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Smile to Earn",
  description: "Web3 platform that rewards you for smiling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={twMerge(inter.className, "antialiased")}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html >
  );
}
