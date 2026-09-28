'use client';

import { useState, useEffect } from 'react';
import { useItemModal } from '@/context/ItemContext';
import { useCart } from '@/context/CartContext';

export default function ItemPreviewModal() {
  const { selectedItem, closeItemPreview } = useItemModal();
  const { addToCart, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    selectedItem?.sizes?.[0]
  );

  // Reset quantity and size when selected item changes
  useEffect(() => {
    setQuantity(1);
    setJustAdded(false);
    setSelectedSize(selectedItem?.sizes?.[0]);
  }, [selectedItem]);

  if (!selectedItem) return null;

  const unitPrice = parseFloat(selectedItem.displayPrice.replace(/[^0-9.]/g, '')) || 0;
  const lineTotal = (unitPrice * quantity).toFixed(2);

  const handleAdd = () => {
    addToCart(
      {
        id: selectedItem.id,
        name: selectedItem.name,
        displayPrice: selectedItem.displayPrice,
        icon: selectedItem.icon,
        imageUrl: selectedItem.imageUrl,
        tag: selectedItem.tag,
        categoryLabel: selectedItem.categoryLabel,
        size: selectedSize,
      },
      quantity
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  return (
    <div className="overlay" onClick={closeItemPreview} role="dialog" aria-modal="true" aria-label={`Preview of ${selectedItem.name}`}>
      <div className="item-modal-panel cute-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="item-modal-header">
          <div className="item-modal-badges">
            <span className="item-number-badge">{selectedItem.itemNumber}</span>
            <span className="item-cat-badge">{selectedItem.categoryLabel}</span>
            <span className="item-subcat-badge">🌸 {selectedItem.subCategoryLabel}</span>
            {selectedItem.isBlindBox && (
              <span className="item-blind-badge">🎁 Blind Box</span>
            )}
          </div>
          <button
            type="button"
            className="close-button"
            onClick={closeItemPreview}
            aria-label="Close item preview"
          >
            ×
          </button>
        </div>

        <div className="item-modal-body">
          <div className={`item-modal-visual accent-${selectedItem.accent} ${selectedItem.imageUrl ? 'has-real-photo' : ''}`}>
            {selectedItem.imageUrl ? (
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                className="item-modal-real-photo"
              />
            ) : (
              <span className="item-modal-icon">{selectedItem.icon}</span>
            )}
            <span className="item-visual-tag">{selectedItem.tag}</span>
          </div>

          <div className="item-modal-info">
            <h2>{selectedItem.name}</h2>

            <div className="item-specs-grid">
              <div className="spec-item">
                <span className="spec-label">Category</span>
                <strong>{selectedItem.categoryLabel}</strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Sub-Category</span>
                <strong>{selectedItem.subCategoryLabel}</strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Price</span>
                <strong className="item-price-preview">{selectedItem.displayPrice}</strong>
              </div>
            </div>

            {/* Size Options Selector if item has sizes */}
            {selectedItem.sizes && (
              <div className="modal-size-selector">
                <span className="modal-size-title">Choose Size:</span>
                <div className="modal-size-pills">
                  {selectedItem.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      className={`modal-size-pill ${selectedSize === sz ? 'active' : ''}`}
                      onClick={() => setSelectedSize(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Picker & Add to Basket Section */}
            <div className="item-modal-add-row">
              <div className="modal-qty-picker">
                <span className="qty-picker-label">Quantity:</span>
                <div className="qty-pill-controls">
                  <button
                    type="button"
                    className="qty-btn minus"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn plus"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="item-modal-actions">
                <button
                  type="button"
                  className={`primary-button modal-add-cart-btn ${justAdded ? 'added' : ''}`}
                  onClick={handleAdd}
                >
                  {justAdded ? '✓ Added to Basket! 🎉' : `🛒 Add to Basket • $${lineTotal}`}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeItemPreview}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
