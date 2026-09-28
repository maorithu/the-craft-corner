'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useCart, PlacedOrder } from '@/context/CartContext';
import { sound } from '@/utils/soundEffects';

declare global {
  interface Window {
    paypal?: any;
  }
}

const PAYPAL_CLIENT_ID = 'AZ8WVg44duswfiUZMOLOZU5UKk8FOEv1MRSV6e6cMl37x8yUF6u1VgMDeF6POKMSYUyTKjtB5q_h7R3e';

export default function CheckoutPage() {
  const { cartItems, subtotal, formattedSubtotal, placeOrder, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [pickupOrShip, setPickupOrShip] = useState<'delivery' | 'ship'>('delivery');
  const [customerNotes, setCustomerNotes] = useState('');

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRenderedRef = useRef(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLTextAreaElement>(null);

  // Form references for PayPal validation
  const formDataRef = useRef({
    customerName,
    customerEmail,
    customerAddress,
    pickupOrShip,
    customerNotes,
    subtotal,
    cartItems,
  });

  useEffect(() => {
    formDataRef.current = {
      customerName,
      customerEmail,
      customerAddress,
      pickupOrShip,
      customerNotes,
      subtotal,
      cartItems,
    };
  }, [customerName, customerEmail, customerAddress, pickupOrShip, customerNotes, subtotal, cartItems]);

  const validateForm = () => {
    // Read directly from DOM input refs first to prevent any state sync lag or browser autofill delay
    const nameVal = (nameInputRef.current?.value ?? formDataRef.current.customerName ?? '').trim();
    const emailVal = (emailInputRef.current?.value ?? formDataRef.current.customerEmail ?? '').trim();
    const addressVal = (addressInputRef.current?.value ?? formDataRef.current.customerAddress ?? '').trim();

    // Sync back to state and ref if autofilled or out of sync
    if (nameVal !== customerName) setCustomerName(nameVal);
    if (emailVal !== customerEmail) setCustomerEmail(emailVal);
    if (addressVal !== customerAddress) setCustomerAddress(addressVal);
    formDataRef.current.customerName = nameVal;
    formDataRef.current.customerEmail = emailVal;
    formDataRef.current.customerAddress = addressVal;

    const errors: { [key: string]: string } = {};
    if (!nameVal) errors.name = 'Please provide your full name.';
    if (!emailVal || !emailVal.includes('@')) errors.email = 'Please provide a valid email.';
    if (!addressVal) errors.address = 'Please provide your shipping/delivery address.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Render PayPal Buttons when PayPal SDK is loaded and cart has items
  useEffect(() => {
    if (!paypalLoaded || !window.paypal || !paypalContainerRef.current) return;
    if (cartItems.length === 0 || placedOrder) return;

    // Reset container before re-rendering
    paypalContainerRef.current.innerHTML = '';
    buttonsRenderedRef.current = false;

    try {
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 48,
        },
        onClick: (data: any, actions: any) => {
          const isValid = validateForm();
          if (!isValid) {
            sound.playClick();
            return actions.reject();
          }
          return actions.resolve();
        },
        createOrder: (data: any, actions: any) => {
          const currentTotal = formDataRef.current.subtotal.toFixed(2);
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: 'USD',
                  value: currentTotal,
                  breakdown: {
                    item_total: {
                      currency_code: 'USD',
                      value: currentTotal,
                    },
                  },
                },
                items: formDataRef.current.cartItems.map((item) => ({
                  name: (item.shortName || item.name).slice(0, 127),
                  unit_amount: {
                    currency_code: 'USD',
                    value: item.price.toFixed(2),
                  },
                  quantity: item.quantity.toString(),
                  category: 'PHYSICAL_GOODS',
                })),
                description: 'The Craft Corner Order',
              },
            ],
          });
        },
        onApprove: async (data: any, actions: any) => {
          setIsProcessing(true);
          try {
            const details = await actions.order.capture();
            const orderId = details?.id || data?.orderID || `PAYPAL-${Date.now()}`;
            
            const currentData = formDataRef.current;
            const newOrder = placeOrder({
              customerName: currentData.customerName || (details?.payer?.name?.given_name ? `${details.payer.name.given_name} ${details.payer.name.surname || ''}`.trim() : 'Customer'),
              customerEmail: currentData.customerEmail || details?.payer?.email_address || 'order@example.com',
              customerAddress: currentData.customerAddress,
              pickupOrShip: currentData.pickupOrShip,
              customerNotes: currentData.customerNotes,
              paymentMethod: 'paypal',
              paypalOrderId: orderId,
            });

            sound.playCelebration();
            setPlacedOrder(newOrder);
          } catch (err) {
            console.error('PayPal Capture Error:', err);
            alert('There was a problem finalizing your PayPal payment. Please try again.');
          } finally {
            setIsProcessing(false);
          }
        },
        onError: (err: any) => {
          console.error('PayPal Buttons Error:', err);
          setIsProcessing(false);
        },
      }).render(paypalContainerRef.current);

      buttonsRenderedRef.current = true;
    } catch (err) {
      console.error('Error rendering PayPal buttons:', err);
    }
  }, [paypalLoaded, cartItems.length, placedOrder]);

  const spoonUnlocked = subtotal >= 50.0;
  const spoonRemaining = (50.0 - subtotal).toFixed(2);

  return (
    <div className="checkout-page-container">
      {/* Load PayPal JavaScript SDK */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons`}
        strategy="afterInteractive"
        onLoad={() => {
          setPaypalLoaded(true);
        }}
      />

      <div className="checkout-content-wrapper">
        {/* Back Link */}
        <div className="checkout-back-bar">
          <Link href="/shop/" className="checkout-back-link">
            ← Continue Craft Shopping
          </Link>
        </div>

        {placedOrder ? (
          /* Order Confirmation View */
          <div className="checkout-success-view">
            <div className="success-sparkle-badge">🎉 📦 🌸 ✨</div>
            <h1 className="success-title">Order Confirmed!</h1>
            <p className="success-subtitle">
              Thank you, <strong>{placedOrder.customerName}</strong>! Your craft order has been received and our young creators are getting it ready.
            </p>

            <div className="success-summary-card">
              <div className="summary-row highlight">
                <span>Order Tracking Code:</span>
                <strong className="tracking-code-highlight">{placedOrder.orderCode}</strong>
              </div>
              <div className="summary-row">
                <span>Payment Method:</span>
                <span className="paypal-confirmed-tag">🅿️ PayPal Verified ({placedOrder.paypalOrderId || 'Paid'})</span>
              </div>
              <div className="summary-row">
                <span>Confirmation Sent To:</span>
                <strong>{placedOrder.customerEmail}</strong>
              </div>
              <div className="summary-row">
                <span>Delivery Address:</span>
                <strong>{placedOrder.customerAddress}</strong>
              </div>
              <div className="summary-row">
                <span>Delivery Option:</span>
                <strong>
                  {placedOrder.pickupOrShip === 'delivery'
                    ? '🚚 Direct Doorstep Delivery'
                    : '📬 By Mail (Standard Shipping)'}
                </strong>
              </div>
              <div className="summary-row highlight">
                <span>Total Paid:</span>
                <strong className="total-highlight">{placedOrder.formattedTotal}</strong>
              </div>
            </div>

            {/* Items Summary */}
            <div className="success-items-list">
              <h3>Items in this Order ({placedOrder.items.length})</h3>
              {placedOrder.items.map((it) => (
                <div key={it.cartId} className="success-item-row">
                  <span className="success-item-icon">{it.icon}</span>
                  <div className="success-item-details">
                    <span className="success-item-title">{it.shortName || it.name} × {it.quantity}</span>
                    {it.customizationDetails && (
                      <span className="success-item-sub">{it.customizationDetails}</span>
                    )}
                  </div>
                  <strong className="success-item-price">${(it.price * it.quantity).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div className="success-actions">
              <Link href="/track/" className="primary-button track-order-action">
                Track Your Order Live 📦
              </Link>
              <Link href="/shop/" className="secondary-button back-to-shop-action">
                Keep Exploring Crafts ✨
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Basket State */
          <div className="checkout-empty-state">
            <span className="empty-cart-emoji">🧺</span>
            <h2>Your basket is empty!</h2>
            <p>Add some adorable crafts, Rainbow Loom bracelets, or slime to check out.</p>
            <Link href="/shop/" className="primary-button">
              Explore The Shop →
            </Link>
          </div>
        ) : (
          /* Main 2-Column Checkout Layout */
          <div className="checkout-grid">
            {/* Left Column: Delivery & Payment Details */}
            <div className="checkout-form-column">
              <div className="checkout-card">
                <div className="checkout-step-header">
                  <span className="step-num">1</span>
                  <h2>Recipient &amp; Delivery Details</h2>
                </div>

                <div className="checkout-fields">
                  <div className="checkout-field-row">
                    <label>
                      Full Name <span className="req">*</span>
                      <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="e.g. Maya Chen"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (formErrors.name) setFormErrors((p) => ({ ...p, name: '' }));
                        }}
                        className={formErrors.name ? 'input-error' : ''}
                      />
                      {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                    </label>
                  </div>

                  <div className="checkout-field-row">
                    <label>
                      Email Address <span className="req">*</span>
                      <input
                        ref={emailInputRef}
                        type="email"
                        placeholder="e.g. maya@example.com"
                        value={customerEmail}
                        onChange={(e) => {
                          setCustomerEmail(e.target.value);
                          if (formErrors.email) setFormErrors((p) => ({ ...p, email: '' }));
                        }}
                        className={formErrors.email ? 'input-error' : ''}
                      />
                      {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                    </label>
                  </div>

                  <div className="checkout-field-row">
                    <label>
                      Delivery Address <span className="req">*</span>
                      <textarea
                        ref={addressInputRef}
                        rows={2}
                        placeholder="Street address, apartment/unit, city, province/state, postal code"
                        value={customerAddress}
                        onChange={(e) => {
                          setCustomerAddress(e.target.value);
                          if (formErrors.address) setFormErrors((p) => ({ ...p, address: '' }));
                        }}
                        className={formErrors.address ? 'input-error' : ''}
                      />
                      {formErrors.address && <span className="error-text">{formErrors.address}</span>}
                    </label>
                  </div>

                  {/* Delivery Mode Radios */}
                  <div className="delivery-options-group">
                    <span className="group-label">Delivery Method</span>
                    <div className="delivery-radios">
                      <label className={`radio-card ${pickupOrShip === 'delivery' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="deliveryOption"
                          value="delivery"
                          checked={pickupOrShip === 'delivery'}
                          onChange={() => setPickupOrShip('delivery')}
                        />
                        <div className="radio-content">
                          <strong>🚚 Direct Doorstep Delivery</strong>
                          <span>Fast &amp; local safe doorstep drop-off</span>
                        </div>
                      </label>

                      <label className={`radio-card ${pickupOrShip === 'ship' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="deliveryOption"
                          value="ship"
                          checked={pickupOrShip === 'ship'}
                          onChange={() => setPickupOrShip('ship')}
                        />
                        <div className="radio-content">
                          <strong>📬 Mail Delivery</strong>
                          <span>Secure tracked bubble mailer package</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="checkout-field-row">
                    <label>
                      Gift or Delivery Instructions (Optional)
                      <textarea
                        rows={2}
                        placeholder="e.g. Please leave on the porch, birthday message for Kaitlyn, etc."
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* PayPal Payment Step */}
              <div className="checkout-card paypal-card-section">
                <div className="checkout-step-header">
                  <span className="step-num">2</span>
                  <div>
                    <h2>Secure Payment via PayPal</h2>
                    <p className="step-desc">
                      Fast, safe, and buyer-protected checkout. Pay with your PayPal account or linked cards.
                    </p>
                  </div>
                </div>

                <div className="paypal-checkout-container">
                  {Object.keys(formErrors).length > 0 && (
                    <div className="paypal-validation-error">
                      ⚠️ Please complete the required recipient details above before proceeding to payment.
                    </div>
                  )}

                  {!customerName || !customerEmail || !customerAddress ? (
                    <div className="paypal-validation-hint">
                      ℹ️ Fill in your recipient name, email, and address above to complete your order.
                    </div>
                  ) : null}

                  {isProcessing && (
                    <div className="paypal-processing-overlay">
                      <div className="spinner"></div>
                      <p>Finalizing your order with PayPal...</p>
                    </div>
                  )}

                  <div ref={paypalContainerRef} className="paypal-btn-wrap" />

                  <div className="paypal-security-badge">
                    <span>🔒 Official PayPal Encrypted Checkout • Buyer Protection Guarantee</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="checkout-summary-column">
              <div className="summary-sticky-card">
                <h3>Order Summary ({cartItems.length} items)</h3>

                {/* VIP Spoon Milestone Perk */}
                <div className="summary-perk-box">
                  <div className="perk-info">
                    <span className="perk-emoji">🥄</span>
                    <span className="perk-text">
                      {spoonUnlocked ? (
                        <strong>🎉 FREE Mystery Spoon Package Unlocked!</strong>
                      ) : (
                        <>
                          Add <strong>${spoonRemaining}</strong> more for a <strong>FREE Mystery Spoon Package</strong>!
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="summary-cart-items">
                  {cartItems.map((it) => (
                    <div key={it.cartId} className="summary-item-line">
                      <div className="summary-item-left">
                        {it.imageUrl ? (
                          <img src={it.imageUrl} alt={it.name} className="summary-thumb" />
                        ) : (
                          <span className="summary-icon">{it.icon}</span>
                        )}
                        <div>
                          <strong>{it.shortName || it.name}</strong>
                          <span className="summary-qty">Qty: {it.quantity}</span>
                          {it.customizationDetails && (
                            <span className="summary-cust">{it.customizationDetails}</span>
                          )}
                        </div>
                      </div>
                      <strong className="summary-item-total">
                        ${(it.price * it.quantity).toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>

                {/* Cost Breakdown */}
                <div className="summary-costs">
                  <div className="cost-row">
                    <span>Subtotal</span>
                    <span>{formattedSubtotal}</span>
                  </div>
                  <div className="cost-row">
                    <span>Delivery</span>
                    <span className="cost-free">FREE 🚚</span>
                  </div>
                  <div className="cost-row">
                    <span>Bonus Craft Stickers</span>
                    <span className="cost-free">FREE 🎉</span>
                  </div>
                  {spoonUnlocked && (
                    <div className="cost-row">
                      <span>VIP Mystery Spoon Perk</span>
                      <span className="cost-free">FREE 🥄</span>
                    </div>
                  )}
                  <div className="cost-row total-row">
                    <span>Total USD</span>
                    <span className="final-total">{formattedSubtotal}</span>
                  </div>
                </div>

                <div className="safe-checkout-notice">
                  <span>🛡️ 100% Satisfaction Guaranteed • Handcrafted with love</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
