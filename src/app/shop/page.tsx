'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { craftItems } from '@/data/items';
import { useItemModal } from '@/context/ItemContext';
import { useCart } from '@/context/CartContext';
import { CraftItem, MainCategory } from '@/types';
import HiddenPal from '@/components/HiddenPal';

const validCategories: MainCategory[] = ['3d-prints', 'bracelets', 'blind-boxes', 'clickers'];

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as MainCategory | null;

  const { openItemPreview } = useItemModal();
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<number | string | null>(null);
  
  // Default to URL category if valid, otherwise 3d-prints
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return categoryParam && validCategories.includes(categoryParam) ? categoryParam : '3d-prints';
  });
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'itemNumber' | 'name' | 'price'>('itemNumber');

  // Sync category param from URL
  useEffect(() => {
    if (categoryParam && validCategories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
      setSelectedSubCategory('all');
    }
  }, [categoryParam]);

  const [selectedSizes, setSelectedSizes] = useState<Record<number | string, string>>({});

  const mainCategories = [
    { id: '3d-prints', label: '🐉 3D Prints & Fidgets' },
    { id: 'bracelets', label: '📿 Bracelets & Rainbow Loom' },
    { id: 'blind-boxes', label: '🎁 Mystery Blind Boxes' },
    { id: 'clickers', label: '⌨️ Clickers & Hand Puppets' },
  ];

  // Dynamic subcategories based on chosen category
  const subCategoryOptions = useMemo(() => {
    if (selectedCategory === 'bracelets') {
      return [
        { id: 'all', label: 'All Bracelets & Loom' },
        { id: 'loom-packet', label: '🌈 Rainbow Loom Packets ($2.00)' },
        { id: 'blind-box', label: '🎁 Loom Blind Boxes ($2.50)' },
        { id: 'seasonal-loom', label: '🍂 Seasonal & Special Loom ($2.00)' },
        { id: 'wearable', label: '📿 Beaded & Charm Bracelets' },
      ];
    }
    if (selectedCategory === '3d-prints') {
      return [
        { id: 'all', label: 'All 3D Items' },
        { id: '3d-animals', label: '🐾 3D Animals' },
        { id: '3d-fidgets', label: '⚡ Fidgets' },
        { id: '3d-prints', label: '🖨️ 3D Prints' },
        { id: 'blind-box', label: '🎁 Dragon Eggs' },
      ];
    }
    if (selectedCategory === 'clickers') {
      return [
        { id: 'all', label: 'All Clickers & Puppets' },
        { id: 'tactile', label: '⌨️ Cat-Paw Clicker Switches' },
        { id: 'puppets', label: '🐲 Paper Hand Dragon Puppets' },
      ];
    }
    if (selectedCategory === 'blind-boxes') {
      return [
        { id: 'all', label: 'All Mystery Blind Boxes' },
        { id: 'squishy-blind-box', label: '🍡 Squishy Blind Boxes ($4.50)' },
        { id: 'blind-box', label: '🌈 Loom Blind Boxes ($2.50)' },
        { id: '3d-prints', label: '🥚 3D Dragon Eggs' },
      ];
    }
    return [];
  }, [selectedCategory]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubCategory('all');
    router.push(`/shop/?category=${catId}`);
  };

  const filteredItems = useMemo(() => {
    return craftItems
      .filter((item) => {
        // Handle Blind Boxes Main Category
        if (selectedCategory === 'blind-boxes') {
          if (!item.isBlindBox) return false;
          if (selectedSubCategory !== 'all') {
            if (item.subCategory !== selectedSubCategory && item.category !== selectedSubCategory) {
              return false;
            }
          }
        } else {
          if (item.category !== selectedCategory) return false;
          if (selectedSubCategory !== 'all' && item.subCategory !== selectedSubCategory) {
            return false;
          }
        }

        // Search match
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
  }, [selectedCategory, selectedSubCategory, searchQuery, sortBy]);

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
    <div className="shop-container">
      {/* Page Header */}
      <div className="shop-header">
        <span className="section-eyebrow">
          {selectedCategory === '3d-prints' && '🐉 3D Printing & Fidget Department'}
          {selectedCategory === 'bracelets' && '🌈 Rainbow Loom & Jewelry Department'}
          {selectedCategory === 'blind-boxes' && '🎁 Mystery Blind Box Department'}
          {selectedCategory === 'clickers' && '⌨️ Tactile Switches & Puppets Department'}
        </span>
        <h1>
          {selectedCategory === '3d-prints' && '🐉 Dragons & 3D Prints'}
          {selectedCategory === 'bracelets' && '📿 Bracelets & Rainbow Loom Collection'}
          {selectedCategory === 'blind-boxes' && '🎁 Mystery Blind Box Section'}
          {selectedCategory === 'clickers' && '⌨️ Keyboard Switch Clickers & Hand Puppets'}
        </h1>
        <p>
          {selectedCategory === '3d-prints' && 'Articulated crystal dragons, flexi animals, capybaras, and tactile 3D fidgets!'}
          {selectedCategory === 'bracelets' && 'Handmade wearable bracelets and DIY rainbow loom packets ($2.00)!'}
          {selectedCategory === 'blind-boxes' && 'Mystery surprise boxes with sealed loom packets ($2.50) and squishy toys ($4.50)!'}
          {selectedCategory === 'clickers' && 'Mechanical key switch clickers with cat paw keychains and handmade dragon hand puppets!'}
        </p>

        {/* Master Catalog Callout */}
        <div className="shop-catalog-link-hint">
          <span>Looking for the master inventory list of all products? </span>
          <Link href="/catalog" className="catalog-text-link">
            Open Complete Product Catalog 📖 →
          </Link>
        </div>

        {/* Slime Exclusivity Notice */}
        <div className="shop-slimetea-notice-bar">
          <span className="notice-tea-icon">🧋</span>
          <span>
            Looking for handmade scented slimes with jelly cubes &amp; boba? Slimes are exclusively freshly scooped at our <strong>SlimeTea Studio</strong>!
          </span>
          <Link href="/slimetea" className="notice-tea-link">
            Teleport to SlimeTea Bar →
          </Link>
        </div>
      </div>

      {/* Main Categories Pills */}
      <div className="shop-controls">
        <div className="category-pills-row" role="tablist" aria-label="Main Craft Categories">
          {mainCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sub-Category Choices */}
        {subCategoryOptions.length > 0 && (
          <div className="subcategory-choices-banner">
            <span className="subcat-label">Choices:</span>
            <div className="subcategory-pills-row">
              {subCategoryOptions.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  className={`subcat-pill ${selectedSubCategory === sub.id ? 'active' : ''} ${
                    sub.id === 'blind-box' ? 'blind-box-pill' : ''
                  }`}
                  onClick={() => setSelectedSubCategory(sub.id)}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search & Sort Bar */}
        <div className="shop-filters-row">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search beach packet, galaxy, boba slime, jelly cubes, loom..."
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
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
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
      <div className="shop-results-status" style={{ position: 'relative' }}>
        <span>Showing <strong>{filteredItems.length}</strong> craft item{filteredItems.length === 1 ? '' : 's'}</span>
        {selectedSubCategory !== 'all' && (
          <button
            type="button"
            className="clear-subcat-btn"
            onClick={() => setSelectedSubCategory('all')}
          >
            Clear choice filter ×
          </button>
        )}
        {/* Hidden Pal #1: Sparky the Dragon (Hiding near craft directory!) */}
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
          <HiddenPal palId="sparky" customClass="shop-sparky-pal" />
        </div>
      </div>

      {/* Item Display as Horizontal Rectangles with Real Product Photo / Visual Inside */}
      {filteredItems.length === 0 ? (
        <div className="no-products-view">
          <span className="no-products-icon">🎨</span>
          <h3>No items found in this section</h3>
          <p>Try clearing your search term or choice filter to view items in this section!</p>
          {(searchQuery || selectedSubCategory !== 'all') && (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setSelectedSubCategory('all');
                setSearchQuery('');
              }}
            >
              Clear Choice &amp; Search Filters
            </button>
          )}
        </div>
      ) : (
        <div className="product-rectangles-list">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className={`product-rect-card ${item.isBlindBox ? 'blind-box-card' : ''}`}
              onClick={() => openItemPreview(item)}
            >
              {/* Item Visual on Left inside Rectangle (Photo or Icon) */}
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

              {/* Action Buttons on Right inside Rectangle */}
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

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="shop-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p>Loading The Craft Corner products...</p>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
