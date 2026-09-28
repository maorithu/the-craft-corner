'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CraftItem, MainCategory, SubCategory } from '@/types';
import { craftItems } from '@/data/items';

export interface ProductItem {
  id: string | number;
  itemNumber: string;
  name: string;
  shortName: string;
  category: MainCategory;
  categoryLabel: string;
  subCategory: SubCategory;
  subCategoryLabel: string;
  staffInCharge?: string;
  stock?: number;
  price?: number;
  displayPrice: string;
  tag?: string;
  accent?: 'brioche' | 'matcha' | 'terracotta' | 'butter' | 'walnut' | 'oat' | string;
  icon?: string;
  imageUrl?: string;
  description?: string;
  materials?: string;
  isBlindBox?: boolean;
  sizes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface InventoryContextType {
  products: ProductItem[];
  isLoading: boolean;
  addProduct: (item: Partial<ProductItem>) => Promise<ProductItem>;
  updateProduct: (id: string | number, item: Partial<ProductItem>) => Promise<ProductItem | null>;
  deleteProduct: (id: string | number) => Promise<boolean>;
  refreshInventory: () => Promise<void>;
  resetInventory: () => Promise<void>;
  getProductById: (id: string | number) => ProductItem | undefined;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'craft_corner_inventory';

function determineStaff(item: { name: string; category?: string; subCategory?: string; shortName?: string }): string {
  const text = `${item.name} ${item.shortName || ''} ${item.category || ''} ${item.subCategory || ''}`.toLowerCase();
  if (
    text.includes('dragon') ||
    text.includes('puppet') ||
    text.includes('3d') ||
    text.includes('print') ||
    text.includes('clicker') ||
    text.includes('egg') ||
    text.includes('axolotl') ||
    text.includes('capybara') ||
    text.includes('dino')
  ) {
    return 'kaitlyn';
  }
  if (
    text.includes('slime') ||
    text.includes('tea') ||
    text.includes('boba') ||
    text.includes('drink') ||
    text.includes('fluff') ||
    text.includes('spoon')
  ) {
    return 'anna';
  }
  return 'nicole';
}

function getDefaultProducts(): ProductItem[] {
  return craftItems.map((it) => ({
    ...it,
    staffInCharge: determineStaff(it),
    stock: 25,
    price: parseFloat(it.displayPrice.replace(/[^0-9.]/g, '')) || 0,
  }));
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<ProductItem[]>(getDefaultProducts);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync state to local storage
  const saveToLocal = (items: ProductItem[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // LocalStorage might be disabled or full
    }
  };

  // Fetch all products from API, fallback to localStorage or default
  const refreshInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          saveToLocal(data.products);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API fetch failed, falling back to local cache:', err);
    }

    // Fallback to localStorage if API unavailable
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default to items.ts
    const defaults = getDefaultProducts();
    setProducts(defaults);
    saveToLocal(defaults);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  // Add Product
  const addProduct = async (item: Partial<ProductItem>): Promise<ProductItem> => {
    const tempId = `p_${Date.now()}`;
    const priceNum = typeof item.price === 'number'
      ? item.price
      : parseFloat(String(item.displayPrice || '0').replace(/[^0-9.]/g, '')) || 0;
    const formattedPrice = item.displayPrice || `$${priceNum.toFixed(2)}`;

    const newItem: ProductItem = {
      id: item.id || tempId,
      itemNumber: item.itemNumber || `Item ${products.length + 1}`,
      name: item.name || 'Untitled Product',
      shortName: item.shortName || item.name || 'Untitled Product',
      category: (item.category as MainCategory) || '3d-prints',
      categoryLabel: item.categoryLabel || item.category || '3D Prints & Fidgets',
      subCategory: (item.subCategory as SubCategory) || 'all',
      subCategoryLabel: item.subCategoryLabel || '',
      staffInCharge: item.staffInCharge || determineStaff({ name: item.name || '', category: item.category, subCategory: item.subCategory }),
      stock: item.stock !== undefined ? Number(item.stock) : 25,
      price: priceNum,
      displayPrice: formattedPrice,
      tag: item.tag || '',
      accent: item.accent || 'butter',
      icon: item.icon || '✨',
      imageUrl: item.imageUrl || '',
      description: item.description || '',
      materials: item.materials || '',
      isBlindBox: Boolean(item.isBlindBox),
      sizes: item.sizes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update state
    const updatedList = [newItem, ...products];
    setProducts(updatedList);
    saveToLocal(updatedList);

    // Call API in background
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.product) {
          const syncedList = [data.product, ...products.filter((p) => p.id !== newItem.id)];
          setProducts(syncedList);
          saveToLocal(syncedList);
          return data.product;
        }
      }
    } catch (err) {
      console.error('Failed to sync added product with backend API:', err);
    }

    return newItem;
  };

  // Update Product
  const updateProduct = async (id: string | number, updates: Partial<ProductItem>): Promise<ProductItem | null> => {
    let updatedProduct: ProductItem | null = null;

    const updatedList = products.map((p) => {
      if (String(p.id) === String(id)) {
        const priceNum = updates.price !== undefined
          ? updates.price
          : updates.displayPrice
            ? parseFloat(updates.displayPrice.replace(/[^0-9.]/g, '')) || p.price || 0
            : p.price;
        const displayPrice = updates.displayPrice || (priceNum !== undefined ? `$${priceNum.toFixed(2)}` : p.displayPrice);

        updatedProduct = {
          ...p,
          ...updates,
          price: priceNum,
          displayPrice,
          updatedAt: new Date().toISOString(),
        };
        return updatedProduct;
      }
      return p;
    });

    if (!updatedProduct) return null;

    setProducts(updatedList);
    saveToLocal(updatedList);

    try {
      await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch (err) {
      console.error('Failed to sync updated product to backend API:', err);
    }

    return updatedProduct;
  };

  // Delete Product
  const deleteProduct = async (id: string | number): Promise<boolean> => {
    const updatedList = products.filter((p) => String(p.id) !== String(id));
    setProducts(updatedList);
    saveToLocal(updatedList);

    try {
      await fetch(`/api/inventory?id=${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to sync deletion to backend API:', err);
    }

    return true;
  };

  // Reset Inventory
  const resetInventory = async () => {
    try {
      const res = await fetch('/api/inventory/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.products) {
          setProducts(data.products);
          saveToLocal(data.products);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to reset inventory on server:', err);
    }

    const defaults = getDefaultProducts();
    setProducts(defaults);
    saveToLocal(defaults);
  };

  const getProductById = (id: string | number): ProductItem | undefined => {
    return products.find((p) => String(p.id) === String(id));
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshInventory,
        resetInventory,
        getProductById,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

