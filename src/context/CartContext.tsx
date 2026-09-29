'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { sound } from '@/utils/soundEffects';

export type CartItem = {
  cartId: string;
  productId: number | string;
  name: string;
  shortName: string;
  price: number;
  displayPrice: string;
  quantity: number;
  icon: string;
  imageUrl?: string;
  tag?: string;
  categoryLabel?: string;
  size?: string;
  customizationDetails?: string;
};

export type PlacedOrder = {
  orderCode: string;
  orderNumber: number;
  customerNumber?: number;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  cardNumberMasked?: string;
  paymentMethod?: 'paypal' | 'card';
  paypalOrderId?: string;
  items: CartItem[];
  total: number;
  formattedTotal: string;
  pickupOrShip: 'mail' | 'delivery' | 'ship' | 'pickup';
  customerNotes: string;
  status: 'Making' | 'Packed' | 'Delivering' | 'Delivered' | 'Ready for Pickup';
  createdAt: string;
  freeSpoonGift: boolean;
  assignedStaffId?: string;
  isInTemporaryTrash?: boolean;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (
    item: {
      id: number | string;
      name: string;
      shortName?: string;
      displayPrice: string;
      icon: string;
      imageUrl?: string;
      tag?: string;
      categoryLabel?: string;
      size?: string;
      customizationDetails?: string;
    },
    quantity?: number
  ) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, newQuantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  formattedSubtotal: string;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  toastMessage: string | null;
  orders: PlacedOrder[];
  placeOrder: (order: {
    customerName: string;
    customerEmail: string;
    customerAddress: string;
    cardNumber?: string;
    paymentMethod?: 'paypal' | 'card';
    paypalOrderId?: string;
    pickupOrShip: 'mail' | 'delivery' | 'ship' | 'pickup';
    customerNotes: string;
  }) => PlacedOrder;
  updateOrderStatus: (orderCode: string, newStatus: PlacedOrder['status']) => void;
  assignOrderStaff: (orderCode: string, staffId: string) => void;
  setOrderInTemporaryTrash: (orderCode: string, isInTemporaryTrash: boolean) => void;
  getOrder: (query: string) => PlacedOrder | undefined;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const DEFAULT_SAMPLE_ORDERS: PlacedOrder[] = [
  {
    orderCode: 'CRAFT-8821',
    orderNumber: 8821,
    customerName: 'Maya Chen',
    customerEmail: 'maya.c@example.com',
    customerAddress: '142 Rosewood Ave, Toronto, ON',
    cardNumberMasked: '•••• •••• •••• 4821',
    paymentMethod: 'paypal',
    paypalOrderId: 'PAYID-M88219901',
    items: [
      {
        cartId: 'demo-1',
        productId: 1,
        name: 'Articulated Crystal Wing Dragon (3D Printed)',
        shortName: 'Crystal Wing Dragon',
        price: 12.0,
        displayPrice: '$12.00',
        quantity: 1,
        icon: '🐉',
        categoryLabel: '3D Prints & Fidgets',
      },
      {
        cartId: 'demo-2',
        productId: 301,
        name: 'Handcrafted Paper Dragon Hand Puppet',
        shortName: 'Dragon Puppet',
        price: 4.0,
        displayPrice: '$4.00',
        quantity: 1,
        icon: '🐲',
        categoryLabel: 'Puppets & Clickers',
      },
    ],
    total: 16.0,
    formattedTotal: '$16.00',
    pickupOrShip: 'ship',
    customerNotes: 'Please pack carefully, so excited for the dragon!',
    status: 'Making',
    createdAt: 'Today, 2:30 PM',
    freeSpoonGift: false,
    assignedStaffId: 'kaitlyn',
  },
  {
    orderCode: 'CRAFT-8822',
    orderNumber: 8822,
    customerName: 'Leo Martinez',
    customerEmail: 'leo.m@example.com',
    customerAddress: '88 Willow Creek Rd, Vancouver, BC',
    cardNumberMasked: '•••• •••• •••• 7192',
    paymentMethod: 'paypal',
    paypalOrderId: 'PAYID-L71920044',
    items: [
      {
        cartId: 'demo-3',
        productId: 6,
        name: 'Matcha Boba Float DIY Slime',
        shortName: 'Matcha Boba Slime',
        price: 6.5,
        displayPrice: '$6.50',
        quantity: 1,
        icon: '🧋',
        categoryLabel: 'SlimeTea Studio',
        customizationDetails: 'Thick & Glossy Base, Green Tea, Black Boba Pearls',
      },
    ],
    total: 6.5,
    formattedTotal: '$6.50',
    pickupOrShip: 'ship',
    customerNotes: 'Extra boba pearls please!',
    status: 'Packed',
    createdAt: 'Yesterday, 11:15 AM',
    freeSpoonGift: false,
    assignedStaffId: 'annabel',
  },
  {
    orderCode: 'CRAFT-8820',
    orderNumber: 8820,
    customerName: 'Chloe Bennett',
    customerEmail: 'chloe.b@example.com',
    customerAddress: '55 Birch View Crescent, Markham, ON',
    cardNumberMasked: '•••• •••• •••• 3301',
    paymentMethod: 'paypal',
    paypalOrderId: 'PAYID-C33018899',
    items: [
      {
        cartId: 'demo-4',
        productId: 5,
        name: 'Strawberry Boba Cloud DIY Slime',
        shortName: 'Strawberry Boba Slime',
        price: 6.5,
        displayPrice: '$6.50',
        quantity: 2,
        icon: '🍓',
        categoryLabel: 'SlimeTea Studio',
        customizationDetails: 'Fluffy Cloud Base, Sweet Berry, Pink Heart Pearls',
      },
      {
        cartId: 'demo-5',
        productId: 2,
        name: 'Pastel Unicorn Horn Desk Fidget',
        shortName: 'Unicorn Horn Fidget',
        price: 5.5,
        displayPrice: '$5.50',
        quantity: 1,
        icon: '🦄',
        categoryLabel: '3D Prints & Fidgets',
      },
      {
        cartId: 'demo-6',
        productId: 101,
        name: 'Beach Sunset Rainbow Loom Bracelet',
        shortName: 'Beach Sunset Loom',
        price: 2.0,
        displayPrice: '$2.00',
        quantity: 1,
        icon: '🏖️',
        categoryLabel: 'Rainbow Loom',
      },
    ],
    total: 20.5,
    formattedTotal: '$20.50',
    pickupOrShip: 'delivery',
    customerNotes: 'Please ring bell upon delivery!',
    status: 'Delivering',
    createdAt: 'Oct 12, 4:45 PM',
    freeSpoonGift: false,
    assignedStaffId: 'anna',
  },
  {
    orderCode: 'CRAFT-8815',
    orderNumber: 8815,
    customerName: 'Ethan & Olivia Ward',
    customerEmail: 'ward.family@example.com',
    customerAddress: '12 Blossom Way, Richmond Hill, ON',
    cardNumberMasked: '•••• •••• •••• 9012',
    paymentMethod: 'paypal',
    paypalOrderId: 'PAYID-E90123311',
    items: [
      {
        cartId: 'demo-7',
        productId: 1,
        name: 'Articulated Crystal Wing Dragon (3D Printed)',
        shortName: 'Crystal Wing Dragon',
        price: 12.0,
        displayPrice: '$12.00',
        quantity: 2,
        icon: '🐉',
        categoryLabel: '3D Prints & Fidgets',
      },
      {
        cartId: 'demo-8',
        productId: 8,
        name: 'Galaxy Nebula Clear DIY Slime',
        shortName: 'Galaxy Slime',
        price: 7.0,
        displayPrice: '$7.00',
        quantity: 2,
        icon: '🌌',
        categoryLabel: 'SlimeTea Studio',
      },
      {
        cartId: 'demo-9',
        productId: 201,
        name: 'Pastel Rainbow Loom Mystery Box',
        shortName: 'Pastel Mystery Box',
        price: 2.5,
        displayPrice: '$2.50',
        quantity: 4,
        icon: '🎁',
        categoryLabel: 'Mystery Blind Boxes',
      },
      {
        cartId: 'demo-10',
        productId: 301,
        name: 'Handcrafted Paper Dragon Hand Puppet',
        shortName: 'Dragon Puppet',
        price: 4.0,
        displayPrice: '$4.00',
        quantity: 2,
        icon: '🐲',
        categoryLabel: 'Puppets & Clickers',
      },
    ],
    total: 56.0,
    formattedTotal: '$56.00',
    pickupOrShip: 'ship',
    customerNotes: 'Birthday gifts! Please make them extra pretty.',
    status: 'Delivered',
    createdAt: 'Oct 10, 1:10 PM',
    freeSpoonGift: true,
    assignedStaffId: 'annabel',
  },
];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<PlacedOrder[]>(DEFAULT_SAMPLE_ORDERS);
  const [isClient, setIsClient] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    setIsClient(true);
    try {
      const savedCart = localStorage.getItem('craftcorner_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      const savedOrders = localStorage.getItem('craftcorner_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch {
      // Storage unavailable or invalid JSON
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem('craftcorner_cart', JSON.stringify(cartItems));
    } catch {
      // Storage quota or disabled
    }
  }, [cartItems, isClient]);

  // Save orders to localStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem('craftcorner_orders', JSON.stringify(orders));
    } catch {
      // Storage quota or disabled
    }
  }, [orders, isClient]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const parseNumericPrice = (displayStr: string): number => {
    const clean = displayStr.replace(/[^0-9.]/g, '');
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  };

  const addToCart = (
    item: {
      id: number | string;
      name: string;
      shortName?: string;
      displayPrice: string;
      icon: string;
      imageUrl?: string;
      tag?: string;
      categoryLabel?: string;
      size?: string;
      customizationDetails?: string;
    },
    quantity: number = 1
  ) => {
    const numPrice = parseNumericPrice(item.displayPrice);

    // Build a unique cart key based on product + size + customization
    const customSuffix = [item.size || '', item.customizationDetails || ''].filter(Boolean).join('::');
    const existingIndex = cartItems.findIndex(
      (ci) =>
        ci.productId === item.id &&
        (ci.size || '') === (item.size || '') &&
        (ci.customizationDetails || '') === (item.customizationDetails || '')
    );

    if (existingIndex > -1) {
      // Update existing item quantity
      setCartItems((prev) => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      });
    } else {
      // Create new line item
      const newItem: CartItem = {
        cartId: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: item.id,
        name: item.name,
        shortName: item.shortName || item.name,
        price: numPrice,
        displayPrice: item.displayPrice,
        quantity,
        icon: item.icon,
        imageUrl: item.imageUrl,
        tag: item.tag,
        categoryLabel: item.categoryLabel,
        size: item.size,
        customizationDetails: item.customizationDetails,
      };
      setCartItems((prev) => [...prev, newItem]);
    }

    sound.playAdd();
    showToast(`Added "${item.shortName || item.name}" to your basket! ✨`);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartId: string) => {
    sound.playClick();
    setCartItems((prev) => prev.filter((ci) => ci.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    sound.playClick();
    setCartItems((prev) =>
      prev.map((ci) => (ci.cartId === cartId ? { ...ci, quantity: newQuantity } : ci))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalCount = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);
  const subtotal = cartItems.reduce((acc, ci) => acc + ci.price * ci.quantity, 0);
  const formattedSubtotal = `$${subtotal.toFixed(2)}`;

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const placeOrder = (orderData: {
    customerName: string;
    customerEmail: string;
    customerAddress: string;
    cardNumber?: string;
    paymentMethod?: 'paypal' | 'card';
    paypalOrderId?: string;
    pickupOrShip: 'mail' | 'delivery' | 'ship' | 'pickup';
    customerNotes: string;
  }): PlacedOrder => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `CRAFT-${randomSuffix}`;
    const orderNumber = randomSuffix;

    let cardNumberMasked: string | undefined = undefined;
    if (orderData.cardNumber) {
      const cleanDigits = orderData.cardNumber.replace(/\D/g, '');
      const last4 = cleanDigits.slice(-4) || '9876';
      cardNumberMasked = `•••• •••• •••• ${last4}`;
    }

    const newOrder: PlacedOrder = {
      orderCode,
      orderNumber,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerAddress: orderData.customerAddress,
      cardNumberMasked,
      paymentMethod: orderData.paymentMethod || 'paypal',
      paypalOrderId: orderData.paypalOrderId,
      items: [...cartItems],
      total: subtotal,
      formattedTotal: formattedSubtotal,
      pickupOrShip: orderData.pickupOrShip,
      customerNotes: orderData.customerNotes,
      status: 'Making',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      freeSpoonGift: subtotal >= 50.0,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderCode: string, newStatus: PlacedOrder['status']) => {
    sound.playClick();
    setOrders((prev) =>
      prev.map((ord) => (ord.orderCode === orderCode ? { ...ord, status: newStatus } : ord))
    );
  };

  const assignOrderStaff = (orderCode: string, staffId: string) => {
    sound.playClick();
    setOrders((prev) =>
      prev.map((ord) =>
        ord.orderCode === orderCode ? { ...ord, assignedStaffId: staffId || undefined } : ord
      )
    );
  };

  const setOrderInTemporaryTrash = (orderCode: string, isInTemporaryTrash: boolean) => {
    sound.playClick();
    setOrders((prev) =>
      prev.map((ord) =>
        ord.orderCode === orderCode ? { ...ord, isInTemporaryTrash } : ord
      )
    );
  };

  const getOrder = (query: string): PlacedOrder | undefined => {
    const q = query.trim().toUpperCase();
    return orders.find(
      (o) =>
        o.orderCode.toUpperCase() === q ||
        o.orderNumber.toString() === q ||
        o.customerEmail.toUpperCase() === q.toUpperCase()
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        formattedSubtotal,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        toastMessage,
        orders,
        placeOrder,
        updateOrderStatus,
        assignOrderStaff,
        setOrderInTemporaryTrash,
        getOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

