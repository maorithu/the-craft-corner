'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useInventory, ProductItem } from '@/context/InventoryContext';
import { sound } from '@/utils/soundEffects';

type StaffMember = {
  id: string;
  name: string;
  icon: string;
  dept: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
};

const STAFF_ADMINS: Record<string, StaffMember> = {
  anna: {
    id: 'anna',
    name: 'Anna (Lead Manager)',
    icon: '🧋',
    dept: 'SlimeTea Studio & Pure Slimes',
    colorBg: '#dbeafe',
    colorBorder: '#93c5fd',
    colorText: '#1e40af',
  },
  kaitlyn: {
    id: 'kaitlyn',
    name: 'Kaitlyn',
    icon: '🐉',
    dept: 'Dragons & 3D Prints',
    colorBg: '#fef3c7',
    colorBorder: '#fcd34d',
    colorText: '#92400e',
  },
  nicole: {
    id: 'nicole',
    name: 'Nicole',
    icon: '🌸',
    dept: 'Rainbow Loom & Blind Boxes',
    colorBg: '#fce7f3',
    colorBorder: '#fbcfe8',
    colorText: '#9d174d',
  },
};

const PRESET_ICONS = ['🐉', '🧋', '🌈', '🎁', '🐱', '🦖', '🐛', '🦫', '⌨️', '🥐', '🍓', '✨', '🐾', '🍃', '⭐'];

const PRESET_IMAGES = [
  { label: 'Beach Packet', path: '/images/products/beach-packet.jpg' },
  { label: 'Beach Blind Box', path: '/images/products/beach-blind-box.jpg' },
  { label: 'Galaxy Packet', path: '/images/products/galaxy-packet.jpg' },
  { label: 'Galaxy Blind Box', path: '/images/products/galaxy-blind-box.jpg' },
  { label: 'Minecraft Packet', path: '/images/products/minecraft-packet.jpg' },
  { label: 'Minecraft Blind Box', path: '/images/products/minecraft-blind-box.jpg' },
  { label: 'Beautiful Day Packet', path: '/images/products/beautiful-day-packet.jpg' },
  { label: 'Beautiful Day Blind Box', path: '/images/products/beautiful-day-bb.jpg' },
  { label: 'Gloomy Light Packet', path: '/images/products/gloomy-light-packet.jpg' },
  { label: 'Gloomy Light Blind Box', path: '/images/products/gloomy-light-bb.jpg' },
  { label: '2016 Vibes Packet', path: '/images/products/vibes-2016-packet.jpg' },
  { label: '2016 Vibes Blind Box', path: '/images/products/vibes-2016-bb.jpg' },
];

