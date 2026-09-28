'use client';

import { useState } from 'react';
import { sound } from '@/utils/soundEffects';

type SwitchStyle = 'blue' | 'brown' | 'bubble';

export default function ClickerFidgetGame() {
  const [clickCount, setClickCount] = useState(0);
  const [switchType, setSwitchType] = useState<SwitchStyle>('blue');
  const [isPressed, setIsPressed] = useState(false);
  const [lastRipple, setLastRipple] = useState<{ id: number; x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    sound.playClick();
    setClickCount((prev) => prev + 1);
    setIsPressed(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLastRipple({ id: Date.now(), x, y });

    setTimeout(() => {
      setIsPressed(false);
    }, 120);
  };

  const getRank = () => {
    if (clickCount >= 100) return '👑 Sensory Master Legend';
    if (clickCount >= 50) return '⚡ Speedy Clacker';
    if (clickCount >= 25) return '🐾 Rhythm Paws';
    if (clickCount >= 10) return '🌱 Beginner Clicker';
    return 'Click to start!';
  };

  return (
    <div className="mini-game-card clicker-game-card">
      <div className="game-card-header">
        <div className="game-title-group">
          <span className="game-badge">⌨️ Mini Game 02</span>
          <h3>Satisfying Cat-Paw Keyboard Clicker</h3>
          <p>Tap and click the tactile mechanical switch! Features authentic mechanical sound and haptic spring bounce.</p>
        </div>

        <div className="click-counter-display">
          <span className="counter-num">{clickCount}</span>
          <span className="counter-label">Clicks</span>
        </div>
      </div>

      <div className="clicker-arena">
        {/* Switch type selectors */}
        <div className="switch-type-picker">
          <button
            type="button"
            className={`switch-mode-btn ${switchType === 'blue' ? 'active' : ''}`}
            onClick={() => setSwitchType('blue')}
          >
            🔵 Blue Switch (Clicky)
          </button>
          <button
            type="button"
            className={`switch-mode-btn ${switchType === 'brown' ? 'active' : ''}`}
            onClick={() => setSwitchType('brown')}
          >
            🟤 Brown Switch (Tactile)
          </button>
          <button
            type="button"
            className={`switch-mode-btn ${switchType === 'bubble' ? 'active' : ''}`}
            onClick={() => setSwitchType('bubble')}
          >
            🌸 Bubble Paw Mode
          </button>
        </div>

        {/* The 3D Clickable Cat-Paw Switch */}
        <div className="switch-stage">
          <button
            type="button"
            className={`giant-mechanical-key ${isPressed ? 'pressed' : ''} style-${switchType}`}
            onClick={handleClick}
            aria-label="Click mechanical switch"
          >
            <div className="keycap-top">
              <span className="keycap-paw-icon">🐾</span>
              <span className="keycap-label">CLICK ME!</span>
            </div>
            <div className="keycap-side" />
            <div className="switch-housing" />

            {lastRipple && (
              <span
                key={lastRipple.id}
                className="click-ripple-wave"
                style={{ left: lastRipple.x, top: lastRipple.y }}
              />
            )}
          </button>

          <span className="click-tip-bubble">Press Space or Tap! ⌨️</span>
        </div>

        {/* Level / Rank Badge */}
        <div className="clicker-achievement-row">
          <div className="rank-badge">
            <span>Rank: <strong>{getRank()}</strong></span>
          </div>

          <div className="milestone-track">
            <span className={`milestone-dot ${clickCount >= 10 ? 'achieved' : ''}`}>10</span>
            <span className={`milestone-dot ${clickCount >= 25 ? 'achieved' : ''}`}>25</span>
            <span className={`milestone-dot ${clickCount >= 50 ? 'achieved' : ''}`}>50</span>
            <span className={`milestone-dot ${clickCount >= 100 ? 'achieved' : ''}`}>100</span>
          </div>

          <button
            type="button"
            className="secondary-button reset-clicks-btn"
            onClick={() => setClickCount(0)}
            disabled={clickCount === 0}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
