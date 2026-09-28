'use client';

import Link from 'next/link';
import BraceletMakerGame from '@/components/games/BraceletMakerGame';
import SlimeMakerGame from '@/components/games/SlimeMakerGame';
import SquishyLabGame from '@/components/games/SquishyLabGame';
import HiddenPal from '@/components/HiddenPal';

export default function MiniGamesPage() {
  return (
    <div className="home-container">
      {/* Gentle Studio Activities Banner */}
      <section className="hero cute-arcade-hero minigames-arcade-hero">
        <div className="hero-content">
          <div className="hero-badge cute-badge">
            <span className="badge-spark">🎨</span>
            <span>Craft Corner Studio</span>
          </div>

          <h1 className="hero-headline home-main-title">
            Craft &amp; DIY Activities
          </h1>

          <p className="hero-description home-main-desc">
            Explore our interactive DIY craft tables! String custom clay bead bracelets, mix &amp; poke handmade slimes, and squish soft tactile toys.
          </p>

          <div className="quick-games-nav" aria-label="Activities Jump Navigation">
            <a href="#game-bracelets" className="game-nav-pill">
              <span>📿</span>
              <strong>Bracelet Studio</strong>
            </a>
            <a href="#game-slime-maker" className="game-nav-pill">
              <span>🥣</span>
              <strong>DIY Slime Maker</strong>
            </a>
            <a href="#game-squishy" className="game-nav-pill">
              <span>🍡</span>
              <strong>Squishy Lab</strong>
            </a>
            <Link href="/slimetea" className="game-nav-pill slime-game-pill">
              <span>🧋</span>
              <strong>SlimeTea Bar</strong>
            </Link>
          </div>
        </div>
      </section>

      {/* ALL DIY CRAFT ACTIVITIES */}
      <section className="games-arcade-wrapper">
        {/* Activity 1: Clay Bead Bracelet Maker */}
        <section id="game-bracelets" className="game-section-anchor">
          <div className="game-wrapper-with-pal">
            <BraceletMakerGame />
          </div>
        </section>

        {/* Activity 2: DIY Slime-Making Game */}
        <section id="game-slime-maker" className="game-section-anchor">
          <SlimeMakerGame />
        </section>

        {/* Activity 3: Mochi Squishy Squeeze Lab */}
        <section id="game-squishy" className="game-section-anchor">
          <div className="game-wrapper-with-pal">
            <SquishyLabGame />
            {/* Hidden Pal #4: Mochi the Kitty - Hiding by the squishies! */}
            <div style={{ position: 'absolute', bottom: '16px', right: '18px' }}>
              <HiddenPal palId="mochi" customClass="game-mochi-pal" />
            </div>
          </div>
        </section>
      </section>

      {/* Gentle Return Banner */}
      <section className="promo-banner cute-arcade-banner">
        <div className="promo-copy">
          <span className="section-eyebrow">🐾 Sneaky Pals Quest</span>
          <h2>Search for all 5 Hidden Pals across the Store!</h2>
          <p>
            Track down Sparky, Pip, Boba, Mochi, and Cookie the Bear on different pages to complete your Crafter Checklist!
          </p>
        </div>
        <Link href="/" className="primary-button promo-cta">
          Back to Home Page 🏡
        </Link>
      </section>
    </div>
  );
}

