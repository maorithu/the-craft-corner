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

type D1PreparedStatement = {
  bind: (...args: any[]) => D1PreparedStatement;
  first: () => Promise<any>;
  all: () => Promise<any>;
  run: () => Promise<any>;
};

type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatement;
  exec: (query: string) => Promise<any>;
};

type CloudflareEnv = {
  DB?: D1DatabaseLike;
};

function isD1Database(value: unknown): value is D1DatabaseLike {
  return !!value && typeof value === 'object' && 'prepare' in value && typeof (value as any).prepare === 'function';
}

function resolveD1Binding(env?: CloudflareEnv): D1DatabaseLike | undefined {
  if (isD1Database(env?.DB)) return env.DB;
  return undefined;
}

const isFilesystemAvailable = Boolean(fs && typeof fs.existsSync === 'function' && typeof fs.mkdirSync === 'function');

const dbPath = (() => {
  if (!isFilesystemAvailable) {
    return ':memory:';
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'inventory.db');
  } catch {
    return ':memory:';
  }
})();

async function ensureD1Schema(db: D1DatabaseLike) {
  await db.exec(`
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

  await db.exec(`
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
}

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

async function getDb(env?: CloudflareEnv) {
  const d1Db = resolveD1Binding(env);
  if (isD1Database(d1Db)) {
    await ensureD1Schema(d1Db);
    return d1Db;
  }

  if (dbInstance) return dbInstance;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(dbPath);

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

function mapStaffUserRow(row: any): DbStaffUser {
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

export async function getAllStaffUsers(env?: CloudflareEnv): Promise<DbStaffUser[]> {
  const db = await getDb(env);
  if (!db) return [];

  if (isD1Database(db)) {
    const rows = await db.prepare('SELECT * FROM staff_users WHERE isActive = 1 ORDER BY fullName ASC').all();
    return (rows.results || []).map(mapStaffUserRow);
  }

  const rows: any[] = db.prepare('SELECT * FROM staff_users WHERE isActive = 1 ORDER BY fullName ASC').all();
  return rows.map(mapStaffUserRow);
}

export async function getStaffByUsername(username: string, env?: CloudflareEnv): Promise<DbStaffUser | null> {
  const db = await getDb(env);
  if (!db) return null;

  const normalizedUsername = username.trim().toLowerCase();

  if (isD1Database(db)) {
    const row = await db.prepare('SELECT * FROM staff_users WHERE username = ? AND isActive = 1').bind(normalizedUsername).first();
    return row ? mapStaffUserRow(row) : null;
  }

  const row: any = db.prepare('SELECT * FROM staff_users WHERE username = ? AND isActive = 1').get(normalizedUsername);
  if (!row) return null;
  return mapStaffUserRow(row);
}

function normalizePermissions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((entry): entry is string => typeof entry === 'string');
      }
    } catch {
      return value ? [value] : [];
    }

    return value ? [value] : [];
  }

  return [];
}

