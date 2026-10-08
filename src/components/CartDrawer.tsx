'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart, PlacedOrder } from '@/context/CartContext';
import { sound } from '@/utils/soundEffects';

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCount,
    subtotal,
    formattedSubtotal,
    placeOrder,
  } = useCart();

  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerStreet, setCustomerStreet] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerStateZip, setCustomerStateZip] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [pickupOrShip, setPickupOrShip] = useState<'mail' | 'delivery'>('mail');

  if (!isCartOpen) return null;

  // Free Mystery Spoon threshold: $50.00
  const freeSpoonThreshold = 50.0;
  const amountToFreeSpoon = Math.max(0, freeSpoonThreshold - subtotal);
  const spoonProgressPercent = Math.min(100, (subtotal / freeSpoonThreshold) * 100);

  const handleSimulateCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playFanfare();
    sound.playBeadChime();

    const fullAddress = [customerStreet.trim(), customerCity.trim(), customerStateZip.trim()]
      .filter(Boolean)
      .join(', ') || '123 Craft Lane, Sunnyvale, CA 94086';

    const order = placeOrder({
      customerName: customerName.trim() || 'Milca',
      customerEmail: customerEmail.trim() || 'milca@craftclub.com',
      customerAddress: fullAddress,
      cardNumber: cardNumber.trim() || '4532 8890 1234 5678',
      pickupOrShip,
      customerNotes: customerNotes.trim(),
    });

    setPlacedOrder(order);
  };

  const handleCloseAll = () => {
    setPlacedOrder(null);
    closeCart();
  };

  // Card input formatting helper
  const handleCardInputChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

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
        {placedOrder ? (
          /* Order Confirmation Screen */
          <div className="cart-success-view">
            <div className="success-sparkle-badge">🎉 📦 🌸 ✨</div>
            <h2>Order #{placedOrder.orderCode} Placed!</h2>

            <p className="success-greeting">
              Thank you, <strong>{placedOrder.customerName}</strong>!
            </p>

            <div className="success-details-box">
              <div className="s-row">
                <span>Tracking Code:</span>
                <strong className="tracking-code-highlight">{placedOrder.orderCode}</strong>
              </div>
              <div className="s-row">
                <span>Sent to Email:</span>
                <strong>{placedOrder.customerEmail}</strong>
              </div>
              <div className="s-row">
                <span>Delivery Address:</span>
                <strong>{placedOrder.customerAddress}</strong>
              </div>
              <div className="s-row">
                <span>Card Paid:</span>
                <code>{placedOrder.cardNumberMasked}</code>
              </div>
              <div className="s-row">
                <span>Method:</span>
                <strong>{placedOrder.pickupOrShip === 'delivery' ? '🚚 Direct Doorstep Delivery' : '📬 By Mail (Standard Shipping)'}</strong>
              </div>
              <div className="s-row">
                <span>Total Paid:</span>
                <strong className="total-highlight">{placedOrder.formattedTotal}</strong>
              </div>
              {placedOrder.freeSpoonGift && (
                <div className="s-row free-spoon-row">
                  <span>Perk Perk:</span>
                  <strong className="spoon-tag">🥄 Free Mystery Spoon Package Included!</strong>
                </div>
              )}
            </div>

            <p className="success-sub">
              Enter your tracking code on our package tracker anytime to see your items being handcrafted, packed, and delivered!
            </p>

            <div className="success-action-buttons">
              <Link
                href={`/track?code=${placedOrder.orderCode}`}
                className="primary-button track-order-cta-btn"
                onClick={closeCart}
              >
                📦 Track Where Your Package Is →
              </Link>
              <button
                type="button"
                className="secondary-button"
                onClick={handleCloseAll}
              >
                Continue Crafting 🎨
              </button>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
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
