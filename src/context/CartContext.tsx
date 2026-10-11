'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  staffInCharge?: string;
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
      staffInCharge?: string;
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
  refreshOrders: () => Promise<void>;
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

const ORDERS_STORAGE_KEY = 'craftcorner_orders';
const CART_STORAGE_KEY = 'craftcorner_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [isClient, setIsClient] = useState(false);

  const saveOrdersToLocal = (list: PlacedOrder[]) => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Storage quota or disabled
    }
  };

  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
          saveOrdersToLocal(data.orders);
          return;
        }
      }
    } catch (err) {
      console.warn('Orders API fetch failed, falling back to local cache:', err);
    }

    try {
      const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          setOrders(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Load cart from localStorage and orders from DB API on client mount
  useEffect(() => {
    setIsClient(true);
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch {
      // Storage unavailable or invalid JSON
    }
    refreshOrders();
  }, [refreshOrders]);

  // Save cart to localStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Storage quota or disabled
    }
  }, [cartItems, isClient]);

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
      staffInCharge?: string;
      customizationDetails?: string;
    },
    quantity: number = 1
  ) => {
    const numPrice = parseNumericPrice(item.displayPrice);

    const existingIndex = cartItems.findIndex(
      (ci) =>
        ci.productId === item.id &&
        (ci.size || '') === (item.size || '') &&
        (ci.customizationDetails || '') === (item.customizationDetails || '')
    );

    if (existingIndex > -1) {
      setCartItems((prev) => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      });
    } else {
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
        staffInCharge: item.staffInCharge,
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

    setOrders((prev) => {
      const next = [newOrder, ...prev];
      saveOrdersToLocal(next);
      return next;
    });
    clearCart();

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.order) {
            setOrders((prev) => {
              const next = prev.map((o) =>
                o.orderCode === newOrder.orderCode ? data.order : o
              );
              saveOrdersToLocal(next);
              return next;
            });
          }
        }
      })
      .catch((err) => console.error('Failed to sync new order to database:', err));

    return newOrder;
  };

  const updateOrderStatus = (orderCode: string, newStatus: PlacedOrder['status']) => {
    sound.playClick();
    setOrders((prev) => {
      const next = prev.map((ord) =>
        ord.orderCode === orderCode ? { ...ord, status: newStatus } : ord
      );
      saveOrdersToLocal(next);
      return next;
    });

    fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode, status: newStatus }),
    }).catch((err) => console.error('Failed to update order status in database:', err));
  };

  const assignOrderStaff = (orderCode: string, staffId: string) => {
    sound.playClick();
    setOrders((prev) => {
      const next = prev.map((ord) =>
        ord.orderCode === orderCode ? { ...ord, assignedStaffId: staffId || undefined } : ord
      );
      saveOrdersToLocal(next);
      return next;
    });

    fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode, assignedStaffId: staffId || '' }),
    }).catch((err) => console.error('Failed to assign order staff in database:', err));
  };

  const setOrderInTemporaryTrash = (orderCode: string, isInTemporaryTrash: boolean) => {
    sound.playClick();
    setOrders((prev) => {
      const next = prev.map((ord) =>
        ord.orderCode === orderCode ? { ...ord, isInTemporaryTrash } : ord
      );
      saveOrdersToLocal(next);
      return next;
    });

    fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode, isInTemporaryTrash }),
    }).catch((err) => console.error('Failed to update order trash status in database:', err));
  };

  const getOrder = useCallback(
    (query: string): PlacedOrder | undefined => {
      const q = query.trim().toUpperCase();
      return orders.find(
        (o) =>
          o.orderCode.toUpperCase() === q ||
          o.orderNumber.toString() === q ||
          o.customerEmail.toUpperCase() === q
      );
    },
    [orders]
  );

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
        refreshOrders,
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
