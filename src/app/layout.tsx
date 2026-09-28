import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ItemProvider } from '@/context/ItemContext';
import { HuntProvider } from '@/context/HuntContext';
import { CartProvider } from '@/context/CartContext';
import { InventoryProvider } from '@/context/InventoryContext';
import Navbar from '@/components/Navbar';
import ItemPreviewModal from '@/components/ItemPreviewModal';
import CartDrawer from '@/components/CartDrawer';
import ScavengerHuntAnimation from '@/components/ScavengerHuntAnimation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'The Craft Corner | Cute Crafts & DIY Store for Kids',
  description: 'A cozy, cute craft store for kids! Explore 3D prints, clay bead bracelets, mechanical switch clickers, mochi squishies, dragon puppets, and hidden scavenger hunt pals.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <InventoryProvider>
          <HuntProvider>
            <ItemProvider>
              <CartProvider>
                <div className="site-wrapper">
                  <div className="ambient-background" />
                  <Navbar />
                  <main>{children}</main>
                  <Footer />
                  <ItemPreviewModal />
                  <CartDrawer />
                  <ScavengerHuntAnimation />
                </div>
              </CartProvider>
            </ItemProvider>
          </HuntProvider>
        </InventoryProvider>
      </body>
    </html>
  );
}
