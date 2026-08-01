import type { Metadata } from "next";
import { DevTools } from "@/components/dev-tools";
import "./globals.css";

export const metadata: Metadata = {
  title: "DOLII Research Survey",
  description: "Delayed Onset of Lactogenesis II research data collection",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <DevTools />
      </body>
    </html>
  );
}
