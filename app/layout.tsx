import type { Metadata, Viewport } from "next";
import { Saira_Condensed, Barlow_Condensed, Anton } from "next/font/google";
import "./globals.css";

const saira = Saira_Condensed({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * Fonte do nome da marca. Condensada no peso máximo — sustenta a hero ao lado
 * da silhueta, que é uma massa preta pesada. Vai sempre com o skew de -12°
 * (`skew-brand`), que é a assinatura já usada nos carrosséis do Instagram.
 */
const marca = Anton({
  variable: "--font-marca-familia",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mó Visão — óculos pra corrida e pra rua",
    template: "%s · Mó Visão",
  },
  description:
    "Óculos Oakley pra quem corre, treina e não abre mão de estilo na rua. Modelo pra cada tipo, do discreto ao que aparece de longe.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Mó Visão",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

/**
 * Layout raiz: só o essencial de toda página.
 *
 * O Header e o Footer da loja NÃO ficam aqui — moram em `(loja)/layout.tsx`.
 * Aqui envolveriam o painel também, e o dono veria o menu da vitrine em cima
 * das telas de administração.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${saira.variable} ${barlow.variable} ${marca.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
