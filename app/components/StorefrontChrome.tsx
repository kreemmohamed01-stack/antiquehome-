import Footer from "./Footer";
import SideMenu from "./SideMenu";
import CartDrawer from "./CartDrawer";
import SearchDrawer from "./SearchDrawer";
import WhatsAppFloat from "./WhatsAppFloat";
import MusicPlayer from "./MusicPlayer";
import SiteChrome from "./SiteChrome";

// Wraps every storefront page's footer + off-canvas menu/drawers + floating
// widgets + client-side behavior. Deliberately excludes any bottom mobile
// nav — the storefront never has one; only /admin/* does.
export default function StorefrontChrome() {
  return (
    <>
      <Footer />
      <SideMenu />
      <CartDrawer />
      <SearchDrawer />
      <WhatsAppFloat />
      <MusicPlayer />
      <SiteChrome />
    </>
  );
}
