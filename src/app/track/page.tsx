'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart, PlacedOrder } from '@/context/CartContext';
import { getStaffDirectory, StaffProfile } from '@/lib/staffAuth';
import { sound } from '@/utils/soundEffects';
import HiddenPal from '@/components/HiddenPal';

function TrackContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const { orders, getOrder } = useCart();
  const [queryCode, setQueryCode] = useState(initialCode);
  const [currentOrder, setCurrentOrder] = useState<PlacedOrder | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [staffDirectory, setStaffDirectory] = useState<StaffProfile[]>([]);

  useEffect(() => {
    getStaffDirectory().then(setStaffDirectory);
  }, []);

  const resolveStaffBadge = (staffId?: string) => {
    if (!staffId) return null;
    return staffDirectory.find(
      (m) => m.id === staffId || m.username === staffId.toLowerCase()
    ) || null;
  };

  useEffect(() => {
    if (initialCode) {
      setQueryCode(initialCode);
      const found = getOrder(initialCode);
      if (found) {
        setCurrentOrder(found);
      }
      setHasSearched(true);
    } else if (orders.length > 0 && !hasSearched) {
      setCurrentOrder(orders[0]);
      setQueryCode(orders[0].orderCode);
    } else if (currentOrder) {
      const refreshed = getOrder(currentOrder.orderCode);
      if (refreshed) setCurrentOrder(refreshed);
    }
  }, [initialCode, orders, getOrder]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setHasSearched(true);
    const trimmed = queryCode.trim();
    if (!trimmed) return;
    const found = getOrder(trimmed);
    if (found) {
      sound.playFanfare();
      setCurrentOrder(found);
      return;
    }

    try {
      const res = await fetch(`/api/orders?query=${encodeURIComponent(trimmed)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          sound.playFanfare();
          setCurrentOrder(data.order);
          return;
        }
      }
    } catch {
      // ignore
    }

    setCurrentOrder(null);
  };

  const getStageIndex = (status: PlacedOrder['status']): number => {
    switch (status) {
      case 'Making':
        return 1;
      case 'Packed':
        return 2;
      case 'Ready for Pickup':
      case 'Delivering':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return 1;
    }
  };

  const activeStage = currentOrder ? getStageIndex(currentOrder.status) : 1;

  const stages = [
    { title: 'Order Confirmed', icon: '💌', desc: 'Received & routed to crafters' },
    { title: 'Making', icon: '✂️', desc: 'Crafting beads, prints & slimes' },
    { title: 'Packed with Love', icon: '📦', desc: 'Boxed with stickers & free perks' },
    { title: 'Delivering', icon: '🚚', desc: 'In transit by postal mail or direct delivery' },
    { title: 'Delivered', icon: '🎉', desc: 'Safely delivered to your doorstep!' },
  ];

  return (
    <div className="home-container track-page-container">
      {/* Tracker Banner */}
      <section className="hero cute-arcade-hero track-hero">
        <div className="hero-content">
          <div className="hero-badge cute-badge">
            <span className="badge-spark">📦</span>
            <span>Live Delivery &amp; Handcraft Status</span>
          </div>

          <h1 className="hero-headline home-main-title">
            Where is Your Package?
          </h1>

          <p className="hero-description home-main-desc">
            Enter the unique tracking code sent to your email during checkout (e.g.{' '}
            <code>CRAFT-4821</code>) to see your items being handcrafted, packed, and delivered!
          </p>

          {/* Search Lookup Form */}
          <form onSubmit={handleLookup} className="track-search-form">
            <div className="track-input-wrap">
              <span className="track-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Enter Tracking Code or Email (e.g. CRAFT-1234)"
                value={queryCode}
                onChange={(e) => setQueryCode(e.target.value)}
                className="track-input-field"
                required
              />
            </div>
            <button type="submit" className="primary-button track-submit-btn">
              Track Package 📦
            </button>
          </form>

          {/* Hidden Pal #5: Cookie the Bear */}
          <div style={{ position: 'absolute', bottom: '14px', right: '16px' }}>
            <HiddenPal palId="cookie" customClass="track-cookie-pal" />
          </div>
        </div>
      </section>

      {/* Main Tracking Details Area */}
      <section className="track-results-wrapper">
        {currentOrder ? (
          <div className="order-tracking-card">
            {/* Order Header Badge */}
            <div className="track-card-top">
              <div className="order-identity">
                <span className="order-code-badge">{currentOrder.orderCode}</span>
                <h2>Package for {currentOrder.customerName}</h2>
                <span className="order-date-text">Placed on {currentOrder.createdAt}</span>
              </div>
            </div>

            {/* Visual 5-Stage Timeline */}
            <div className="tracking-timeline-box">
              <div className="timeline-progress-line-track">
                <div
                  className="timeline-progress-line-fill"
                  style={{ width: `${(activeStage / (stages.length - 1)) * 100}%` }}
                />
              </div>

              <div className="timeline-stages-row">
                {stages.map((st, idx) => {
                  const isDone = idx <= activeStage;
                  const isCurrent = idx === activeStage;
                  return (
                    <div
                      key={idx}
                      className={`timeline-step ${isDone ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="step-bubble">
                        <span>{st.icon}</span>
                      </div>
                      <strong className="step-title">{st.title}</strong>
                      <small className="step-desc">{st.desc}</small>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="tracking-info-grid">
              <div className="track-info-col">
                <span className="info-label">Customer &amp; Email:</span>
                <strong>{currentOrder.customerName}</strong>
                <span className="info-sub">{currentOrder.customerEmail}</span>
              </div>

              <div className="track-info-col">
                <span className="info-label">🏡 Delivery Address:</span>
                <strong>{currentOrder.customerAddress || 'Customer Address'}</strong>
                <span className="info-sub">
                  {currentOrder.pickupOrShip === 'delivery'
                    ? '🚚 Direct Doorstep Delivery'
                    : '📬 Standard Mail Shipping'}
                </span>
              </div>

              <div className="track-info-col">
                <span className="info-label">Payment &amp; Status:</span>
                <strong>Card: {currentOrder.cardNumberMasked}</strong>
                <span className="info-sub">
                  Total: {currentOrder.formattedTotal} • <span className="status-live-tag">{currentOrder.status}</span>
                </span>
              </div>

              {currentOrder.freeSpoonGift && (
                <div className="track-info-col free-spoon-col">
                  <span className="info-label">VIP $50+ Perk:</span>
                  <strong className="spoon-highlight">
                    🥄 FREE Mystery Spoon Package Included!
                  </strong>
                  <span className="info-sub">Mixing spoon &amp; holographic stickers</span>
                </div>
              )}
            </div>

            {/* Items Inside this Package */}
            <div className="package-items-section">
              <h3>Items in this Package ({currentOrder.items.length})</h3>
              <div className="package-items-list">
                {currentOrder.items.map((it, idx) => (
                  <div key={idx} className="package-item-row">
                    <div className="package-item-visual">
                      {it.imageUrl ? (
                        <img src={it.imageUrl} alt={it.name} className="pkg-thumb" />
                      ) : (
                        <span className="pkg-icon">{it.icon}</span>
                      )}
                    </div>
                    <div className="package-item-meta">
                      <strong>{it.shortName || it.name}</strong>
                      {it.size && <span className="pkg-size-pill">Size: {it.size}</span>}
                      {(() => {
                        const lead = resolveStaffBadge(it.staffInCharge || currentOrder.assignedStaffId);
                        if (!lead) return null;
                        return (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '999px',
                              background: lead.colorBg,
                              color: lead.colorText,
                              border: `1px solid ${lead.colorBorder}`,
                              marginTop: '4px',
                              width: 'fit-content',
                            }}
                          >
                            {lead.icon} {lead.name}
                          </span>
                        );
                      })()}
                      {it.customizationDetails && (
                        <small className="pkg-custom-note">{it.customizationDetails}</small>
                      )}
                      <span className="pkg-qty">Qty: {it.quantity} × {it.displayPrice}</span>
                    </div>
                    <span className="pkg-total">
                      ${(it.price * it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {currentOrder.customerNotes && (
              <div className="order-notes-box">
                <strong>Customer Notes:</strong>
                <p>&ldquo;{currentOrder.customerNotes}&rdquo;</p>
              </div>
            )}
          </div>
        ) : hasSearched ? (
          <div className="no-order-found-box">
            <span className="no-order-icon">🔍</span>
            <h3>No order found for &ldquo;{queryCode}&rdquo;</h3>
            <p>
              Please double check the tracking code sent to your email (e.g.{' '}
              <code>CRAFT-XXXX</code>) or search with the exact email address you used at checkout.
            </p>
            <div className="no-order-actions">
              <Link href="/shop" className="primary-button">
                Visit Craft Shop →
              </Link>
              <Link href="/slimetea" className="secondary-button">
                Order SlimeTea Drinks 🧋
              </Link>
            </div>
          </div>
        ) : (
          <div className="awaiting-search-box">
            <span className="awaiting-icon">📦</span>
            <h3>Enter a tracking code above to look up your order!</h3>
            <p>Orders placed on The Craft Corner appear here in real-time.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="home-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p>Loading package tracker...</p>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
