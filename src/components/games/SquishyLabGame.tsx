'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sound } from '@/utils/soundEffects';

type SquishyModel = 'cat' | 'panda' | 'croissant' | 'donut' | 'dragon' | 'bear';

type SquishyConfig = {
  name: string;
  emoji: string;
  scent: string;
  accent: string;
  soundType: 'squeak' | 'jelly' | 'crunch' | 'wet' | 'boing' | 'plop';
  rarity: 'Common' | 'Rare' | 'Secret Rare';
  series: string;
};

const squishyOptions: Record<SquishyModel, SquishyConfig> = {
  cat: {
    name: 'Mochi Peach Kitten',
    emoji: '🐱',
    scent: 'Sweet White Peach 🍑',
    accent: '#f7b7a3',
    soundType: 'squeak',
    rarity: 'Common',
    series: 'Animal Blind Box',
  },
  panda: {
    name: 'Matcha Boba Panda',
    emoji: '🐼',
    scent: 'Uji Matcha Green Tea 🍵',
    accent: '#a3d9a5',
    soundType: 'jelly',
    rarity: 'Rare',
    series: 'Animal Blind Box',
  },
  croissant: {
    name: 'Golden Brioche Croissant',
    emoji: '🥐',
    scent: 'Warm Vanilla Butter 🧈',
    accent: '#f7d08a',
    soundType: 'crunch',
    rarity: 'Common',
    series: 'Bakery Blind Box',
  },
  donut: {
    name: 'Berry Glaze Donut',
    emoji: '🍩',
    scent: 'Strawberry Sugar 🍓',
    accent: '#e8a5c8',
    soundType: 'wet',
    rarity: 'Common',
    series: 'Bakery Blind Box',
  },
  dragon: {
    name: 'Baby Sparky Wyrmling',
    emoji: '🐲',
    scent: 'Cinnamon Ember Spark ⚡',
    accent: '#ff9f43',
    soundType: 'boing',
    rarity: 'Secret Rare',
    series: 'Dragon Blind Box',
  },
  bear: {
    name: 'Galaxy Cosmic Bear',
    emoji: '🧸',
    scent: 'Blueberry Nebula 🫐',
    accent: '#bfa3d9',
    soundType: 'plop',
    rarity: 'Rare',
    series: 'Animal Blind Box',
  },
};

