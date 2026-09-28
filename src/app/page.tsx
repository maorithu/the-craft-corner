'use client';

import Link from 'next/link';
import { craftItems } from '@/data/items';
import { useCart } from '@/context/CartContext';
import { useInventory } from '@/context/InventoryContext';
import { sound } from '@/utils/soundEffects';
import HiddenPal from '@/components/HiddenPal';
import ScavengerHuntBoard from '@/components/ScavengerHuntBoard';

export default function HomePage() {
  const { addToCart } = useCart();
  const { products } = useInventory();

  const catalog = products.length > 0 ? products : craftItems;

  // Curate 6 top products representing each staff department
  const featuredIds = [101, 102, 1, 6, 4, 301];
  const featuredProducts = catalog.filter((it) => featuredIds.includes(Number(it.id)));

  const handleQuickAdd = (it: (typeof catalog)[0]) => {
    sound.playClick();
    addToCart({
      id: it.id,
      name: it.name,
      shortName: it.shortName,
      displayPrice: it.displayPrice,
      icon: it.icon || '✨',
      imageUrl: it.imageUrl,
      tag: it.tag,
      categoryLabel: it.categoryLabel,
    });
  };

  return (
    <div className="home-container">
      {/* Clean & Welcoming Hero Section */}
      <section className="hero simple-craft-hero">
        <div className="hero-content">
          <div className="hero-badge cute-badge">
            <span className="badge-spark">✨</span>
            <span>Handmade Crafts, DIY Slimes &amp; 3D Prints</span>
          </div>

          <h1 className="hero-headline home-main-title">
            The Craft Corner
          </h1>

          <p className="hero-description home-main-desc">
            A cozy handmade craft shop full of cute DIY fun! Explore articulated 3D dragons, handmade studio slimes, and Rainbow Loom bracelet kits.
          </p>

          <div className="hero-actions">
            <Link href="/shop" className="primary-button hero-btn">
              🛍️ Shop All Crafts
            </Link>
            <Link href="/slimetea" className="secondary-button hero-btn">
              🧋 SlimeTea Studio
            </Link>
          </div>
        </div>
      </section>

      {/* Staff Department Highlights */}
      <section className="home-depts-section">
        <div className="home-section-header">
          <span className="section-pill">🎨 Meet Our Craft Leads</span>
          <h2>Explore by Craft Department</h2>
          <p>Each staff member specializes in handcrafting their own unique creations!</p>
        </div>

        <div className="home-dept-cards-grid">
          {/* Kaitlyn's Department */}
          <Link href="/shop?category=3d-prints" className="home-dept-card dept-kaitlyn">
            <div className="dept-card-top">
              <span className="dept-icon">🐉</span>
              <span className="dept-badge">Dragon Studio</span>
            </div>
            <h3>Dragons &amp; 3D Prints</h3>
            <p>Articulated crystal dragons, cute capybaras, dinos, and sensory keyboard clickers.</p>
            <span className="dept-link-label">Browse 3D Prints →</span>
          </Link>

          {/* SlimeTea Department */}
          <Link href="/slimetea" className="home-dept-card dept-anna">
            <div className="dept-card-top">
              <span className="dept-icon">🧋</span>
              <span className="dept-badge">SlimeTea Studio</span>
            </div>
            <h3>Handmade SlimeTea &amp; Boba</h3>
            <p>Custom craft slimes, boba bubble drinks, jelly cubes, and DIY slime toppings.</p>
            <span className="dept-link-label">Visit SlimeTea Bar →</span>
          </Link>

          {/* Loom Department */}
          <Link href="/shop?category=bracelets" className="home-dept-card dept-nicole">
            <div className="dept-card-top">
              <span className="dept-icon">🌸</span>
              <span className="dept-badge">Loom &amp; Gift Shop</span>
            </div>
            <h3>Rainbow Loom &amp; Blind Boxes</h3>
            <p>Beach, Galaxy &amp; Minecraft kits ($2.00) plus mystery squishy blind boxes ($2.50).</p>
            <span className="dept-link-label">Browse Loom &amp; Boxes →</span>
          </Link>
        </div>
      </section>

      {/* Featured Products directly on Homepage */}
      <section className="home-featured-section">
        <div className="home-section-header">
          <span className="section-pill">⭐ Customer Favorites</span>
          <h2>Popular Craft Kits &amp; Creations</h2>
          <p>Handcrafted in small batches — tap to add right into your craft basket!</p>
        </div>

        <div className="home-products-grid">
          {featuredProducts.map((it) => (
            <div key={it.id} className="home-product-card">
              <div className="product-card-top">
                <span className="product-icon-tag">{it.icon || '✨'}</span>
                {it.tag && <span className="product-meta-pill">{it.tag}</span>}
              </div>

              <div className="product-card-info">
                <strong className="product-title">{it.shortName || it.name}</strong>
              </div>

              <div className="product-card-bottom">
                <span className="product-price">{it.displayPrice}</span>
                <button
                  type="button"
                  className="primary-button product-add-btn"
                  onClick={() => handleQuickAdd(it)}
                >
                  + Add to Basket
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="home-shop-departments-cta">
          <div className="home-dept-chips-title">Shop by Craft Department:</div>
          <div className="home-dept-buttons">
            <Link href="/shop/?category=3d-prints" className="home-dept-chip">
              🐉 3D Prints &amp; Dragons
            </Link>
            <Link href="/shop/?category=bracelets" className="home-dept-chip">
              🌈 Rainbow Loom ($2.00)
            </Link>
            <Link href="/shop/?category=blind-boxes" className="home-dept-chip">
              🎁 Mystery Blind Boxes ($2.50)
            </Link>
            <Link href="/shop/?category=clickers" className="home-dept-chip">
              ⌨️ Clickers &amp; Puppets
            </Link>
            <Link href="/slimetea/" className="home-dept-chip slime-chip">
              🧋 SlimeTea Bar
            </Link>
          </div>
          <div className="home-catalog-link-wrap">
            <Link href="/catalog/" className="home-catalog-link">
              📖 Browse Master Product Catalog ({catalog.length} items) →
            </Link>
          </div>
        </div>
      </section>

      {/* Studio Perks */}
      <section className="home-perks-bar">
        <div className="home-perk-item">
          <span className="perk-emoji">📦</span>
          <div>
            <strong>Mail &amp; Delivery Only</strong>
            <p>Sent safely to your door by postal mail or direct delivery.</p>
          </div>
        </div>
        <div className="home-perk-item">
          <span className="perk-emoji">✨</span>
          <div>
            <strong>Handmade Slimes</strong>
            <p>Crafted fresh with custom charms &amp; toppings.</p>
          </div>
        </div>
        <div className="home-perk-item">
          <span className="perk-emoji">🥄</span>
          <div>
            <strong>Mystery Spoon Perks</strong>
            <p>Free mixing spoon package on orders over $50.</p>
          </div>
        </div>
      </section>

      {/* Creative Activities Spotlight */}
      <section className="home-games-spotlight" style={{ position: 'relative' }}>
        <div className="games-spotlight-box">
          <div className="spotlight-text">
            <span className="spotlight-tag">🎨 Creative Activities</span>
            <h3>Interactive Craft Studios</h3>
            <p>
              Try our cozy digital craft tables — design bead bracelets, mix DIY slimes, or try squishy blind boxes!
            </p>
          </div>
          <div className="spotlight-actions">
            <Link href="/minigames" className="primary-button spotlight-btn">
              Explore Activities 🎨
            </Link>
            <a href="#scavenger-hunt" className="secondary-button spotlight-btn">
              🐾 Pals Quest
            </a>
          </div>
        </div>

        {/* Hidden Pal #2: Pip the Berry Bunny (Hiding near creative activities!) */}
        <div style={{ position: 'absolute', bottom: '12px', right: '24px' }}>
          <HiddenPal palId="pip" customClass="home-pip-pal" />
        </div>
      </section>

      {/* 5 Hidden Pals Scavenger Hunt Board */}
      <ScavengerHuntBoard />
    </div>
  );
}

