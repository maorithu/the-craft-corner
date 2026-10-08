export type MainCategory =
  | 'bracelets'
  | '3d-prints'
  | 'clickers'
  | 'dragon-puppets'
  | 'blind-boxes';

export type SubCategory =
  | 'all'
  | 'loom-packet'
  | 'seasonal-loom'
  | 'wearable'
  | 'blind-box'
  | 'oreo-balloon'
  | 'squishy-blind-box'
  | '3d-animals'
  | '3d-fidgets'
  | '3d-prints'
  | 'tactile'
  | 'puppets';

export type CraftItem = {
  id: number;
  itemNumber: string;
  name: string;
  shortName: string;
  category: MainCategory;
  categoryLabel: string;
  subCategory: SubCategory;
  subCategoryLabel: string;
  staffInCharge?: string;
  tag: string;
  accent: 'brioche' | 'matcha' | 'terracotta' | 'butter' | 'walnut' | 'oat';
  icon: string;
  imageUrl?: string;
  description: string;
  materials: string;
  displayPrice: string;
  isBlindBox?: boolean;
  sizes?: string[];
};

export type HuntCharacter = {
  id: string;
  name: string;
  nickname: string;
  emoji: string;
  color: string;
  clue: string;
  greeting: string;
  personality: string;
};
