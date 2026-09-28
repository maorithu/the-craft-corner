'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-glow" />
      <div className="footer-content">
        <div className="footer-brand-col">
          <div className="brand-wrap">
            <div className="brand-mark">
              <span className="brand-mark-icon">✨</span>
            </div>
            <div>
              <span className="brand-title">The Craft Corner</span>
              <p className="brand-description">
                A super cute, cozy handmade craft store & studio for kids and makers. Featuring 3D prints, friendship bracelets, sensory clickers, squishies, dragon puppets, and DIY crafts.
              </p>
            </div>
          </div>
          <div className="footer-cafe-schedule">
            <span className="schedule-badge">🌸 Kids Craft Studio Preview</span>
            <p>Exploring crafts to make: 3D prints, bead bracelets, keyboard clickers, squishies & dragon puppets!</p>
          </div>
        </div>

        <div className="footer-links-col">
          <h4>Popular Crafts</h4>
          <ul>
            <li><Link href="/catalog/">📖 Master Product Catalog</Link></li>
            <li><Link href="/shop/?category=bracelets">📿 Rainbow Loom &amp; Bracelets</Link></li>
            <li><Link href="/shop/?category=blind-boxes">🎁 Blind Box Mystery Section</Link></li>
            <li><Link href="/shop/?category=3d-prints">🐉 3D Prints &amp; Fidgets</Link></li>
            <li><Link href="/shop/?category=clickers">🐲 Dragon Puppets &amp; Clickers</Link></li>
            <li><Link href="/slimetea/">🧋 SlimeTea Studio</Link></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4>Customer Care &amp; Fun</h4>
          <ul>
            <li><Link href="/track">📦 Track Your Package</Link></li>
            <li><Link href="/#scavenger-hunt">🐾 Sneaky Pals Quest</Link></li>
            <li><Link href="/minigames">🎨 Craft &amp; DIY Activities</Link></li>
            <li><Link href="/staff/">🔒 Staff Portal</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} The Craft Corner. Cozy handmade craft store for kids & creative hands.</p>
        <div className="footer-meta-links">
          <span>Safe & non-toxic</span>
          <span>•</span>
          <span>Kid-friendly crafts</span>
          <span>•</span>
          <span>Fun DIY projects</span>
        </div>
      </div>
    </footer>
  );
}
