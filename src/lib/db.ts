import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { craftItems } from '@/data/items';

export interface DbProduct {
  id: string | number;
  itemNumber: string;
  name: string;
  shortName: string;
  category: string;
  categoryLabel: string;
  subCategory: string;
  subCategoryLabel: string;
  staffInCharge: string;
  stock: number;
  price: number;
  displayPrice: string;
  tag: string;
  accent: string;
  icon: string;
  imageUrl?: string;
  description: string;
  materials: string;
  isBlindBox?: boolean;
  sizes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'inventory.db');

export interface DbStaffUser {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  fullName: string;
  role: string;
  department: string;
  departmentShort: string;
  icon: string;
  description: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  isActive: number;
  permissions: string;
  createdAt: string;
  updatedAt: string;
}

export function hashStaffPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  return {
    salt,
    hash: crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex'),
  };
}

export function verifyStaffPassword(password: string, passwordHash: string, salt: string): boolean {
  if (!password || !passwordHash || !salt) return false;

  try {
    const candidateHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
    return crypto.timingSafeEqual(
      Buffer.from(candidateHash, 'hex'),
      Buffer.from(passwordHash, 'hex')
    );
  } catch {
    return false;
  }
}

let dbInstance: any = null;

function getDb() {
  if (dbInstance) return dbInstance;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(dbPath);

    // Initialize Schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        itemNumber TEXT,
        name TEXT NOT NULL,
        shortName TEXT,
        category TEXT NOT NULL,
        categoryLabel TEXT,
        subCategory TEXT,
        subCategoryLabel TEXT,
        staffInCharge TEXT,
        stock INTEGER DEFAULT 25,
        price REAL DEFAULT 0,
        displayPrice TEXT,
        tag TEXT,
        accent TEXT DEFAULT 'butter',
        icon TEXT DEFAULT '✨',
        imageUrl TEXT,
        description TEXT,
        materials TEXT,
        isBlindBox INTEGER DEFAULT 0,
        sizes TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS staff_users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        passwordSalt TEXT NOT NULL,
        fullName TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT,
        departmentShort TEXT,
        icon TEXT DEFAULT '👤',
        description TEXT,
        colorBg TEXT DEFAULT '#eff6ff',
        colorBorder TEXT DEFAULT '#bfdbfe',
        colorText TEXT DEFAULT '#1e3a8a',
        isActive INTEGER DEFAULT 1,
        permissions TEXT DEFAULT '[]',
        createdAt TEXT,
        updatedAt TEXT
      );
    `);

    ensureDefaultStaffUsers(db);

    // Check if table is empty; if so, seed from craftItems
    const countRow: any = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (!countRow || countRow.count === 0) {
      seedProducts(db);
    }

    dbInstance = db;
    return dbInstance;
  } catch (err) {
    console.error('Failed to initialize SQLite DatabaseSync:', err);
    return null;
  }
}

function ensureDefaultStaffUsers(db: any) {
  const rows: any = db.prepare('SELECT COUNT(*) as count FROM staff_users').get();
  if (!rows || rows.count > 0) return;

  const envEntries: Array<{ username: string; password: string; fullName: string; role: string; department: string; departmentShort: string; icon: string; description: string; colorBg: string; colorBorder: string; colorText: string }> = [];

  const candidateNames = [
    ['STAFF_DEFAULT_USERNAME', 'STAFF_DEFAULT_PASSWORD', 'Staff Admin', 'Lead Manager', 'Operations', 'Operations', '👑', 'Default staff admin account', '#dbeafe', '#93c5fd', '#1e40af'],
    ['STAFF_ADMIN_USERNAME', 'STAFF_ADMIN_PASSWORD', 'Store Admin', 'Administrator', 'Operations', 'Admin', '🛠️', 'Store administrator account', '#fef3c7', '#fcd34d', '#92400e'],
  ];

  for (const [usernameKey, passwordKey, fullName, role, department, departmentShort, icon, description, colorBg, colorBorder, colorText] of candidateNames) {
    const username = process.env[usernameKey];
    const password = process.env[passwordKey];
    if (!username || !password) continue;

    envEntries.push({
      username: username.trim().toLowerCase(),
      password,
      fullName,
      role,
      department,
      departmentShort,
      icon,
      description,
      colorBg,
      colorBorder,
      colorText,
    });
  }

  if (envEntries.length === 0) return;

  const insert = db.prepare(`
    INSERT INTO staff_users (
      id, username, passwordHash, passwordSalt, fullName, role,
      department, departmentShort, icon, description,
      colorBg, colorBorder, colorText, isActive, permissions,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const entry of envEntries) {
    const { hash, salt } = hashStaffPassword(entry.password);
    insert.run(
      `staff_${entry.username.replace(/[^a-z0-9]+/g, '_')}`,
      entry.username,
      hash,
      salt,
      entry.fullName,
      entry.role,
      entry.department,
      entry.departmentShort,
      entry.icon,
      entry.description,
      entry.colorBg,
      entry.colorBorder,
      entry.colorText,
      1,
      JSON.stringify(['manage_orders', 'manage_inventory', 'view_dashboard']),
      now,
      now
    );
  }
}

