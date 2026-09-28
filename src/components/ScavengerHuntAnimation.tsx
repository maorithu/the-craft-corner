'use client';

import { useState, useEffect } from 'react';
import { useHunt } from '@/context/HuntContext';
import { huntCharacters } from '@/data/characters';

export default function ScavengerHuntAnimation() {
  const { activeFoundPal, dismissFoundPal, foundIds, totalPals } = useHunt();
  const [animationStep, setAnimationStep] = useState<'greeting' | 'walking' | 'checked'>('greeting');

  useEffect(() => {
    if (activeFoundPal) {
      setAnimationStep('greeting');
      const walkTimer = setTimeout(() => {
        setAnimationStep('walking');
      }, 1200);

      const checkTimer = setTimeout(() => {
        setAnimationStep('checked');
      }, 3000);

      return () => {
        clearTimeout(walkTimer);
        clearTimeout(checkTimer);
      };
    }
  }, [activeFoundPal]);

  if (!activeFoundPal) return null;

  return (
    <div className="hunt-modal-overlay" onClick={dismissFoundPal} role="dialog" aria-modal="true">
      <div className="hunt-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Celebration Header */}
        <div className="hunt-modal-header">
          <div className="hunt-trophy-badge">
            <span>✨ Scavenger Hunt Discovery!</span>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={dismissFoundPal}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Character Speech Bubble & Avatar */}
        <div className="hunt-modal-body">
          <div className="hunt-speech-bubble">
            <span className="speech-quote-mark">“</span>
            <h3>Oh! You found me! 🎉</h3>
            <p className="hunt-character-quote">{activeFoundPal.greeting}</p>
          </div>

          {/* Walking Animation Track */}
          <div className="hunt-walk-track">
            <div className="walk-track-ground" />
            <div className={`walking-character ${animationStep}`}>
              <div className="character-figure">
                <span className="character-emoji-sprite">{activeFoundPal.emoji}</span>
                <div className="character-cute-shadow" />
                <div className="walk-dust-sparks">
                  <span>🐾</span>
                  <span>✨</span>
                </div>
              </div>
              <span className="character-walk-label">
                {animationStep === 'walking' ? 'Walking to checklist...' : activeFoundPal.name}
              </span>
            </div>

            <div className="walk-destination-flag">
              <span className="flag-icon">📋</span>
              <span className="flag-label">Checklist</span>
            </div>
          </div>

          {/* Interactive Live Checklist Progress */}
          <div className="hunt-live-checklist">
            <h4>Homepage Crafter Checklist</h4>
            <div className="checklist-chips-row">
              {huntCharacters.map((char) => {
                const isFound = foundIds.includes(char.id);
                const isJustFound = char.id === activeFoundPal.id;

                return (
                  <div
                    key={char.id}
                    className={`checklist-chip ${isFound ? 'checked' : 'pending'} ${isJustFound && animationStep === 'checked' ? 'highlight-check' : ''}`}
                  >
                    <span className="chip-emoji">{char.emoji}</span>
                    <span className="chip-name">{char.name}</span>
                    <span className="chip-status">
                      {isFound ? '✓ Checked!' : 'Hiding...'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hunt-modal-footer">
            <p className="hunt-tally-text">
              Pals Discovered: <strong>{foundIds.length} of {totalPals}</strong>
            </p>
            <button
              type="button"
              className="primary-button hunt-dismiss-btn"
              onClick={dismissFoundPal}
            >
              Yay! Continue Exploring 🌸
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
