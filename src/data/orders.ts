export interface OrderItemSeed {
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
}

export interface OrderSeed {
  orderCode: string;
  orderNumber: number;
  customerNumber?: number;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  cardNumberMasked?: string;
  paymentMethod?: 'paypal' | 'card';
  paypalOrderId?: string;
  items: OrderItemSeed[];
  total: number;
  formattedTotal: string;
  pickupOrShip: 'mail' | 'delivery' | 'ship' | 'pickup';
  customerNotes: string;
  status: 'Making' | 'Packed' | 'Delivering' | 'Delivered' | 'Ready for Pickup';
  createdAt: string;
  freeSpoonGift: boolean;
  assignedStaffId?: string;
  isInTemporaryTrash?: boolean;
}

export const initialOrders: OrderSeed[] = [
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
        productId: 6,
        name: 'Silk Dual-Color Articulated Crystal Dragon',
        shortName: 'Crystal Dragon',
        price: 16.0,
        displayPrice: '$16.00',
        quantity: 1,
        icon: '🐉',
        categoryLabel: '3D Prints & Fidgets',
      },
      {
        cartId: 'demo-2',
        productId: 20,
        name: 'TikTok Viral Articulated Paper Hand Dragon Puppet',
        shortName: 'Hand Dragon Puppet',
        price: 16.0,
        displayPrice: '$16.00',
        quantity: 1,
        icon: '🐲',
        categoryLabel: 'Clickers & Puppets',
      },
    ],
    total: 32.0,
    formattedTotal: '$32.00',
    pickupOrShip: 'ship',
    customerNotes: 'Please pack carefully, so excited for the dragon!',
    status: 'Making',
    createdAt: 'Today, 2:30 PM',
    freeSpoonGift: false,
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
        productId: 'matcha-red-bean-boba',
        name: 'Matcha Red Bean Boba Slime',
        shortName: 'Matcha Boba Slime',
        price: 4.5,
        displayPrice: '$4.50',
        quantity: 1,
        icon: '🍵',
        categoryLabel: 'SlimeTea Studio',
        customizationDetails: 'Thick & Glossy Base, Green Tea, Black Boba Pearls',
      },
    ],
    total: 4.5,
    formattedTotal: '$4.50',
    pickupOrShip: 'ship',
    customerNotes: 'Extra boba pearls please!',
    status: 'Packed',
    createdAt: 'Yesterday, 11:15 AM',
    freeSpoonGift: false,
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
        productId: 'strawberry-milk',
        name: 'Strawberry Milk Cream Slime',
        shortName: 'Strawberry Milk Slime',
        price: 3.5,
        displayPrice: '$3.50',
        quantity: 2,
        icon: '🍓',
        categoryLabel: 'SlimeTea Studio',
        customizationDetails: 'Fluffy Cloud Base, Sweet Berry, Pink Heart Pearls',
      },
      {
        cartId: 'demo-5',
        productId: 2,
        name: 'Flexi Baby Dino T-Rex',
        shortName: 'Flexi Baby Dino',
        price: 9.0,
        displayPrice: '$9.00',
        quantity: 1,
        icon: '🦖',
        categoryLabel: '3D Prints & Fidgets',
      },
      {
        cartId: 'demo-6',
        productId: 101,
        name: 'Beach Packet Rainbow Loom Kit',
        shortName: 'Beach Packet',
        price: 2.0,
        displayPrice: '$2.00',
        quantity: 1,
        icon: '🏖️',
        imageUrl: '/images/products/beach-packet.jpg',
        categoryLabel: 'Bracelets & Loom',
      },
    ],
    total: 18.0,
    formattedTotal: '$18.00',
    pickupOrShip: 'delivery',
    customerNotes: 'Please ring bell upon delivery!',
    status: 'Delivering',
    createdAt: 'Oct 12, 4:45 PM',
    freeSpoonGift: false,
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
        productId: 6,
        name: 'Silk Dual-Color Articulated Crystal Dragon',
        shortName: 'Crystal Dragon',
        price: 16.0,
        displayPrice: '$16.00',
        quantity: 2,
        icon: '🐉',
        categoryLabel: '3D Prints & Fidgets',
      },
      {
        cartId: 'demo-8',
        productId: 104,
        name: 'Galaxy Packet Mystery Blind Box',
        shortName: 'Galaxy Blind Box',
        price: 2.5,
        displayPrice: '$2.50',
        quantity: 4,
        icon: '🎁',
        imageUrl: '/images/products/galaxy-blind-box.jpg',
        categoryLabel: 'Bracelets & Loom',
      },
      {
        cartId: 'demo-9',
        productId: 20,
        name: 'TikTok Viral Articulated Paper Hand Dragon Puppet',
        shortName: 'Hand Dragon Puppet',
        price: 16.0,
        displayPrice: '$16.00',
        quantity: 1,
        icon: '🐲',
        categoryLabel: 'Clickers & Puppets',
      },
    ],
    total: 58.0,
    formattedTotal: '$58.00',
    pickupOrShip: 'ship',
    customerNotes: 'Birthday gifts! Please make them extra pretty.',
    status: 'Delivered',
    createdAt: 'Oct 10, 1:10 PM',
    freeSpoonGift: true,
  },
];
