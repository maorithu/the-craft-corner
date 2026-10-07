'use client';

import { useState } from 'react';
import { sound } from '@/utils/soundEffects';

type Bead = {
  id: string;
  type: 'color' | 'charm' | 'letter';
  value: string;
  color: string;
};

const beadColors = [
  { name: 'Peach', color: '#f7a399', text: '' },
  { name: 'Matcha', color: '#88a381', text: '' },
  { name: 'Honey', color: '#e5a953', text: '' },
  { name: 'Butter', color: '#f9e79f', text: '' },
  { name: 'Lilac', color: '#bb8fce', text: '' },
  { name: 'Sky Mint', color: '#76d7c4', text: '' },
  { name: 'Clay', color: '#c06c52', text: '' },
  { name: 'Pure Pearl', color: '#ffffff', text: '' },
];

const charms = [
  { name: 'Star', icon: '⭐', color: '#ffd700' },
  { name: 'Heart', icon: '💖', color: '#ff69b4' },
  { name: 'Flower', icon: '🌸', color: '#ffb7b2' },
  { name: 'Sparkle', icon: '✨', color: '#f9e79f' },
  { name: 'Smiley', icon: '😊', color: '#f7dc6f' },
];

export default function BraceletMakerGame() {
  const [beads, setBeads] = useState<Bead[]>([
    { id: '1', type: 'color', value: '', color: '#f7a399' },
    { id: '2', type: 'color', value: '', color: '#f9e79f' },
    { id: '3', type: 'color', value: '', color: '#88a381' },
    { id: '4', type: 'letter', value: 'C', color: '#ffffff' },
    { id: '5', type: 'letter', value: 'R', color: '#ffffff' },
    { id: '6', type: 'letter', value: 'A', color: '#ffffff' },
    { id: '7', type: 'letter', value: 'F', color: '#ffffff' },
    { id: '8', type: 'letter', value: 'T', color: '#ffffff' },
    { id: '9', type: 'charm', value: '⭐', color: '#ffd700' },
    { id: '10', type: 'color', value: '', color: '#bb8fce' },
    { id: '11', type: 'color', value: '', color: '#76d7c4' },
  ]);

  const [letterInput, setLetterInput] = useState('');
  const [celebrating, setCelebrating] = useState(false);

  const addColorBead = (color: string) => {
    sound.playBeadChime();
    setBeads((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type: 'color', value: '', color },
    ]);
  };

  const addCharm = (charmIcon: string, charmColor: string) => {
    sound.playBeadChime();
    setBeads((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type: 'charm', value: charmIcon, color: charmColor },
    ]);
  };

  const handleAddLetters = () => {
    if (!letterInput.trim()) return;
    sound.playFanfare();
    const letters = letterInput.toUpperCase().split('').filter((c) => c.match(/[A-Z0-9]/));
    const newBeads: Bead[] = letters.map((l, idx) => ({
      id: `${Date.now()}-${idx}`,
      type: 'letter',
      value: l,
      color: '#ffffff',
    }));
    setBeads((prev) => [...prev, ...newBeads]);
    setLetterInput('');
  };

  const undoLast = () => {
    setBeads((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    setBeads([]);
  };

  const shuffleCutePattern = () => {
    sound.playFanfare();
    const pastelColors = ['#f7a399', '#88a381', '#f9e79f', '#bb8fce', '#76d7c4', '#ffffff'];
    const generated: Bead[] = [];
    for (let i = 0; i < 14; i++) {
      if (i === 6) {
        generated.push({ id: `gen-${i}`, type: 'charm', value: '💖', color: '#ff69b4' });
      } else {
        generated.push({
          id: `gen-${i}`,
          type: 'color',
          value: '',
          color: pastelColors[i % pastelColors.length],
        });
      }
    }
    setBeads(generated);
  };

  const handleWear = () => {
    sound.playFanfare();
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 3000);
  };

  return (
    <div className="mini-game-card bracelet-game-card">
      <div className="game-card-header">
        <div className="game-title-group">
          <span className="game-badge">📿 Activity 01</span>
          <h3>Clay Bead Bracelet Studio</h3>
          <p>Design your own trendy friendship bracelet with clay heishi discs, custom letter beads, and cute charms!</p>
        </div>
        <button type="button" className="secondary-button shuffle-btn" onClick={shuffleCutePattern}>
          ✨ Magic Shuffle Pattern
        </button>
      </div>

      {/* Visual Bracelet String Preview */}
      <div className="bracelet-canvas-area">
        <div className="bracelet-string-track">
          <div className="bracelet-thread-line" />
          <div className="beads-strand">
            {beads.length === 0 ? (
              <span className="empty-bracelet-hint">Your elastic string is empty! Tap colors below to string your beads 📿</span>
            ) : (
              beads.map((bead) => (
                <div
                  key={bead.id}
                  className={`clay-bead bead-${bead.type}`}
                  style={{ backgroundColor: bead.color }}
                >
                  {bead.type === 'letter' && <span className="bead-letter-text">{bead.value}</span>}
                  {bead.type === 'charm' && <span className="bead-charm-icon">{bead.value}</span>}
                  {bead.type === 'color' && <span className="bead-hole-dot" />}
                </div>
              ))
            )}
          </div>
        </div>

        {celebrating && (
          <div className="bracelet-celebrate-toast">
            <span>✨ Wow! Your bracelet looks so gorgeous! Ready to wear! 💖</span>
          </div>
        )}
      </div>

      {/* Control Tools */}
      <div className="bracelet-controls-grid">
        {/* Colors Rack */}
        <div className="palette-section">
          <span className="palette-label">1. Pick Clay Heishi Colors:</span>
          <div className="color-dots-rack">
            {beadColors.map((b) => (
              <button
                key={b.name}
                type="button"
                className="color-dot-pick-btn"
                style={{ backgroundColor: b.color }}
                onClick={() => addColorBead(b.color)}
                title={`Add ${b.name} bead`}
              >
                <span className="dot-name">{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Charms Rack */}
        <div className="palette-section">
          <span className="palette-label">2. Add Cute Charms:</span>
          <div className="charms-rack">
            {charms.map((c) => (
              <button
                key={c.name}
                type="button"
                className="charm-pick-btn"
                onClick={() => addCharm(c.icon, c.color)}
              >
                <span>{c.icon}</span>
                <small>{c.name}</small>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Letter Beads */}
        <div className="palette-section letters-section">
          <span className="palette-label">3. Add Name / Word Beads:</span>
          <div className="letter-input-row">
            <input
              type="text"
              placeholder="e.g. BESTIE, BFF"
              maxLength={8}
              value={letterInput}
              onChange={(e) => setLetterInput(e.target.value)}
              className="letter-input-field"
            />
            <button type="button" className="primary-button add-letters-btn" onClick={handleAddLetters}>
              + Add Word
            </button>
          </div>
        </div>
      </div>

      <div className="bracelet-footer-actions">
        <div className="bead-count-tally">
          Total Beads: <strong>{beads.length}</strong>
        </div>
        <div className="bracelet-buttons-group">
          <button type="button" className="secondary-button" onClick={undoLast} disabled={beads.length === 0}>
            ↩ Undo
          </button>
          <button type="button" className="secondary-button" onClick={clearAll} disabled={beads.length === 0}>
            🗑️ Clear
          </button>
          <button type="button" className="primary-button wear-btn" onClick={handleWear} disabled={beads.length === 0}>
            📸 Wear Bracelet! ✨
          </button>
        </div>
      </div>
    </div>
  );
}
