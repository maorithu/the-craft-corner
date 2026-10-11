'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    totalCount,
    subtotal,
    formattedSubtotal,
  } = useCart();

  if (!isCartOpen) return null;

  // Free Mystery Spoon threshold: $50.00
  const freeSpoonThreshold = 50.0;
  const amountToFreeSpoon = Math.max(0, freeSpoonThreshold - subtotal);
  const spoonProgressPercent = Math.min(100, (subtotal / freeSpoonThreshold) * 100);

  return (
    <div
      className="cart-drawer-overlay"
      onClick={closeCart}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart Drawer"
    >
      <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title-row">
            <span className="cart-header-icon">🛒</span>
            <div>
              <h3>Your Craft Basket</h3>
              <span className="cart-item-count-label">
                {totalCount} item{totalCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={closeCart}
            aria-label="Close cart drawer"
          >
            ×
          </button>
        </div>

        {/* Free Mystery Spoon Package Progress Bar ($50.00 Threshold) */}
        <div className="cart-perk-banner">
          <div className="perk-label-row">
            <span className="perk-icon">🥄</span>
            <span className="perk-text">
              {amountToFreeSpoon > 0 ? (
                <>
                  Spend <strong>${amountToFreeSpoon.toFixed(2)}</strong> more to get a{' '}
                  <strong>FREE Mystery Spoon Package</strong> (Mixing Spoon + Charms)!
                </>
              ) : (
                <strong>🎉 UNLOCKED! You earned a FREE Mystery Spoon Package! 🥄✨</strong>
              )}
            </span>
          </div>
          <div className="perk-progress-bar-track">
            <div
              className="perk-progress-bar-fill"
              style={{ width: `${spoonProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Body Content */}
        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="cart-empty-view">
            <span className="cart-empty-icon">🧺</span>
            <h3>Your basket is empty</h3>
            <p>
              Check out our <strong>$2.00 Rainbow Loom Packets</strong>, <strong>$2.50 Mystery Blind Boxes</strong>, the <strong>$4.50 Oreo Balloon</strong>, and SlimeTea bar!
            </p>
            <Link
              href="/shop"
              className="primary-button empty-shop-btn"
              onClick={closeCart}
            >
              Product Catalog →
            </Link>
          </div>
        ) : (
          /* Cart Items List */
          <>
            <div className="cart-items-scroll-list">
              {cartItems.map((ci) => (
                <div key={ci.cartId} className="cart-item-row">
                  {/* Visual */}
                  <div className="cart-item-visual">
                    {ci.imageUrl ? (
                      <img src={ci.imageUrl} alt={ci.name} className="cart-item-thumb" />
                    ) : (
                      <span className="cart-item-icon">{ci.icon}</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="cart-item-info">
                    <div className="cart-item-title-row">
                      <strong className="cart-item-name">{ci.shortName || ci.name}</strong>
                      <span className="cart-item-price-tag">${(ci.price * ci.quantity).toFixed(2)}</span>
                    </div>

                    {/* Size tag */}
                    {ci.size && (
                      <span className="cart-item-size-badge">Size: {ci.size}</span>
                    )}

                    {ci.customizationDetails ? (
                      <span className="cart-item-custom-note">{ci.customizationDetails}</span>
                    ) : (
                      <span className="cart-item-unit-price">{ci.displayPrice} each</span>
                    )}

                    {/* Quantity Controls */}
                    <div className="cart-item-qty-row">
                      <div className="qty-pill-controls">
                        <button
                          type="button"
                          className="qty-btn minus"
                          onClick={() => updateQuantity(ci.cartId, ci.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="qty-value">{ci.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn plus"
                          onClick={() => updateQuantity(ci.cartId, ci.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove-link"
                        onClick={() => removeFromCart(ci.cartId)}
                        aria-label="Remove item from basket"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer Summary */}
            <div className="cart-drawer-footer">
              <div className="cart-pricing-breakdown">
                <div className="price-line">
                  <span>Subtotal:</span>
                  <strong>{formattedSubtotal}</strong>
                </div>
                <div className="price-line free-shipping-line">
                  <span>Craft Stickers:</span>
                  <span className="free-badge">FREE 🎉</span>
                </div>
                {amountToFreeSpoon === 0 && (
                  <div className="price-line free-shipping-line">
                    <span>Mystery Spoon Package:</span>
                    <span className="free-badge">FREE 🥄</span>
                  </div>
                )}
                <div className="price-line total-line">
                  <span>Total:</span>
                  <span className="total-amount">{formattedSubtotal}</span>
                </div>
              </div>

              <Link href="/checkout" className="primary-button checkout-submit-btn" onClick={closeCart}>
                Proceed to Checkout ({formattedSubtotal}) ✨
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
