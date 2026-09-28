'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { totalCount, toggleCart } = useCart();

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShopMenuOpen(false);
      }

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShopMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }

    if (shopMenuOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shopMenuOpen, mobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1060) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleMobileToggle = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  return (
    <header className="topbar">
      <Link href="/" className="brand-wrap">
        <div className="brand-mark">
          <span className="brand-mark-icon">✨</span>
        </div>
        <div className="brand-text">
          <span className="brand-title">The Craft Corner</span>
          <span className="brand-tagline">Cute Crafts & DIY Studio for Kids</span>
        </div>
      </Link>

      <nav className="nav desktop-nav">
        <Link href="/" className="nav-link">Home</Link>

        {/* Recommended Shop Menu */}
        <div
          className="mega-menu-wrapper"
          ref={dropdownRef}
          onMouseEnter={() => setShopMenuOpen(true)}
          onMouseLeave={() => setShopMenuOpen(false)}
        >
          <button
            type="button"
            className={`nav-link shop-nav-button ${shopMenuOpen ? 'active' : ''}`}
            onClick={() => setShopMenuOpen((prev) => !prev)}
            aria-expanded={shopMenuOpen}
            aria-haspopup="true"
            aria-label="Recommended shop menu"
          >
            <span>Shop</span>
            <span className={`dropdown-chevron ${shopMenuOpen ? 'rotated' : ''}`}>▾</span>
          </button>

          {shopMenuOpen && (
            <div className="simple-shop-dropdown" role="menu">
              <Link
                href="/shop/?category=3d-prints"
                className="simple-dropdown-item"
                onClick={() => setShopMenuOpen(false)}
              >
                <span className="simple-dd-icon">🐉</span>
                <div>
                  <strong>Dragons &amp; 3D Prints</strong>
                  <small>Articulated dragons, cute fidgets &amp; fun prints</small>
                </div>
              </Link>
              <Link
                href="/shop/?category=bracelets"
                className="simple-dropdown-item"
                onClick={() => setShopMenuOpen(false)}
              >
                <span className="simple-dd-icon">🌈</span>
                <div>
                  <strong>Rainbow Loom Kits</strong>
                  <small>Bright bracelets, loom packs &amp; surprise boxes</small>
                </div>
              </Link>
              <Link
                href="/shop/?category=blind-boxes"
                className="simple-dropdown-item"
                onClick={() => setShopMenuOpen(false)}
              >
                <span className="simple-dd-icon">🎁</span>
                <div>
                  <strong>Mystery Blind Boxes</strong>
                  <small>Fun surprise picks for crafty little explorers</small>
                </div>
              </Link>
              <Link
                href="/shop/?category=clickers"
                className="simple-dropdown-item"
                onClick={() => setShopMenuOpen(false)}
              >
                <span className="simple-dd-icon">⌨️</span>
                <div>
                  <strong>Clickers &amp; Puppets</strong>
                  <small>Keyboard clickers, paw switches &amp; soft puppets</small>
                </div>
              </Link>
              <Link
                href="/catalog/"
                className="simple-dropdown-item"
                onClick={() => setShopMenuOpen(false)}
              >
                <span className="simple-dd-icon">📖</span>
                <div>
                  <strong>Browse Full Catalog</strong>
                  <small>See all the cute craft items in one place</small>
                </div>
              </Link>
            </div>
          )}
        </div>

        <Link href="/catalog/" className="nav-link">
          <span>Catalog</span>
        </Link>
        <Link href="/minigames/" className="nav-link">
          <span>🎨 Activities</span>
        </Link>
        <Link href="/track/" className="nav-link">
          <span>📦 Track Order</span>
        </Link>
      </nav>

      <div className="topbar-actions">
        <button
          type="button"
          className="cart-toggle-nav-btn"
          onClick={toggleCart}
          aria-label={`Open shopping basket with ${totalCount} items`}
        >
          <span className="cart-nav-icon">🛒</span>
          <span className="cart-nav-label">Basket</span>
          {totalCount > 0 && (
            <span className="cart-nav-badge">{totalCount}</span>
          )}
        </button>

        {/* Mobile Hamburger Menu Toggle Button */}
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={(event) => {
            event.stopPropagation();
            handleMobileToggle();
          }}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="hamburger-icon">{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile Slide-Down / Full Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div ref={mobileMenuRef} className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <div className="brand-wrap">
                <div className="brand-mark">
                  <span className="brand-mark-icon">✨</span>
                </div>
                <div className="brand-text">
                  <span className="brand-title">The Craft Corner</span>
                </div>
              </div>
              <button
                type="button"
                className="mobile-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="mobile-nav-links">
              <Link href="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">🏡</span>
                <div className="mobile-nav-text">
                  <strong>Home</strong>
                  <small>Secret Pals Scavenger Hunt &amp; Studio</small>
                </div>
              </Link>

              <div className="mobile-nav-subcategories">
                <span className="subcat-header">Shop by Section:</span>
                <div className="mobile-chips-row">
                  <Link href="/shop/?category=3d-prints" className="mobile-chip" onClick={() => setMobileMenuOpen(false)}>
                    🐉 3D Prints
                  </Link>
                  <Link href="/shop/?category=bracelets" className="mobile-chip" onClick={() => setMobileMenuOpen(false)}>
                    🌈 Rainbow Loom ($2.00)
                  </Link>
                  <Link href="/shop/?category=blind-boxes" className="mobile-chip" onClick={() => setMobileMenuOpen(false)}>
                    🎁 Blind Boxes ($2.50)
                  </Link>
                  <Link href="/shop/?category=clickers" className="mobile-chip" onClick={() => setMobileMenuOpen(false)}>
                    ⌨️ Clickers &amp; Puppets
                  </Link>
                  <Link href="/slimetea/" className="mobile-chip" onClick={() => setMobileMenuOpen(false)}>
                    🧋 SlimeTea Bar
                  </Link>
                </div>
              </div>

              <Link href="/catalog/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">📖</span>
                <div className="mobile-nav-text">
                  <strong>Product Catalog</strong>
                  <small>Master catalog of all craft products</small>
                </div>
              </Link>

              <Link href="/#scavenger-hunt" className="mobile-nav-link hunt-pill" onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">🐾</span>
                <div className="mobile-nav-text">
                  <strong>5 Sneaky Pals Quest</strong>
                  <small>Check off all 5 hidden mascots</small>
                </div>
              </Link>

              <Link href="/minigames/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">🎨</span>
                <div className="mobile-nav-text">
                  <strong>Craft Activities</strong>
                  <small>Bead maker, slime maker &amp; squishy lab</small>
                </div>
              </Link>

              <Link href="/slimetea" className="mobile-nav-link slime-pill" onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">🧋</span>
                <div className="mobile-nav-text">
                  <strong>SlimeTea Studio</strong>
                  <small>Boba &amp; jelly cube slime bar</small>
                </div>
              </Link>

              <Link href="/track" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">📦</span>
                <div className="mobile-nav-text">
                  <strong>Track Your Package</strong>
                  <small>Live handcrafting &amp; shipping status</small>
                </div>
              </Link>

            </div>

            <div className="mobile-nav-footer">
              <button
                type="button"
                className="primary-button mobile-open-basket-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  toggleCart();
                }}
              >
                🛒 Open Craft Basket ({totalCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
