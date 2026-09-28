'use client';

import { huntCharacters } from '@/data/characters';
import { useHunt } from '@/context/HuntContext';
import { sound } from '@/utils/soundEffects';

export default function HiddenPal({ palId, customClass = '' }: { palId: string; customClass?: string }) {
  const { isFound, findCharacter } = useHunt();
  const pal = huntCharacters.find((p) => p.id === palId);

  if (!pal) return null;
  const found = isFound(pal.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!found) {
      sound.playFanfare();
    }
    findCharacter(pal);
  };

  return (
    <div
      className={`sneaky-pal-spot ${customClass} ${found ? 'found' : 'sneaking'}`}
      onClick={handleClick}
      title={found ? `${pal.name} (Found! ⭐)` : `Something subtle is peeking...`}
      role="button"
      tabIndex={0}
      aria-label={`Hidden craft pal ${pal.name}`}
    >
      <div className="sneaky-peeker">
        <span className="sneaky-emoji">{pal.emoji}</span>
        {found && <span className="sneaky-found-star">⭐</span>}
        {!found && <span className="sneaky-tiny-sparkle">✦</span>}
      </div>
    </div>
  );
}
