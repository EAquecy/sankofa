import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/caveat/700.css";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Sankofa · Virtual WASSCE remedial classes",
  description: "Learn from screened Ghanaian teachers online. Follow teachers, join classroom sessions, ask questions and book private or group lessons for your WASSCE rewrite.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
