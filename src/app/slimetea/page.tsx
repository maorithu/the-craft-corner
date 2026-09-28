'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sound } from '@/utils/soundEffects';
import { useCart } from '@/context/CartContext';
import HiddenPal from '@/components/HiddenPal';

type SlimeMenuItem = {
  id: string;
  name: string;
  chineseName: string;
  category: 'fruit' | 'boba' | 'tea' | 'food';
  price: string;
  tag: string;
  emoji: string;
  accent: string;
  liquidColor: string;
  description: string;
  defaultFoam: boolean;
  hasJellyCubes: boolean;
  hasDrippyThing?: boolean;
  hasBoba?: boolean;
};

const slimeMenuItems: SlimeMenuItem[] = [
  // 1. BOBA TEAS
  {
    id: 'brown-sugar-boba',
    name: 'Brown Sugar Boba Tea Slime',
    chineseName: '黑糖波波厚乳泥',
    category: 'boba',
    price: '$4.50',
    tag: 'JC + Foam Layer',
    emoji: '🧋',
    accent: '#9a633a',
    liquidColor: 'linear-gradient(180deg, #fffcf5 0%, #d4a373 40%, #583115 100%)',
    description: 'Authentic 3-layer experience: brown sugar syrup slime base with squishy jelly cubes (JC), black boba pearls, and a fluffy white foam cloud layer on top!',
    defaultFoam: true,
    hasJellyCubes: true,
    hasBoba: true,
  },
  {
    id: 'taro-boba',
    name: 'Taro Milk Tea Boba Slime',
    chineseName: '芋泥波波厚乳泥',
    category: 'boba',
    price: '$4.00',
    tag: 'Creamy Lavender',
    emoji: '💜',
    accent: '#bfa3d9',
    liquidColor: 'linear-gradient(180deg, #f3e8ff 0%, #bfa3d9 60%, #4a2860 100%)',
    description: 'Creamy lavender-colored thick and glossy slime, loaded with glossy black tapioca pearls.',
    defaultFoam: true,
    hasJellyCubes: false,
    hasBoba: true,
  },
  {
    id: 'roasted-oolong-boba',
    name: 'Roasted Oolong Cheese Foam Slime',
    chineseName: '芝芝金凤茶王泥',
    category: 'boba',
    price: '$4.25',
    tag: 'Salted Cheese Cap',
    emoji: '🧋',
    accent: '#c68b59',
    liquidColor: 'linear-gradient(180deg, #ffffff 0%, #fef3c7 20%, #b45309 80%, #451a03 100%)',
    description: 'Deep roasted amber oolong tea slime topped with a thick, spreadable salted cheese foam clay cap and chewy black boba pearls.',
    defaultFoam: true,
    hasJellyCubes: false,
    hasBoba: true,
  },
  {
    id: 'thai-iced-tea-boba',
    name: 'Thai Iced Tea Boba Slime',
    chineseName: '泰式波波奶茶泥',
    category: 'boba',
    price: '$4.25',
    tag: 'Condensed Milk Swirl',
    emoji: '🧋',
    accent: '#e67e22',
    liquidColor: 'linear-gradient(180deg, #fffcf5 0%, #f39c12 50%, #d35400 100%)',
    description: 'Vibrant golden-amber spiced Thai tea clear-sludge base with a separate white condensed-milk cloud slime swirl and black boba beads.',
    defaultFoam: true,
    hasJellyCubes: false,
    hasBoba: true,
  },
  {
    id: 'matcha-red-bean-boba',
    name: 'Matcha Red Bean Boba Slime',
    chineseName: '宇治红豆波波泥',
    category: 'boba',
    price: '$4.50',
    tag: 'Clay Red Bean Paste',
    emoji: '🍵',
    accent: '#556b4e',
    liquidColor: 'linear-gradient(180deg, #ffffff 0%, #88a381 40%, #3e4f3a 80%, #5c2020 100%)',
    description: 'Earthy Uji green tea thick slime layered with squishy dark red bean clay chunks, black acrylic boba pearls, and a sweet cream top.',
    defaultFoam: true,
    hasJellyCubes: false,
    hasBoba: true,
  },
  {
    id: 'white-peach-boba',
    name: 'White Peach Oolong Popping Boba',
    chineseName: '白桃乌龙啵啵泥',
    category: 'boba',
    price: '$4.25',
    tag: 'Popping Jelly Boba',
    emoji: '🍑',
    accent: '#f7a399',
    liquidColor: 'linear-gradient(180deg, #ffffff 0%, #ffccd5 40%, #f48fb1 80%, #ff80aa 100%)',
    description: 'Crystal-clear peach blossom jelly slime infused with sparkling white mica shimmer and translucent peach popping boba beads that pop with pressure.',
    defaultFoam: false,
    hasJellyCubes: true,
    hasBoba: true,
  },

  // 2. FRUITY & JELLY CUBE (JC) SLIMES
  {
    id: 'watermelon-sugar',
    name: 'Watermelon Sugar JC Slime',
    chineseName: '西瓜糖果果冻泥',
    category: 'fruit',
    price: '$4.00',
    tag: 'Squishy Jelly Cubes',
    emoji: '🍉',
    accent: '#ff6b8b',
    liquidColor: 'linear-gradient(180deg, #ffebee 0%, #ff4081 70%, #c2185b 100%)',
    description: 'Translucent pink watermelon jelly slime packed with squishy melamine jelly cubes (JC) you can crush and pop, topped with seed sprinkles!',
    defaultFoam: false,
    hasJellyCubes: true,
  },
  {
    id: 'mango-drippy',
    name: 'Mango Slime with Drippy Syrup',
    chineseName: '多肉芒芒滴滴泥',
    category: 'fruit',
    price: '$4.00',
    tag: 'With Drippy Thing!',
    emoji: '🥭',
    accent: '#f5a623',
    liquidColor: 'linear-gradient(180deg, #fffde7 0%, #ffd54f 50%, #f57f17 100%)',
    description: 'Velvety mango yellow butter slime that comes with a separate bottle of clear orange drippy mango syrup for you to drizzle on top yourself!',
    defaultFoam: false,
    hasJellyCubes: false,
    hasDrippyThing: true,
  },
  {
    id: 'strawberry-milk',
    name: 'Strawberry Milk Cream Slime',
    chineseName: '芝芝草莓厚乳泥',
    category: 'fruit',
    price: '$3.50',
    tag: 'Thick & Glossy',
    emoji: '🍓',
    accent: '#ff85a2',
    liquidColor: 'linear-gradient(180deg, #ffffff 0%, #ffc1e3 50%, #f06292 100%)',
    description: 'Pastel pink thick & glossy slime, garnished with miniature strawberry clay slices.',
    defaultFoam: true,
    hasJellyCubes: false,
  },
  {
    id: 'grape-bubble',
    name: 'Grape Glossy Bubble Slime',
    chineseName: '多肉葡萄啵啵泥',
    category: 'fruit',
    price: '$3.50',
    tag: 'Sweet Concord',
    emoji: '🍇',
    accent: '#8e44ad',
    liquidColor: 'linear-gradient(180deg, #ede7f6 0%, #ba68c8 50%, #6a1b9a 100%)',
    description: 'Ultra-glossy vibrant purple slime. Super clicky, stretchy, and makes the loudest bubble pops!',
    defaultFoam: false,
    hasJellyCubes: false,
  },
  {
    id: 'pineapple-jelly',
    name: 'Golden Pineapple Jelly Slime',
    chineseName: '金凤菠萝果冻泥',
    category: 'fruit',
    price: '$3.50',
    tag: 'Tropical Citrus',
    emoji: '🍍',
    accent: '#f1c40f',
    liquidColor: 'linear-gradient(180deg, #fffde7 0%, #fff176 50%, #fbc02d 100%)',
    description: 'Vibrant golden-yellow clear slime with glistening gold micro-glitter and a cute acrylic pineapple charm.',
    defaultFoam: false,
    hasJellyCubes: false,
  },
  {
    id: 'sweet-cherry',
    name: 'Sweet Cherry Glossy Slime',
    chineseName: '红颜车厘子亮光泥',
    category: 'fruit',
    price: '$3.50',
    tag: 'Ruby Red',
    emoji: '🍒',
    accent: '#c0392b',
    liquidColor: 'linear-gradient(180deg, #ffebee 0%, #e53935 60%, #b71c1c 100%)',
    description: 'Deep ruby-red high-gloss slime, finished with an adorable duo cherry charm.',
    defaultFoam: false,
    hasJellyCubes: false,
  },

  // 3. TEA & ZEN SLIMES
  {
    id: 'jasmine-green-tea',
    name: 'Jasmine Green Tea Clear Slime',
    chineseName: '绿妍茉莉清香泥',
    category: 'tea',
    price: '$3.50',
    tag: 'Zen Jelly',
    emoji: '🍵',
    accent: '#27ae60',
    liquidColor: 'linear-gradient(180deg, #e8f5e9 0%, #81c784 50%, #2e7d32 100%)',
    description: 'Soothing crystal-clear jade green slime with calming miniature tea leaf glitter accents.',
    defaultFoam: false,
    hasJellyCubes: false,
  },
  {
    id: 'matcha-butter',
    name: 'Ceremonial Matcha Butter Clay',
    chineseName: '宇治抹茶生巧泥',
    category: 'tea',
    price: '$4.00',
    tag: 'Super Spreadable',
    emoji: '🍵',
    accent: '#556b4e',
    liquidColor: 'linear-gradient(180deg, #ffffff 0%, #a5d6a7 40%, #556b4e 100%)',
    description: 'Ultra-creamy matte matcha green butter slime made with Japanese air-dry clay. Incredibly soft, stretchy, and holds holdable swirls.',
    defaultFoam: true,
    hasJellyCubes: false,
  },

  // 4. FOOD SLIMES (Changed from Novelty to Food + Expanded!)
  {
    id: 'guac-chip',
    name: 'Guac & Chip Textured Slime',
    chineseName: '牛油果脆片泥',
    category: 'food',
    price: '$4.50',
    tag: 'Mini Tortilla Chips',
    emoji: '🥑',
    accent: '#768b6e',
    liquidColor: 'linear-gradient(180deg, #f1f8e9 0%, #aed581 50%, #558b2f 100%)',
    description: 'Textured avocado green cloud-dough slime, complete with miniature realistic polymer tortilla chip charms!',
    defaultFoam: false,
    hasJellyCubes: false,
  },
  {
    id: 'fluffy-pancake',
    name: 'Fluffy Honey Butter Pancake Slime',
    chineseName: '舒芙蕾松饼泥',
    category: 'food',
    price: '$4.75',
    tag: 'Butter Cloud Slime',
    emoji: '🥞',
    accent: '#e67e22',
    liquidColor: 'linear-gradient(180deg, #fff8e1 0%, #ffe082 50%, #b45309 100%)',
    description: 'Incredibly puffy soufflé pancake cloud slime! Pure cloud texture, accompanied by a realistic polymer butter pat and maple syrup drizzle bottle.',
    defaultFoam: false,
    hasJellyCubes: false,
    hasDrippyThing: true,
  },
  {
    id: 'strawberry-donut',
    name: 'Strawberry Frosted Donut Slime',
    chineseName: '草莓糖霜甜甜圈泥',
    category: 'food',
    price: '$4.50',
    tag: 'DIY Clay Squish',
    emoji: '🍩',
    accent: '#ff80aa',
    liquidColor: 'linear-gradient(180deg, #fce4ec 0%, #f48fb1 50%, #d81b60 100%)',
    description: 'Interactive DIY slime kit! Includes a handcrafted soft clay donut that you squish into a tub of thick strawberry glaze slime with rainbow sprinkles.',
    defaultFoam: true,
    hasJellyCubes: false,
  },
  {
    id: 'nutella-toast',
    name: 'Nutella Brioche Toast Slime',
    chineseName: '巧克力厚吐司泥',
    category: 'food',
    price: '$4.50',
    tag: 'Spreadable Chocolate',
    emoji: '🍞',
    accent: '#6d4c41',
    liquidColor: 'linear-gradient(180deg, #fff3e0 0%, #bcaaa4 40%, #4e342e 100%)',
    description: 'Thick toasted brioche butter slime paired with a separate pot of glossy chocolate hazelnut slime and a mini wooden spreader knife!',
    defaultFoam: false,
    hasJellyCubes: false,
  },
  {
    id: 'cotton-candy-cloud',
    name: 'Pastel Cotton Candy Cloud Slime',
    chineseName: '梦幻棉花糖云朵泥',
    category: 'food',
    price: '$4.25',
    tag: 'Tri-Color Drizzle',
    emoji: '🍬',
    accent: '#c77dff',
    liquidColor: 'linear-gradient(180deg, #ffccd5 0%, #c77dff 50%, #80d9ff 100%)',
    description: 'Drizzly, super fluffy tri-color (pink, lavender, baby blue) cloud slime, dusted with iridescent sugar glitter.',
    defaultFoam: false,
    hasJellyCubes: false,
  },
  {
    id: 'tonkotsu-ramen',
    name: 'Tonkotsu Ramen Noodle Slime',
    chineseName: '日式豚骨拉面泥',
    category: 'food',
    price: '$5.00',
    tag: 'Realistic Food Slime',
    emoji: '🍜',
    accent: '#d97706',
    liquidColor: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 40%, #b45309 100%)',
    description: 'Rich savoury broth jelly slime topped with stretchy yellow clay ramen noodles, miniature polymer naruto fish cakes, green onion fimo slices, and a soft-boiled egg charm!',
    defaultFoam: false,
    hasJellyCubes: true,
  },
  {
    id: 'marshmallow-fluff',
    name: 'Whipped Marshmallow Fluff Slime',
    chineseName: '手工棉花糖绒毛泥',
    category: 'food',
    price: '$4.50',
    tag: 'Fluff Flavor Choice',
    emoji: '🍦',
    accent: '#f48fb1',
    liquidColor: 'linear-gradient(180deg, #ffffff 0%, #fff0f5 40%, #fce4ec 100%)',
    description: 'Ultra-puffy whipped marshmallow fluff cloud slime! Super stretchy, airy, and soft. Pick Blueberry 🫐, Strawberry 🍓, or Original 🤍 fluff flavor!',
    defaultFoam: true,
    hasJellyCubes: false,
  },
];

