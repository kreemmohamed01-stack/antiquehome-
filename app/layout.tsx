import type { Metadata } from "next";
import "./styles/styles.css";
import "./styles/promo-bar.css";
import "./styles/sections.css";
import "./styles/footer.css";
import "./styles/sidemenu.css";
import "./styles/drawers.css";
import "./styles/music-player.css";
import "./styles/shop.css";
import "./styles/product.css";
import "./styles/checkout.css";
import "./styles/order-confirmation.css";
import "./styles/about.css";
import "./styles/route-loader.css";
import RouteLoaderWrapper from "./components/RouteLoaderWrapper";
import VisitTracker from "./components/VisitTracker";

export const metadata: Metadata = {
  title: "Antique Home — Vase & Decor",
  description:
    "Curated vases, antiques and distinctive home décor pieces designed to bring timeless character to your space.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&family=Dancing+Script:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <RouteLoaderWrapper />
        <VisitTracker />
        {children}
      </body>
    </html>
  );
}
