'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sound } from '@/utils/soundEffects';

type DragonColor = 'fire' | 'matcha' | 'candy' | 'midnight' | 'gold';
type DragonHorns = 'spikes' | 'ram' | 'wings' | 'crown';
type DragonEye = 'anime' | 'fierce' | 'wink' | 'hearts';
type DragonBreath = 'fire' | 'rainbow' | 'ice' | 'bubble';

const colorThemes: Record<DragonColor, { name: string; upper: string; lower: string; mouth: string; label: string }> = {
  fire: { name: 'Fire Amber', upper: '#ff7043', lower: '#e64a19', mouth: '#d81b60', label: '🔥 Fire Amber' },
  matcha: { name: 'Forest Matcha', upper: '#81c784', lower: '#4caf50', mouth: '#ad1457', label: '🍵 Forest Matcha' },
  candy: { name: 'Cotton Candy', upper: '#f48fb1', lower: '#ec407a', mouth: '#c2185b', label: '🍬 Cotton Candy' },
  midnight: { name: 'Midnight Violet', upper: '#9575cd', lower: '#673ab7', mouth: '#880e4f', label: '🌌 Midnight Violet' },
  gold: { name: 'Sunbeam Gold', upper: '#ffd54f', lower: '#ffb300', mouth: '#d81b60', label: '☀️ Sunbeam Gold' },
};

const dragonPhrases = [
  'ROAAAAR! Welcome to The Craft Corner! 🐲',
  'Chomp chomp! Feed me cardstock and glitter! ✨',
  'Rawr! Did you find my brother Sparky hiding in the Shop menu? 👀',
  'Snap! Watch my paper jaws fold just like a real TikTok puppet! 📄',
  'Roooar! My scales were hand-creased with origami folds! 🎨',
  'Chomp! I guard the Rainbow Loom blind boxes! 🎁',
  'Fwoosh! Beware my colorful elemental dragon breath! 💨',
];

