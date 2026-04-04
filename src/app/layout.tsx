import type { Metadata } from "next";
import "./globals.css";
import HpCanvas from "./components/HpCanvas";

export const metadata: Metadata = {
  title: "Mentor House",
  description: "Your competitive programming mentor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HpCanvas />
        {children}
      </body>
    </html>
  );
}
