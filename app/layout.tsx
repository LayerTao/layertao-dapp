import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";

import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Providers } from "@/components/Providers";

// 1. Change variable to --font-sans
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// 2. Change variable to --font-display
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});
export const metadata: Metadata = {
  title: "Layer API | Developer Portal",
  description: "Manage API keys, billing, and usage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* By applying font-sans here, Inter becomes the default font for the whole app.
        We will configure Tailwind to recognize these variables next.
      */}
      <body
        className="min-h-full font-sans bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
              {/* Left Sidebar Fixed */}
              <div className="hidden border-r border-border bg-background md:block">
                <div className="fixed inset-y-0 w-[260px]">
                  <Sidebar />
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex min-w-0 flex-col">
                <Topbar />
                <main className="flex-1 p-6">
                  <div className="mx-auto max-w-7xl">{children}</div>
                </main>
              </div>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
