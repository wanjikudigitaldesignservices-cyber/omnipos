import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-context";

export const metadata: Metadata = {
  title: "OmniPOS — Universal SME Point of Sale & ERP",
  description: "Next-generation Universal Point of Sale and Cloud ERP for Retail, Chemists, Agrovets, and Dining SMEs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('omnipos-theme');
                if (saved === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {
                document.documentElement.classList.add('light');
              }
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased min-h-screen selection:bg-emerald-500 selection:text-white dark:selection:text-slate-950 font-sans transition-colors duration-150">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

