import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { Splash } from "@/components/Splash";
import "./globals.css";

const DESCRIPTION =
  "Карта Владивостока для жителей: проблемы двора и дома, ремонты и отключения рядом, квитанции ЖКХ простыми словами.";
export const metadata: Metadata = {
  title: {
    default: "Мой дом. Владивосток",
    template: "%s · Мой дом. Владивосток",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Мой дом. Владивосток",
    title: "Мой дом. Владивосток",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Splash />
        </Providers>
      </body>
    </html>
  );
}