export async function createStaffUser(
  input: Partial<Omit<DbStaffUser, 'permissions'>> & {
    password: string;
    username: string;
    fullName: string;
    role?: string;
    department?: string;
    departmentShort?: string;
    permissions?: string[] | string;
  },
  env?: CloudflareEnv,
): Promise<DbStaffUser | null> {
  const db = await getDb(env);
  if (!db) return null;

  const username = input.username.trim().toLowerCase();
  const now = new Date().toISOString();
  const { hash, salt } = hashStaffPassword(input.password);
  const id = input.id || `staff_${username.replace(/[^a-z0-9]+/g, '_')}`;
  const permissions = normalizePermissions(input.permissions);

  try {
    if (isD1Database(db)) {
      await db.prepare(`
        INSERT INTO staff_users (
          id, username, passwordHash, passwordSalt, fullName, role,
          department, departmentShort, icon, description,
          colorBg, colorBorder, colorText, isActive, permissions,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
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
        JSON.stringify(permissions.length > 0 ? permissions : ['manage_orders']),
        now,
        now
      ).run();
    } else {
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
        JSON.stringify(permissions.length > 0 ? permissions : ['manage_orders']),
        now,
        now
      );
    }
  } catch {
    return null;
  }

  return getStaffByUsername(username, env);
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

async function seedProductsD1(db: D1DatabaseLike) {
  const now = new Date().toISOString();

  for (const it of craftItems) {
    const priceNum = parseFloat(it.displayPrice.replace(/[^0-9.]/g, '')) || 0;
    const staff = (it as any).staffInCharge || '';
    await db.prepare(`
      INSERT INTO products (
        id, itemNumber, name, shortName, category, categoryLabel,
        subCategory, subCategoryLabel, staffInCharge, stock, price,
        displayPrice, tag, accent, icon, imageUrl, description,
        materials, isBlindBox, sizes, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `).bind(
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
    ).run();
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

export async function getAllProducts(env?: CloudflareEnv): Promise<DbProduct[]> {
  const db = await getDb(env);
  if (!db) {
    return craftItems.map((it) => ({
      ...it,
      staffInCharge: it.staffInCharge || '',
      stock: 25,
      price: parseFloat(it.displayPrice.replace(/[^0-9.]/g, '')) || 0,
    }));
  }

  if (isD1Database(db)) {
    const rows = await db.prepare('SELECT * FROM products ORDER BY rowid ASC').all();
    return (rows.results || []).map(rowToProduct);
  }

  const rows: any[] = db.prepare('SELECT * FROM products ORDER BY rowid ASC').all();
  return rows.map(rowToProduct);
}

export async function getProductById(id: string | number, env?: CloudflareEnv): Promise<DbProduct | null> {
  const db = await getDb(env);
  if (!db) return null;

  if (isD1Database(db)) {
    const row = await db.prepare('SELECT * FROM products WHERE id = ?').bind(String(id)).first();
    return row ? rowToProduct(row) : null;
  }

  const row: any = db.prepare('SELECT * FROM products WHERE id = ?').get(String(id));
  return row ? rowToProduct(row) : null;
}

export async function addProduct(item: Partial<DbProduct>, env?: CloudflareEnv): Promise<DbProduct> {
  const db = await getDb(env);
  const id = item.id !== undefined ? String(item.id) : `p_${Date.now()}`;
  const now = new Date().toISOString();
  const priceNum = typeof item.price === 'number' ? item.price : parseFloat(String(item.displayPrice || '0').replace(/[^0-9.]/g, '')) || 0;
  const displayPrice = item.displayPrice || `$${priceNum.toFixed(2)}`;
  const staff = item.staffInCharge || '';

  if (db) {
    if (isD1Database(db)) {
      await db.prepare(`
        INSERT INTO products (
          id, itemNumber, name, shortName, category, categoryLabel,
          subCategory, subCategoryLabel, staffInCharge, stock, price,
          displayPrice, tag, accent, icon, imageUrl, description,
          materials, isBlindBox, sizes, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `).bind(
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
      ).run();
    } else {
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
          ?, ?, ?, ?
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

export async function updateProduct(id: string | number, item: Partial<DbProduct>, env?: CloudflareEnv): Promise<DbProduct | null> {
  const db = await getDb(env);
  const existing = await getProductById(id, env);
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
    if (isD1Database(db)) {
      await db.prepare(`
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
      `).bind(
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
      ).run();
    } else {
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
  }

  return updated;
}

export async function deleteProduct(id: string | number, env?: CloudflareEnv): Promise<boolean> {
  const db = await getDb(env);
  if (!db) return false;

  if (isD1Database(db)) {
    await db.prepare('DELETE FROM products WHERE id = ?').bind(String(id)).run();
    return true;
  }

  const stmt = db.prepare('DELETE FROM products WHERE id = ?');
  stmt.run(String(id));
  return true;
}

export async function resetProducts(env?: CloudflareEnv): Promise<DbProduct[]> {
  const db = await getDb(env);
  if (db) {
    if (isD1Database(db)) {
      await db.exec('DELETE FROM products');
      await seedProductsD1(db);
    } else {
      db.exec('DELETE FROM products');
      seedProducts(db);
    }
  }
  return getAllProducts(env);
}

