'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart, PlacedOrder } from '@/context/CartContext';
import { authenticateStaff } from '@/lib/staffAuth';
import { sound } from '@/utils/soundEffects';

type StaffAccount = {
  id: string; // 'anna' | 'kaitlyn' | 'nicole'
  name: string; // 'Anna' | 'Kaitlyn' | 'Nicole'
  icon: string;
  role: string;
  deptName: string;
  deptShort: string;
  description: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
};

const STAFF_MEMBERS: StaffAccount[] = [
  {
    id: 'anna',
    name: 'Anna',
    icon: '🧋',
    role: 'Lead Manager & SlimeTea Director',
    deptName: 'SlimeTea Studio & DIY Slime Bar',
    deptShort: 'SlimeTea & Slimes',
    description: 'Lead Manager with Order Assignment access. In charge of Handmade Slimes, Boba Drinks, Fluff formulas, Jelly Cubes, & Mystery Spoon Packages.',
    colorBg: '#dbeafe',
    colorBorder: '#93c5fd',
    colorText: '#1e40af',
  },
  {
    id: 'kaitlyn',
    name: 'Kaitlyn',
    icon: '🐉',
    role: 'Dragon & 3D Print Lead',
    deptName: 'Dragon Sanctuary & 3D Prints',
    deptShort: 'Dragons & 3D Prints',
    description: 'In charge of all Dragon Puppets, Articulated 3D Dragons, Capybaras, Dragon Eggs, & Keyboard Clickers.',
    colorBg: '#fef3c7',
    colorBorder: '#fcd34d',
    colorText: '#92400e',
  },
  {
    id: 'nicole',
    name: 'Nicole',
    icon: '🌸',
    role: 'Rainbow Loom & Mystery Blind Box Specialist',
    deptName: 'Rainbow Loom & Mystery Atelier',
    deptShort: 'Loom & Blind Boxes',
    description: 'In charge of Rainbow Loom Packets, Loom Mystery Blind Boxes, Squishy Blind Boxes, & Friendship Bracelets.',
    colorBg: '#fce7f3',
    colorBorder: '#fbcfe8',
    colorText: '#9d174d',
  },
];

const getStaffInCharge = (item: {
  name: string;
  shortName?: string;
  categoryLabel?: string;
  tag?: string;
}): StaffAccount => {
  const text = `${item.name} ${item.shortName || ''} ${item.categoryLabel || ''} ${item.tag || ''}`.toLowerCase();

  // 1. Kaitlyn: In charge of Dragon, Puppets, 3D Prints, Clickers, Eggs
  if (
    text.includes('dragon') ||
    text.includes('puppet') ||
    text.includes('3d') ||
    text.includes('print') ||
    text.includes('clicker') ||
    text.includes('axolotl') ||
    text.includes('capybara') ||
    text.includes('slug') ||
    text.includes('dino') ||
    text.includes('egg')
  ) {
    return STAFF_MEMBERS[1]; // Kaitlyn
  }

  // 2. Anna: In charge of Slimes, SlimeTea, Boba Drinks, Mystery Spoon
  if (
    text.includes('slime') ||
    text.includes('tea') ||
    text.includes('boba') ||
    text.includes('drink') ||
    text.includes('fluff') ||
    text.includes('spoon')
  ) {
    return STAFF_MEMBERS[0]; // Anna
  }

  // 3. Nicole: In charge of Rainbow Loom, Bracelets, Blind Boxes, Squishies
  return STAFF_MEMBERS[2]; // Nicole
};