export default function SquishyLabGame() {
  const [model, setModel] = useState<SquishyModel>('cat');
  const [squishing, setSquishing] = useState(false);
  const [slowRising, setSlowRising] = useState(false);
  const [squishCount, setSquishCount] = useState(0);
  const [unboxMessage, setUnboxMessage] = useState<string | null>(null);

  const active = squishyOptions[model];

  const handleSquishStart = () => {
    // Unique sound per squishy model!
    sound.playDiverseSquish(active.soundType);
    setSquishing(true);
    setSlowRising(false);
    setSquishCount((c) => c + 1);
  };

  const handleSquishEnd = () => {
    setSquishing(false);
    setSlowRising(true);
    setTimeout(() => {
      setSlowRising(false);
    }, 1800);
  };

  const handleUnboxBlindBox = () => {
    sound.playFanfare();
    const keys = Object.keys(squishyOptions) as SquishyModel[];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    setModel(randomKey);
    const item = squishyOptions[randomKey];
    setUnboxMessage(`🎉 UNBOXED: ${item.name} (${item.rarity})!`);
    setTimeout(() => setUnboxMessage(null), 3500);
  };

  return (
    <div className="mini-game-card squishy-game-card">
      <div className="game-card-header">
        <div className="game-title-group">
          <span className="game-badge">🍡 Activity 03</span>
          <h3>Squishy Blind Box Squeeze Lab</h3>
          <p>
            Each mystery squishy makes its own unique tactile sound (squeaks, plops, jelly wobbles, boings, and crunches)! Press &amp; hold to squeeze flat!
          </p>
        </div>

        <div className="squish-counter-badge">
          <span>Squishes: <strong>{squishCount}</strong></span>
        </div>
      </div>

      {unboxMessage && (
        <div className="blindbox-unbox-banner" role="alert">
          <span>{unboxMessage}</span>
        </div>
      )}

      <div className="squishy-arena">
        {/* Squishy Model Selectors + Blind Box Unbox Button */}
        <div className="squishy-selector-row">
          <button
            type="button"
            className="blindbox-surprise-btn"
            onClick={handleUnboxBlindBox}
            title="Unbox a random surprise squishy blind box"
          >
            <span>🎁</span>
            <small>Surprise Unbox!</small>
          </button>

          {(Object.keys(squishyOptions) as SquishyModel[]).map((key) => {
            const item = squishyOptions[key];
            return (
              <button
                key={key}
                type="button"
                className={`squishy-pick-tab ${model === key ? 'active' : ''}`}
                onClick={() => setModel(key)}
              >
                <span>{item.emoji}</span>
                <small>{item.name}</small>
              </button>
            );
          })}
        </div>

        {/* Interactive Squishy Stage */}
        <div className="squishy-stage">
          <div
            className={`squishy-target-figure ${squishing ? 'squished' : ''} ${slowRising ? 'slow-rising' : ''}`}
            onMouseDown={handleSquishStart}
            onMouseUp={handleSquishEnd}
            onTouchStart={handleSquishStart}
            onTouchEnd={handleSquishEnd}
            role="button"
            tabIndex={0}
            aria-label={`Squish the ${active.name}`}
            style={{ backgroundColor: active.accent }}
          >
            <span className="squishy-face-icon">{active.emoji}</span>
            <div className="squishy-blush-dots">
              <span className="blush-left">🌸</span>
              <span className="blush-right">🌸</span>
            </div>

            {squishing && (
              <span className="squish-squish-particles">
                {active.soundType === 'squeak' && '🎶 SQUEAAAK! 🎶'}
                {active.soundType === 'jelly' && '🌊 JELLY WOBBLE! 🌊'}
                {active.soundType === 'crunch' && '🥐 CRUNCHY SQUISH! 🥐'}
                {active.soundType === 'wet' && '💦 WET SQUELCH! 💦'}
                {active.soundType === 'boing' && '⚡ BOING POP! ⚡'}
                {active.soundType === 'plop' && '🫧 PLOP POP! 🫧'}
              </span>
            )}
            {slowRising && <span className="squish-squish-particles">✨ Slow Rising... ✨</span>}
          </div>

          <span className="squish-hint-text">
            {squishing
              ? 'Squishing flat!! 🐾'
              : slowRising
              ? 'Rising back slowly... ⏳'
              : 'Press & Hold to Squeeze! 🖐️'}
          </span>
        </div>

        {/* Scent, Sound & Blind Box Series Stats */}
        <div className="squishy-stats-bar">
          <div className="scent-tag">
            <span>Scent Profile:</span>
            <strong>{active.scent}</strong>
          </div>
          <div className="rebound-tag">
            <span>Sound Effect:</span>
            <strong>
              {active.soundType === 'squeak' && 'High-Pitch Squeak'}
              {active.soundType === 'jelly' && 'Resonant Jelly Wobble'}
              {active.soundType === 'crunch' && 'Crisp Bakery Crunch'}
              {active.soundType === 'wet' && 'Wet Squelch Pop'}
              {active.soundType === 'boing' && 'Springy Boing'}
              {active.soundType === 'plop' && 'Deep Squelch Plop'}
            </strong>
          </div>
          <div className="blindbox-tag">
            <span>Blind Box Series:</span>
            <strong>{active.series} ({active.rarity})</strong>
          </div>
        </div>

        {/* Link to Shop Blind Box Section */}
        <div className="squishy-shop-link-row">
          <span>Love mystery collectibles? Order real Squishy Blind Boxes in our shop:</span>
          <Link href="/shop?category=blind-boxes" className="squishy-shop-cta-link">
            Shop Blind Box Section 🎁 →
          </Link>
        </div>
      </div>
    </div>
  );
}