export function getAllStaffUsers(): DbStaffUser[] {
  const db = getDb();
  if (!db) return [];

  const rows: any[] = db.prepare('SELECT * FROM staff_users WHERE isActive = 1 ORDER BY fullName ASC').all();
  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    passwordHash: row.passwordHash,
    passwordSalt: row.passwordSalt,
    fullName: row.fullName,
    role: row.role,
    department: row.department || 'Operations',
    departmentShort: row.departmentShort || row.department || 'Operations',
    icon: row.icon || '👤',
    description: row.description || '',
    colorBg: row.colorBg || '#eff6ff',
    colorBorder: row.colorBorder || '#bfdbfe',
    colorText: row.colorText || '#1e3a8a',
    isActive: Number(row.isActive) || 0,
    permissions: row.permissions || '[]',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export function getStaffByUsername(username: string): DbStaffUser | null {
  const db = getDb();
  if (!db) return null;

  const normalizedUsername = username.trim().toLowerCase();
  const row: any = db.prepare('SELECT * FROM staff_users WHERE username = ? AND isActive = 1').get(normalizedUsername);
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    passwordHash: row.passwordHash,
    passwordSalt: row.passwordSalt,
    fullName: row.fullName,
    role: row.role,
    department: row.department || 'Operations',
    departmentShort: row.departmentShort || row.department || 'Operations',
    icon: row.icon || '👤',
    description: row.description || '',
    colorBg: row.colorBg || '#eff6ff',
    colorBorder: row.colorBorder || '#bfdbfe',
    colorText: row.colorText || '#1e3a8a',
    isActive: Number(row.isActive) || 0,
    permissions: row.permissions || '[]',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createStaffUser(input: Partial<DbStaffUser> & { password: string; username: string; fullName: string; role?: string; department?: string; departmentShort?: string; }): DbStaffUser | null {
  const db = getDb();
  if (!db) return null;

  const username = input.username.trim().toLowerCase();
  const now = new Date().toISOString();
  const { hash, salt } = hashStaffPassword(input.password);
  const id = input.id || `staff_${username.replace(/[^a-z0-9]+/g, '_')}`;

  try {
    db.prepare(`
      INSERT INTO staff_users (
        id, username, passwordHash, passwordSalt, fullName, role,
        department, departmentShort, icon, description,
        colorBg, colorBorder, colorText, isActive, permissions,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      username,
      hash,
      salt,
      input.fullName,
      input.role || 'Staff',
      input.department || 'Operations',
      input.departmentShort || input.department || 'Operations',
      input.icon || '👤',
      input.description || '',
      input.colorBg || '#eff6ff',
      input.colorBorder || '#bfdbfe',
      input.colorText || '#1e3a8a',
      1,
      JSON.stringify(input.permissions ? (Array.isArray(input.permissions) ? input.permissions : [input.permissions]) : []),
      now,
      now
    );
  } catch {
    return null;
  }

  return getStaffByUsername(username);
}

function seedProducts(db: any) {
  const insert = db.prepare(`
    INSERT INTO products (
      id, itemNumber, name, shortName, category, categoryLabel,
      subCategory, subCategoryLabel, staffInCharge, stock, price,
      displayPrice, tag, accent, icon, imageUrl, description,
      materials, isBlindBox, sizes, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  const now = new Date().toISOString();

  for (const it of craftItems) {
    const priceNum = parseFloat(it.displayPrice.replace(/[^0-9.]/g, '')) || 0;
      const staff = (it as any).staffInCharge || '';
    insert.run(
      String(it.id),
      it.itemNumber || `Item ${it.id}`,
      it.name,
      it.shortName || it.name,
      it.category,
      it.categoryLabel || it.category,
      it.subCategory || 'all',
      it.subCategoryLabel || '',
      staff,
      25,
      priceNum,
      it.displayPrice,
      it.tag || '',
      it.accent || 'butter',
      it.icon || '✨',
      it.imageUrl || '',
      it.description || '',
      it.materials || '',
      it.isBlindBox ? 1 : 0,
      it.sizes ? JSON.stringify(it.sizes) : '',
      now,
      now
    );
  }
}

function rowToProduct(row: any): DbProduct {
  let sizes: string[] | undefined = undefined;
  if (row.sizes) {
    try {
      sizes = JSON.parse(row.sizes);
    } catch {
      sizes = undefined;
    }
  }

  const numId = Number(row.id);
  const finalId = !isNaN(numId) && String(numId) === String(row.id) ? numId : row.id;

  return {
    id: finalId,
    itemNumber: row.itemNumber || `Item ${row.id}`,
    name: row.name,
    shortName: row.shortName || row.name,
    category: row.category,
    categoryLabel: row.categoryLabel || row.category,
    subCategory: row.subCategory || 'all',
    subCategoryLabel: row.subCategoryLabel || '',
    staffInCharge: row.staffInCharge || 'anna',
    stock: typeof row.stock === 'number' ? row.stock : 25,
    price: typeof row.price === 'number' ? row.price : 0,
    displayPrice: row.displayPrice || '$0.00',
    tag: row.tag || '',
    accent: row.accent || 'butter',
    icon: row.icon || '✨',
    imageUrl: row.imageUrl || '',
    description: row.description || '',
    materials: row.materials || '',
    isBlindBox: Boolean(row.isBlindBox),
    sizes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function getAllProducts(): DbProduct[] {
  const db = getDb();
  if (!db) {
    return craftItems.map((it) => ({
      ...it,
      staffInCharge: it.staffInCharge || '',
      stock: 25,
      price: parseFloat(it.displayPrice.replace(/[^0-9.]/g, '')) || 0,
    }));
  }

  const rows: any[] = db.prepare('SELECT * FROM products ORDER BY rowid ASC').all();
  return rows.map(rowToProduct);
}

export function getProductById(id: string | number): DbProduct | null {
  const db = getDb();
  if (!db) return null;
  const row: any = db.prepare('SELECT * FROM products WHERE id = ?').get(String(id));
  return row ? rowToProduct(row) : null;
}

export function addProduct(item: Partial<DbProduct>): DbProduct {
  const db = getDb();
  const id = item.id !== undefined ? String(item.id) : `p_${Date.now()}`;
  const now = new Date().toISOString();
  const priceNum = typeof item.price === 'number' ? item.price : parseFloat(String(item.displayPrice || '0').replace(/[^0-9.]/g, '')) || 0;
  const displayPrice = item.displayPrice || `$${priceNum.toFixed(2)}`;
  const staff = item.staffInCharge || '';

  if (db) {
    const insert = db.prepare(`
      INSERT INTO products (
        id, itemNumber, name, shortName, category, categoryLabel,
        subCategory, subCategoryLabel, staffInCharge, stock, price,
        displayPrice, tag, accent, icon, imageUrl, description,
        materials, isBlindBox, sizes, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    insert.run(
      id,
      item.itemNumber || `Item ${id}`,
      item.name || 'Untitled Craft Item',
      item.shortName || item.name || 'Untitled Craft Item',
      item.category || '3d-prints',
      item.categoryLabel || item.category || '3D Prints & Fidgets',
      item.subCategory || 'all',
      item.subCategoryLabel || '',
      staff,
      item.stock !== undefined ? Number(item.stock) : 25,
      priceNum,
      displayPrice,
      item.tag || '',
      item.accent || 'butter',
      item.icon || '✨',
      item.imageUrl || '',
      item.description || '',
      item.materials || '',
      item.isBlindBox ? 1 : 0,
      item.sizes ? JSON.stringify(item.sizes) : '',
      now,
      now
    );
  }

  const numId = Number(id);
  const finalId = !isNaN(numId) && String(numId) === id ? numId : id;

  return {
    id: finalId,
    itemNumber: item.itemNumber || `Item ${id}`,
    name: item.name || 'Untitled Craft Item',
    shortName: item.shortName || item.name || 'Untitled Craft Item',
    category: item.category || '3d-prints',
    categoryLabel: item.categoryLabel || item.category || '3D Prints & Fidgets',
    subCategory: item.subCategory || 'all',
    subCategoryLabel: item.subCategoryLabel || '',
    staffInCharge: staff,
    stock: item.stock !== undefined ? Number(item.stock) : 25,
    price: priceNum,
    displayPrice,
    tag: item.tag || '',
    accent: item.accent || 'butter',
    icon: item.icon || '✨',
    imageUrl: item.imageUrl || '',
    description: item.description || '',
    materials: item.materials || '',
    isBlindBox: Boolean(item.isBlindBox),
    sizes: item.sizes,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateProduct(id: string | number, item: Partial<DbProduct>): DbProduct | null {
  const db = getDb();
  const existing = getProductById(id);
  if (!existing && !db) return null;

  const updated: DbProduct = {
    ...existing!,
    ...item,
    id: existing?.id ?? id,
    updatedAt: new Date().toISOString(),
  };

  if (item.displayPrice && item.price === undefined) {
    updated.price = parseFloat(item.displayPrice.replace(/[^0-9.]/g, '')) || 0;
  }

  if (db) {
    const stmt = db.prepare(`
      UPDATE products SET
        itemNumber = ?,
        name = ?,
        shortName = ?,
        category = ?,
        categoryLabel = ?,
        subCategory = ?,
        subCategoryLabel = ?,
        staffInCharge = ?,
        stock = ?,
        price = ?,
        displayPrice = ?,
        tag = ?,
        accent = ?,
        icon = ?,
        imageUrl = ?,
        description = ?,
        materials = ?,
        isBlindBox = ?,
        sizes = ?,
        updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.itemNumber,
      updated.name,
      updated.shortName,
      updated.category,
      updated.categoryLabel,
      updated.subCategory,
      updated.subCategoryLabel,
      updated.staffInCharge,
      Number(updated.stock) || 0,
      Number(updated.price) || 0,
      updated.displayPrice,
      updated.tag || '',
      updated.accent || 'butter',
      updated.icon || '✨',
      updated.imageUrl || '',
      updated.description || '',
      updated.materials || '',
      updated.isBlindBox ? 1 : 0,
      updated.sizes ? JSON.stringify(updated.sizes) : '',
      updated.updatedAt || new Date().toISOString(),
      String(id)
    );
  }

  return updated;
}

export function deleteProduct(id: string | number): boolean {
  const db = getDb();
  if (!db) return false;
  const stmt = db.prepare('DELETE FROM products WHERE id = ?');
  stmt.run(String(id));
  return true;
}

export function resetProducts(): DbProduct[] {
  const db = getDb();
  if (db) {
    db.exec('DELETE FROM products');
    seedProducts(db);
  }
  return getAllProducts();
}

