import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "maazi.de | Personal Hiring Manager",
  description: "Local, privacy-first application tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="h-full bg-white text-black antialiased">{children}</body>
    </html>
  );
}
