'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { HuntCharacter } from '@/types';
import { huntCharacters } from '@/data/characters';

type HuntContextType = {
  foundIds: string[];
  findCharacter: (character: HuntCharacter) => void;
  isFound: (id: string) => boolean;
  totalPals: number;
  foundCount: number;
  allFound: boolean;
  activeFoundPal: HuntCharacter | null;
  dismissFoundPal: () => void;
  questOpen: boolean;
  setQuestOpen: (open: boolean) => void;
  resetHunt: () => void;
};

const HuntContext = createContext<HuntContextType | undefined>(undefined);

export function HuntProvider({ children }: { children: React.ReactNode }) {
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [activeFoundPal, setActiveFoundPal] = useState<HuntCharacter | null>(null);
  const [questOpen, setQuestOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.localStorage.getItem('the-craft-corner-pals-hunt');
      if (saved) {
        setFoundIds(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        window.localStorage.setItem('the-craft-corner-pals-hunt', JSON.stringify(foundIds));
      } catch {
        // ignore
      }
    }
  }, [foundIds, mounted]);

  const findCharacter = (character: HuntCharacter) => {
    if (!foundIds.includes(character.id)) {
      setFoundIds((prev) => [...prev, character.id]);
    }
    setActiveFoundPal(character);
  };

  const dismissFoundPal = () => {
    setActiveFoundPal(null);
  };

  const isFound = (id: string) => foundIds.includes(id);

  const resetHunt = () => {
    setFoundIds([]);
    try {
      window.localStorage.removeItem('the-craft-corner-pals-hunt');
    } catch {
      // ignore
    }
  };

  const totalPals = huntCharacters.length;
  const foundCount = foundIds.length;
  const allFound = totalPals > 0 && foundCount === totalPals;

  return (
    <HuntContext.Provider
      value={{
        foundIds,
        findCharacter,
        isFound,
        totalPals,
        foundCount,
        allFound,
        activeFoundPal,
        dismissFoundPal,
        questOpen,
        setQuestOpen,
        resetHunt,
      }}
    >
      {children}
    </HuntContext.Provider>
  );
}

export function useHunt() {
  const context = useContext(HuntContext);
  if (!context) {
    throw new Error('useHunt must be used within a HuntProvider');
  }
  return context;
}