export default function AdminInventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct, resetInventory } = useInventory();

  // Authentication: username + password (craft123)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [loginError, setLoginError] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ProductItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formItemNumber, setFormItemNumber] = useState('');
  const [formPrice, setFormPrice] = useState('$2.50');
  const [formCategory, setFormCategory] = useState<string>('3d-prints');
  const [formCategoryLabel, setFormCategoryLabel] = useState('');
  const [formSubCategory, setFormSubCategory] = useState('all');
  const [formStaffLead, setFormStaffLead] = useState('kaitlyn');
  const [formStock, setFormStock] = useState<number>(25);
  const [formTag, setFormTag] = useState('');
  const [formIcon, setFormIcon] = useState('✨');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMaterials, setFormMaterials] = useState('');
  const [formIsBlindBox, setFormIsBlindBox] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    const p = password.trim().toLowerCase();

    let matched: StaffMember | null = null;
    if (u === 'anna123' || u === 'anna') {
      matched = STAFF_ADMINS.anna;
    } else if (u === 'kaitlyn123' || u === 'kaitlyn') {
      matched = STAFF_ADMINS.kaitlyn;
    } else if (u === 'nicole123' || u === 'nicole') {
      matched = STAFF_ADMINS.nicole;
    } else if (u === 'admin' || u === 'craft123') {
      matched = STAFF_ADMINS.anna;
    }

    // Password must be craft123 (or Anna123 / kaitlyn123 / nicole123 for convenience)
    const isPasswordValid =
      p === 'craft123' ||
      (matched && p === `${matched.id}123`) ||
      p === 'admin123';

    if (matched && isPasswordValid) {
      sound.playFanfare();
      setCurrentStaff(matched);
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      sound.playClick();
      setLoginError(true);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    sound.playClick();
    setEditingProduct(null);
    setFormName('');
    setFormShortName('');
    setFormItemNumber(`Item ${products.length + 1}`);
    setFormPrice('$3.00');
    setFormCategory('3d-prints');
    setFormCategoryLabel('3D Prints & Fidgets');
    setFormSubCategory('3d-prints');
    setFormStaffLead(currentStaff?.id || 'anna');
    setFormStock(25);
    setFormTag('New Arrival');
    setFormIcon('✨');
    setFormImageUrl('');
    setFormDescription('Handcrafted in small batches with premium kid-safe materials.');
    setFormMaterials('Eco-friendly PLA, latex-free elastic, non-toxic colors.');
    setFormIsBlindBox(false);
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (p: ProductItem) => {
    sound.playClick();
    setEditingProduct(p);
    setFormName(p.name);
    setFormShortName(p.shortName || p.name);
    setFormItemNumber(p.itemNumber || `Item ${p.id}`);
    setFormPrice(p.displayPrice || '$2.00');
    setFormCategory(p.category);
    setFormCategoryLabel(p.categoryLabel || p.category);
    setFormSubCategory(p.subCategory || 'all');
    setFormStaffLead(p.staffInCharge || 'anna');
    setFormStock(p.stock !== undefined ? p.stock : 25);
    setFormTag(p.tag || '');
    setFormIcon(p.icon || '✨');
    setFormImageUrl(p.imageUrl || '');
    setFormDescription(p.description || '');
    setFormMaterials(p.materials || '');
    setFormIsBlindBox(Boolean(p.isBlindBox));
    setIsEditModalOpen(true);
  };

  // Image File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    sound.playClick();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/inventory/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.imageUrl) {
          setFormImageUrl(data.imageUrl);
          sound.playFanfare();
          showToast('Image uploaded successfully!');
        }
      } else {
        // Fallback to local DataURL for preview
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setFormImageUrl(event.target.result as string);
            showToast('Loaded image preview from file!');
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Save Add/Edit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const priceNum = parseFloat(formPrice.replace(/[^0-9.]/g, '')) || 0;
    const formattedPrice = formPrice.startsWith('$') ? formPrice : `$${priceNum.toFixed(2)}`;

    const payload: Partial<ProductItem> = {
      name: formName.trim(),
      shortName: formShortName.trim() || formName.trim(),
      itemNumber: formItemNumber.trim(),
      displayPrice: formattedPrice,
      price: priceNum,
      category: formCategory as any,
      categoryLabel: formCategoryLabel || formCategory,
      subCategory: formSubCategory as any,
      staffInCharge: formStaffLead,
      stock: Number(formStock) || 0,
      tag: formTag.trim(),
      icon: formIcon || '✨',
      imageUrl: formImageUrl.trim(),
      description: formDescription.trim(),
      materials: formMaterials.trim(),
      isBlindBox: formIsBlindBox,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
      sound.playFanfare();
      showToast(`Updated "${payload.name}" in database! ✨`);
    } else {
      await addProduct(payload);
      sound.playFanfare();
      showToast(`Added new product "${payload.name}" to database! 🎉`);
    }

    setIsEditModalOpen(false);
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    sound.playClick();
    await deleteProduct(deleteCandidate.id);
    showToast(`Deleted "${deleteCandidate.name}" from database.`);
    setDeleteCandidate(null);
  };

  // Quick Stock Adjustment
  const handleAdjustStock = (p: ProductItem, delta: number) => {
    sound.playClick();
    const currentStock = p.stock !== undefined ? p.stock : 25;
    const nextStock = Math.max(0, currentStock + delta);
    updateProduct(p.id, { stock: nextStock });
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchShort = (p.shortName || '').toLowerCase().includes(q);
      const matchNum = (p.itemNumber || '').toLowerCase().includes(q);
      const matchTag = (p.tag || '').toLowerCase().includes(q);
      if (!matchName && !matchShort && !matchNum && !matchTag) return false;
    }

    if (deptFilter !== 'all') {
      if (p.staffInCharge !== deptFilter) return false;
    }

    if (categoryFilter !== 'all') {
      if (p.category !== categoryFilter) return false;
    }

    if (stockFilter === 'low') {
      if ((p.stock ?? 25) > 5) return false;
    } else if (stockFilter === 'out') {
      if ((p.stock ?? 25) > 0) return false;
    }

    return true;
  });

  const totalStockCount = products.reduce((acc, p) => acc + (p.stock ?? 25), 0);
  const lowStockCount = products.filter((p) => (p.stock ?? 25) <= 5).length;

  return (
    <div className="home-container admin-inventory-container">
      {!isAuthenticated ? (
        /* Staff Admin Lock Screen with Username & Password */
        <div className="staff-lock-screen">
          <div className="staff-lock-card">
            <div className="lock-icon-badge">📦 🔒</div>
            <h2>Inventory &amp; Product Database Admin</h2>
            <p>
              Please enter your staff username and password to manage inventory, products, pictures, and stock levels.
            </p>

            <form onSubmit={handleLogin} className="staff-login-form">
              <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                <label htmlFor="admin-username" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px' }}>
                  Staff Username:
                </label>
                <input
                  id="admin-username"
                  type="text"
                  placeholder="Enter staff username..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setLoginError(false);
                  }}
                  required
                  className="staff-passcode-input"
                  autoComplete="username"
                  style={{ width: '100%', marginBottom: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                <label htmlFor="admin-password" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px' }}>
                  Password:
                </label>
                <input
                  id="admin-password"
                  type="password"
                  placeholder="Enter staff password..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError(false);
                  }}
                  required
                  className="staff-passcode-input"
                  autoComplete="current-password"
                  style={{ width: '100%' }}
                />
              </div>

              {loginError && (
                <div className="staff-error-msg" role="alert" style={{ display: 'block', marginBottom: '12px' }}>
                  ⚠️ Invalid username or password. Please check your credentials.
                </div>
              )}

              <button type="submit" className="primary-button staff-login-btn">
                Unlock Inventory Database →
              </button>
            </form>

            <div style={{ marginTop: '16px' }}>
              <Link href="/staff" className="back-home-link" style={{ fontSize: '0.85rem' }}>
                ← Go to Staff Orders Hub
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Admin Dashboard */
        <div className="admin-dashboard-content">
          {/* Top Bar / Header */}
          <div className="admin-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.8rem' }}>📦</span>
                <h1 style={{ margin: 0, fontSize: '1.7rem', color: 'var(--walnut-wood)' }}>
                  Inventory &amp; Product Database
                </h1>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-soft)', fontSize: '0.88rem' }}>
                Manage catalog items, upload pictures, edit details, and adjust live store stock.
              </p>
            </div>

            <div className="admin-header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: currentStaff?.colorBg || '#eff6ff',
                  border: `1.5px solid ${currentStaff?.colorBorder || '#93c5fd'}`,
                  color: currentStaff?.colorText || '#1e40af',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                }}
              >
                <span>{currentStaff?.icon}</span>
                <span>{currentStaff?.name} on Duty</span>
              </div>

              <button
                type="button"
                className="primary-button add-product-btn"
                onClick={handleOpenAddModal}
                style={{ background: '#16a34a', borderColor: '#15803d' }}
              >
                + Add New Product
              </button>

              <Link href="/staff" className="secondary-button" style={{ fontSize: '0.84rem' }}>
                📋 View Orders
              </Link>

              <Link href="/shop" className="secondary-button" style={{ fontSize: '0.84rem' }}>
                🛍️ View Live Shop
              </Link>

              <button
                type="button"
                className="secondary-button"
                style={{ fontSize: '0.84rem' }}
                onClick={() => {
                  setIsAuthenticated(false);
                  setCurrentStaff(null);
                  setUsername('');
                  setPassword('');
                }}
              >
                Log Out 🔒
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div
              style={{
                background: '#ecfdf5',
                border: '2px solid #6ee7b7',
                borderRadius: '8px',
                padding: '10px 16px',
                margin: '16px 0',
                color: '#065f46',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>✨</span>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Metric Tiles */}
          <div className="staff-metrics-grid" style={{ margin: '18px 0' }}>
            <div className="metric-box">
              <span className="metric-label">Total Catalog Products</span>
              <strong className="metric-val">{products.length}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Total Units in Stock</span>
              <strong className="metric-val">{totalStockCount}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">🐉 Kaitlyn&apos;s 3D/Dragons</span>
              <strong className="metric-val">
                {products.filter((p) => p.staffInCharge === 'kaitlyn').length}
              </strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">🧋 Anna&apos;s Slimes</span>
              <strong className="metric-val">
                {products.filter((p) => p.staffInCharge === 'anna').length}
              </strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">🌸 Nicole&apos;s Loom &amp; Boxes</span>
              <strong className="metric-val">
                {products.filter((p) => p.staffInCharge === 'nicole').length}
              </strong>
            </div>
            {lowStockCount > 0 && (
              <div className="metric-box" style={{ borderColor: '#fca5a5', background: '#fff1f2' }}>
                <span className="metric-label" style={{ color: '#be123c' }}>⚠️ Low Stock (&le; 5)</span>
                <strong className="metric-val" style={{ color: '#be123c' }}>{lowStockCount}</strong>
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div
            className="staff-filter-bar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#ffffff',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--line)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search products by name, item number, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '260px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--line)',
                  fontSize: '0.88rem',
                }}
              />

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--line)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  <option value="all">All Departments</option>
                  <option value="kaitlyn">🐉 Kaitlyn (Dragons &amp; 3D)</option>
                  <option value="anna">🧋 Anna (Slimes &amp; SlimeTea)</option>
                  <option value="nicole">🌸 Nicole (Loom &amp; Blind Boxes)</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--line)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="3d-prints">🐉 3D Prints &amp; Fidgets</option>
                  <option value="bracelets">🌈 Rainbow Loom &amp; Bracelets</option>
                  <option value="blind-boxes">🎁 Blind Boxes</option>
                  <option value="clickers">⌨️ Clickers</option>
                  <option value="dragon-puppets">🐲 Dragon Puppets</option>
                </select>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--line)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  <option value="all">All Stock Levels</option>
                  <option value="low">⚠️ Low Stock (&le; 5)</option>
                  <option value="out">❌ Out of Stock (0)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Reset database to initial catalog defaults"
                >
                  🔄 Reset Defaults
                </button>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="staff-orders-table-wrapper" style={{ marginBottom: '32px' }}>
            <table className="staff-orders-table admin-products-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Picture</th>
                  <th>Item Details &amp; Lead</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Quantity</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No products match your current search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const staff = STAFF_ADMINS[p.staffInCharge || 'anna'] || STAFF_ADMINS.anna;
                    const stock = p.stock !== undefined ? p.stock : 25;
                    const isLow = stock <= 5;
                    const isOut = stock === 0;

                    return (
                      <tr key={p.id} className="order-row">
                        {/* Picture Thumbnail */}
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          <div
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '8px',
                              background: '#f1f5f9',
                              border: '1px solid var(--line)',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.6rem',
                              margin: '0 auto',
                              position: 'relative',
                            }}
                          >
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span>{p.icon || '✨'}</span>
                            )}
                          </div>
                        </td>

                        {/* Item Details */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: '#f1f5f9',
                                color: '#475569',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {p.itemNumber || `Item ${p.id}`}
                            </span>
                            {p.tag && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                }}
                              >
                                {p.tag}
                              </span>
                            )}
                            {p.isBlindBox && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: '#fce7f3',
                                  color: '#9d174d',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                }}
                              >
                                🎁 Blind Box
                              </span>
                            )}
                          </div>

                          <strong style={{ fontSize: '0.94rem', color: 'var(--walnut-wood)', display: 'block' }}>
                            {p.name}
                          </strong>
                          <p style={{ margin: '2px 0 6px', fontSize: '0.78rem', color: 'var(--text-soft)', maxWidth: '420px', lineHeight: 1.35 }}>
                            {p.description}
                          </p>

                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: staff.colorBg,
                              color: staff.colorText,
                              border: `1px solid ${staff.colorBorder}`,
                            }}
                          >
                            {staff.icon} {staff.name}
                          </span>
                        </td>

                        {/* Category */}
                        <td>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                            {p.categoryLabel || p.category}
                          </div>
                          {p.subCategoryLabel && (
                            <small style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {p.subCategoryLabel}
                            </small>
                          )}
                        </td>

                        {/* Price */}
                        <td>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--terracotta)' }}>
                            {p.displayPrice}
                          </strong>
                        </td>

                        {/* Stock Stepper */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p, -1)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                              }}
                              title="Decrease stock"
                            >
                              -
                            </button>
                            <span
                              style={{
                                minWidth: '32px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#1e293b',
                              }}
                            >
                              {stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p, 1)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                              }}
                              title="Increase stock"
                            >
                              +
                            </button>
                          </div>

                          <div style={{ marginTop: '4px' }}>
                            {isOut ? (
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                                Low Stock
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a' }}>
                                ✓ In Stock
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: '1px solid #3b82f6',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit Details &amp; Picture
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteCandidate(p)}
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: '1px solid #fca5a5',
                                background: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Add / Edit Product Modal */}
          {isEditModalOpen && (
            <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
              <div
                className="admin-edit-modal-box"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  width: '94%',
                  maxWidth: '680px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '24px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--walnut-wood)' }}>
                    {editingProduct ? `✏️ Edit Product #${editingProduct.id}` : '✨ Add New Product to Inventory'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Row 1: Name & Short Name */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Silk Articulated Crystal Dragon"
                        required
                        className="checkout-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                        Short Name
                      </label>
                      <input
                        type="text"
                        value={formShortName}
                        onChange={(e) => setFormShortName(e.target.value)}
                        placeholder="e.g. Crystal Dragon"
                        className="checkout-input"
                      />
                    </div>
                  </div>

                  {/* Row 2: Item Number, Price, Stock */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                        Item Code / SKU
                      </label>
                      <input
                        type="text"
                        value={formItemNumber}
                        onChange={(e) => setFormItemNumber(e.target.value)}
                        placeholder="e.g. 3D 08"
                        className="checkout-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                        Price (e.g. $4.50) *
                      </label>
                      <input
                        type="text"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="$4.50"
                        required
                        className="checkout-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                        Stock Units
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(Number(e.target.value))}
                        className="checkout-input"
                      />
                    </div>
                  </div>

                  {/* Row 3: Department Lead & Category */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                        Staff In Charge
                      </label>
                      <select
                        value={formStaffLead}
                        onChange={(e) => setFormStaffLead(e.target.value)}
                        className="checkout-select"
                        style={{ width: '100%' }}
                      >
                        <option value="kaitlyn">🐉 Kaitlyn (Dragons &amp; 3D Prints)</option>
                        <option value="anna">🧋 Anna (SlimeTea &amp; Pure Slimes)</option>
                        <option value="nicole">🌸 Nicole (Rainbow Loom &amp; Blind Boxes)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          const cat = e.target.value;
                          setFormCategory(cat);
                          if (cat === 'bracelets') setFormCategoryLabel('Bracelets & Loom');
                          else if (cat === '3d-prints') setFormCategoryLabel('3D Prints & Fidgets');
                          else if (cat === 'clickers') setFormCategoryLabel('Clickers & Puppets');
                          else if (cat === 'blind-boxes') setFormCategoryLabel('Blind Box Section');
                        }}
                        className="checkout-select"
                        style={{ width: '100%' }}
                      >
                        <option value="3d-prints">🐉 3D Prints &amp; Fidgets</option>
                        <option value="bracelets">🌈 Bracelets &amp; Rainbow Loom</option>
                        <option value="blind-boxes">🎁 Blind Box Section</option>
                        <option value="clickers">⌨️ Switch Clickers</option>
                        <option value="dragon-puppets">🐲 Dragon Puppets</option>
                      </select>
                    </div>
                  </div>

                  {/* Picture / Image Management */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--walnut-wood)', marginBottom: '8px' }}>
                      📸 Product Picture &amp; Icon
                    </label>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Live Preview Box */}
                      <div
                        style={{
                          width: '90px',
                          height: '90px',
                          borderRadius: '8px',
                          border: '2px dashed #cbd5e1',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          fontSize: '2.4rem',
                          flexShrink: 0,
                        }}
                      >
                        {formImageUrl ? (
                          <img
                            src={formImageUrl}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        ) : (
                          <span>{formIcon}</span>
                        )}
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
                        {/* File Upload Button */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: '1.5px solid #0284c7',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              cursor: 'pointer',
                            }}
                          >
                            {isUploading ? 'Uploading...' : '📁 Upload Picture from Device'}
                          </button>
                          {formImageUrl && (
                            <button
                              type="button"
                              onClick={() => setFormImageUrl('')}
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.76rem',
                                color: '#ef4444',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              ✕ Remove Picture
                            </button>
                          )}
                        </div>

                        {/* Image URL input */}
                        <input
                          type="text"
                          placeholder="Or paste picture URL (/images/products/... or https://...)"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          className="checkout-input"
                          style={{ fontSize: '0.8rem' }}
                        />

                        {/* Quick Presets */}
                        <div>
                          <small style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            Or choose from studio preset images:
                          </small>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {PRESET_IMAGES.map((img) => (
                              <button
                                key={img.path}
                                type="button"
                                onClick={() => setFormImageUrl(img.path)}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: formImageUrl === img.path ? '#3b82f6' : '#ffffff',
                                  color: formImageUrl === img.path ? '#ffffff' : '#334155',
                                  cursor: 'pointer',
                                }}
                              >
                                {img.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emoji Icon Picker */}
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '4px' }}>
                        Fallback Icon:
                      </label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {PRESET_ICONS.map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setFormIcon(ic)}
                            style={{
                              fontSize: '1.2rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: formIcon === ic ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                              background: formIcon === ic ? '#eff6ff' : '#ffffff',
                              cursor: 'pointer',
                            }}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tag and Mystery Blind Box Checkbox */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                        Tag / Feature Badge
                      </label>
                      <input
                        type="text"
                        value={formTag}
                        onChange={(e) => setFormTag(e.target.value)}
                        placeholder="e.g. Fan Favorite, Limited Edition"
                        className="checkout-input"
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                      <input
                        type="checkbox"
                        id="modal-blind-box"
                        checked={formIsBlindBox}
                        onChange={(e) => setFormIsBlindBox(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="modal-blind-box" style={{ fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                        🎁 Mark as Mystery Blind Box
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                      Product Description
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe what makes this craft item special..."
                      className="checkout-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Materials */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                      Craft Materials / Ingredients
                    </label>
                    <input
                      type="text"
                      value={formMaterials}
                      onChange={(e) => setFormMaterials(e.target.value)}
                      placeholder="e.g. Non-toxic PVA slime base, acrylic charms, foam beads"
                      className="checkout-input"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="secondary-button"
                      style={{ padding: '8px 16px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="primary-button"
                      style={{ padding: '8px 20px', background: '#16a34a', borderColor: '#15803d' }}
                    >
                      {editingProduct ? 'Save Changes ✨' : 'Add to Catalog 🎉'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteCandidate && (
            <div className="modal-backdrop" onClick={() => setDeleteCandidate(null)}>
              <div
                className="admin-edit-modal-box"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  maxWidth: '460px',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🗑️</div>
                <h3 style={{ margin: '0 0 8px', color: '#b91c1c' }}>Delete Product?</h3>
                <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '20px' }}>
                  Are you sure you want to delete <strong>&ldquo;{deleteCandidate.name}&rdquo;</strong> from the database? This cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setDeleteCandidate(null)}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="primary-button"
                    style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                  >
                    Yes, Delete Product
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Confirmation Modal */}
          {isResetConfirmOpen && (
            <div className="modal-backdrop" onClick={() => setIsResetConfirmOpen(false)}>
              <div
                className="admin-edit-modal-box"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  maxWidth: '460px',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔄</div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--walnut-wood)' }}>Reset Database to Defaults?</h3>
                <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '20px' }}>
                  This will reload all original craft products (Dragons, Slimes, Loom Packets, Blind Boxes) into the database.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      sound.playFanfare();
                      await resetInventory();
                      showToast('Database reset to default catalog!');
                      setIsResetConfirmOpen(false);
                    }}
                    className="primary-button"
                  >
                    Yes, Reset Catalog
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

