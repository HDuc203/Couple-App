import type { Metadata } from "next";
import "./globals.css";
import { AppClientWrapper } from "@/components/AppClientWrapper";

export const metadata: Metadata = {
  title: "Couple App",
  description: "Invite-first couple onboarding built with Next.js and Supabase.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppClientWrapper>{children}</AppClientWrapper>
      </body>
    </html>
  );
}
