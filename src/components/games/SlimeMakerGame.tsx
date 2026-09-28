'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { sound } from '@/utils/soundEffects';

type GlueBase = 'clear' | 'white' | 'butter' | 'marshmallow';
type ColorDye = 'pink' | 'blue' | 'matcha' | 'gold' | 'purple';
type ToppingType = 'jelly-cubes' | 'boba-pearls' | 'sprinkles' | 'fruit-slices' | 'marshmallow-fluff';

const glueBases: Record<GlueBase, { name: string; desc: string; color: string; icon: string }> = {
  clear: { name: 'Clear Crystal Glue', desc: 'Ultra-glossy & glassy finish', color: '#e0f7fa', icon: '💎' },
  white: { name: 'Fluffy White Glue', desc: 'Super thick, soft & clicky', color: '#ffffff', icon: '🥛' },
  butter: { name: 'Daiso Butter Clay Base', desc: 'Creamy, matte & spreadable', color: '#fcf2dc', icon: '🧈' },
  marshmallow: { name: 'Marshmallow Fluff Base', desc: 'Whipped, airy & marshmallow puffy', color: '#fff0f5', icon: '🍦' },
};

const colorDyes: Record<ColorDye, { name: string; hex: string; emoji: string }> = {
  pink: { name: 'Strawberry Berry', hex: '#ff80aa', emoji: '🍓' },
  blue: { name: 'Ocean Aqua', hex: '#66d9ff', emoji: '🌊' },
  matcha: { name: 'Matcha Forest', hex: '#99d98c', emoji: '🍵' },
  gold: { name: 'Golden Honey', hex: '#ffd166', emoji: '🍯' },
  purple: { name: 'Taro Blossom', hex: '#c77dff', emoji: '💜' },
};

const toppingOptions: Record<ToppingType, { name: string; emoji: string }> = {
  'jelly-cubes': { name: 'Melamine Jelly Cubes (JC)', emoji: '🧊' },
  'boba-pearls': { name: 'Chewy Boba Pearls', emoji: '🧋' },
  sprinkles: { name: 'Rainbow Sparkle Glitter', emoji: '✨' },
  'fruit-slices': { name: 'Fimo Fruit Slices', emoji: '🍓' },
  'marshmallow-fluff': { name: 'Marshmallow Fluff Dollop (Berry & Original)', emoji: '🍦' },
};

