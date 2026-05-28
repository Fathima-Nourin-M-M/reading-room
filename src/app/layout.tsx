import type { Metadata } from "next";
import { Crimson_Text, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";

const crimsonText = Crimson_Text({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Reading Room — Curated Literary Sanctuary",
  description: "A warm, immersive platform for book lovers. Discover curated books, read at your own pace, and connect with a community of real readers.",
  openGraph: {
    title: "The Reading Room",
    description: "A curated literary sanctuary for slow evenings and good books.",
    siteName: "The Reading Room",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${crimsonText.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fdf9f3]">
        <Providers>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-[#d4b58f]/40 bg-[#f7ecde] px-4 py-8 md:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-8 md:grid-cols-4">
                <div className="md:col-span-2">
                  <p className="font-serif text-2xl text-[#2b1c14]">The Reading Room</p>
                  <p className="mt-2 text-xs uppercase tracking-widest text-[#9c7148]">Curated Literary Sanctuary</p>
                  <p className="mt-3 max-w-xs text-sm text-[#6d4e38]">
                    A warm, immersive platform for book lovers. Discover curated books, read at your own pace.
                  </p>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9b6842]">Explore</p>
                  <nav className="space-y-2 text-sm text-[#5d4334]">
                    {[["Discover", "/discover"], ["Store", "/store"], ["Marketplace", "/marketplace"], ["Lists", "/lists"], ["Reader Feed", "/feed"]].map(([label, href]) => (
                      <a key={href} href={href} className="block hover:text-[#2b1c14]">{label}</a>
                    ))}
                  </nav>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9b6842]">Account</p>
                  <nav className="space-y-2 text-sm text-[#5d4334]">
                    {[["Library", "/library"], ["Orders", "/orders"], ["Wishlist", "/wishlist"], ["Sell a Book", "/sell"], ["Profile", "/profile"]].map(([label, href]) => (
                      <a key={href} href={href} className="block hover:text-[#2b1c14]">{label}</a>
                    ))}
                  </nav>
                </div>
              </div>
              <div className="mt-8 border-t border-[#d4b58f]/40 pt-6 text-center text-xs text-[#9c7148]">
                © {new Date().getFullYear()} The Reading Room. A sanctuary for slow readers.
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
