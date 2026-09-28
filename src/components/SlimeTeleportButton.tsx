'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sound } from '@/utils/soundEffects';

export default function SlimeTeleportButton() {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isTeleporting, setIsTeleporting] = useState(false);

  const handleInitialClick = () => {
    sound.playSlimeSplat();
    setIsConfirming(true);
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  const handleConfirmTeleport = () => {
    setIsConfirming(false);
    setIsTeleporting(true);
    sound.playTeleportWarp();

    // After 1.8 seconds of slimy vortex warp, route to /slimetea
    setTimeout(() => {
      sound.playSlimeSplat();
      router.push('/slimetea');
    }, 1800);
  };

  return (
    <>
      {/* Prominent Slimy Button on Top */}
      <div className="slimy-button-container">
        <button
          type="button"
          className="slimy-teleport-button"
          onClick={handleInitialClick}
          aria-label="Teleport to SlimeTea Boba and Slime Bar"
        >
          {/* Animated dripping slime top cap */}
          <span className="slime-drip-cap" aria-hidden="true">
            <span className="slime-drip drip-1"></span>
            <span className="slime-drip drip-2"></span>
            <span className="slime-drip drip-3"></span>
            <span className="slime-drip drip-4"></span>
          </span>

          <span className="slime-btn-sparkle">✨ 🫧</span>
          <span className="slime-btn-text">
            <strong>🌀 Teleport to SlimeTea</strong>
            <small>(Boba &amp; Slime Bar)</small>
          </span>
          <span className="slime-btn-icon">🧋 💚</span>
        </button>
      </div>

      {/* Confirmation Modal: "Are you sure? (It gets slimy...)" */}
      {isConfirming && (
        <div className="slime-modal-overlay" onClick={handleCancel}>
          <div className="slime-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Dripping slime header border */}
            <div className="slime-dialog-drips" aria-hidden="true">
              <div className="drip-drop d1"></div>
              <div className="drip-drop d2"></div>
              <div className="drip-drop d3"></div>
              <div className="drip-drop d4"></div>
              <div className="drip-drop d5"></div>
            </div>

            <div className="slime-confirm-header">
              <span className="slime-warning-emoji">⚠️ 🫧 💚</span>
              <h2>Are you sure?</h2>
              <span className="slime-warning-pill">(It gets slimy...)</span>
            </div>

            <p className="slime-confirm-desc">
              You are about to enter the <strong>Slime Vortex</strong>!
              <br />
              Warning: Extreme squishiness, flying tapioca boba pearls, and tactile jelly cube slimes ahead. Do you dare step through the portal?
            </p>

            <div className="slime-confirm-actions">
              <button
                type="button"
                className="slime-yes-button"
                onClick={handleConfirmTeleport}
              >
                Yes! Slime Me &amp; Teleport! 🌀
              </button>
              <button
                type="button"
                className="slime-no-button"
                onClick={handleCancel}
              >
                Wait, not yet! 🏃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Slime Teleportation Warp Sequence */}
      {isTeleporting && (
        <div className="slime-teleport-warp-screen" aria-live="assertive">
          <div className="warp-vortex-bg"></div>
          <div className="warp-floating-elements">
            <span className="warp-bubble b1">🫧</span>
            <span className="warp-bubble b2">🧋</span>
            <span className="warp-bubble b3">🍉</span>
            <span className="warp-bubble b4">✨</span>
            <span className="warp-bubble b5">🍡</span>
            <span className="warp-bubble b6">🥑</span>
          </div>

          <div className="warp-content-center">
            <div className="warp-spinner-ring"></div>
            <h1 className="warp-title">🌀 TELEPORTING TO SLIMETEA...</h1>
            <p className="warp-subtitle">Warping through squishy jelly cubes &amp; boba foam!</p>
            <div className="warp-splat-badge">SPLAT! 🫧</div>
          </div>
        </div>
      )}
    </>
  );
}
