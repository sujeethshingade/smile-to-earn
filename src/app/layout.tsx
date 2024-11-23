import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smile to Earn",
  description: "web3 platform that rewards you for smiling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