export default function SlimeMakerGame() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedBase, setSelectedBase] = useState<GlueBase>('white');
  const [selectedColor, setSelectedColor] = useState<ColorDye>('pink');
  const [selectedToppings, setSelectedToppings] = useState<ToppingType[]>(['jelly-cubes']);
  
  // Stirring & Mixing state
  const [activatorDrops, setActivatorDrops] = useState(0);
  const [stirProgress, setStirProgress] = useState(0);
  const [isStirring, setIsStirring] = useState(false);
  const [spoonAngle, setSpoonAngle] = useState(0);

  // Play & Poke state
  const [pokeDents, setPokeDents] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isStretched, setIsStretched] = useState(false);
  const [bubblePopsCount, setBubblePopsCount] = useState(0);

  const bowlRef = useRef<HTMLDivElement>(null);

  const handlePickBase = (b: GlueBase) => {
    sound.playPourGlue();
    setSelectedBase(b);
  };

  const handlePickColor = (c: ColorDye) => {
    sound.playBeadChime();
    setSelectedColor(c);
  };

  const handleToggleTopping = (t: ToppingType) => {
    sound.playDiverseSquish('plop');
    setSelectedToppings((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const handleAddActivator = () => {
    sound.playPourGlue();
    setActivatorDrops((d) => Math.min(5, d + 1));
  };

  const handleStirClick = () => {
    sound.playStirSlime();
    setIsStirring(true);
    setSpoonAngle((prev) => prev + 45);
    setStirProgress((p) => {
      const next = Math.min(100, p + 14);
      if (next >= 100) {
        sound.playFanfare();
        setTimeout(() => setCurrentStep(5), 600);
      }
      return next;
    });
    setTimeout(() => setIsStirring(false), 200);
  };

  const handlePokeSlime = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bowlRef.current) return;
    const rect = bowlRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    sound.playDiverseSquish(Math.random() > 0.5 ? 'wet' : 'plop');
    setBubblePopsCount((c) => c + 1);

    const newDent = { id: Date.now() + Math.random(), x, y };
    setPokeDents((prev) => [...prev.slice(-12), newDent]);
  };

  const handleStretchSlime = () => {
    sound.playDiverseSquish('jelly');
    setIsStretched(true);
    setTimeout(() => {
      sound.playDiverseSquish('crunch');
      setIsStretched(false);
    }, 1200);
  };

  const handleResetSlime = () => {
    sound.playClick();
    setCurrentStep(1);
    setActivatorDrops(0);
    setStirProgress(0);
    setPokeDents([]);
    setIsStretched(false);
  };

  return (
    <div className="mini-game-card slime-maker-game-card">
      <div className="game-card-header">
        <div className="game-title-group">
          <span className="game-badge">🥣 Activity 02</span>
          <h3>DIY Slime-Making Studio</h3>
          <p>
            Choose your glue base, swirl vibrant color dyes, drop tactile mix-ins, pour activator, stir until stretchy, then poke and pop your custom handmade studio slime!
          </p>
        </div>

        {currentStep === 5 && (
          <div className="squish-counter-badge">
            <span>Bubble Pops: <strong>{bubblePopsCount}</strong> 🫧</span>
          </div>
        )}
      </div>

      {/* Stepper Tabs */}
      <div className="slime-maker-steps-bar" role="tablist">
        <button
          type="button"
          className={`slime-step-btn ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <span>1</span>
          <small>Glue Base</small>
        </button>
        <button
          type="button"
          className={`slime-step-btn ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(2)}
        >
          <span>2</span>
          <small>Color Dye</small>
        </button>
        <button
          type="button"
          className={`slime-step-btn ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(3)}
        >
          <span>3</span>
          <small>Mix-ins</small>
        </button>
        <button
          type="button"
          className={`slime-step-btn ${currentStep === 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(4)}
        >
          <span>4</span>
          <small>Stir &amp; Activate</small>
        </button>
        <button
          type="button"
          className={`slime-step-btn ${currentStep === 5 ? 'active' : ''}`}
          onClick={() => setCurrentStep(5)}
        >
          <span>5</span>
          <small>Poke &amp; Squish!</small>
        </button>
      </div>

      {/* Main Interactive Bowl Workstation */}
      <div className="slime-workstation-arena">
        <div className="slime-bowl-outer-frame">
          <div
            ref={bowlRef}
            className={`slime-mixing-bowl base-${selectedBase} ${isStretched ? 'stretched-bubble' : ''}`}
            onClick={currentStep === 5 ? handlePokeSlime : undefined}
            style={{
              backgroundColor: colorDyes[selectedColor].hex,
              boxShadow: `0 16px 36px ${colorDyes[selectedColor].hex}60`,
            }}
          >
            {/* Swirl Gloss Sheen */}
            <div className="slime-gloss-highlight" />

            {/* Toppings in bowl */}
            <div className="slime-floating-toppings">
              {selectedToppings.includes('jelly-cubes') && (
                <>
                  <span className="jelly-cube-particle jc-1">🧊</span>
                  <span className="jelly-cube-particle jc-2">🧊</span>
                  <span className="jelly-cube-particle jc-3">🧊</span>
                </>
              )}
              {selectedToppings.includes('boba-pearls') && (
                <>
                  <span className="boba-particle b-1">⚫</span>
                  <span className="boba-particle b-2">⚫</span>
                  <span className="boba-particle b-3">⚫</span>
                </>
              )}
              {selectedToppings.includes('sprinkles') && (
                <>
                  <span className="sprinkle-particle s-1">✨</span>
                  <span className="sprinkle-particle s-2">⭐</span>
                  <span className="sprinkle-particle s-3">✨</span>
                </>
              )}
              {selectedToppings.includes('fruit-slices') && (
                <>
                  <span className="fruit-slice-particle f-1">🍓</span>
                  <span className="fruit-slice-particle f-2">🍉</span>
                  <span className="fruit-slice-particle f-3">🥝</span>
                </>
              )}
              {selectedToppings.includes('marshmallow-fluff') && (
                <>
                  <span className="marshmallow-particle m-1">🍦</span>
                  <span className="marshmallow-particle m-2">🍓</span>
                  <span className="marshmallow-particle m-3">🫐</span>
                </>
              )}
            </div>

            {/* Poke Dents from squishing */}
            {currentStep === 5 &&
              pokeDents.map((dent) => (
                <div
                  key={dent.id}
                  className="slime-poke-dent"
                  style={{ left: `${dent.x}px`, top: `${dent.y}px` }}
                >
                  <span className="dent-bubble-ring">🫧</span>
                </div>
              ))}

            {/* Stirring Spoon Animation */}
            {currentStep === 4 && (
              <div
                className={`slime-stirring-spoon ${isStirring ? 'spinning' : ''}`}
                style={{ transform: `rotate(${spoonAngle}deg)` }}
                onClick={handleStirClick}
              >
                🥄
              </div>
            )}

            {/* Step 5 Finish Floating Badge */}
            {currentStep === 5 && isStretched && (
              <div className="giant-stretch-balloon">
                <span>💨 WHOOSH! Giant Slime Bubble! 💨</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Controls based on current step */}
        <div className="slime-controls-panel">
          {/* STEP 1: GLUE BASE */}
          {currentStep === 1 && (
            <div className="step-options-container">
              <h4>1. Choose Your Slime Glue Base</h4>
              <div className="step-cards-grid">
                {(Object.keys(glueBases) as GlueBase[]).map((key) => {
                  const b = glueBases[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`step-choice-card ${selectedBase === key ? 'selected' : ''}`}
                      onClick={() => handlePickBase(key)}
                    >
                      <span className="card-choice-icon">{b.icon}</span>
                      <strong>{b.name}</strong>
                      <small>{b.desc}</small>
                    </button>
                  );
                })}
              </div>
              <div className="step-action-bar">
                <button
                  type="button"
                  className="primary-button step-next-btn"
                  onClick={() => setCurrentStep(2)}
                >
                  Next: Pick Color Dye 🎨 →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COLOR DYE */}
          {currentStep === 2 && (
            <div className="step-options-container">
              <h4>2. Add Scented Liquid Color Dye</h4>
              <div className="color-dye-swatches-row">
                {(Object.keys(colorDyes) as ColorDye[]).map((key) => {
                  const c = colorDyes[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`color-swatch-btn ${selectedColor === key ? 'selected' : ''}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => handlePickColor(key)}
                    >
                      <span className="swatch-emoji">{c.emoji}</span>
                      <span className="swatch-name">{c.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="step-action-bar">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCurrentStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="primary-button step-next-btn"
                  onClick={() => setCurrentStep(3)}
                >
                  Next: Add Mix-in Charms 🧊 →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: MIX-IN TOPPINGS */}
          {currentStep === 3 && (
            <div className="step-options-container">
              <h4>3. Select Tactile Mix-in Add-ins</h4>
              <div className="step-cards-grid">
                {(Object.keys(toppingOptions) as ToppingType[]).map((key) => {
                  const t = toppingOptions[key];
                  const hasIt = selectedToppings.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`step-choice-card ${hasIt ? 'selected' : ''}`}
                      onClick={() => handleToggleTopping(key)}
                    >
                      <span className="card-choice-icon">{t.emoji}</span>
                      <strong>{t.name}</strong>
                      <small>{hasIt ? '✓ Added in Bowl' : '+ Tap to add'}</small>
                    </button>
                  );
                })}
              </div>
              <div className="step-action-bar">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCurrentStep(2)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="primary-button step-next-btn"
                  onClick={() => setCurrentStep(4)}
                >
                  Next: Activate &amp; Stir 🥄 →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ACTIVATOR & STIR */}
          {currentStep === 4 && (
            <div className="step-options-container">
              <h4>4. Add Activator &amp; Stir Fast!</h4>
              <p className="step-hint">
                Add activator drops to thicken the glue, then click the stirring spoon to mix until 100%!
              </p>

              <div className="activator-controls-box">
                <div className="activator-meter-row">
                  <span>Activator Drops: <strong>{activatorDrops} / 5</strong></span>
                  <button
                    type="button"
                    className="secondary-button add-activator-btn"
                    onClick={handleAddActivator}
                  >
                    💧 Add Activator Drop
                  </button>
                </div>

                <div className="stir-meter-container">
                  <div className="stir-meter-header">
                    <span>Slime Cohesion &amp; Thickness:</span>
                    <strong>{stirProgress}%</strong>
                  </div>
                  <div className="stir-progress-track">
                    <div
                      className="stir-progress-fill"
                      style={{ width: `${stirProgress}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="primary-button stir-giant-btn"
                  onClick={handleStirClick}
                >
                  🥄 Stir the Bowl! (Click repeatedly!)
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: POKE & SQUISH READY SLIME */}
          {currentStep === 5 && (
            <div className="step-options-container finish-container">
              <div className="finish-banner-tag">
                🎉 Slime Activated &amp; Ready!
              </div>
              <h4>Tap Anywhere on the Slime Bowl to Poke &amp; Pop!</h4>
              <p className="finish-desc">
                Your custom <strong>{glueBases[selectedBase].name}</strong> with{' '}
                <strong>{colorDyes[selectedColor].name}</strong> (pure handmade formula) is super stretchy!
              </p>

              <div className="finish-actions-row">
                <button
                  type="button"
                  className="primary-button stretch-btn"
                  onClick={handleStretchSlime}
                >
                  💨 Pull Giant Bubble Stretch!
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleResetSlime}
                >
                  🥣 Mix Another Slime
                </button>
              </div>

              <div className="slimeshop-invite-box">
                <span>Want real handmade slimes with jelly cubes &amp; boba delivered to you?</span>
                <Link href="/slimetea" className="teleport-link-btn">
                  Visit SlimeTea Bar 🧋 →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
