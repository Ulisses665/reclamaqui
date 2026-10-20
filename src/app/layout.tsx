import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reclamaqui | Um espaço de escuta escolar",
  description: "Mural comunitário para compartilhar e acompanhar situações do ambiente escolar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
