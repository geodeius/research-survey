import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { DevTools } from "@/components/dev-tools";
import "react-day-picker/style.css";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "DOLII Research Survey",
  description: "Delayed Onset of Lactogenesis II research data collection",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={instrumentSans.variable}>
      <body>
        {children}
        <DevTools />
      </body>
    </html>
  );
}
