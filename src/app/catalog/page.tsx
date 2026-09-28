'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { craftItems } from '@/data/items';
import { useItemModal } from '@/context/ItemContext';
import { useCart } from '@/context/CartContext';
import { CraftItem } from '@/types';
import HiddenPal from '@/components/HiddenPal';

function CatalogContent() {
  const { openItemPreview } = useItemModal();
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<number | string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'itemNumber' | 'name' | 'price'>('itemNumber');
  const [selectedSizes, setSelectedSizes] = useState<Record<number | string, string>>({});

  const catalogCategories = [
    { id: 'all', label: '📖 All Catalog Items' },
    { id: '3d-prints', label: '🐉 3D Prints' },
    { id: 'bracelets', label: '🌈 Loom & Bracelets' },
    { id: 'blind-boxes', label: '🎁 Blind Boxes' },
    { id: 'clickers', label: '⌨️ Clickers & Puppets' },
  ];

  const filteredItems = useMemo(() => {
    return craftItems
      .filter((item) => {
        if (categoryFilter === 'blind-boxes') {
          if (!item.isBlindBox) return false;
        } else if (categoryFilter !== 'all') {
          if (item.category !== categoryFilter) return false;
        }

        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.materials.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subCategoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price') {
          const priceA = parseFloat(a.displayPrice.replace('$', ''));
          const priceB = parseFloat(b.displayPrice.replace('$', ''));
          return priceA - priceB;
        }
        return a.id - b.id;
      });
  }, [categoryFilter, searchQuery, sortBy]);

  const handleAddToCart = (e: React.MouseEvent, item: CraftItem) => {
    e.stopPropagation();
    const chosenSize = item.sizes ? selectedSizes[item.id] || item.sizes[0] : undefined;
    addToCart({
      id: item.id,
      name: item.name,
      displayPrice: item.displayPrice,
      icon: item.icon,
      imageUrl: item.imageUrl,
      tag: item.tag,
      categoryLabel: item.categoryLabel,
      size: chosenSize,
    });
    setAddedId(item.id);
    setTimeout(() => {
      setAddedId((current) => (current === item.id ? null : current));
    }, 1800);
  };

  return (
    <div className="shop-container catalog-container">
      {/* Catalog Header */}
      <div className="shop-header">
        <span className="section-eyebrow">📖 Master Store Directory</span>
        <h1>The Craft Corner Product Catalog</h1>
        <p>
          The complete master catalog of every handmade item, DIY kit, 3D print, and mystery box in our collection.
        </p>

        {/* Department Navigation Switcher */}
        <div className="catalog-dept-nav-banner">
          <span className="dept-nav-icon">🛍️</span>
          <span>
            Looking for specific shop sections? Browse{' '}
            <Link href="/shop/?category=3d-prints" className="dept-link">🐉 3D Prints</Link>,{' '}
            <Link href="/shop/?category=bracelets" className="dept-link">🌈 Rainbow Loom</Link>,{' '}
            <Link href="/shop/?category=blind-boxes" className="dept-link">🎁 Blind Boxes</Link>, or visit the{' '}
            <Link href="/slimetea/" className="dept-link">🧋 SlimeTea Studio</Link>!
          </span>
        </div>
      </div>

      {/* Catalog Filters */}
      <div className="shop-controls">
        <div className="category-pills-row" role="tablist" aria-label="Catalog Categories">
          {catalogCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${categoryFilter === cat.id ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Bar */}
        <div className="shop-filters-row">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search catalog by name, materials, item number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shop-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="sort-wrap">
            <label htmlFor="catalog-sort-select">Sort by:</label>
            <select
              id="catalog-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="shop-sort-select"
            >
              <option value="itemNumber">Item Number</option>
              <option value="name">Alphabetical</option>
              <option value="price">Price (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Count & Status */}
      <div className="shop-results-status">
        <span>Showing <strong>{filteredItems.length}</strong> master catalog item{filteredItems.length === 1 ? '' : 's'}</span>
        {categoryFilter !== 'all' && (
          <button
            type="button"
            className="clear-subcat-btn"
            onClick={() => setCategoryFilter('all')}
          >
            Show All Catalog Items ×
          </button>
        )}
      </div>

      <div style={{ position: 'relative', minHeight: '30px' }}>
        <HiddenPal palId="sparky" customClass="catalog-sparky-pal" />
      </div>

      {/* Item Display as Horizontal Rectangles */}
      {filteredItems.length === 0 ? (
        <div className="no-products-view">
          <span className="no-products-icon">📖</span>
          <h3>No catalog items found</h3>
          <p>Try clearing your search term or selecting &quot;All Catalog Items&quot;!</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setCategoryFilter('all');
              setSearchQuery('');
            }}
          >
            Reset Catalog Search
          </button>
        </div>
      ) : (
        <div className="product-rectangles-list">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className={`product-rect-card ${item.isBlindBox ? 'blind-box-card' : ''}`}
              onClick={() => openItemPreview(item)}
            >
              {/* Item Visual on Left inside Rectangle */}
              <div className={`rect-item-visual accent-${item.accent} ${item.imageUrl ? 'has-real-photo' : ''}`}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="rect-item-photo"
                    loading="lazy"
                  />
                ) : (
                  <span className="rect-item-icon">{item.icon}</span>
                )}
                <span className="rect-item-badge">{item.itemNumber}</span>
                {item.isBlindBox && (
                  <span className="rect-item-mystery-tag">🎁 Blind Box</span>
                )}
              </div>

              {/* Item Details inside Rectangle */}
              <div className="rect-item-details">
                <div className="rect-item-header">
                  <div className="rect-pill-group">
                    <span className="rect-cat-tag">{item.categoryLabel}</span>
                    <span className="rect-subcat-tag">🌸 {item.subCategoryLabel}</span>
                    <span className="rect-special-tag">{item.tag}</span>
                  </div>
                  <strong className="rect-price-text">{item.displayPrice}</strong>
                </div>

                <h3 className="rect-item-title">{item.name}</h3>
                <p className="rect-item-description">{item.description}</p>

                <div className="rect-item-materials">
                  <span className="materials-label">Contents:</span>
                  <span className="materials-value">{item.materials}</span>
                </div>

                {item.sizes && (
                  <div className="rect-item-sizes" onClick={(e) => e.stopPropagation()}>
                    <span className="size-label">Select Size:</span>
                    <div className="size-buttons-row">
                      {item.sizes.map((sz) => {
                        const isSelected = (selectedSizes[item.id] || item.sizes![0]) === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            className={`size-pill-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => setSelectedSizes((prev) => ({ ...prev, [item.id]: sz }))}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="rect-item-action">
                <button
                  type="button"
                  className={`primary-button rect-add-cart-btn ${addedId === item.id ? 'added' : ''}`}
                  onClick={(e) => handleAddToCart(e, item)}
                  aria-label={`Add ${item.name} to basket`}
                >
                  {addedId === item.id ? '✓ In Basket! 🎉' : `🛒 Add ${item.displayPrice}`}
                </button>
                <button
                  type="button"
                  className="secondary-button rect-preview-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openItemPreview(item);
                  }}
                  aria-label={`Quick view details for ${item.name}`}
                >
                  Quick View 🔍
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="shop-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p>Loading The Craft Corner catalog...</p>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}