export default function StaffPortalPage() {
  const { orders, updateOrderStatus, assignOrderStaff, setOrderInTemporaryTrash } = useCart();

  // Secure Staff Login States (zero hints)
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Authenticated State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffAccount | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignment, setFilterAssignment] = useState<'all' | 'anna' | 'kaitlyn' | 'nicole' | 'unassigned'>('all');
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);
  const [showTemporaryTrash, setShowTemporaryTrash] = useState(false);

  // Unified Form Submit (Both Username and Password together)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const staffId = await authenticateStaff(usernameInput, passwordInput);
      const matched = STAFF_MEMBERS.find((member) => member.id === staffId);

      if (!matched) {
        sound.playClick();
        setLoginError('Sign-in failed. Check your credentials or contact the administrator.');
        return;
      }

      sound.playFanfare();
      setCurrentStaff(matched);
      setIsAuthenticated(true);
      setLoginError(null);
      setPasswordInput('');
      setUsernameInput('');
      setShowPassword(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentStaff(null);
    setUsernameInput('');
    setPasswordInput('');
    setShowPassword(false);
    setLoginError(null);
    setFilterStatus('all');
    setFilterAssignment('all');
  };

  const handleStatusChange = (orderCode: string, newStatus: PlacedOrder['status']) => {
    const order = orders.find((ord) => ord.orderCode === orderCode);
    if (
      order?.status === 'Delivered' &&
      currentStaff?.id !== 'anna' &&
      order.assignedStaffId !== currentStaff?.id
    ) return;

    if (newStatus === 'Delivered') {
      sound.playFanfare();
      setAssignmentNotice(`Order #${orderCode} delivered and moved to the Done section! ✅🎉`);
      setTimeout(() => setAssignmentNotice(null), 3500);
    } else {
      sound.playClick();
      setAssignmentNotice(`Order #${orderCode} status updated to "${newStatus}".`);
      setTimeout(() => setAssignmentNotice(null), 3000);
    }
    updateOrderStatus(orderCode, newStatus);
  };

  const handleTemporaryTrash = (orderCode: string, isInTemporaryTrash: boolean) => {
    const order = orders.find((ord) => ord.orderCode === orderCode);
    if (
      !order ||
      (currentStaff?.id !== 'anna' && order.assignedStaffId !== currentStaff?.id)
    ) return;

    setOrderInTemporaryTrash(orderCode, isInTemporaryTrash);
    setAssignmentNotice(
      isInTemporaryTrash
        ? `Order #${orderCode} moved to temporary trash.`
        : `Order #${orderCode} restored from temporary trash.`
    );
    setTimeout(() => setAssignmentNotice(null), 3500);
  };

  const handleAssign = (orderCode: string, newStaffId: string) => {
    assignOrderStaff(orderCode, newStaffId);
    if (newStaffId === 'nicole') {
      sound.playFanfare();
      setAssignmentNotice(
        `Order #${orderCode} assigned to Nicole! It now appears in Nicole's account only.`
      );
    } else if (newStaffId === 'kaitlyn') {
      sound.playFanfare();
      setAssignmentNotice(
        `Order #${orderCode} assigned to Kaitlyn! It now appears in Kaitlyn's account only.`
      );
    } else if (newStaffId === 'anna') {
      sound.playFanfare();
      setAssignmentNotice(
        `Order #${orderCode} assigned to Anna (Myself)! It stays in your account.`
      );
    } else {
      sound.playClick();
      setAssignmentNotice(`Order #${orderCode} unassigned.`);
    }
    setTimeout(() => setAssignmentNotice(null), 3500);
  };

  const isAnna = currentStaff?.id === 'anna';

  // For non-Anna (Kaitlyn or Nicole), strictly filter to orders assigned to them only.
  // For Anna, start with all orders, then apply Anna's assignment filter tab.
  const staffFilteredOrders = (isAnna
    ? orders.filter((o) => {
        if (filterAssignment === 'all') return true;
        if (filterAssignment === 'unassigned') return !o.assignedStaffId;
        return o.assignedStaffId === filterAssignment;
      })
    : orders.filter((o) => o.assignedStaffId === currentStaff?.id))
    .filter((o) => !o.isInTemporaryTrash);

  // Active Orders (Not Delivered)
  const activeOrders = staffFilteredOrders.filter((o) => {
    if (o.status === 'Delivered') return false;
    if (filterStatus !== 'all' && filterStatus !== 'Delivered' && o.status !== filterStatus) return false;
    if (filterStatus === 'Delivered') return false;
    return true;
  });

  // Completed orders and trash are visible to every signed-in staff member.
  const doneOrders = orders.filter((o) => {
    if (o.status !== 'Delivered') return false;
    if (o.isInTemporaryTrash) return false;
    if (filterStatus !== 'all' && filterStatus !== 'Delivered') return false;
    return true;
  });

  const temporaryTrashOrders = orders.filter((o) => o.isInTemporaryTrash);

  const totalRevenue = staffFilteredOrders.reduce((acc, ord) => acc + ord.total, 0);

  const renderOrdersTable = (ordersList: PlacedOrder[], isDoneSection: boolean, isTrashView = false) => {
    if (ordersList.length === 0) {
      if (isDoneSection) {
        return (
          <div style={{ padding: '38px 20px', textAlign: 'center', color: 'var(--text-soft)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📦</span>
            <p style={{ margin: 0, fontSize: '0.92rem' }}>
              {isTrashView
                ? 'Temporary trash is empty.'
                : <>No orders in the Done section yet. When an order&apos;s status is marked as <strong>Delivered 🎉</strong>, it will automatically move here!</>}
            </p>
          </div>
        );
      }
      return (
        <div style={{ padding: '38px 20px', textAlign: 'center', color: '#166534' }}>
          <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '8px' }}>🎉</span>
          <strong style={{ fontSize: '1.1rem', display: 'block', color: '#166534' }}>
            All Caught Up!
          </strong>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-soft)' }}>
            There are no active orders waiting for fulfillment right now. Great job!
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Desktop View: Full Data Table (Shown on screens > 768px) */}
        <div className="staff-desktop-table staff-orders-table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="staff-orders-table">
            <thead>
              <tr style={isDoneSection ? { background: '#f0fdf4' } : undefined}>
                <th>Order Code</th>
                <th>Customer &amp; Address</th>
                <th>Items &amp; Craft Station</th>
                <th>Total &amp; Perks</th>
                <th>Shipping Type</th>
                <th>Fulfillment Status</th>
                <th>Staff Assignment</th>
              </tr>
            </thead>
            <tbody>
              {ordersList.map((ord) => (
                <tr
                  key={ord.orderCode}
                  className="order-row"
                  style={isDoneSection ? { backgroundColor: 'rgba(240, 253, 244, 0.45)' } : undefined}
                >
                  <td className="code-cell">
                    <strong>{ord.orderCode}</strong>
                    <small className="order-sub-date">{ord.createdAt}</small>
                    {isDoneSection && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          marginTop: '6px',
                          border: '1px solid #86efac',
                        }}
                      >
                        {isTrashView ? '🗑 IN TEMPORARY TRASH' : '✓ DONE'}
                      </span>
                    )}
                  </td>

                  <td className="customer-cell">
                    <strong>{ord.customerName}</strong>
                    <div className="cust-email">{ord.customerEmail}</div>
                    {ord.customerAddress && (
                      <div
                        className="cust-lives-at"
                        style={{
                          margin: '4px 0',
                          fontSize: '0.82rem',
                          color: '#0f766e',
                          background: '#f0fdfa',
                          border: '1px solid #ccfbf1',
                          borderRadius: '6px',
                          padding: '3px 8px',
                        }}
                      >
                        🏡 <strong>Lives at:</strong> {ord.customerAddress}
                      </div>
                    )}
                    <small className="cust-card">Card: {ord.cardNumberMasked}</small>
                    {ord.customerNotes && (
                      <div className="cust-notes-preview">
                        &ldquo;{ord.customerNotes}&rdquo;
                      </div>
                    )}
                  </td>

                  <td className="items-cell">
                    <ul className="ordered-items-summary">
                      {ord.items.map((it, idx) => {
                        const staffLead = getStaffInCharge(it);
                        return (
                          <li key={idx} style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span className="item-icon-tag">{it.icon}</span>
                              <strong>{it.quantity}×</strong> {it.shortName || it.name}
                              {it.size && <span className="item-size-pill">[{it.size}]</span>}
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  background: staffLead.colorBg,
                                  color: staffLead.colorText,
                                  border: `1px solid ${staffLead.colorBorder}`,
                                }}
                              >
                                {staffLead.icon} {staffLead.name}
                              </span>
                            </div>
                            {it.customizationDetails && (
                              <small className="custom-slime-sub" style={{ display: 'block', marginTop: '2px' }}>
                                ({it.customizationDetails})
                              </small>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </td>

                  <td className="pricing-cell">
                    <strong className="ord-price">{ord.formattedTotal}</strong>
                    {ord.freeSpoonGift && (
                      <span className="free-spoon-badge">
                        🥄 Mystery Spoon Included
                      </span>
                    )}
                  </td>

                  <td className="method-cell">
                    {ord.pickupOrShip === 'delivery' ? (
                      <span className="method-badge delivery" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                        🚚 Direct Delivery
                      </span>
                    ) : (
                      <span className="method-badge ship">📬 By Mail</span>
                    )}
                  </td>

                  <td className="status-cell">
                    {isTrashView ? (
                      <span>Delivered (Temporary Trash)</span>
                    ) : !isDoneSection || isAnna || ord.assignedStaffId === currentStaff?.id ? (
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          handleStatusChange(ord.orderCode, e.target.value as PlacedOrder['status'])
                        }
                        className={`status-selector status-${ord.status.toLowerCase().replace(/\s+/g, '-')}`}
                        aria-label={`Status for ${ord.orderCode}`}
                      >
                        <option value="Making">Making ✂️</option>
                        <option value="Packed">Packed 📦</option>
                        <option value="Delivering">Delivering 🚚</option>
                        <option value="Delivered">Delivered 🎉 ({isDoneSection ? 'Done' : 'Move to Done'})</option>
                      </select>
                    ) : (
                      <span className={`status-badge-pill status-${ord.status.toLowerCase()}`}>{ord.status}</span>
                    )}
                    {(isDoneSection || isTrashView) &&
                      (isAnna || ord.assignedStaffId === currentStaff?.id) && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleTemporaryTrash(ord.orderCode, !isTrashView)}
                        >
                          {isTrashView ? 'Restore order' : 'Move to temporary trash'}
                        </button>
                      )}
                  </td>

                  {/* Staff Assignment Column */}
                  <td className="assignment-cell" style={{ minWidth: '190px' }}>
                    {isAnna ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <select
                          value={ord.assignedStaffId || ''}
                          onChange={(e) => handleAssign(ord.orderCode, e.target.value)}
                          className={`staff-assign-dropdown ${
                            ord.assignedStaffId ? `assigned-${ord.assignedStaffId}` : ''
                          }`}
                          aria-label="Assign order to staff"
                        >
                          <option value="">⚪ Unassigned (Select staff)</option>
                          <option value="anna">🧋 Anna (Myself)</option>
                          <option value="kaitlyn">🐉 Kaitlyn</option>
                          <option value="nicole">🌸 Nicole</option>
                        </select>

                        {ord.assignedStaffId && (
                          (() => {
                            const assigned = STAFF_MEMBERS.find((m) => m.id === ord.assignedStaffId);
                            if (!assigned) return null;
                            return (
                              <span
                                className="assigned-staff-badge"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: '999px',
                                  background: assigned.colorBg,
                                  color: assigned.colorText,
                                  border: `1.5px solid ${assigned.colorBorder}`,
                                  alignSelf: 'flex-start',
                                }}
                              >
                                <span>{assigned.icon}</span>
                                <span>Assigned to {assigned.name}</span>
                              </span>
                            );
                          })()
                        )}
                      </div>
                    ) : (
                      <span
                        className="assigned-staff-badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: currentStaff?.colorBg,
                          color: currentStaff?.colorText,
                          border: `1.5px solid ${currentStaff?.colorBorder}`,
                        }}
                      >
                        <span>{currentStaff?.icon}</span>
                        <span>Assigned to You ({currentStaff?.name})</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Touch-Friendly Order Cards (Shown on screens <= 768px) */}
        <div className="staff-mobile-cards">
          {ordersList.map((ord) => (
            <div
              key={ord.orderCode}
              className={`staff-order-card ${isDoneSection ? 'done-card' : ''}`}
            >
              <div className="mobile-card-header">
                <div className="mobile-card-code">
                  <strong>{ord.orderCode}</strong>
                  <small>{ord.createdAt}</small>
                </div>
                {isDoneSection ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      border: '1px solid #86efac',
                    }}
                  >
                    {isTrashView ? '🗑 IN TRASH' : '✓ DONE'}
                  </span>
                ) : (
                  <span
                    className={`status-badge-pill status-${ord.status.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    {ord.status}
                  </span>
                )}
              </div>

              <div className="mobile-card-customer">
                <div className="cust-name">👤 {ord.customerName}</div>
                <div className="cust-email">{ord.customerEmail}</div>
                {ord.customerAddress && (
                  <div className="cust-address">
                    🏡 <strong>Lives at:</strong> {ord.customerAddress}
                  </div>
                )}
                <small style={{ color: 'var(--text-soft)', fontSize: '0.74rem' }}>Card: {ord.cardNumberMasked}</small>
                {ord.customerNotes && (
                  <div className="cust-notes">&ldquo;{ord.customerNotes}&rdquo;</div>
                )}
              </div>

              <div className="mobile-card-items">
                <div className="mobile-card-items-title">Ordered Items:</div>
                {ord.items.map((it, idx) => {
                  const lead = getStaffInCharge(it);
                  return (
                    <div key={idx} className="mobile-item-line">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{it.icon}</span>
                        <strong>{it.quantity}×</strong> {it.shortName || it.name}
                        {it.size && <span className="item-size-pill">[{it.size}]</span>}
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: lead.colorBg,
                            color: lead.colorText,
                            border: `1px solid ${lead.colorBorder}`,
                          }}
                        >
                          {lead.icon} {lead.name}
                        </span>
                      </div>
                      {it.customizationDetails && (
                        <small style={{ color: 'var(--text-soft)', fontSize: '0.72rem', paddingLeft: '4px' }}>
                          ({it.customizationDetails})
                        </small>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mobile-card-pricing-row">
                <div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--walnut-wood)' }}>{ord.formattedTotal}</strong>
                  {ord.freeSpoonGift && (
                    <span className="free-spoon-badge" style={{ display: 'inline-block', marginLeft: '6px' }}>
                      🥄 Mystery Spoon
                    </span>
                  )}
                </div>
                <span className={`method-badge ${ord.pickupOrShip === 'delivery' ? 'delivery' : 'ship'}`} style={ord.pickupOrShip === 'delivery' ? { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' } : undefined}>
                  {ord.pickupOrShip === 'delivery' ? '🚚 Direct Delivery' : '📬 By Mail'}
                </span>
              </div>

              {/* Mobile Touch-Friendly Controls */}
              <div className="mobile-card-controls">
                <div className="mobile-control-field">
                  <label>Fulfillment Status:</label>
                  {isTrashView ? (
                    <span>Delivered (Temporary Trash)</span>
                  ) : !isDoneSection || isAnna || ord.assignedStaffId === currentStaff?.id ? (
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.orderCode, e.target.value as PlacedOrder['status'])}
                      className={`status-selector status-${ord.status.toLowerCase().replace(/\s+/g, '-')}`}
                      style={{ width: '100%', minHeight: '44px', fontSize: '0.9rem' }}
                      aria-label={`Status for ${ord.orderCode}`}
                    >
                      <option value="Making">Making ✂️</option>
                      <option value="Packed">Packed 📦</option>
                      <option value="Delivering">Delivering 🚚</option>
                      <option value="Delivered">Delivered 🎉 ({isDoneSection ? 'Done' : 'Move to Done'})</option>
                    </select>
                  ) : (
                    <span>{ord.status}</span>
                  )}
                </div>

                {(isDoneSection || isTrashView) &&
                  (isAnna || ord.assignedStaffId === currentStaff?.id) && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleTemporaryTrash(ord.orderCode, !isTrashView)}
                    >
                      {isTrashView ? 'Restore order' : 'Move to temporary trash'}
                    </button>
                  )}

                <div className="mobile-control-field">
                  <label>Staff Assignment:</label>
                  {isAnna ? (
                    <select
                      value={ord.assignedStaffId || ''}
                      onChange={(e) => handleAssign(ord.orderCode, e.target.value)}
                      className={`staff-assign-dropdown ${ord.assignedStaffId ? `assigned-${ord.assignedStaffId}` : ''}`}
                      style={{ width: '100%', minHeight: '44px', fontSize: '0.9rem' }}
                      aria-label={`Assign order ${ord.orderCode}`}
                    >
                      <option value="">⚪ Unassigned (Select staff)</option>
                      <option value="anna">🧋 Anna (Myself)</option>
                      <option value="kaitlyn">🐉 Kaitlyn</option>
                      <option value="nicole">🌸 Nicole</option>
                    </select>
                  ) : (
                    <span
                      className="assigned-staff-badge"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: currentStaff?.colorBg,
                        color: currentStaff?.colorText,
                        border: `1.5px solid ${currentStaff?.colorBorder}`,
                      }}
                    >
                      <span>{currentStaff?.icon}</span>
                      <span>Assigned to You ({currentStaff?.name})</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="home-container staff-portal-container">
      {!isAuthenticated ? (
        /* Secure Staff Lock Screen (Zero Hints, Clear Username & Password Fields) */
        <div className="staff-lock-screen">
          <div className="staff-lock-card">
            <div className="lock-icon-badge">👑</div>
            <h2>Craft Corner Team Leader &amp; Staff Portal</h2>
            <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', margin: '4px 0 18px' }}>
              Authorized personnel only.
            </p>

            <form onSubmit={handleLogin} className="staff-login-form" autoComplete="off">
              {/* Field 1: Staff Username */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' }}>
                <label htmlFor="staff-login-username" style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--walnut-wood)' }}>
                  👤 Staff Username:
                </label>
                <input
                  id="staff-login-username"
                  name="staff_login_username"
                  type="text"
                  placeholder="Enter staff username..."
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setLoginError(null);
                  }}
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ fontSize: '16px', minHeight: '48px' }}
                  className="staff-passcode-input"
                  autoComplete="off"
                />
              </div>

              {/* Field 2: Staff Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left', marginTop: '12px' }}>
                <label htmlFor="staff-login-password" style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--walnut-wood)' }}>
                  🔑 Staff Password:
                </label>
                <div className="staff-password-wrap">
                  <input
                    id="staff-login-password"
                    name="staff_login_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter staff password..."
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError(null);
                    }}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    style={{ fontSize: '16px', minHeight: '48px' }}
                    className="staff-passcode-input"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="staff-password-toggle-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="staff-error-msg" style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginTop: '10px' }}>
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                className="primary-button staff-login-btn"
                style={{ minHeight: '48px', marginTop: '16px', fontSize: '1rem', fontWeight: 800 }}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Signing in...' : 'Unlock Staff Dashboard 🔑'}
              </button>
            </form>

            <div className="staff-lock-footer" style={{ marginTop: '18px' }}>
              <Link href="/">← Return to Storefront</Link>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Staff Dashboard */
        <div className="staff-dashboard">
          {/* Dashboard Header */}
          <div className="staff-header-row">
            <div>
              <span
                className="staff-role-badge"
                style={{
                  background: currentStaff?.colorBg,
                  color: currentStaff?.colorText,
                  border: `1px solid ${currentStaff?.colorBorder}`,
                }}
              >
                {currentStaff?.icon} Logged in as {currentStaff?.name} ({currentStaff?.role})
              </span>
              <h1>Customer Orders &amp; Fulfillment Hub</h1>
              <p>
                Welcome back, <strong>{currentStaff?.name}</strong>!{' '}
                {isAnna
                  ? 'Lead Manager Portal: Assign incoming customer orders to Nicole, Kaitlyn, or yourself.'
                  : `Viewing orders assigned to your account for fulfillment.`}
              </p>
            </div>

            <div className="staff-header-actions">
              <Link href="/track" className="secondary-button" target="_blank">
                Open Customer Tracker 📦
              </Link>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowTemporaryTrash((show) => !show)}
                aria-pressed={showTemporaryTrash}
              >
                {showTemporaryTrash ? 'Back to orders' : `Temporary Trash (${temporaryTrashOrders.length})`}
              </button>
              <button
                type="button"
                className="secondary-button logout-btn"
                onClick={handleLogout}
              >
                Log Out 🔒
              </button>
            </div>
          </div>

          {/* Anna's Lead Manager Order Assignment Banner */}
          {isAnna && (
            <div
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '2px solid #93c5fd',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.8rem' }}>👑</span>
                <div>
                  <strong style={{ color: '#1e40af', fontSize: '1rem', display: 'block' }}>
                    Anna&apos;s Lead Manager Assignment Controls
                  </strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#1e3a8a' }}>
                    Assign each order using the dropdown on the side with the three names. When assigned to <strong>Nicole</strong>, it goes to Nicole&apos;s account only. When assigned to <strong>Kaitlyn</strong>, it goes to Kaitlyn&apos;s account only. When assigned to <strong>Anna (Myself)</strong>, it stays in your account.
                  </p>
                </div>
              </div>
              <span
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                👑 ANNA: LEAD MANAGER
              </span>
            </div>
          )}

          {/* Real-time Notification Notice */}
          {assignmentNotice && (
            <div
              style={{
                background: '#ecfdf5',
                border: '2px solid #6ee7b7',
                borderRadius: '8px',
                padding: '10px 16px',
                marginBottom: '18px',
                color: '#065f46',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>✨</span>
              <span>{assignmentNotice}</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="staff-metrics-grid">
            <div className="metric-box">
              <span className="metric-label">{isAnna ? 'Total Studio Orders' : 'My Assigned Orders'}</span>
              <strong className="metric-val">{staffFilteredOrders.length}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Total Revenue</span>
              <strong className="metric-val">${totalRevenue.toFixed(2)}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Active To Fulfill</span>
              <strong className="metric-val" style={{ color: '#ea580c' }}>
                {activeOrders.length}
              </strong>
            </div>
            <div className="metric-box" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
              <span className="metric-label" style={{ color: '#166534' }}>Done &amp; Delivered</span>
              <strong className="metric-val" style={{ color: '#15803d' }}>
                {doneOrders.length}
              </strong>
            </div>
          </div>

          {/* Filter Bars */}
          <div
            className="staff-filter-bar"
            style={{ display: showTemporaryTrash ? 'none' : 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {/* Anna's Assignment Filters */}
            {isAnna && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Account View:</span>
                <div className="status-filter-pills">
                  {[
                    { id: 'all', label: 'All Orders', count: orders.length },
                    { id: 'anna', label: '🧋 Assigned to Anna (Myself)', count: orders.filter((o) => o.assignedStaffId === 'anna').length },
                    { id: 'kaitlyn', label: '🐉 Assigned to Kaitlyn', count: orders.filter((o) => o.assignedStaffId === 'kaitlyn').length },
                    { id: 'nicole', label: '🌸 Assigned to Nicole', count: orders.filter((o) => o.assignedStaffId === 'nicole').length },
                    { id: 'unassigned', label: '⚪ Unassigned', count: orders.filter((o) => !o.assignedStaffId).length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`filter-pill-btn ${filterAssignment === tab.id ? 'active' : ''}`}
                      onClick={() => setFilterAssignment(tab.id as typeof filterAssignment)}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Status:</span>
              <div className="status-filter-pills">
                {[
                  { id: 'all', label: 'All Orders', count: staffFilteredOrders.length },
                  { id: 'Making', label: 'Making ✂️', count: staffFilteredOrders.filter((o) => o.status === 'Making').length },
                  { id: 'Packed', label: 'Packed 📦', count: staffFilteredOrders.filter((o) => o.status === 'Packed').length },
                  { id: 'Delivering', label: 'Delivering 🚚', count: staffFilteredOrders.filter((o) => o.status === 'Delivering').length },
                  { id: 'Delivered', label: 'Done / Delivered ✅', count: doneOrders.length },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    className={`filter-pill-btn ${filterStatus === st.id ? 'active' : ''}`}
                    onClick={() => setFilterStatus(st.id)}
                    style={st.id === 'Delivered' && filterStatus === 'Delivered' ? { background: '#166534', borderColor: '#166534', color: '#fff' } : undefined}
                  >
                    {st.label} ({st.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notice if non-Anna has 0 total assigned orders */}
          {!showTemporaryTrash && !isAnna && staffFilteredOrders.length === 0 && doneOrders.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                border: '2px solid var(--line)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px 20px',
                textAlign: 'center',
                margin: '20px 0',
              }}
            >
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>
                {currentStaff?.icon}
              </span>
              <h3 style={{ margin: '0 0 6px', color: 'var(--walnut-wood)' }}>
                No Orders Assigned to {currentStaff?.name} Yet
              </h3>
              <p style={{ margin: 0, color: 'var(--text-soft)', fontSize: '0.92rem' }}>
                Anna will assign customer orders to your account. When assigned, they will appear here!
              </p>
            </div>
          ) : (
            <>
              {/* Section 1: Active Orders To Fulfill */}
              {!showTemporaryTrash && filterStatus !== 'Delivered' && (
                <div
                  className="staff-orders-section active-orders-section"
                  style={{
                    background: '#ffffff',
                    border: '2px solid var(--line)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-subtle)',
                    overflow: 'hidden',
                    marginTop: '18px',
                    marginBottom: '26px',
                  }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #fdf6ec 0%, #fef3c7 100%)',
                      padding: '16px 20px',
                      borderBottom: '2px solid var(--line)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.6rem' }}>📋</span>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--walnut-wood)', fontWeight: 800 }}>
                          Active Orders To Fulfill
                        </h2>
                        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                          In-progress orders to prepare, pack, and dispatch. Selecting <strong>&ldquo;Delivered 🎉&rdquo;</strong> will automatically move an order into our Done section below!
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        background: activeOrders.length > 0 ? '#ea580c' : '#16a34a',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '999px',
                      }}
                    >
                      {activeOrders.length} {activeOrders.length === 1 ? 'Order' : 'Orders'} Waiting
                    </span>
                  </div>
                  {renderOrdersTable(activeOrders, false)}
                </div>
              )}

              {/* Section 2: Done & Delivered Section */}
              {!showTemporaryTrash && (filterStatus === 'all' || filterStatus === 'Delivered') && (
                <div
                  className="staff-orders-section done-orders-section"
                  style={{
                    background: '#ffffff',
                    border: '2px solid #86efac',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 4px 18px rgba(22, 101, 52, 0.08)',
                    overflow: 'hidden',
                    marginBottom: '28px',
                  }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      padding: '16px 20px',
                      borderBottom: '2px solid #bbf7d0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.6rem' }}>✅</span>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#166534', fontWeight: 800 }}>
                          Done &amp; Delivered Section
                        </h2>
                        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#15803d' }}>
                          Completed customer deliveries. Orders marked as Delivered automatically appear here. If marked by mistake, change status to move it back to Active.
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        background: '#166534',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '999px',
                      }}
                    >
                      {doneOrders.length} Done / Delivered
                    </span>
                  </div>
                  {renderOrdersTable(doneOrders, true)}
                </div>
              )}

              {showTemporaryTrash && (
                <div
                  className="staff-orders-section"
                  style={{
                    background: '#ffffff',
                    border: '2px solid #d1d5db',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-subtle)',
                    overflow: 'hidden',
                    marginTop: '18px',
                    marginBottom: '28px',
                  }}
                >
                  <div
                    style={{
                      background: '#f3f4f6',
                      padding: '16px 20px',
                      borderBottom: '2px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.6rem' }}>🗑️</span>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#374151', fontWeight: 800 }}>
                          Temporary Trash
                        </h2>
                        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#4b5563' }}>
                          Orders here are hidden from Done. Anna or the assigned packager can restore them.
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#374151' }}>
                      {temporaryTrashOrders.length} Trashed
                    </span>
                  </div>
                  {renderOrdersTable(temporaryTrashOrders, true, true)}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

