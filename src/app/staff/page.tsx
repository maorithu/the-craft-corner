'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart, PlacedOrder } from '@/context/CartContext';
import { useInventory, ProductItem } from '@/context/InventoryContext';
import {
  authenticateStaff,
  authenticateAdminStaff,
  getStaffDirectory,
  deleteStaffAccount,
  StaffProfile,
} from '@/lib/staffAuth';
import { sound } from '@/utils/soundEffects';

type PortalSection = 'orders' | 'inventory' | 'staff';

const PRESET_ICONS = ['🐉', '🧋', '🌈', '🎁', '🐱', '🦖', '🐛', '🦫', '⌨️', '🥐', '🍓', '✨', '🐾', '🍃', '⭐', '🦎', '🧁'];

const PRESET_IMAGES = [
  { label: 'Beach Packet', path: '/images/products/beach-packet.jpg' },
  { label: 'Beach Blind Box', path: '/images/products/beach-blind-box.jpg' },
  { label: 'Galaxy Packet', path: '/images/products/galaxy-packet.jpg' },
  { label: 'Galaxy Blind Box', path: '/images/products/galaxy-blind-box.jpg' },
  { label: 'Minecraft Packet', path: '/images/products/minecraft-packet.jpg' },
  { label: 'Minecraft Blind Box', path: '/images/products/minecraft-blind-box.jpg' },
  { label: 'Beautiful Day Packet', path: '/images/products/beautiful-day-packet.jpg' },
  { label: 'Beautiful Day Blind Box', path: '/images/products/beautiful-day-blind-box.jpg' },
  { label: 'Gloomy Light Packet', path: '/images/products/gloomy-light-packet.jpg' },
  { label: 'Gloomy Light Blind Box', path: '/images/products/gloomy-light-blind-box.jpg' },
  { label: '2016 Vibes Packet', path: '/images/products/vibes-2016-packet.jpg' },
  { label: '2016 Vibes Blind Box', path: '/images/products/vibes-2016-blind-box.jpg' },
  { label: 'Axolotl Belly Clicker', path: '/images/products/axolotl-belly-clicker.jpg' },
];

const CATEGORY_METADATA: Record<
  string,
  { label: string; defaultSub: string; subOptions: { id: string; label: string }[] }
> = {
  '3d-prints': {
    label: '3D Prints & Fidgets',
    defaultSub: '3d-prints',
    subOptions: [
      { id: '3d-prints', label: '3D Prints' },
      { id: '3d-animals', label: '3D Animals' },
      { id: '3d-fidgets', label: 'Fidgets' },
      { id: 'blind-box', label: 'Blind Box Section' },
    ],
  },
  bracelets: {
    label: 'Bracelets & Loom',
    defaultSub: 'loom-packet',
    subOptions: [
      { id: 'loom-packet', label: 'Rainbow Loom Packets' },
      { id: 'blind-box', label: 'Loom Blind Box' },
      { id: 'seasonal-loom', label: 'Seasonal Loom' },
      { id: 'wearable', label: 'Beaded & Charm Bracelets' },
    ],
  },
  'blind-boxes': {
    label: 'Blind Box Section',
    defaultSub: 'oreo-balloon',
    subOptions: [
      { id: 'oreo-balloon', label: 'Oreo Balloon' },
      { id: 'blind-box', label: 'Mystery Blind Box' },
      { id: 'squishy-blind-box', label: 'Squishy Blind Box' },
    ],
  },
  clickers: {
    label: 'Clickers & Puppets',
    defaultSub: 'tactile',
    subOptions: [
      { id: 'tactile', label: 'Tactile Fidgets' },
      { id: 'puppets', label: 'Puppets' },
    ],
  },
  'dragon-puppets': {
    label: 'Clickers & Puppets',
    defaultSub: 'puppets',
    subOptions: [
      { id: 'puppets', label: 'Puppets' },
      { id: 'tactile', label: 'Tactile Fidgets' },
    ],
  },
};

function ProductThumbnail({
  imageUrl,
  icon,
  alt,
  size = 56,
}: {
  imageUrl?: string;
  icon?: string;
  alt: string;
  size?: number;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl && failedUrl !== imageUrl);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '8px',
        background: '#f1f5f9',
        border: '1px solid var(--line)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size > 70 ? '2.2rem' : '1.6rem',
        margin: '0 auto',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setFailedUrl(imageUrl || null)}
        />
      ) : (
        <span>{icon || '✨'}</span>
      )}
    </div>
  );
}

async function compressImageFile(file: File, maxDim = 600): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        outputType,
        0.82
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

function StaffPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get('section') as PortalSection | null;

  const { orders, refreshOrders, updateOrderStatus, assignOrderStaff, setOrderInTemporaryTrash } = useCart();
  const { products, addProduct, updateProduct, deleteProduct, resetInventory } = useInventory();

  const [activeSection, setActiveSection] = useState<PortalSection>(() => {
    if (sectionParam === 'inventory' || sectionParam === 'staff' || sectionParam === 'orders') {
      return sectionParam;
    }
    return 'orders';
  });

  useEffect(() => {
    if (sectionParam === 'inventory' || sectionParam === 'staff' || sectionParam === 'orders') {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  const handleSectionSelect = (sec: PortalSection) => {
    sound.playClick();
    setActiveSection(sec);
    router.replace(`/staff/?section=${sec}`, { scroll: false });
  };

  // Staff Directory loaded from DB (/api/staff-users)
  const [staffMembers, setStaffMembers] = useState<StaffProfile[]>([]);

  const loadStaffDirectory = async () => {
    const members = await getStaffDirectory();
    setStaffMembers(members);
  };

  useEffect(() => {
    loadStaffDirectory();
  }, []);

  // Auth State 1: Staff Portal (Orders & Inventory — authenticated against DB staff_users or Cloudflare Admin)
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffProfile | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Auth State 2: Staff Management (ONLY read from Cloudflare directly via /api/admin-login)
  const [isCloudflareAdminAuthenticated, setIsCloudflareAdminAuthenticated] = useState(false);
  const [cloudflareAdminProfile, setCloudflareAdminProfile] = useState<StaffProfile | null>(null);
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  // Shared Notice / Toast
  const [portalNotice, setPortalNotice] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setPortalNotice(msg);
    setTimeout(() => setPortalNotice(null), 3500);
  };

  // ==================== LOGIN HANDLERS ====================

  // Login for Order Management & Inventory Management (DB staff_users credentials ONLY via /api/staff-login)
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const dbStaff = await authenticateStaff(usernameInput, passwordInput);
      if (dbStaff) {
        sound.playFanfare();
        setCurrentStaff(dbStaff);
        setIsStaffAuthenticated(true);
        setUsernameInput('');
        setPasswordInput('');
        setShowPassword(false);
        await loadStaffDirectory();
        await refreshOrders();
        return;
      }

      sound.playClick();
      setLoginError(
        'Sign-in failed. Order & Inventory Management use database staff accounts created in Staff Management.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Login specifically for Staff Management (Cloudflare credentials ONLY via /api/admin-login)
  const handleCloudflareAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoggingIn(true);
    setAdminLoginError(null);
    try {
      const cfAdmin = await authenticateAdminStaff(adminUsernameInput, adminPasswordInput);
      if (!cfAdmin) {
        sound.playClick();
        setAdminLoginError('Invalid Cloudflare Staff Management credentials.');
        return;
      }

      sound.playFanfare();
      setCloudflareAdminProfile(cfAdmin);
      setIsCloudflareAdminAuthenticated(true);
      setAdminUsernameInput('');
      setAdminPasswordInput('');
      setShowAdminPassword(false);
      await loadStaffDirectory();
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleLogoutAll = () => {
    setIsStaffAuthenticated(false);
    setCurrentStaff(null);
    setIsCloudflareAdminAuthenticated(false);
    setCloudflareAdminProfile(null);
    setUsernameInput('');
    setPasswordInput('');
    setAdminUsernameInput('');
    setAdminPasswordInput('');
    setLoginError(null);
    setAdminLoginError(null);
  };

  // ==================== SECTION 1: ORDER MANAGEMENT STATE & HANDLERS ====================

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignment, setFilterAssignment] = useState<string>('all');
  const [showTemporaryTrash, setShowTemporaryTrash] = useState(false);

  const canManageStaffOrders =
    isCloudflareAdminAuthenticated ||
    (!!currentStaff &&
      ((currentStaff.permissions &&
        currentStaff.permissions.some(
          (p) => p === 'manage_orders' || p === 'manage_assignments' || p === 'view_all_orders'
        )) ||
        currentStaff.role.toLowerCase().includes('manager') ||
        currentStaff.role.toLowerCase().includes('admin') ||
        currentStaff.role.toLowerCase().includes('lead')));

  const canManageAssignments = canManageStaffOrders;

  const resolveStaffMember = (staffId?: string): StaffProfile | null => {
    if (!staffId) return null;
    return (
      staffMembers.find(
        (m) => m.id === staffId || m.username.toLowerCase() === staffId.toLowerCase()
      ) || null
    );
  };

  const handleStatusChange = (orderCode: string, newStatus: PlacedOrder['status']) => {
    const order = orders.find((ord) => ord.orderCode === orderCode);
    if (
      order?.status === 'Delivered' &&
      !canManageStaffOrders &&
      order.assignedStaffId !== currentStaff?.id
    ) {
      return;
    }

    if (newStatus === 'Delivered') {
      sound.playFanfare();
      showNotice(`Order #${orderCode} delivered and moved to the Done section! ✅🎉`);
    } else {
      sound.playClick();
      showNotice(`Order #${orderCode} status updated to "${newStatus}".`);
    }
    updateOrderStatus(orderCode, newStatus);
  };

  const handleTemporaryTrash = (orderCode: string, isInTemporaryTrash: boolean) => {
    const order = orders.find((ord) => ord.orderCode === orderCode);
    if (!order || (!canManageStaffOrders && order.assignedStaffId !== currentStaff?.id)) return;

    setOrderInTemporaryTrash(orderCode, isInTemporaryTrash);
    showNotice(
      isInTemporaryTrash
        ? `Order #${orderCode} moved to temporary trash.`
        : `Order #${orderCode} restored from temporary trash.`
    );
  };

  const handleAssign = (orderCode: string, newStaffId: string) => {
    assignOrderStaff(orderCode, newStaffId);
    const assignedStaff = resolveStaffMember(newStaffId);

    if (assignedStaff) {
      sound.playFanfare();
      showNotice(`Order #${orderCode} assigned to ${assignedStaff.name}.`);
    } else {
      sound.playClick();
      showNotice(`Order #${orderCode} unassigned.`);
    }
  };

  const staffFilteredOrders = (
    canManageStaffOrders
      ? orders.filter((o) => {
          if (filterAssignment === 'all') return true;
          if (filterAssignment === 'unassigned') return !o.assignedStaffId;
          return o.assignedStaffId === filterAssignment;
        })
      : orders.filter(
          (o) =>
            o.assignedStaffId === currentStaff?.id ||
            o.assignedStaffId === currentStaff?.username
        )
  ).filter((o) => !o.isInTemporaryTrash);

  const activeOrders = staffFilteredOrders.filter((o) => {
    if (o.status === 'Delivered') return false;
    if (filterStatus !== 'all' && filterStatus !== 'Delivered' && o.status !== filterStatus)
      return false;
    if (filterStatus === 'Delivered') return false;
    return true;
  });

  const doneOrders = orders.filter((o) => {
    if (o.status !== 'Delivered') return false;
    if (o.isInTemporaryTrash) return false;
    if (filterStatus !== 'all' && filterStatus !== 'Delivered') return false;
    return true;
  });

  const temporaryTrashOrders = orders.filter((o) => o.isInTemporaryTrash);
  const totalRevenue = staffFilteredOrders.reduce((acc, ord) => acc + ord.total, 0);

  // ==================== SECTION 2: INVENTORY MANAGEMENT STATE & HANDLERS ====================

  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [invDeptFilter, setInvDeptFilter] = useState<string>('all');
  const [invCategoryFilter, setInvCategoryFilter] = useState<string>('all');
  const [invStockFilter, setInvStockFilter] = useState<string>('all');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ProductItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Product Form State
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formItemNumber, setFormItemNumber] = useState('');
  const [formPrice, setFormPrice] = useState('$3.00');
  const [formCategory, setFormCategory] = useState<string>('3d-prints');
  const [formCategoryLabel, setFormCategoryLabel] = useState('3D Prints & Fidgets');
  const [formSubCategory, setFormSubCategory] = useState('3d-prints');
  const [formSubCategoryLabel, setFormSubCategoryLabel] = useState('3D Prints');
  const [formStaffLead, setFormStaffLead] = useState('');
  const [formStock, setFormStock] = useState<number>(25);
  const [formTag, setFormTag] = useState('');
  const [formIcon, setFormIcon] = useState('✨');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMaterials, setFormMaterials] = useState('');
  const [formIsBlindBox, setFormIsBlindBox] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAddModal = () => {
    sound.playClick();
    setEditingProduct(null);
    setFormName('');
    setFormShortName('');
    setFormItemNumber(`Item ${products.length + 1}`);
    setFormPrice('$3.00');
    setFormCategory('3d-prints');
    setFormCategoryLabel('3D Prints & Fidgets');
    setFormSubCategory('3d-prints');
    setFormSubCategoryLabel('3D Prints');
    setFormStaffLead(staffMembers[0]?.id || currentStaff?.id || '');
    setFormStock(25);
    setFormTag('New Arrival');
    setFormIcon('✨');
    setFormImageUrl('');
    setFormDescription('Handcrafted in small batches with premium kid-safe materials.');
    setFormMaterials('Eco-friendly PLA, latex-free elastic, non-toxic colors.');
    setFormIsBlindBox(false);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (p: ProductItem) => {
    sound.playClick();
    setEditingProduct(p);
    setFormName(p.name);
    setFormShortName(p.shortName || p.name);
    setFormItemNumber(p.itemNumber || `Item ${p.id}`);
    setFormPrice(p.displayPrice || '$2.00');
    setFormCategory(p.category || '3d-prints');
    setFormCategoryLabel(
      p.categoryLabel || CATEGORY_METADATA[p.category]?.label || '3D Prints & Fidgets'
    );
    setFormSubCategory(p.subCategory || 'all');
    setFormSubCategoryLabel(p.subCategoryLabel || '');
    setFormStaffLead(p.staffInCharge || '');
    setFormStock(p.stock !== undefined ? p.stock : 25);
    setFormTag(p.tag || '');
    setFormIcon(p.icon || '✨');
    setFormImageUrl(p.imageUrl || '');
    setFormDescription(p.description || '');
    setFormMaterials(p.materials || '');
    setFormIsBlindBox(Boolean(p.isBlindBox));
    setIsEditModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    sound.playClick();

    try {
      const compressedBlob = await compressImageFile(file, 600);
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type || file.type || 'image/jpeg',
      });

      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await fetch('/api/inventory/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.imageUrl) {
          setFormImageUrl(data.imageUrl);
          sound.playFanfare();
          showNotice('Picture uploaded and ready to save! 📸');
          return;
        }
      }

      // Fallback to local DataURL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormImageUrl(event.target.result as string);
          showNotice('Picture loaded from device! 📸');
        }
      };
      reader.readAsDataURL(compressedBlob);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSavingProduct(true);
    try {
      const priceNum = parseFloat(formPrice.replace(/[^0-9.]/g, '')) || 0;
      const formattedPrice = formPrice.trim().startsWith('$')
        ? formPrice.trim()
        : `$${priceNum.toFixed(2)}`;

      const catMeta = CATEGORY_METADATA[formCategory] || CATEGORY_METADATA['3d-prints'];
      const subOption = catMeta.subOptions.find((s) => s.id === formSubCategory);

      const payload: Partial<ProductItem> = {
        name: formName.trim(),
        shortName: formShortName.trim() || formName.trim(),
        itemNumber: formItemNumber.trim() || `Item ${products.length + 1}`,
        displayPrice: formattedPrice,
        price: priceNum,
        category: formCategory as any,
        categoryLabel: formCategoryLabel || catMeta.label,
        subCategory: (formSubCategory || catMeta.defaultSub) as any,
        subCategoryLabel: formSubCategoryLabel || subOption?.label || '',
        staffInCharge: formStaffLead,
        stock: Number(formStock) || 0,
        tag: formTag.trim(),
        icon: formIcon || '✨',
        imageUrl: formImageUrl.trim(),
        description: formDescription.trim(),
        materials: formMaterials.trim(),
        isBlindBox: formIsBlindBox || formCategory === 'blind-boxes' || formSubCategory === 'blind-box',
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        sound.playFanfare();
        showNotice(`Updated "${payload.name}" in database! ✨`);
      } else {
        await addProduct(payload);
        sound.playFanfare();
        showNotice(`Added new product "${payload.name}" to database! 🎉`);
      }

      setIsEditModalOpen(false);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deleteCandidate) return;
    sound.playClick();
    await deleteProduct(deleteCandidate.id);
    showNotice(`Deleted "${deleteCandidate.name}" from database.`);
    setDeleteCandidate(null);
  };

  const handleAdjustStock = (p: ProductItem, delta: number) => {
    sound.playClick();
    const currentStock = p.stock !== undefined ? p.stock : 25;
    const nextStock = Math.max(0, currentStock + delta);
    updateProduct(p.id, { stock: nextStock });
  };

  const filteredProducts = products.filter((p) => {
    if (invSearchQuery.trim()) {
      const q = invSearchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchShort = (p.shortName || '').toLowerCase().includes(q);
      const matchNum = (p.itemNumber || '').toLowerCase().includes(q);
      const matchTag = (p.tag || '').toLowerCase().includes(q);
      if (!matchName && !matchShort && !matchNum && !matchTag) return false;
    }

    if (invDeptFilter !== 'all') {
      if (invDeptFilter === 'unassigned') {
        if (p.staffInCharge) return false;
      } else if (p.staffInCharge !== invDeptFilter) {
        return false;
      }
    }

    if (invCategoryFilter !== 'all') {
      if (p.category !== invCategoryFilter) return false;
    }

    if (invStockFilter === 'low') {
      if ((p.stock ?? 25) > 5) return false;
    } else if (invStockFilter === 'out') {
      if ((p.stock ?? 25) > 0) return false;
    }

    return true;
  });

  const totalStockCount = products.reduce((acc, p) => acc + (p.stock ?? 25), 0);
  const lowStockCount = products.filter((p) => (p.stock ?? 25) <= 5).length;

  // ==================== SECTION 3: STAFF MANAGEMENT STATE & HANDLERS ====================

  const [staffFormUsername, setStaffFormUsername] = useState('');
  const [staffFormPassword, setStaffFormPassword] = useState('');
  const [staffFormFullName, setStaffFormFullName] = useState('');
  const [staffFormRole, setStaffFormRole] = useState('Craft Specialist');
  const [staffFormDepartment, setStaffFormDepartment] = useState('Operations');
  const [staffFormIcon, setStaffFormIcon] = useState('👤');
  const [staffFormDescription, setStaffFormDescription] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormUsername.trim() || !staffFormPassword || !staffFormFullName.trim()) {
      showNotice('Username, password, and full name are required.');
      return;
    }

    setIsCreatingStaff(true);
    try {
      const response = await fetch('/api/staff-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: staffFormUsername,
          password: staffFormPassword,
          fullName: staffFormFullName,
          role: staffFormRole,
          department: staffFormDepartment,
          icon: staffFormIcon,
          description: staffFormDescription,
          permissions: ['manage_orders', 'manage_inventory', 'view_dashboard'],
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        showNotice(result.error || 'Could not create staff member.');
        return;
      }

      setStaffFormUsername('');
      setStaffFormPassword('');
      setStaffFormFullName('');
      setStaffFormRole('Craft Specialist');
      setStaffFormDepartment('Operations');
      setStaffFormIcon('👤');
      setStaffFormDescription('');
      showNotice(`Created staff account for ${result.staff?.fullName || staffFormFullName}! 🎉`);
      await loadStaffDirectory();
      sound.playFanfare();
    } catch {
      showNotice('Something went wrong while creating the staff account.');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleRemoveStaff = async (member: StaffProfile) => {
    sound.playClick();
    const ok = await deleteStaffAccount(member.id);
    if (ok) {
      showNotice(`Removed staff account "${member.name}".`);
      await loadStaffDirectory();
    } else {
      showNotice('Failed to remove staff account.');
    }
  };

  // ==================== ORDERS TABLE RENDERER ====================

  const renderOrdersTable = (ordersList: PlacedOrder[], isDoneSection: boolean, isTrashView = false) => {
    if (ordersList.length === 0) {
      if (isDoneSection) {
        return (
          <div style={{ padding: '38px 20px', textAlign: 'center', color: 'var(--text-soft)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📦</span>
            <p style={{ margin: 0, fontSize: '0.92rem' }}>
              {isTrashView ? (
                'Temporary trash is empty.'
              ) : (
                <>
                  No orders in the Done section yet. When an order&apos;s status is marked as{' '}
                  <strong>Delivered 🎉</strong>, it will automatically move here!
                </>
              )}
            </p>
          </div>
        );
      }
      return (
        <div style={{ padding: '38px 20px', textAlign: 'center', color: '#166534' }}>
          <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '8px' }}>🎉</span>
          <strong style={{ fontSize: '1.1rem', display: 'block', color: '#166534' }}>
            All Caught Up!
          </strong>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-soft)' }}>
            There are no active orders waiting for fulfillment right now. Great job!
          </p>
        </div>
      );
    }

    return (
      <>
        <div
          className="staff-desktop-table staff-orders-table-wrapper"
          style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}
        >
          <table className="staff-orders-table">
            <thead>
              <tr style={isDoneSection ? { background: '#f0fdf4' } : undefined}>
                <th>Order Code</th>
                <th>Customer &amp; Address</th>
                <th>Items &amp; Craft Station</th>
                <th>Total &amp; Perks</th>
                <th>Shipping Type</th>
                <th>Fulfillment Status</th>
                <th>Staff Assignment</th>
              </tr>
            </thead>
            <tbody>
              {ordersList.map((ord) => {
                const assignedMember = resolveStaffMember(ord.assignedStaffId);
                return (
                  <tr
                    key={ord.orderCode}
                    className="order-row"
                    style={
                      isDoneSection ? { backgroundColor: 'rgba(240, 253, 244, 0.45)' } : undefined
                    }
                  >
                    <td className="code-cell">
                      <strong>{ord.orderCode}</strong>
                      <small className="order-sub-date">{ord.createdAt}</small>
                      {isDoneSection && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '2px 7px',
                            borderRadius: '999px',
                            marginTop: '6px',
                            border: '1px solid #86efac',
                          }}
                        >
                          {isTrashView ? '🗑 IN TEMPORARY TRASH' : '✓ DONE'}
                        </span>
                      )}
                    </td>

                    <td className="customer-cell">
                      <strong>{ord.customerName}</strong>
                      <div className="cust-email">{ord.customerEmail}</div>
                      {ord.customerAddress && (
                        <div
                          className="cust-lives-at"
                          style={{
                            margin: '4px 0',
                            fontSize: '0.82rem',
                            color: '#0f766e',
                            background: '#f0fdfa',
                            border: '1px solid #ccfbf1',
                            borderRadius: '6px',
                            padding: '3px 8px',
                          }}
                        >
                          🏡 <strong>Lives at:</strong> {ord.customerAddress}
                        </div>
                      )}
                      {ord.cardNumberMasked && (
                        <small className="cust-card">Card: {ord.cardNumberMasked}</small>
                      )}
                      {ord.customerNotes && (
                        <div className="cust-notes-preview">&ldquo;{ord.customerNotes}&rdquo;</div>
                      )}
                    </td>

                    <td className="items-cell">
                      <ul className="ordered-items-summary">
                        {ord.items.map((it, idx) => {
                          const staffLead = resolveStaffMember(it.staffInCharge);
                          return (
                            <li
                              key={idx}
                              style={{
                                marginBottom: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span className="item-icon-tag">{it.icon}</span>
                                <strong>{it.quantity}×</strong> {it.shortName || it.name}
                                {it.size && <span className="item-size-pill">[{it.size}]</span>}
                                {staffLead && (
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      background: staffLead.colorBg,
                                      color: staffLead.colorText,
                                      border: `1px solid ${staffLead.colorBorder}`,
                                    }}
                                  >
                                    {staffLead.icon} {staffLead.name}
                                  </span>
                                )}
                              </div>
                              {it.customizationDetails && (
                                <small
                                  className="custom-slime-sub"
                                  style={{ display: 'block', marginTop: '2px' }}
                                >
                                  ({it.customizationDetails})
                                </small>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </td>

                    <td className="pricing-cell">
                      <strong className="ord-price">{ord.formattedTotal}</strong>
                      {ord.freeSpoonGift && (
                        <span className="free-spoon-badge">🥄 Mystery Spoon Included</span>
                      )}
                    </td>

                    <td className="method-cell">
                      {ord.pickupOrShip === 'delivery' ? (
                        <span
                          className="method-badge delivery"
                          style={{
                            background: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                          }}
                        >
                          🚚 Direct Delivery
                        </span>
                      ) : (
                        <span className="method-badge ship">📬 By Mail</span>
                      )}
                    </td>

                    <td className="status-cell">
                      {isTrashView ? (
                        <span>Delivered (Temporary Trash)</span>
                      ) : !isDoneSection ||
                        canManageStaffOrders ||
                        ord.assignedStaffId === currentStaff?.id ? (
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            handleStatusChange(
                              ord.orderCode,
                              e.target.value as PlacedOrder['status']
                            )
                          }
                          className={`status-selector status-${ord.status
                            .toLowerCase()
                            .replace(/\s+/g, '-')}`}
                          aria-label={`Status for ${ord.orderCode}`}
                        >
                          <option value="Making">Making ✂️</option>
                          <option value="Packed">Packed 📦</option>
                          <option value="Delivering">Delivering 🚚</option>
                          <option value="Delivered">
                            Delivered 🎉 ({isDoneSection ? 'Done' : 'Move to Done'})
                          </option>
                        </select>
                      ) : (
                        <span className={`status-badge-pill status-${ord.status.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      )}
                      {(isDoneSection || isTrashView) &&
                        (canManageStaffOrders || ord.assignedStaffId === currentStaff?.id) && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => handleTemporaryTrash(ord.orderCode, !isTrashView)}
                          >
                            {isTrashView ? 'Restore order' : 'Move to temporary trash'}
                          </button>
                        )}
                    </td>

                    <td className="assignment-cell" style={{ minWidth: '190px' }}>
                      {canManageAssignments ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <select
                            value={ord.assignedStaffId || ''}
                            onChange={(e) => handleAssign(ord.orderCode, e.target.value)}
                            className="staff-assign-dropdown"
                            aria-label="Assign order to staff"
                          >
                            <option value="">⚪ Unassigned (Select staff)</option>
                            {staffMembers.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.icon} {member.name}
                              </option>
                            ))}
                          </select>

                          {assignedMember && (
                            <span
                              className="assigned-staff-badge"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '999px',
                                background: assignedMember.colorBg,
                                color: assignedMember.colorText,
                                border: `1.5px solid ${assignedMember.colorBorder}`,
                                alignSelf: 'flex-start',
                              }}
                            >
                              <span>{assignedMember.icon}</span>
                              <span>Assigned to {assignedMember.name}</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span
                          className="assigned-staff-badge"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: currentStaff?.colorBg,
                            color: currentStaff?.colorText,
                            border: `1.5px solid ${currentStaff?.colorBorder}`,
                          }}
                        >
                          <span>{currentStaff?.icon}</span>
                          <span>Assigned to {currentStaff?.name}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="staff-mobile-cards">
          {ordersList.map((ord) => (
            <div
              key={ord.orderCode}
              className={`staff-order-card ${isDoneSection ? 'done-card' : ''}`}
            >
              <div className="mobile-card-header">
                <div className="mobile-card-code">
                  <strong>{ord.orderCode}</strong>
                  <small>{ord.createdAt}</small>
                </div>
                <span
                  className={`status-badge-pill status-${ord.status
                    .toLowerCase()
                    .replace(/\s+/g, '-')}`}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {isTrashView ? '🗑 IN TRASH' : ord.status}
                </span>
              </div>

              <div className="mobile-card-customer">
                <div className="cust-name">👤 {ord.customerName}</div>
                <div className="cust-email">{ord.customerEmail}</div>
                {ord.customerAddress && (
                  <div className="cust-address">
                    🏡 <strong>Lives at:</strong> {ord.customerAddress}
                  </div>
                )}
              </div>

              <div className="mobile-card-items">
                <div className="mobile-card-items-title">Ordered Items:</div>
                {ord.items.map((it, idx) => (
                  <div key={idx} className="mobile-item-line">
                    <span>{it.icon}</span> <strong>{it.quantity}×</strong>{' '}
                    {it.shortName || it.name}
                  </div>
                ))}
              </div>

              <div className="mobile-card-pricing-row">
                <strong style={{ fontSize: '1.1rem', color: 'var(--walnut-wood)' }}>
                  {ord.formattedTotal}
                </strong>
                <span className="method-badge ship">
                  {ord.pickupOrShip === 'delivery' ? '🚚 Direct Delivery' : '📬 By Mail'}
                </span>
              </div>

              <div className="mobile-card-controls">
                {!isTrashView && (
                  <div className="mobile-control-field">
                    <label>Fulfillment Status:</label>
                    <select
                      value={ord.status}
                      onChange={(e) =>
                        handleStatusChange(ord.orderCode, e.target.value as PlacedOrder['status'])
                      }
                      className="status-selector"
                      style={{ width: '100%', minHeight: '44px' }}
                    >
                      <option value="Making">Making ✂️</option>
                      <option value="Packed">Packed 📦</option>
                      <option value="Delivering">Delivering 🚚</option>
                      <option value="Delivered">Delivered 🎉</option>
                    </select>
                  </div>
                )}
                {canManageAssignments && (
                  <div className="mobile-control-field">
                    <label>Staff Assignment:</label>
                    <select
                      value={ord.assignedStaffId || ''}
                      onChange={(e) => handleAssign(ord.orderCode, e.target.value)}
                      className="staff-assign-dropdown"
                      style={{ width: '100%', minHeight: '44px' }}
                    >
                      <option value="">⚪ Unassigned</option>
                      {staffMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.icon} {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // ==================== MAIN RENDER ====================

  const activeUserDisplay =
    activeSection === 'staff' && cloudflareAdminProfile
      ? cloudflareAdminProfile
      : currentStaff || cloudflareAdminProfile;

  return (
    <div className="home-container staff-portal-container">
      {/* Top Portal Banner & 3-Section Navigation Tabs */}
      <div
        className="staff-portal-top-nav"
        style={{
          background: '#ffffff',
          border: '2px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          marginBottom: '22px',
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--terracotta)',
              }}
            >
              ✨ The Craft Corner Operations
            </span>
            <h1 style={{ margin: '2px 0 0', fontSize: '1.65rem', color: 'var(--walnut-wood)' }}>
              Unified Staff Portal
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {activeUserDisplay && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: activeUserDisplay.colorBg || '#eff6ff',
                  border: `1.5px solid ${activeUserDisplay.colorBorder || '#93c5fd'}`,
                  color: activeUserDisplay.colorText || '#1e40af',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                }}
              >
                <span>{activeUserDisplay.icon}</span>
                <span>
                  {activeUserDisplay.name} ({activeUserDisplay.role})
                </span>
              </span>
            )}

            <Link href="/shop" className="secondary-button" style={{ fontSize: '0.84rem' }}>
              🛍️ Live Storefront
            </Link>

            {(isStaffAuthenticated || isCloudflareAdminAuthenticated) && (
              <button
                type="button"
                className="secondary-button logout-btn"
                onClick={handleLogoutAll}
                style={{ fontSize: '0.84rem' }}
              >
                Log Out 🔒
              </button>
            )}
          </div>
        </div>

        {/* 3 Section Tabs: Order Management, Inventory Management, Staff Management */}
        <div
          role="tablist"
          aria-label="Staff Portal Sections"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '10px',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'orders'}
            onClick={() => handleSectionSelect('orders')}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border:
                activeSection === 'orders'
                  ? '2px solid var(--walnut-wood)'
                  : '1.5px solid var(--line)',
              background: activeSection === 'orders' ? 'var(--walnut-wood)' : '#f8fafc',
              color: activeSection === 'orders' ? '#ffffff' : 'var(--walnut-wood)',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📋</span>
            <span>Order Management ({orders.filter((o) => !o.isInTemporaryTrash).length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'inventory'}
            onClick={() => handleSectionSelect('inventory')}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border:
                activeSection === 'inventory'
                  ? '2px solid var(--walnut-wood)'
                  : '1.5px solid var(--line)',
              background: activeSection === 'inventory' ? 'var(--walnut-wood)' : '#f8fafc',
              color: activeSection === 'inventory' ? '#ffffff' : 'var(--walnut-wood)',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📦</span>
            <span>Inventory Management ({products.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'staff'}
            onClick={() => handleSectionSelect('staff')}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border:
                activeSection === 'staff'
                  ? '2px solid var(--walnut-wood)'
                  : '1.5px solid var(--line)',
              background: activeSection === 'staff' ? 'var(--walnut-wood)' : '#f8fafc',
              color: activeSection === 'staff' ? '#ffffff' : 'var(--walnut-wood)',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>👥</span>
            <span>Staff Management ({staffMembers.length})</span>
          </button>
        </div>
      </div>

      {/* Portal Toast Notice */}
      {portalNotice && (
        <div
          role="status"
          style={{
            background: '#ecfdf5',
            border: '2px solid #6ee7b7',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '18px',
            color: '#065f46',
            fontWeight: 800,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✨</span>
          <span>{portalNotice}</span>
        </div>
      )}

      {/* ==================== SECTION 3 VIEW: STAFF MANAGEMENT (Cloudflare Credential Only) ==================== */}
      {activeSection === 'staff' ? (
        !isCloudflareAdminAuthenticated ? (
          <div className="staff-lock-screen">
            <div className="staff-lock-card">
              <div className="lock-icon-badge">👥 🔑</div>
              <h2>Staff Management Access</h2>
              <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', margin: '4px 0 18px' }}>
                Protected by Cloudflare administrator credentials. Sign in to add or manage staff accounts in the database.
              </p>

              <form onSubmit={handleCloudflareAdminLogin} className="staff-login-form" autoComplete="off">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' }}>
                  <label
                    htmlFor="cf-admin-username"
                    style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--walnut-wood)' }}
                  >
                    👤 Cloudflare Admin Username:
                  </label>
                  <input
                    id="cf-admin-username"
                    type="text"
                    placeholder="Enter Cloudflare admin username..."
                    value={adminUsernameInput}
                    onChange={(e) => {
                      setAdminUsernameInput(e.target.value);
                      setAdminLoginError(null);
                    }}
                    required
                    className="staff-passcode-input"
                    style={{ fontSize: '16px', minHeight: '48px' }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    textAlign: 'left',
                    marginTop: '12px',
                  }}
                >
                  <label
                    htmlFor="cf-admin-password"
                    style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--walnut-wood)' }}
                  >
                    🔑 Cloudflare Admin Password:
                  </label>
                  <div className="staff-password-wrap">
                    <input
                      id="cf-admin-password"
                      type={showAdminPassword ? 'text' : 'password'}
                      placeholder="Enter Cloudflare admin password..."
                      value={adminPasswordInput}
                      onChange={(e) => {
                        setAdminPasswordInput(e.target.value);
                        setAdminLoginError(null);
                      }}
                      required
                      className="staff-passcode-input"
                      style={{ fontSize: '16px', minHeight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword((p) => !p)}
                      className="staff-password-toggle-btn"
                      aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAdminPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {adminLoginError && (
                  <div
                    className="staff-error-msg"
                    role="alert"
                    style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginTop: '10px' }}
                  >
                    ⚠️ {adminLoginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary-button staff-login-btn"
                  style={{ minHeight: '48px', marginTop: '16px', fontSize: '1rem', fontWeight: 800 }}
                  disabled={isAdminLoggingIn}
                >
                  {isAdminLoggingIn ? 'Verifying with Cloudflare...' : 'Unlock Staff Management 🔑'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="staff-dashboard">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                alignItems: 'start',
              }}
            >
              {/* Create Staff Form */}
              <form
                onSubmit={handleCreateStaff}
                style={{
                  border: '2px solid var(--line)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  background: '#ffffff',
                  display: 'grid',
                  gap: '14px',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--walnut-wood)' }}>
                    ➕ Add New Staff Account
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-soft)' }}>
                    Staff accounts created here are stored in the database and can sign in to manage orders and inventory.
                  </p>
                </div>

                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', marginBottom: '4px', fontWeight: 700, fontSize: '0.84rem' }}>
                    Username *
                  </span>
                  <input
                    type="text"
                    value={staffFormUsername}
                    onChange={(e) => setStaffFormUsername(e.target.value)}
                    placeholder="e.g. kaitlyn"
                    required
                    className="staff-passcode-input"
                  />
                </label>

                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', marginBottom: '4px', fontWeight: 700, fontSize: '0.84rem' }}>
                    Password *
                  </span>
                  <input
                    type="password"
                    value={staffFormPassword}
                    onChange={(e) => setStaffFormPassword(e.target.value)}
                    placeholder="Enter staff password..."
                    required
                    className="staff-passcode-input"
                  />
                </label>

                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', marginBottom: '4px', fontWeight: 700, fontSize: '0.84rem' }}>
                    Full Name *
                  </span>
                  <input
                    type="text"
                    value={staffFormFullName}
                    onChange={(e) => setStaffFormFullName(e.target.value)}
                    placeholder="e.g. Kaitlyn"
                    required
                    className="staff-passcode-input"
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', marginBottom: '4px', fontWeight: 700, fontSize: '0.84rem' }}>
                      Role
                    </span>
                    <input
                      type="text"
                      value={staffFormRole}
                      onChange={(e) => setStaffFormRole(e.target.value)}
                      placeholder="e.g. Lead Manager"
                      className="staff-passcode-input"
                    />
                  </label>

                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', marginBottom: '4px', fontWeight: 700, fontSize: '0.84rem' }}>
                      Department
                    </span>
                    <input
                      type="text"
                      value={staffFormDepartment}
                      onChange={(e) => setStaffFormDepartment(e.target.value)}
                      placeholder="e.g. 3D Prints & Dragons"
                      className="staff-passcode-input"
                    />
                  </label>
                </div>

                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', marginBottom: '4px', fontWeight: 700, fontSize: '0.84rem' }}>
                    Avatar Icon
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {['🧋', '🐉', '🌸', '👑', '🎨', '✨', '🐾', '👤'].map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setStaffFormIcon(ic)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: staffFormIcon === ic ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: staffFormIcon === ic ? '#eff6ff' : '#ffffff',
                          fontSize: '1.1rem',
                          cursor: 'pointer',
                        }}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={staffFormIcon}
                    onChange={(e) => setStaffFormIcon(e.target.value)}
                    className="staff-passcode-input"
                  />
                </label>

                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', marginBottom: '4px', fontWeight: 700, fontSize: '0.84rem' }}>
                    Specialty / Description
                  </span>
                  <textarea
                    value={staffFormDescription}
                    onChange={(e) => setStaffFormDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe what crafts or orders this team member leads..."
                    className="staff-passcode-input"
                    style={{ resize: 'vertical' }}
                  />
                </label>

                <button type="submit" className="primary-button" disabled={isCreatingStaff}>
                  {isCreatingStaff ? 'Creating Staff Account...' : 'Create Staff Account ✨'}
                </button>
              </form>

              {/* Current Staff Directory */}
              <div
                style={{
                  border: '2px solid var(--line)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  background: '#ffffff',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                <h2 style={{ margin: '0 0 14px', fontSize: '1.25rem', color: 'var(--walnut-wood)' }}>
                  👥 Active Database Staff ({staffMembers.length})
                </h2>

                {staffMembers.length === 0 ? (
                  <div
                    style={{
                      padding: '32px 16px',
                      textAlign: 'center',
                      color: 'var(--text-soft)',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px dashed #cbd5e1',
                    }}
                  >
                    No staff accounts in the database yet. Use the form on the left to add your first team member!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {staffMembers.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          background: '#f8fafc',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '1.6rem' }}>{member.icon || '👤'}</span>
                            <div>
                              <strong style={{ fontSize: '1rem', color: 'var(--walnut-wood)', display: 'block' }}>
                                {member.name}
                              </strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>
                                @{member.username}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.86rem', color: '#334155' }}>
                            <strong>{member.role}</strong> · {member.deptName}
                          </div>
                          {member.description && (
                            <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                              {member.description}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStaff(member)}
                          style={{
                            padding: '5px 10px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid #fca5a5',
                            background: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      ) : !isStaffAuthenticated ? (
        /* ==================== LOGIN FOR ORDER MANAGEMENT & INVENTORY MANAGEMENT ==================== */
        <div className="staff-lock-screen">
          <div className="staff-lock-card">
            <div className="lock-icon-badge">
              {activeSection === 'inventory' ? '📦 🔒' : '📋 🔒'}
            </div>
            <h2>
              {activeSection === 'inventory'
                ? 'Inventory Management Sign-In'
                : 'Order Management Sign-In'}
            </h2>
            <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', margin: '4px 0 18px' }}>
              Sign in with your staff account to manage customer orders and live product inventory.
            </p>

            <form onSubmit={handleStaffLogin} className="staff-login-form" autoComplete="off">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' }}>
                <label
                  htmlFor="staff-login-username"
                  style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--walnut-wood)' }}
                >
                  👤 Staff Username:
                </label>
                <input
                  id="staff-login-username"
                  name="staff_login_username"
                  type="text"
                  placeholder="Enter staff username..."
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setLoginError(null);
                  }}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ fontSize: '16px', minHeight: '48px' }}
                  className="staff-passcode-input"
                  autoComplete="off"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  textAlign: 'left',
                  marginTop: '12px',
                }}
              >
                <label
                  htmlFor="staff-login-password"
                  style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--walnut-wood)' }}
                >
                  🔑 Staff Password:
                </label>
                <div className="staff-password-wrap">
                  <input
                    id="staff-login-password"
                    name="staff_login_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter staff password..."
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError(null);
                    }}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    style={{ fontSize: '16px', minHeight: '48px' }}
                    className="staff-passcode-input"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="staff-password-toggle-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {loginError && (
                <div
                  className="staff-error-msg"
                  role="alert"
                  style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginTop: '10px' }}
                >
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                className="primary-button staff-login-btn"
                style={{ minHeight: '48px', marginTop: '16px', fontSize: '1rem', fontWeight: 800 }}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Signing in...' : 'Unlock Staff Portal 🔑'}
              </button>
            </form>

            <div className="staff-lock-footer" style={{ marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => handleSectionSelect('staff')}
                className="text-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Need to create or manage staff accounts? Go to Staff Management →
              </button>
            </div>
          </div>
        </div>
      ) : activeSection === 'orders' ? (
        /* ==================== SECTION 1 VIEW: ORDER MANAGEMENT ==================== */
        <div className="staff-dashboard">
          <div className="staff-header-row" style={{ marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--walnut-wood)' }}>
                📋 Customer Orders &amp; Fulfillment Hub
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-soft)', fontSize: '0.9rem' }}>
                Manage database orders, update fulfillment stages, and assign orders to team members.
              </p>
            </div>

            <div className="staff-header-actions">
              <Link href="/track" className="secondary-button">
                Open Customer Tracker 📦
              </Link>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowTemporaryTrash((show) => !show)}
                aria-pressed={showTemporaryTrash}
              >
                {showTemporaryTrash
                  ? 'Back to Orders'
                  : `Temporary Trash (${temporaryTrashOrders.length})`}
              </button>
            </div>
          </div>

          <div className="staff-metrics-grid">
            <div className="metric-box">
              <span className="metric-label">
                {canManageStaffOrders ? 'Total Studio Orders' : 'My Assigned Orders'}
              </span>
              <strong className="metric-val">{staffFilteredOrders.length}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Total Revenue</span>
              <strong className="metric-val">${totalRevenue.toFixed(2)}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Active To Fulfill</span>
              <strong className="metric-val" style={{ color: '#ea580c' }}>
                {activeOrders.length}
              </strong>
            </div>
            <div className="metric-box" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
              <span className="metric-label" style={{ color: '#166534' }}>
                Done &amp; Delivered
              </span>
              <strong className="metric-val" style={{ color: '#15803d' }}>
                {doneOrders.length}
              </strong>
            </div>
          </div>

          {/* Filter Bars */}
          <div
            className="staff-filter-bar"
            style={{
              display: showTemporaryTrash ? 'none' : 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {canManageAssignments && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Account View:</span>
                <div className="status-filter-pills">
                  {[
                    { id: 'all', label: 'All Orders', count: orders.filter((o) => !o.isInTemporaryTrash).length },
                    ...staffMembers.map((member) => ({
                      id: member.id,
                      label: `${member.icon} Assigned to ${member.name}`,
                      count: orders.filter(
                        (o) => !o.isInTemporaryTrash && o.assignedStaffId === member.id
                      ).length,
                    })),
                    {
                      id: 'unassigned',
                      label: '⚪ Unassigned',
                      count: orders.filter((o) => !o.isInTemporaryTrash && !o.assignedStaffId).length,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`filter-pill-btn ${filterAssignment === tab.id ? 'active' : ''}`}
                      onClick={() => setFilterAssignment(tab.id)}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Status:</span>
              <div className="status-filter-pills">
                {[
                  { id: 'all', label: 'All Orders', count: staffFilteredOrders.length },
                  {
                    id: 'Making',
                    label: 'Making ✂️',
                    count: staffFilteredOrders.filter((o) => o.status === 'Making').length,
                  },
                  {
                    id: 'Packed',
                    label: 'Packed 📦',
                    count: staffFilteredOrders.filter((o) => o.status === 'Packed').length,
                  },
                  {
                    id: 'Delivering',
                    label: 'Delivering 🚚',
                    count: staffFilteredOrders.filter((o) => o.status === 'Delivering').length,
                  },
                  { id: 'Delivered', label: 'Done / Delivered ✅', count: doneOrders.length },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    className={`filter-pill-btn ${filterStatus === st.id ? 'active' : ''}`}
                    onClick={() => setFilterStatus(st.id)}
                  >
                    {st.label} ({st.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Orders Section */}
          {!showTemporaryTrash && filterStatus !== 'Delivered' && (
            <div
              className="staff-orders-section active-orders-section"
              style={{
                background: '#ffffff',
                border: '2px solid var(--line)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-subtle)',
                overflow: 'hidden',
                marginTop: '18px',
                marginBottom: '26px',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #fdf6ec 0%, #fef3c7 100%)',
                  padding: '16px 20px',
                  borderBottom: '2px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>📋</span>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.15rem',
                        color: 'var(--walnut-wood)',
                        fontWeight: 800,
                      }}
                    >
                      Active Orders To Fulfill
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                      In-progress orders stored in the database. Selecting{' '}
                      <strong>&ldquo;Delivered 🎉&rdquo;</strong> moves an order to the Done section.
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    background: activeOrders.length > 0 ? '#ea580c' : '#16a34a',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '999px',
                  }}
                >
                  {activeOrders.length} {activeOrders.length === 1 ? 'Order' : 'Orders'} Waiting
                </span>
              </div>
              {renderOrdersTable(activeOrders, false)}
            </div>
          )}

          {/* Done & Delivered Section */}
          {!showTemporaryTrash && (filterStatus === 'all' || filterStatus === 'Delivered') && (
            <div
              className="staff-orders-section done-orders-section"
              style={{
                background: '#ffffff',
                border: '2px solid #86efac',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 18px rgba(22, 101, 52, 0.08)',
                overflow: 'hidden',
                marginBottom: '28px',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  padding: '16px 20px',
                  borderBottom: '2px solid #bbf7d0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>✅</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#166534', fontWeight: 800 }}>
                      Done &amp; Delivered Section
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#15803d' }}>
                      Completed customer deliveries.
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    background: '#166534',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '999px',
                  }}
                >
                  {doneOrders.length} Done / Delivered
                </span>
              </div>
              {renderOrdersTable(doneOrders, true)}
            </div>
          )}

          {/* Temporary Trash View */}
          {showTemporaryTrash && (
            <div
              className="staff-orders-section"
              style={{
                background: '#ffffff',
                border: '2px solid #d1d5db',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-subtle)',
                overflow: 'hidden',
                marginTop: '18px',
                marginBottom: '28px',
              }}
            >
              <div
                style={{
                  background: '#f3f4f6',
                  padding: '16px 20px',
                  borderBottom: '2px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>🗑️</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#374151', fontWeight: 800 }}>
                      Temporary Trash
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#4b5563' }}>
                      Orders here are hidden from Done and can be restored anytime.
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#374151' }}>
                  {temporaryTrashOrders.length} Trashed
                </span>
              </div>
              {renderOrdersTable(temporaryTrashOrders, true, true)}
            </div>
          )}
        </div>
      ) : (
        /* ==================== SECTION 2 VIEW: INVENTORY MANAGEMENT ==================== */
        <div className="admin-dashboard-content">
          <div
            className="admin-header-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--walnut-wood)' }}>
                📦 Inventory &amp; Product Database
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-soft)', fontSize: '0.88rem' }}>
                Add new products, upload or edit pictures, update pricing, and adjust live stock levels.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="primary-button add-product-btn"
                onClick={handleOpenAddModal}
                style={{ background: '#16a34a', borderColor: '#15803d' }}
              >
                + Add New Product
              </button>
              <Link href="/catalog" className="secondary-button" style={{ fontSize: '0.84rem' }}>
                📖 View Master Catalog
              </Link>
            </div>
          </div>

          {/* Metric Tiles */}
          <div className="staff-metrics-grid" style={{ margin: '18px 0' }}>
            <div className="metric-box">
              <span className="metric-label">Total Catalog Products</span>
              <strong className="metric-val">{products.length}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Total Units in Stock</span>
              <strong className="metric-val">{totalStockCount}</strong>
            </div>
            {staffMembers.map((member) => (
              <div className="metric-box" key={member.id}>
                <span className="metric-label">
                  {member.icon} {member.name}
                </span>
                <strong className="metric-val">
                  {products.filter((p) => p.staffInCharge === member.id).length}
                </strong>
              </div>
            ))}
            {lowStockCount > 0 && (
              <div
                className="metric-box"
                style={{ borderColor: '#fca5a5', background: '#fff1f2' }}
              >
                <span className="metric-label" style={{ color: '#be123c' }}>
                  ⚠️ Low Stock (&le; 5)
                </span>
                <strong className="metric-val" style={{ color: '#be123c' }}>
                  {lowStockCount}
                </strong>
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div
            className="staff-filter-bar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#ffffff',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--line)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search products by name, item number, or tag..."
                value={invSearchQuery}
                onChange={(e) => setInvSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '260px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--line)',
                  fontSize: '0.88rem',
                }}
              />

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={invDeptFilter}
                  onChange={(e) => setInvDeptFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--line)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  <option value="all">All Staff Leads</option>
                  {staffMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.icon} {member.name}
                    </option>
                  ))}
                  <option value="unassigned">⚪ Unassigned</option>
                </select>

                <select
                  value={invCategoryFilter}
                  onChange={(e) => setInvCategoryFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--line)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="3d-prints">🐉 3D Prints &amp; Fidgets</option>
                  <option value="bracelets">🌈 Rainbow Loom &amp; Bracelets</option>
                  <option value="blind-boxes">🎁 Blind Boxes</option>
                  <option value="clickers">⌨️ Clickers</option>
                  <option value="dragon-puppets">🐲 Dragon Puppets</option>
                </select>

                <select
                  value={invStockFilter}
                  onChange={(e) => setInvStockFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--line)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  <option value="all">All Stock Levels</option>
                  <option value="low">⚠️ Low Stock (&le; 5)</option>
                  <option value="out">❌ Out of Stock (0)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Reset database to initial catalog defaults"
                >
                  🔄 Reset Defaults
                </button>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="staff-orders-table-wrapper" style={{ marginBottom: '32px' }}>
            <table className="staff-orders-table admin-products-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Picture</th>
                  <th>Item Details &amp; Lead</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Quantity</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No products match your current search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const staff = resolveStaffMember(p.staffInCharge);
                    const stock = p.stock !== undefined ? p.stock : 25;
                    const isLow = stock <= 5;
                    const isOut = stock === 0;

                    return (
                      <tr key={p.id} className="order-row">
                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          <ProductThumbnail
                            imageUrl={p.imageUrl}
                            icon={p.icon}
                            alt={p.name}
                            size={56}
                          />
                        </td>

                        <td>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '2px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: '#f1f5f9',
                                color: '#475569',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {p.itemNumber || `Item ${p.id}`}
                            </span>
                            {p.tag && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                }}
                              >
                                {p.tag}
                              </span>
                            )}
                            {p.isBlindBox && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: '#fce7f3',
                                  color: '#9d174d',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                }}
                              >
                                🎁 Blind Box
                              </span>
                            )}
                          </div>

                          <strong
                            style={{
                              fontSize: '0.94rem',
                              color: 'var(--walnut-wood)',
                              display: 'block',
                            }}
                          >
                            {p.name}
                          </strong>
                          <p
                            style={{
                              margin: '2px 0 6px',
                              fontSize: '0.78rem',
                              color: 'var(--text-soft)',
                              maxWidth: '420px',
                              lineHeight: 1.35,
                            }}
                          >
                            {p.description}
                          </p>

                          {staff && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: staff.colorBg,
                                color: staff.colorText,
                                border: `1px solid ${staff.colorBorder}`,
                              }}
                            >
                              {staff.icon} {staff.name}
                            </span>
                          )}
                        </td>

                        <td>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                            {p.categoryLabel || p.category}
                          </div>
                          {p.subCategoryLabel && (
                            <small style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {p.subCategoryLabel}
                            </small>
                          )}
                        </td>

                        <td>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--terracotta)' }}>
                            {p.displayPrice}
                          </strong>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p, -1)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                              }}
                              title="Decrease stock"
                            >
                              -
                            </button>
                            <span
                              style={{
                                minWidth: '32px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#1e293b',
                              }}
                            >
                              {stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p, 1)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                              }}
                              title="Increase stock"
                            >
                              +
                            </button>
                          </div>

                          <div style={{ marginTop: '4px' }}>
                            {isOut ? (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  color: '#dc2626',
                                  background: '#fee2e2',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  color: '#d97706',
                                  background: '#fef3c7',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                Low Stock
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a' }}>
                                ✓ In Stock
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: '1px solid #3b82f6',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit Details &amp; Picture
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteCandidate(p)}
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: '1px solid #fca5a5',
                                background: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Add / Edit Product Popup Dialog */}
          {isEditModalOpen && (
            <div
              className="modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-product-dialog-title"
              onClick={() => setIsEditModalOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
            >
              <div
                className="admin-edit-modal-box"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '2px solid var(--line)',
                  width: '100%',
                  maxWidth: '680px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '24px',
                  boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '18px',
                    paddingBottom: '12px',
                    borderBottom: '1.5px solid var(--line)',
                  }}
                >
                  <h3
                    id="edit-product-dialog-title"
                    style={{ margin: 0, fontSize: '1.25rem', color: 'var(--walnut-wood)' }}
                  >
                    {editingProduct
                      ? `✏️ Edit Product #${editingProduct.id}`
                      : '✨ Add New Product to Inventory'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    aria-label="Close product dialog"
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      width: '34px',
                      height: '34px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={handleSaveProduct}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Silk Articulated Crystal Dragon"
                        required
                        className="checkout-input"
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        Short Name
                      </label>
                      <input
                        type="text"
                        value={formShortName}
                        onChange={(e) => setFormShortName(e.target.value)}
                        placeholder="e.g. Crystal Dragon"
                        className="checkout-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        Item Code / SKU
                      </label>
                      <input
                        type="text"
                        value={formItemNumber}
                        onChange={(e) => setFormItemNumber(e.target.value)}
                        placeholder="e.g. 3D 08"
                        className="checkout-input"
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        Price (e.g. $4.50) *
                      </label>
                      <input
                        type="text"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="$4.50"
                        required
                        className="checkout-input"
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        Stock Units
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(Number(e.target.value))}
                        className="checkout-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        Staff In Charge
                      </label>
                      <select
                        value={formStaffLead}
                        onChange={(e) => setFormStaffLead(e.target.value)}
                        className="checkout-select"
                        style={{ width: '100%' }}
                      >
                        <option value="">⚪ Unassigned</option>
                        {staffMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.icon} {member.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          const cat = e.target.value;
                          const meta = CATEGORY_METADATA[cat] || CATEGORY_METADATA['3d-prints'];
                          setFormCategory(cat);
                          setFormCategoryLabel(meta.label);
                          setFormSubCategory(meta.defaultSub);
                          setFormSubCategoryLabel(meta.subOptions[0]?.label || '');
                        }}
                        className="checkout-select"
                        style={{ width: '100%' }}
                      >
                        <option value="3d-prints">🐉 3D Prints &amp; Fidgets</option>
                        <option value="bracelets">🌈 Bracelets &amp; Rainbow Loom</option>
                        <option value="blind-boxes">🎁 Blind Box Section</option>
                        <option value="clickers">⌨️ Switch Clickers</option>
                        <option value="dragon-puppets">🐲 Dragon Puppets</option>
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        Sub-Category
                      </label>
                      <select
                        value={formSubCategory}
                        onChange={(e) => {
                          const sub = e.target.value;
                          const meta = CATEGORY_METADATA[formCategory] || CATEGORY_METADATA['3d-prints'];
                          const found = meta.subOptions.find((s) => s.id === sub);
                          setFormSubCategory(sub);
                          setFormSubCategoryLabel(found?.label || '');
                        }}
                        className="checkout-select"
                        style={{ width: '100%' }}
                      >
                        {(CATEGORY_METADATA[formCategory]?.subOptions || []).map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Picture / Image Management */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: 'var(--walnut-wood)',
                        marginBottom: '8px',
                      }}
                    >
                      📸 Product Picture &amp; Icon
                    </label>

                    <div
                      style={{
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                      }}
                    >
                      <ProductThumbnail
                        imageUrl={formImageUrl}
                        icon={formIcon}
                        alt="Preview"
                        size={90}
                      />

                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          minWidth: '240px',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: '1.5px solid #0284c7',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              cursor: 'pointer',
                            }}
                          >
                            {isUploading ? 'Uploading...' : '📁 Upload Picture from Device'}
                          </button>
                          {formImageUrl && (
                            <button
                              type="button"
                              onClick={() => setFormImageUrl('')}
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.76rem',
                                color: '#ef4444',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              ✕ Remove Picture
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          placeholder="Or paste picture URL (/images/products/... or https://...)"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          className="checkout-input"
                          style={{ fontSize: '0.8rem' }}
                        />

                        <div>
                          <small
                            style={{
                              fontSize: '0.72rem',
                              color: '#64748b',
                              display: 'block',
                              marginBottom: '4px',
                            }}
                          >
                            Or choose from studio preset images:
                          </small>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {PRESET_IMAGES.map((img) => (
                              <button
                                key={img.path}
                                type="button"
                                onClick={() => setFormImageUrl(img.path)}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '3px 7px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: formImageUrl === img.path ? '#2563eb' : '#ffffff',
                                  color: formImageUrl === img.path ? '#ffffff' : '#334155',
                                  cursor: 'pointer',
                                }}
                              >
                                {img.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        Fallback Icon:
                      </label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {PRESET_ICONS.map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setFormIcon(ic)}
                            style={{
                              fontSize: '1.2rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: formIcon === ic ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                              background: formIcon === ic ? '#eff6ff' : '#ffffff',
                              cursor: 'pointer',
                            }}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        marginBottom: '4px',
                      }}
                    >
                      Tag / Feature Badge
                    </label>
                    <input
                      type="text"
                      value={formTag}
                      onChange={(e) => setFormTag(e.target.value)}
                      placeholder="e.g. Fan Favorite, Limited Edition"
                      className="checkout-input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        marginBottom: '4px',
                      }}
                    >
                      Product Description
                    </label>
                    <textarea
                      rows={4}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe what makes this craft item special..."
                      className="checkout-input"
                      style={{ width: '100%', minHeight: '96px', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        marginBottom: '4px',
                      }}
                    >
                      Craft Materials / Ingredients
                    </label>
                    <textarea
                      rows={3}
                      value={formMaterials}
                      onChange={(e) => setFormMaterials(e.target.value)}
                      placeholder="e.g. Eco-friendly PLA filament, latex-free bands"
                      className="checkout-input"
                      style={{ width: '100%', minHeight: '76px', resize: 'vertical' }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: '#fdf2f8',
                      border: '1px solid #fbcfe8',
                      borderRadius: '8px',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="modal-blind-box"
                      checked={formIsBlindBox}
                      onChange={(e) => setFormIsBlindBox(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
                    />
                    <label
                      htmlFor="modal-blind-box"
                      style={{ fontSize: '0.84rem', fontWeight: 700, color: '#9d174d', cursor: 'pointer' }}
                    >
                      🎁 Mark as Mystery Blind Box
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '10px',
                      marginTop: '12px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="secondary-button"
                      style={{ padding: '8px 16px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={isSavingProduct}
                      style={{
                        padding: '8px 20px',
                        background: '#16a34a',
                        borderColor: '#15803d',
                      }}
                    >
                      {isSavingProduct
                        ? 'Saving...'
                        : editingProduct
                          ? 'Save Changes ✨'
                          : 'Add to Catalog 🎉'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Popup Dialog */}
          {deleteCandidate && (
            <div
              className="modal-backdrop"
              role="dialog"
              aria-modal="true"
              onClick={() => setDeleteCandidate(null)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
            >
              <div
                className="admin-edit-modal-box"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '2px solid var(--line)',
                  width: '100%',
                  maxWidth: '460px',
                  padding: '24px',
                  textAlign: 'center',
                  boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🗑️</div>
                <h3 style={{ margin: '0 0 8px', color: '#b91c1c' }}>Delete Product?</h3>
                <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '20px' }}>
                  Are you sure you want to delete{' '}
                  <strong>&ldquo;{deleteCandidate.name}&rdquo;</strong> from the database?
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setDeleteCandidate(null)}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteProduct}
                    className="primary-button"
                    style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                  >
                    Yes, Delete Product
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Confirmation Popup Dialog */}
          {isResetConfirmOpen && (
            <div
              className="modal-backdrop"
              role="dialog"
              aria-modal="true"
              onClick={() => setIsResetConfirmOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
            >
              <div
                className="admin-edit-modal-box"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '2px solid var(--line)',
                  width: '100%',
                  maxWidth: '460px',
                  padding: '24px',
                  textAlign: 'center',
                  boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔄</div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--walnut-wood)' }}>
                  Reset Database to Defaults?
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '20px' }}>
                  This will reload all original craft products into the database.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      sound.playFanfare();
                      await resetInventory();
                      showNotice('Database reset to default catalog!');
                      setIsResetConfirmOpen(false);
                    }}
                    className="primary-button"
                  >
                    Yes, Reset Catalog
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StaffPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="home-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p>Loading Staff Portal...</p>
        </div>
      }
    >
      <StaffPortalContent />
    </Suspense>
  );
}