export default function DragonPuppetStudio() {
  const [colorTheme, setColorTheme] = useState<DragonColor>('fire');
  const [hornStyle, setHornStyle] = useState<DragonHorns>('spikes');
  const [eyeStyle, setEyeStyle] = useState<DragonEye>('anime');
  const [breathType, setBreathType] = useState<DragonBreath>('fire');
  const [isChomping, setIsChomping] = useState(false);
  const [roarsCount, setRoarsCount] = useState(0);
  const [speech, setSpeech] = useState('Click "Snap Jaws & Roar!" to watch my origami puppet chomp!');

  const activeTheme = colorThemes[colorTheme];

  const handleChompAndRoar = () => {
    sound.playDragonFireRoar();
    setIsChomping(true);
    setRoarsCount((c) => c + 1);

    const randomQuote = dragonPhrases[Math.floor(Math.random() * dragonPhrases.length)];
    setSpeech(randomQuote);

    setTimeout(() => {
      setIsChomping(false);
    }, 850);
  };

  return (
    <div className="mini-game-card dragon-game-card">
      <div className="game-card-header">
        <div className="game-title-group">
          <span className="game-badge">🐲 Mini Game 03</span>
          <h3>Articulated Paper Dragon Puppet Studio</h3>
          <p>
            An authentic TikTok-inspired foldable origami dragon puppet! Custom crease colors, horns, eyes, and fire breath. Tap to snap jaws and roar!
          </p>
        </div>

        <div className="squish-counter-badge">
          <span>Roars: <strong>{roarsCount}</strong> 🐲</span>
        </div>
      </div>

      <div className="dragon-stage-area">
        {/* Dragon Speech Cloud */}
        <div className="dragon-speech-cloud">
          <span className="speech-quote">💬</span>
          <p>{speech}</p>
        </div>

        {/* Origami Dragon Hand Puppet Apparatus */}
        <div className="dragon-puppet-stage-frame">
          <div className={`paper-puppet-dragon ${isChomping ? 'mouth-open' : 'mouth-closed'}`}>
            {/* Horns / Ears on Top of Head */}
            <div className="puppet-horns-layer">
              {hornStyle === 'spikes' && (
                <>
                  <span className="horn-item left">🔺</span>
                  <span className="horn-item right">🔺</span>
                </>
              )}
              {hornStyle === 'ram' && (
                <>
                  <span className="horn-item left">🐏</span>
                  <span className="horn-item right">🐏</span>
                </>
              )}
              {hornStyle === 'wings' && (
                <>
                  <span className="horn-item left">🪶</span>
                  <span className="horn-item right">🪶</span>
                </>
              )}
              {hornStyle === 'crown' && (
                <span className="horn-item center">👑</span>
              )}
            </div>

            {/* UPPER JAW / SNOUT */}
            <div
              className="puppet-upper-jaw"
              style={{ backgroundColor: activeTheme.upper }}
            >
              <div className="puppet-paper-creases" />

              {/* Eyes */}
              <div className="puppet-eye-cluster">
                <div className="puppet-eye left">
                  {eyeStyle === 'anime' && '✨👁️✨'}
                  {eyeStyle === 'fierce' && '🔥👁️🔥'}
                  {eyeStyle === 'wink' && '😉⭐'}
                  {eyeStyle === 'hearts' && '😍💖'}
                </div>
                <div className="puppet-eye right">
                  {eyeStyle === 'anime' && '✨👁️✨'}
                  {eyeStyle === 'fierce' && '🔥👁️🔥'}
                  {eyeStyle === 'wink' && '⭐👁️'}
                  {eyeStyle === 'hearts' && '😍💖'}
                </div>
              </div>

              {/* Nostrils & Snout Tip */}
              <div className="puppet-snout-tip">
                <span className="puppet-nostril">●</span>
                <span className="puppet-nostril">●</span>
              </div>

              {/* Upper Teeth Row */}
              <div className="puppet-teeth upper">
                <span>▲</span><span>▲</span><span>▲</span><span>▲</span><span>▲</span>
              </div>
            </div>

            {/* MOUTH INTERIOR CAVITY (Revealed when chomping) */}
            <div
              className="puppet-mouth-cavity"
              style={{ backgroundColor: activeTheme.mouth }}
            >
              {/* Pink Foldable Origami Tongue */}
              <div className="puppet-origami-tongue">
                <span>👅</span>
              </div>

              {/* Breath FX Particles */}
              {isChomping && (
                <div className="puppet-breath-stream">
                  {breathType === 'fire' && (
                    <span className="breath-particles blast-fire">
                      🔥🔥🔥 WHOOSH! INFERNO! 🔥🔥🔥
                    </span>
                  )}
                  {breathType === 'rainbow' && (
                    <span className="breath-particles blast-rainbow">
                      ✨🌈✨ RAINBOW SPARKLE! ✨🌈✨
                    </span>
                  )}
                  {breathType === 'ice' && (
                    <span className="breath-particles blast-ice">
                      ❄️🧊❄️ BLIZZARD CHILL! ❄️🧊❄️
                    </span>
                  )}
                  {breathType === 'bubble' && (
                    <span className="breath-particles blast-bubble">
                      🫧🫧🫧 POPPING BUBBLES! 🫧🫧🫧
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* LOWER JAW */}
            <div
              className="puppet-lower-jaw"
              style={{ backgroundColor: activeTheme.lower }}
            >
              {/* Lower Teeth Row */}
              <div className="puppet-teeth lower">
                <span>▼</span><span>▼</span><span>▼</span><span>▼</span><span>▼</span>
              </div>

              {/* Chin Paper Crease */}
              <div className="puppet-chin-handle">
                <span className="chin-crease-line">Hand Grip Crease ✋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Snap Jaws Action Button */}
        <div className="dragon-action-bar">
          <button
            type="button"
            className="primary-button snap-roar-btn"
            onClick={handleChompAndRoar}
          >
            🐲 SNAP JAWS &amp; ROAR! 🐾
          </button>
        </div>
      </div>

      {/* Dragon Customization Selectors */}
      <div className="dragon-customizer-grid">
        {/* 1. Scale Colors */}
        <div className="custom-section">
          <span className="custom-label">1. Cardstock Scale Colors:</span>
          <div className="picker-buttons-row">
            {(Object.keys(colorThemes) as DragonColor[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`dragon-color-btn ${colorTheme === key ? 'active' : ''}`}
                onClick={() => {
                  sound.playClick();
                  setColorTheme(key);
                }}
              >
                {colorThemes[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Horns Style */}
        <div className="custom-section">
          <span className="custom-label">2. Origami Horns &amp; Accessories:</span>
          <div className="picker-buttons-row">
            <button
              type="button"
              className={`dragon-opt-btn ${hornStyle === 'spikes' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setHornStyle('spikes');
              }}
            >
              🔺 Cardstock Spikes
            </button>
            <button
              type="button"
              className={`dragon-opt-btn ${hornStyle === 'ram' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setHornStyle('ram');
              }}
            >
              🐏 Ram Horns
            </button>
            <button
              type="button"
              className={`dragon-opt-btn ${hornStyle === 'wings' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setHornStyle('wings');
              }}
            >
              🪶 Feather Wings
            </button>
            <button
              type="button"
              className={`dragon-opt-btn ${hornStyle === 'crown' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setHornStyle('crown');
              }}
            >
              👑 Royal Crown
            </button>
          </div>
        </div>

        {/* 3. Eye Expressions */}
        <div className="custom-section">
          <span className="custom-label">3. Anime Eyes &amp; Expression:</span>
          <div className="picker-buttons-row">
            <button
              type="button"
              className={`dragon-opt-btn ${eyeStyle === 'anime' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setEyeStyle('anime');
              }}
            >
              ✨ Anime Stars
            </button>
            <button
              type="button"
              className={`dragon-opt-btn ${eyeStyle === 'fierce' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setEyeStyle('fierce');
              }}
            >
              🔥 Fierce Dragon
            </button>
            <button
              type="button"
              className={`dragon-opt-btn ${eyeStyle === 'wink' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setEyeStyle('wink');
              }}
            >
              😉 Playful Wink
            </button>
            <button
              type="button"
              className={`dragon-opt-btn ${eyeStyle === 'hearts' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setEyeStyle('hearts');
              }}
            >
              😍 Heart Eyes
            </button>
          </div>
        </div>

        {/* 4. Breath Attack */}
        <div className="custom-section">
          <span className="custom-label">4. Dragon Elemental Breath:</span>
          <div className="picker-buttons-row">
            <button
              type="button"
              className={`dragon-opt-btn ${breathType === 'fire' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setBreathType('fire');
              }}
            >
              🔥 Inferno Blast
            </button>
            <button
              type="button"
              className={`dragon-opt-btn ${breathType === 'rainbow' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setBreathType('rainbow');
              }}
            >
              🌈 Rainbow Sparkle
            </button>
            <button
              type="button"
              className={`dragon-opt-btn ${breathType === 'ice' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setBreathType('ice');
              }}
            >
              ❄️ Frost Blizzard
            </button>
            <button
              type="button"
              className={`dragon-opt-btn ${breathType === 'bubble' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setBreathType('bubble');
              }}
            >
              🫧 Bubble Stream
            </button>
          </div>
        </div>
      </div>

      {/* Link to Buy Puppet in Shop */}
      <div className="puppet-store-card">
        <span>Want a real handmade wearable paper hand dragon puppet shipped to you?</span>
        <Link href="/shop?category=clickers" className="puppet-shop-btn">
          Order Dragon Puppet ($16.00) 🐲 →
        </Link>
      </div>
    </div>
  );
}
