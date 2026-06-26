import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gomoku — Five in a Row",
  description:
    "Play Gomoku online! A classic strategy board game for two players. Challenge the AI or play with friends. Five in a row wins!",
  keywords: ["gomoku", "five in a row", "board game", "strategy game", "online game"],
  openGraph: {
    title: "Gomoku — Five in a Row",
    description: "Classic strategy board game. Challenge the AI or play with friends!",
    type: "website",
    siteName: "Gomoku",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gomoku — Five in a Row",
    description: "Classic strategy board game. Challenge the AI or play with friends!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col items-center bg-[var(--bg)] text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