type CustomizationState = {
  iceLevel: 'regular' | 'less' | 'none' | 'freeze';
  foamTopping: 'cheese' | 'marshmallow' | 'cream' | 'none';
  marshmallowFlavor: 'blueberry' | 'strawberry' | 'original';
  addIns: string[];
};

export default function SlimeTeaPage() {
  const { addToCart, openCart, totalCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fruit' | 'boba' | 'tea' | 'food'>('all');
  const [activeItem, setActiveItem] = useState<SlimeMenuItem | null>(null);
  
  // HeyTea series of questions state
  const [customization, setCustomization] = useState<CustomizationState>({
    iceLevel: 'regular',
    foamTopping: 'cheese',
    marshmallowFlavor: 'original',
    addIns: [],
  });

  // Completed order state
  const [servedDrink, setServedDrink] = useState<{
    item: SlimeMenuItem;
    custom: CustomizationState;
    orderNum: number;
    squishes: number;
  } | null>(null);

  const [squishWobble, setSquishWobble] = useState(false);

  const filteredItems = slimeMenuItems.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const openCustomization = (item: SlimeMenuItem) => {
    sound.playSlimeSplat();
    setActiveItem(item);
    setCustomization({
      iceLevel: 'regular',
      foamTopping: item.id === 'marshmallow-fluff' ? 'marshmallow' : (item.defaultFoam ? 'cheese' : 'none'),
      marshmallowFlavor: 'original',
      addIns: item.hasJellyCubes ? ['Jelly Cubes (JC)'] : item.hasDrippyThing ? ['Drippy Mango Syrup'] : [],
    });
  };

  const handleToggleAddIn = (addIn: string) => {
    sound.playSlimeBobaPop();
    setCustomization((prev) => {
      const exists = prev.addIns.includes(addIn);
      if (exists) {
        return { ...prev, addIns: prev.addIns.filter((a) => a !== addIn) };
      }
      return { ...prev, addIns: [...prev.addIns, addIn] };
    });
  };

  const handlePlaceOrder = () => {
    if (!activeItem) return;
    sound.playFanfare();
    sound.playSlimeSplat();
    const orderNum = Math.floor(100 + Math.random() * 900);

    const fluffFlavorName =
      customization.marshmallowFlavor === 'blueberry'
        ? 'Blueberry Fluff 🫐'
        : customization.marshmallowFlavor === 'strawberry'
        ? 'Strawberry Fluff 🍓'
        : 'Original Fluff 🤍';

    const foamText =
      customization.foamTopping === 'marshmallow'
        ? `${fluffFlavorName} Marshmallow Fluff`
        : customization.foamTopping === 'cheese'
        ? 'Cheese Cloud Foam ☁️'
        : customization.foamTopping === 'cream'
        ? 'Whipped Cream Foam 🥛'
        : 'No Foam';

    const details = [
      `${customization.iceLevel} Ice`,
      foamText,
      customization.addIns.length > 0 ? `+${customization.addIns.join(', ')}` : null,
    ].filter(Boolean).join(' • ');

    addToCart({
      id: `slime-${activeItem.id}-${Date.now()}`,
      name: activeItem.name,
      shortName: activeItem.name,
      displayPrice: activeItem.price,
      icon: activeItem.emoji,
      categoryLabel: 'Slimes & Boba',
      customizationDetails: details,
    });

    setServedDrink({
      item: activeItem,
      custom: customization,
      orderNum,
      squishes: 0,
    });
    setActiveItem(null);
  };

  const handleSquishServedDrink = () => {
    sound.playSlimeSplat();
    setSquishWobble(true);
    setTimeout(() => setSquishWobble(false), 300);
    if (servedDrink) {
      setServedDrink({
        ...servedDrink,
        squishes: servedDrink.squishes + 1,
      });
    }
  };

  return (
    <div className="slimetea-page-wrapper">
      {/* Top HeyTea Slime Brand Header */}
      <header className="slimetea-brand-bar">
        <div className="slimetea-brand-left">
          <Link href="/" className="slimetea-back-home" title="Teleport back to The Craft Corner">
            ← 🏡 Craft Corner
          </Link>
          <div className="slimetea-logo-group">
            <span className="slimetea-logo-icon">🧋</span>
            <div>
              <span className="slimetea-english-title">SlimeTea Studio</span>
              <span className="slimetea-chinese-title">喜茶泥 • 纯手作史莱姆茶饮</span>
            </div>
          </div>
        </div>

        <div className="slimetea-brand-right">
          <div className="slimetea-store-status">
            <span className="status-dot"></span>
            <span>Station 01 • Freshly Squished Daily</span>
          </div>
          <button
            type="button"
            className="cart-toggle-nav-btn slimetea-basket-btn"
            onClick={openCart}
            aria-label={`Open craft basket with ${totalCount} items`}
          >
            <span className="cart-nav-icon">🛒</span>
            <span className="cart-nav-label">Basket</span>
            {totalCount > 0 && <span className="cart-nav-badge">{totalCount}</span>}
          </button>
        </div>
      </header>

      {/* Barista Welcome Counter Banner */}
      <section className="slimetea-counter-banner">
        <div className="barista-avatar-zone">
          <div className="barista-avatar">
            <span className="barista-emoji">🧋✨</span>
            <span className="barista-nametag">SlimeTea Bar</span>
          </div>
        </div>

        <div className="barista-speech-bubble">
          <div className="bubble-corner"></div>
          <p className="barista-quote">
            &ldquo;SPLAT! Welcome to <strong>SlimeTea</strong>! ✨ Everything here is handmade with jelly cubes, tapioca pearls, and cloud foam! Tap any drink to customize your ice, fluff, and mix-ins!&rdquo;
          </p>
        </div>
      </section>

      {/* HeyTea Mobile Order App Container */}
      <main className="slimetea-mobile-order-app">
        <div className="mobile-order-phone-frame">
          {/* App Status Header */}
          <div className="app-status-bar">
            <span>9:41</span>
            <span className="app-pickup-badge">📬 By Mail &amp; Delivery</span>
            <span>📶 100%</span>
          </div>

          <div className="app-order-header">
            <div>
              <h2>Order Slime Drinks</h2>
              <p>Handmade Studio Tactile Slimes</p>
            </div>
            <span className="app-bag-indicator">🧋 20 Handcrafted Recipes</span>
          </div>

          {/* Category Tabs */}
          <div className="app-category-tabs" role="tablist">
            <button
              type="button"
              className={`app-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Slimes
            </button>
            <button
              type="button"
              className={`app-tab ${selectedCategory === 'boba' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('boba')}
            >
              🧋 Boba Teas
            </button>
            <button
              type="button"
              className={`app-tab ${selectedCategory === 'fruit' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('fruit')}
            >
              🍉 Fruity &amp; JC
            </button>
            <button
              type="button"
              className={`app-tab ${selectedCategory === 'food' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('food')}
            >
              🥞 Food &amp; Bakery
            </button>
            <button
              type="button"
              className={`app-tab ${selectedCategory === 'tea' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('tea')}
            >
              🍵 Matcha &amp; Zen
            </button>
          </div>

          {/* Slime Menu List with Illustrated Pictures for All Items */}
          <div className="app-menu-grid">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="slime-menu-card"
                onClick={() => openCustomization(item)}
              >
                <div className="slime-card-visual" style={{ background: `${item.accent}15` }}>
                  {/* Illustrated Drink Cup / Dish Picture */}
                  <div className="slime-drink-picture-frame">
                    <div
                      className="slime-cup-liquid"
                      style={{ background: item.liquidColor }}
                    >
                      {item.defaultFoam && <div className="slime-cup-foam" />}
                      {item.hasBoba && (
                        <div className="cup-boba-layer">
                          <span>⚫</span><span>⚫</span><span>⚫</span><span>⚫</span>
                        </div>
                      )}
                      {item.hasJellyCubes && (
                        <div className="cup-jc-layer">
                          <span>🧊</span><span>🧊</span><span>🧊</span>
                        </div>
                      )}
                      <div className="cup-sheen-line" />
                    </div>
                    <span className="slime-card-emoji-hero">{item.emoji}</span>
                  </div>

                  <span className="slime-card-tag">{item.tag}</span>
                  {item.hasJellyCubes && (
                    <span className="slime-jc-badge">🧊 JC</span>
                  )}
                  {item.hasDrippyThing && (
                    <span className="slime-drippy-badge">💧 Drizzle</span>
                  )}
                  {item.hasBoba && (
                    <span className="slime-boba-badge">🧋 Boba</span>
                  )}
                </div>

                <div className="slime-card-info">
                  <div className="slime-card-names">
                    <strong className="slime-card-title">{item.name}</strong>
                    <span className="slime-card-chinese">{item.chineseName}</span>
                  </div>

                  <div className="slime-card-bottom">
                    <span className="slime-card-price">{item.price}</span>
                    <button
                      type="button"
                      className="slime-select-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomization(item);
                      }}
                    >
                      + Customize
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {/* Hidden Pal #3: Boba the Matcha Frog - Hiding among the tea drinks! */}
            <div className="slimetea-pal-spot-footer" style={{ textAlign: 'center', padding: '16px 0', gridColumn: '1 / -1' }}>
              <span style={{ fontSize: '0.84rem', color: '#65a30d', fontWeight: 700, marginRight: '8px' }}>
                🍵 A little matcha frog is peeking near the tea recipes...
              </span>
              <HiddenPal palId="boba" customClass="slimetea-boba-pal" />
            </div>
          </div>
        </div>
      </main>

      {/* HeyTea-Style Customization Modal / Series of Questions */}
      {activeItem && (
        <div className="heytea-modal-overlay" onClick={() => setActiveItem(null)}>
          <div className="heytea-custom-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="drawer-header">
              <div className="drawer-title-group">
                <span className="drawer-emoji">{activeItem.emoji}</span>
                <div>
                  <h3>{activeItem.name}</h3>
                  <span className="drawer-chinese">{activeItem.chineseName}</span>
                </div>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setActiveItem(null)}
              >
                ×
              </button>
            </div>

            {/* Questions Form */}
            <div className="drawer-body-questions">
              {/* Question 1: Ice Level / Texture Chill */}
              <div className="question-group">
                <div className="question-title-row">
                  <span className="question-num">1</span>
                  <strong>Ice Level (Slime Texture Chill)</strong>
                </div>
                <div className="options-pill-grid">
                  {[
                    { id: 'regular', label: 'Regular Ice 🧊', desc: 'Standard Squish & Stretch' },
                    { id: 'less', label: 'Less Ice 🧊', desc: 'Warmer, Softer Slime' },
                    { id: 'none', label: 'No Ice 🌡️', desc: 'Maximum Melt & Super Stretchy' },
                    { id: 'freeze', label: 'Slime Freeze ❄️', desc: 'Crunchy Slime with Micro-beads' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`option-card-btn ${customization.iceLevel === opt.id ? 'selected' : ''}`}
                      onClick={() => setCustomization({ ...customization, iceLevel: opt.id as any })}
                    >
                      <span className="opt-label">{opt.label}</span>
                      <small className="opt-desc">{opt.desc}</small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Foam Topping / Cloud Layer */}
              <div className="question-group">
                <div className="question-title-row">
                  <span className="question-num">2</span>
                  <strong>Add Foam Topping? (Cloud Layer)</strong>
                </div>
                <div className="options-pill-grid">
                  {[
                    { id: 'cheese', label: 'Cheese Foam Cloud ☁️', desc: 'Fluffy Salty-Sweet Slime Topper' },
                    { id: 'marshmallow', label: 'Marshmallow Fluff 🍦', desc: 'Whipped Fluffy Choice' },
                    { id: 'cream', label: 'Whipped Cream Foam 🥛', desc: 'Soft Light Whipped Texture' },
                    { id: 'none', label: 'No Foam (Pure Gloss) 💧', desc: 'Clear & Glossy Top' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`option-card-btn ${customization.foamTopping === opt.id ? 'selected' : ''}`}
                      onClick={() => setCustomization({ ...customization, foamTopping: opt.id as any })}
                    >
                      <span className="opt-label">{opt.label}</span>
                      <small className="opt-desc">{opt.desc}</small>
                    </button>
                  ))}
                </div>

                {/* If Marshmallow Fluff is active or item is marshmallow fluff slime, show Flavor Selection Order */}
                {(customization.foamTopping === 'marshmallow' || activeItem.id === 'marshmallow-fluff') && (
                  <div className="marshmallow-flavor-section">
                    <div className="marshmallow-flavor-header">
                      <span className="fluff-pill-badge">✨ Fluff Flavor Selection</span>
                      <strong>Pick Your Marshmallow Fluff Flavor:</strong>
                    </div>
                    <div className="fluff-flavors-grid">
                      {[
                        {
                          id: 'blueberry',
                          label: 'Blueberry Fluff',
                          emoji: '🫐',
                          color: '#4338ca',
                          bg: '#eef2ff',
                          desc: 'Sweet wild blueberry aroma & soft lilac marshmallow cloud',
                        },
                        {
                          id: 'strawberry',
                          label: 'Strawberry Fluff',
                          emoji: '🍓',
                          color: '#db2777',
                          bg: '#fdf2f8',
                          desc: 'Sweet strawberry creme & pastel pink fluffy cloud',
                        },
                        {
                          id: 'original',
                          label: 'Original Fluff',
                          emoji: '🤍',
                          color: '#b45309',
                          bg: '#fffbeb',
                          desc: 'Classic whipped sweet vanilla marshmallow crema',
                        },
                      ].map((fluff) => {
                        const isSelected = customization.marshmallowFlavor === fluff.id;
                        return (
                          <button
                            key={fluff.id}
                            type="button"
                            className={`fluff-flavor-card ${isSelected ? 'selected' : ''}`}
                            style={{
                              borderColor: isSelected ? fluff.color : undefined,
                              backgroundColor: isSelected ? fluff.bg : undefined,
                            }}
                            onClick={() =>
                              setCustomization({
                                ...customization,
                                marshmallowFlavor: fluff.id as any,
                                foamTopping: 'marshmallow',
                              })
                            }
                          >
                            <span className="fluff-flavor-emoji">{fluff.emoji}</span>
                            <div className="fluff-flavor-info">
                              <span className="fluff-flavor-title">
                                {isSelected ? '✓ ' : ''}
                                {fluff.label}
                              </span>
                              <small className="fluff-flavor-desc">{fluff.desc}</small>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Question 3: Slime Mix-Ins & Charms */}
              <div className="question-group">
                <div className="question-title-row">
                  <span className="question-num">3</span>
                  <strong>Slime Mix-Ins &amp; Charms (Tap to Add!)</strong>
                </div>
                <div className="options-pill-grid">
                  {[
                    { id: 'Jelly Cubes (JC)', label: 'Jelly Cubes (JC) 🧊', desc: 'Crushable squishy sponges' },
                    { id: 'Boba Pearls', label: 'Tapioca Boba Pearls ⚫', desc: 'Glossy chewy black beads' },
                    { id: 'Drippy Mango Syrup', label: 'Drippy Syrup Bottle 🥭', desc: 'Clear drizzle syrup topper' },
                    { id: 'Tortilla Chip Charms', label: 'Tortilla Chip Charms 🥑', desc: 'Mini realistic clay chips' },
                    { id: 'Star Glitters', label: 'Holographic Star Glitter ✨', desc: 'Iridescent sparkle dust' },
                    { id: 'Clay Fruit Slices', label: 'Fruit Fimo Slices 🍓', desc: 'Mini sliced fruit polymer' },
                  ].map((opt) => {
                    const isChecked = customization.addIns.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`option-card-btn ${isChecked ? 'selected' : ''}`}
                        onClick={() => handleToggleAddIn(opt.id)}
                      >
                        <span className="opt-label">
                          {isChecked ? '✓ ' : '+ '}
                          {opt.label}
                        </span>
                        <small className="opt-desc">{opt.desc}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Bottom Action */}
            <div className="drawer-footer-action">
              <div className="drawer-summary-pill">
                <span>
                  {customization.iceLevel} Ice • {
                    customization.foamTopping === 'marshmallow'
                      ? `${
                          customization.marshmallowFlavor === 'blueberry'
                            ? '🫐 Blueberry'
                            : customization.marshmallowFlavor === 'strawberry'
                            ? '🍓 Strawberry'
                            : '🤍 Original'
                        } Fluff`
                      : customization.foamTopping !== 'none'
                      ? 'Cloud Foam'
                      : 'No Foam'
                  }
                </span>
              </div>
              <button
                type="button"
                className="primary-button craft-slime-order-btn"
                onClick={handlePlaceOrder}
              >
                Craft &amp; Mix My Slime Order! 🧋
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Served Slime Drink Modal & Interactive Squisher */}
      {servedDrink && (
        <div className="served-drink-overlay">
          <div className="served-drink-card">
            <div className="served-badge">
              <span>🎉 Ding! Order #{servedDrink.orderNum} Ready at Counter!</span>
            </div>

            <h2>{servedDrink.item.name}</h2>
            <p className="served-subtitle">
              Freshly crafted by Barista Boba! Tap the slime cup below to squish it!
            </p>

            {/* Interactive Visual Slime Cup */}
            <div
              className={`interactive-slime-cup-view ${squishWobble ? 'squish-wobble' : ''}`}
              onClick={handleSquishServedDrink}
              role="button"
              tabIndex={0}
              title="Tap to squish your slime drink!"
            >
              <div className="slime-cup-rim"></div>
              
              {/* Optional Foam Layer on Top */}
              {servedDrink.custom.foamTopping !== 'none' && (
                <div
                  className="slime-cup-foam-layer"
                  style={{
                    background:
                      servedDrink.custom.foamTopping === 'marshmallow'
                        ? servedDrink.custom.marshmallowFlavor === 'blueberry'
                          ? 'linear-gradient(180deg, #ede7f6 0%, #c7d2fe 100%)'
                          : servedDrink.custom.marshmallowFlavor === 'strawberry'
                          ? 'linear-gradient(180deg, #fff0f5 0%, #fbcfe8 100%)'
                          : 'linear-gradient(180deg, #ffffff 0%, #fef3c7 100%)'
                        : undefined,
                  }}
                >
                  <span>
                    {servedDrink.custom.foamTopping === 'marshmallow'
                      ? `${
                          servedDrink.custom.marshmallowFlavor === 'blueberry'
                            ? '🫐 Blueberry'
                            : servedDrink.custom.marshmallowFlavor === 'strawberry'
                            ? '🍓 Strawberry'
                            : '🤍 Original'
                        } Marshmallow Fluff`
                      : servedDrink.custom.foamTopping === 'cheese'
                      ? '🧀 Cheese Cloud Foam'
                      : '🥛 Whipped Cream Foam'}
                  </span>
                </div>
              )}

              {/* Slime Liquid Body with Custom Colors */}
              <div
                className="slime-cup-body"
                style={{
                  background: `linear-gradient(180deg, ${servedDrink.item.accent}99 0%, ${servedDrink.item.accent} 100%)`,
                }}
              >
                <div className="slime-swirl-rings"></div>

                {/* Floating Boba / Jelly Cubes inside */}
                <div className="slime-toppings-visual">
                  {servedDrink.custom.addIns.map((addIn, idx) => (
                    <span key={idx} className="floating-topping-chip">
                      {addIn.includes('Jelly') ? '🧊' : addIn.includes('Boba') ? '⚫' : addIn.includes('Drippy') ? '💧' : addIn.includes('Chip') ? '🥑' : '✨'}
                    </span>
                  ))}
                  <span className="cup-main-emoji">{servedDrink.item.emoji}</span>
                </div>
              </div>

              {/* Giant Straw */}
              <div className="slime-cup-straw"></div>

              {/* Tap to Squish Callout */}
              <div className="tap-squish-tooltip">
                <span>👆 Tap to Squish! (Squished {servedDrink.squishes} times)</span>
              </div>
            </div>

            {/* Order Recipe Card */}
            <div className="order-recipe-summary">
              <div className="recipe-row">
                <span className="r-label">Chill Level:</span>
                <strong>{servedDrink.custom.iceLevel} ice</strong>
              </div>
              <div className="recipe-row">
                <span className="r-label">Topping / Fluff:</span>
                <strong>
                  {servedDrink.custom.foamTopping === 'marshmallow'
                    ? `${
                        servedDrink.custom.marshmallowFlavor === 'blueberry'
                          ? '🫐 Blueberry'
                          : servedDrink.custom.marshmallowFlavor === 'strawberry'
                          ? '🍓 Strawberry'
                          : '🤍 Original'
                      } Marshmallow Fluff`
                    : servedDrink.custom.foamTopping === 'cheese'
                    ? '🧀 Cheese Cloud Foam'
                    : servedDrink.custom.foamTopping === 'cream'
                    ? '🥛 Whipped Cream Foam'
                    : 'No Foam'}
                </strong>
              </div>
              <div className="recipe-row">
                <span className="r-label">Mix-Ins:</span>
                <strong>
                  {servedDrink.custom.addIns.length > 0
                    ? servedDrink.custom.addIns.join(', ')
                    : 'Classic Pure Recipe'}
                </strong>
              </div>
              <div className="recipe-row">
                <span className="r-label">Crafted:</span>
                <strong>✨ Fresh in Studio</strong>
              </div>
            </div>

            <div className="served-actions-row">
              <button
                type="button"
                className="primary-button served-cart-btn"
                onClick={openCart}
              >
                🛒 View Basket ({totalCount})
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setServedDrink(null)}
              >
                Order Another Slime 🧋
              </button>
              <Link href="/" className="secondary-button">
                Craft Corner 🏡
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
