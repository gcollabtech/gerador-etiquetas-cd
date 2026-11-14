import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gerador de Endereços e Etiquetas CODE 128 (10×5 cm) — Centro de Distribuição",
  description:
    "Ferramenta web para criação automática de endereços de armazenagem (R01-P01-A01-N01), geração de código de barras CODE 128 e impressão de etiquetas 100×50 mm com posicionamento automático de setas.",
  keywords: [
    "CODE 128",
    "Etiquetas CD",
    "Armazenagem",
    "Centro de Distribuição",
    "WMS",
    "Código de Barras",
    "Big Master",
    "Collab",
  ],
  icons: {
    icon: "/logo/icone-collab-colorido-1-branco-mostarda.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0E12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('cd-labels-theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--collab-mostarda)] selection:text-black">
        {children}
      </body>
    </html>
  );
}

