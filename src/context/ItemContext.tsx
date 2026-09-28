'use client';

import React, { createContext, useContext, useState } from 'react';
import { CraftItem } from '@/types';

type ItemContextType = {
  selectedItem: CraftItem | null;
  openItemPreview: (item: CraftItem) => void;
  closeItemPreview: () => void;
};

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export function ItemProvider({ children }: { children: React.ReactNode }) {
  const [selectedItem, setSelectedItem] = useState<CraftItem | null>(null);

  const openItemPreview = (item: CraftItem) => {
    setSelectedItem(item);
  };

  const closeItemPreview = () => {
    setSelectedItem(null);
  };

  return (
    <ItemContext.Provider value={{ selectedItem, openItemPreview, closeItemPreview }}>
      {children}
    </ItemContext.Provider>
  );
}

export function useItemModal() {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error('useItemModal must be used within an ItemProvider');
  }
  return context;
}
