import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FootBook",
  description: "A football journalling web application",
  icons: {
    icon: "/footbook_title_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider dynamic>
      <html lang="en" className="h-full">
        <body className={`${inter.variable} min-h-full flex flex-col font-sans antialiased text-foreground bg-background`}>
          <Navbar />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
