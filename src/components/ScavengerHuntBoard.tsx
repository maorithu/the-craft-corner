'use client';

import { useHunt } from '@/context/HuntContext';
import { huntCharacters } from '@/data/characters';

export default function ScavengerHuntBoard() {
  const { foundIds, totalPals, allFound, isFound, resetHunt, questOpen, setQuestOpen, findCharacter } = useHunt();

  return (
    <>
      {/* Homepage Quest Board Section */}
      <section id="scavenger-hunt" className="section-block scavenger-hunt-section">
        <div className="scavenger-hunt-card compact-hunt-card">
          <div className="scavenger-hunt-header">
            <div className="hunt-title-group">
              <span className="section-eyebrow">🌸 Tiny Studio Pals</span>
              <h2>Little hidden pals around the shop</h2>
              <p className="scavenger-hunt-subtitle">
                A few tiny craft mascots are tucked into corners around the site for a fun little scavenger challenge.
              </p>
            </div>

            <div className="hunt-score-badge small-hunt-badge">
              <span className="hunt-score-icon">🏆</span>
              <div className="hunt-score-text">
                <span className="hunt-score-num">{foundIds.length} / {totalPals}</span>
                <span className="hunt-score-label">Pals Found</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="hunt-progress-bar-wrap">
            <div
              className="hunt-progress-fill"
              style={{ width: `${(foundIds.length / totalPals) * 100}%` }}
            />
          </div>

          {/* All Found Celebration */}
          {allFound && (
            <div className="hunt-all-found-celebration compact-celebration">
              <span className="celebration-spark">🎉</span>
              <h3>All 5 pals found!</h3>
              <button type="button" className="secondary-button reset-hunt-btn" onClick={resetHunt}>
                Reset Hunt 🔄
              </button>
            </div>
          )}

          {/* The 5 Characters Checklist */}
          <div className="hunt-checklist-grid compact-checklist-grid">
            {huntCharacters.map((char) => {
              const found = isFound(char.id);

              return (
                <div
                  key={char.id}
                  className={`hunt-character-card ${found ? 'found' : 'not-found'} compact-card`}
                  onClick={() => {
                    if (found) {
                      findCharacter(char);
                    }
                  }}
                >
                  <div className="char-card-header">
                    <span className="char-emoji-large">{char.emoji}</span>
                    <span className={`char-status-pill ${found ? 'pill-found' : 'pill-hiding'}`}>
                      {found ? '⭐ Found' : '👀 Hiding'}
                    </span>
                  </div>

                  <h4>{char.name}</h4>
                  <span className="char-nickname">{char.nickname}</span>

                  <div className="char-clue-box">
                    <strong>Clue:</strong>
                    <p>{char.clue}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Floating Quest Tracker in the bottom corner */}
      <aside className="floating-quest-tracker">
        <button
          type="button"
          className="quest-bubble-btn"
          onClick={() => setQuestOpen(!questOpen)}
          aria-label="Open Scavenger Hunt Tracker"
        >
          <span className="quest-bubble-icon">🐾</span>
          <span className="quest-bubble-text">Pals: {foundIds.length}/{totalPals}</span>
          {allFound && <span className="quest-badge-star">⭐</span>}
        </button>

        {questOpen && (
          <div className="floating-quest-dropdown">
            <div className="floating-quest-header">
              <h4>Cute Pals Checklist</h4>
              <button
                type="button"
                className="close-button"
                onClick={() => setQuestOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="floating-quest-list">
              {huntCharacters.map((char) => {
                const found = isFound(char.id);
                return (
                  <div key={char.id} className={`floating-pal-row ${found ? 'found' : ''}`}>
                    <span className="pal-row-emoji">{char.emoji}</span>
                    <div className="pal-row-info">
                      <strong>{char.name}</strong>
                      <span className="pal-row-clue">{found ? 'Found! ⭐' : char.clue}</span>
                    </div>
                    <span className="pal-row-check">{found ? '✓' : '...'}</span>
                  </div>
                );
              })}
            </div>
            <div className="floating-quest-footer">
              <a
                href="#scavenger-hunt"
                className="primary-button full-width"
                onClick={() => setQuestOpen(false)}
              >
                Go to Homepage Checklist 📋
              </a>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
