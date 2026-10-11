import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { craftItems } from '../data/items';
import { initialOrders, OrderItemSeed, OrderSeed } from '../data/orders';

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

export type DbOrderItem = OrderItemSeed;
export type DbOrder = OrderSeed & { updatedAt?: string };

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
  try {
    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, itemNumber TEXT, name TEXT NOT NULL, shortName TEXT, category TEXT NOT NULL, categoryLabel TEXT, subCategory TEXT, subCategoryLabel TEXT, staffInCharge TEXT, stock INTEGER DEFAULT 25, price REAL DEFAULT 0, displayPrice TEXT, tag TEXT, accent TEXT DEFAULT 'butter', icon TEXT DEFAULT '✨', imageUrl TEXT, description TEXT, materials TEXT, isBlindBox INTEGER DEFAULT 0, sizes TEXT, createdAt TEXT, updatedAt TEXT)"
      )
      .run();
  } catch (e) {
    console.warn('ensureD1Schema products warning:', e);
  }

  try {
    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS staff_users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, passwordHash TEXT NOT NULL, passwordSalt TEXT NOT NULL, fullName TEXT NOT NULL, role TEXT NOT NULL, department TEXT, departmentShort TEXT, icon TEXT DEFAULT '👤', description TEXT, colorBg TEXT DEFAULT '#eff6ff', colorBorder TEXT DEFAULT '#bfdbfe', colorText TEXT DEFAULT '#1e3a8a', isActive INTEGER DEFAULT 1, permissions TEXT DEFAULT '[]', createdAt TEXT, updatedAt TEXT)"
      )
      .run();
  } catch (e) {
    console.warn('ensureD1Schema staff_users warning:', e);
  }

  try {
    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS orders (orderCode TEXT PRIMARY KEY, orderNumber INTEGER NOT NULL, customerNumber INTEGER, customerName TEXT NOT NULL, customerEmail TEXT NOT NULL, customerAddress TEXT NOT NULL, cardNumberMasked TEXT, paymentMethod TEXT DEFAULT 'paypal', paypalOrderId TEXT, items TEXT NOT NULL, total REAL NOT NULL, formattedTotal TEXT NOT NULL, pickupOrShip TEXT NOT NULL, customerNotes TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'Making', createdAt TEXT NOT NULL, freeSpoonGift INTEGER DEFAULT 0, assignedStaffId TEXT DEFAULT '', isInTemporaryTrash INTEGER DEFAULT 0, updatedAt TEXT)"
      )
      .run();
  } catch (e) {
    console.warn('ensureD1Schema orders warning:', e);
  }
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
let d1SchemaInitialized = false;
let d1InitPromise: Promise<void> | null = null;

async function getDb(env?: CloudflareEnv) {
  const d1Db = resolveD1Binding(env);
  if (isD1Database(d1Db)) {
    if (!d1SchemaInitialized) {
      if (!d1InitPromise) {
        d1InitPromise = (async () => {
          await ensureD1Schema(d1Db);

          const prodCountRow: any = await d1Db.prepare('SELECT COUNT(*) as count FROM products').first();
          if (!prodCountRow || Number(prodCountRow.count) === 0) {
            await seedProductsD1(d1Db);
          }

          const orderCountRow: any = await d1Db.prepare('SELECT COUNT(*) as count FROM orders').first();
          if (!orderCountRow || Number(orderCountRow.count) === 0) {
            await seedOrdersD1(d1Db);
          }

          d1SchemaInitialized = true;
        })().finally(() => {
          d1InitPromise = null;
        });
      }
      await d1InitPromise;
    }

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

    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        orderCode TEXT PRIMARY KEY,
        orderNumber INTEGER NOT NULL,
        customerNumber INTEGER,
        customerName TEXT NOT NULL,
        customerEmail TEXT NOT NULL,
        customerAddress TEXT NOT NULL,
        cardNumberMasked TEXT,
        paymentMethod TEXT DEFAULT 'paypal',
        paypalOrderId TEXT,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        formattedTotal TEXT NOT NULL,
        pickupOrShip TEXT NOT NULL,
        customerNotes TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Making',
        createdAt TEXT NOT NULL,
        freeSpoonGift INTEGER DEFAULT 0,
        assignedStaffId TEXT DEFAULT '',
        isInTemporaryTrash INTEGER DEFAULT 0,
        updatedAt TEXT
      );
    `);

    const prodCountRow: any = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (!prodCountRow || prodCountRow.count === 0) {
      seedProducts(db);
    }

    const orderCountRow: any = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    if (!orderCountRow || orderCountRow.count === 0) {
      seedOrders(db);
    }

    dbInstance = db;
    return dbInstance;
  } catch (err) {
    console.error('Failed to initialize SQLite DatabaseSync:', err);
    return null;
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
  env?: CloudflareEnv
): Promise<DbStaffUser | null> {
  const db = await getDb(env);
  if (!db) return null;

  const username = input.username.trim().toLowerCase();
  const now = new Date().toISOString();
  const { hash, salt } = hashStaffPassword(input.password);
  const id = input.id || `staff_${username.replace(/[^a-z0-9]+/g, '_')}`;
  const permissions = normalizePermissions(input.permissions);
  const defaultPerms = permissions.length > 0 ? permissions : ['manage_orders', 'manage_inventory'];

  try {
    if (isD1Database(db)) {
      await ensureD1Schema(db);
      await db
        .prepare(`
        INSERT INTO staff_users (
          id, username, passwordHash, passwordSalt, fullName, role,
          department, departmentShort, icon, description,
          colorBg, colorBorder, colorText, isActive, permissions,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
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
          JSON.stringify(defaultPerms),
          now,
          now
        )
        .run();
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
        JSON.stringify(defaultPerms),
        now,
        now
      );
    }
  } catch (error) {
    console.error('Failed to create staff user:', error);
    return null;
  }

  return getStaffByUsername(username, env);
}

export async function deleteStaffUser(id: string, env?: CloudflareEnv): Promise<boolean> {
  const db = await getDb(env);
  if (!db) return false;

  if (isD1Database(db)) {
    await db.prepare('DELETE FROM staff_users WHERE id = ? OR username = ?').bind(id, id.toLowerCase()).run();
    return true;
  }

  db.prepare('DELETE FROM staff_users WHERE id = ? OR username = ?').run(id, id.toLowerCase());
  return true;
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
    const staff = it.staffInCharge || '';
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
    const staff = it.staffInCharge || '';
    await db
      .prepare(`
      INSERT OR IGNORE INTO products (
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
    `)
      .bind(
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
      )
      .run();
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
    staffInCharge: row.staffInCharge || '',
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
  const priceNum =
    typeof item.price === 'number'
      ? item.price
      : parseFloat(String(item.displayPrice || '0').replace(/[^0-9.]/g, '')) || 0;
  const displayPrice = item.displayPrice || `$${priceNum.toFixed(2)}`;
  const staff = item.staffInCharge || '';

  if (db) {
    if (isD1Database(db)) {
      await db
        .prepare(`
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
      `)
        .bind(
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
        )
        .run();
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

export async function updateProduct(
  id: string | number,
  item: Partial<DbProduct>,
  env?: CloudflareEnv
): Promise<DbProduct | null> {
  const db = await getDb(env);
  const existing = await getProductById(id, env);
  if (!existing && !db) return null;

  const base: DbProduct = existing || {
    id,
    itemNumber: item.itemNumber || `Item ${id}`,
    name: item.name || 'Untitled Craft Item',
    shortName: item.shortName || item.name || 'Untitled Craft Item',
    category: item.category || '3d-prints',
    categoryLabel: item.categoryLabel || item.category || '3D Prints & Fidgets',
    subCategory: item.subCategory || 'all',
    subCategoryLabel: item.subCategoryLabel || '',
    staffInCharge: item.staffInCharge || '',
    stock: item.stock !== undefined ? Number(item.stock) : 25,
    price: typeof item.price === 'number' ? item.price : 0,
    displayPrice: item.displayPrice || '$0.00',
    tag: item.tag || '',
    accent: item.accent || 'butter',
    icon: item.icon || '✨',
    imageUrl: item.imageUrl || '',
    description: item.description || '',
    materials: item.materials || '',
    isBlindBox: Boolean(item.isBlindBox),
  };

  const updated: DbProduct = {
    ...base,
    ...item,
    id: base.id,
    updatedAt: new Date().toISOString(),
  };

  if (item.displayPrice && item.price === undefined) {
    updated.price = parseFloat(item.displayPrice.replace(/[^0-9.]/g, '')) || 0;
  } else if (item.price !== undefined && !item.displayPrice) {
    updated.displayPrice = `$${Number(item.price).toFixed(2)}`;
  }

  if (db) {
    if (isD1Database(db)) {
      await db
        .prepare(`
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
      `)
        .bind(
          updated.itemNumber,
          updated.name,
          updated.shortName,
          updated.category,
          updated.categoryLabel,
          updated.subCategory,
          updated.subCategoryLabel,
          updated.staffInCharge || '',
          Number(updated.stock ?? 25),
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
        )
        .run();
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
        updated.staffInCharge || '',
        Number(updated.stock ?? 25),
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
      await db.prepare('DELETE FROM products').run();
      await seedProductsD1(db);
    } else {
      db.exec('DELETE FROM products');
      seedProducts(db);
    }
  }
  return getAllProducts(env);
}

// ==================== ORDERS DATABASE OPERATIONS ====================

function seedOrders(db: any) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO orders (
      orderCode, orderNumber, customerNumber, customerName, customerEmail,
      customerAddress, cardNumberMasked, paymentMethod, paypalOrderId,
      items, total, formattedTotal, pickupOrShip, customerNotes,
      status, createdAt, freeSpoonGift, assignedStaffId, isInTemporaryTrash, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const ord of initialOrders) {
    insert.run(
      ord.orderCode,
      ord.orderNumber,
      ord.customerNumber ?? null,
      ord.customerName,
      ord.customerEmail,
      ord.customerAddress,
      ord.cardNumberMasked || '',
      ord.paymentMethod || 'paypal',
      ord.paypalOrderId || '',
      JSON.stringify(ord.items || []),
      ord.total,
      ord.formattedTotal,
      ord.pickupOrShip,
      ord.customerNotes || '',
      ord.status,
      ord.createdAt,
      ord.freeSpoonGift ? 1 : 0,
      ord.assignedStaffId || '',
      ord.isInTemporaryTrash ? 1 : 0,
      now
    );
  }
}

async function seedOrdersD1(db: D1DatabaseLike) {
  const now = new Date().toISOString();
  for (const ord of initialOrders) {
    await db
      .prepare(`
      INSERT OR IGNORE INTO orders (
        orderCode, orderNumber, customerNumber, customerName, customerEmail,
        customerAddress, cardNumberMasked, paymentMethod, paypalOrderId,
        items, total, formattedTotal, pickupOrShip, customerNotes,
        status, createdAt, freeSpoonGift, assignedStaffId, isInTemporaryTrash, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        ord.orderCode,
        ord.orderNumber,
        ord.customerNumber ?? null,
        ord.customerName,
        ord.customerEmail,
        ord.customerAddress,
        ord.cardNumberMasked || '',
        ord.paymentMethod || 'paypal',
        ord.paypalOrderId || '',
        JSON.stringify(ord.items || []),
        ord.total,
        ord.formattedTotal,
        ord.pickupOrShip,
        ord.customerNotes || '',
        ord.status,
        ord.createdAt,
        ord.freeSpoonGift ? 1 : 0,
        ord.assignedStaffId || '',
        ord.isInTemporaryTrash ? 1 : 0,
        now
      )
      .run();
  }
}

function rowToOrder(row: any): DbOrder {
  let items: DbOrderItem[] = [];
  if (typeof row.items === 'string') {
    try {
      const parsed = JSON.parse(row.items);
      if (Array.isArray(parsed)) items = parsed;
    } catch {
      items = [];
    }
  } else if (Array.isArray(row.items)) {
    items = row.items;
  }

  return {
    orderCode: row.orderCode,
    orderNumber: Number(row.orderNumber) || 0,
    customerNumber: row.customerNumber ? Number(row.customerNumber) : undefined,
    customerName: row.customerName || 'Customer',
    customerEmail: row.customerEmail || '',
    customerAddress: row.customerAddress || '',
    cardNumberMasked: row.cardNumberMasked || undefined,
    paymentMethod: (row.paymentMethod as 'paypal' | 'card') || 'paypal',
    paypalOrderId: row.paypalOrderId || undefined,
    items,
    total: Number(row.total) || 0,
    formattedTotal: row.formattedTotal || `$${(Number(row.total) || 0).toFixed(2)}`,
    pickupOrShip: (row.pickupOrShip as DbOrder['pickupOrShip']) || 'ship',
    customerNotes: row.customerNotes || '',
    status: (row.status as DbOrder['status']) || 'Making',
    createdAt: row.createdAt || '',
    freeSpoonGift: Boolean(row.freeSpoonGift),
    assignedStaffId: row.assignedStaffId || undefined,
    isInTemporaryTrash: Boolean(row.isInTemporaryTrash),
    updatedAt: row.updatedAt || undefined,
  };
}

export async function getAllOrders(env?: CloudflareEnv): Promise<DbOrder[]> {
  const db = await getDb(env);
  if (!db) {
    return initialOrders;
  }

  if (isD1Database(db)) {
    const rows = await db.prepare('SELECT * FROM orders ORDER BY rowid DESC').all();
    const mapped = (rows.results || []).map(rowToOrder);
    return mapped;
  }

  const rows: any[] = db.prepare('SELECT * FROM orders ORDER BY rowid DESC').all();
  return rows.map(rowToOrder);
}

export async function getOrderByQuery(query: string, env?: CloudflareEnv): Promise<DbOrder | null> {
  const q = query.trim();
  if (!q) return null;

  const allOrders = await getAllOrders(env);
  const upper = q.toUpperCase();
  const found = allOrders.find(
    (o) =>
      o.orderCode.toUpperCase() === upper ||
      String(o.orderNumber) === upper ||
      o.customerEmail.toUpperCase() === upper
  );
  return found || null;
}

export async function createOrder(order: Partial<DbOrder>, env?: CloudflareEnv): Promise<DbOrder> {
  const db = await getDb(env);
  const now = new Date().toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = order.orderNumber || randomSuffix;
  const orderCode = order.orderCode || `CRAFT-${orderNumber}`;
  const total = typeof order.total === 'number' ? order.total : 0;
  const formattedTotal = order.formattedTotal || `$${total.toFixed(2)}`;
  const createdAt =
    order.createdAt ||
    new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const newOrder: DbOrder = {
    orderCode,
    orderNumber,
    customerNumber: order.customerNumber,
    customerName: order.customerName || 'Customer',
    customerEmail: order.customerEmail || '',
    customerAddress: order.customerAddress || '',
    cardNumberMasked: order.cardNumberMasked,
    paymentMethod: order.paymentMethod || 'paypal',
    paypalOrderId: order.paypalOrderId,
    items: Array.isArray(order.items) ? order.items : [],
    total,
    formattedTotal,
    pickupOrShip: order.pickupOrShip || 'ship',
    customerNotes: order.customerNotes || '',
    status: order.status || 'Making',
    createdAt,
    freeSpoonGift: order.freeSpoonGift !== undefined ? Boolean(order.freeSpoonGift) : total >= 50,
    assignedStaffId: order.assignedStaffId || undefined,
    isInTemporaryTrash: Boolean(order.isInTemporaryTrash),
    updatedAt: now,
  };

  if (db) {
    if (isD1Database(db)) {
      await db
        .prepare(`
        INSERT INTO orders (
          orderCode, orderNumber, customerNumber, customerName, customerEmail,
          customerAddress, cardNumberMasked, paymentMethod, paypalOrderId,
          items, total, formattedTotal, pickupOrShip, customerNotes,
          status, createdAt, freeSpoonGift, assignedStaffId, isInTemporaryTrash, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          newOrder.orderCode,
          newOrder.orderNumber,
          newOrder.customerNumber ?? null,
          newOrder.customerName,
          newOrder.customerEmail,
          newOrder.customerAddress,
          newOrder.cardNumberMasked || '',
          newOrder.paymentMethod || 'paypal',
          newOrder.paypalOrderId || '',
          JSON.stringify(newOrder.items),
          newOrder.total,
          newOrder.formattedTotal,
          newOrder.pickupOrShip,
          newOrder.customerNotes,
          newOrder.status,
          newOrder.createdAt,
          newOrder.freeSpoonGift ? 1 : 0,
          newOrder.assignedStaffId || '',
          newOrder.isInTemporaryTrash ? 1 : 0,
          now
        )
        .run();
    } else {
      db.prepare(`
        INSERT INTO orders (
          orderCode, orderNumber, customerNumber, customerName, customerEmail,
          customerAddress, cardNumberMasked, paymentMethod, paypalOrderId,
          items, total, formattedTotal, pickupOrShip, customerNotes,
          status, createdAt, freeSpoonGift, assignedStaffId, isInTemporaryTrash, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newOrder.orderCode,
        newOrder.orderNumber,
        newOrder.customerNumber ?? null,
        newOrder.customerName,
        newOrder.customerEmail,
        newOrder.customerAddress,
        newOrder.cardNumberMasked || '',
        newOrder.paymentMethod || 'paypal',
        newOrder.paypalOrderId || '',
        JSON.stringify(newOrder.items),
        newOrder.total,
        newOrder.formattedTotal,
        newOrder.pickupOrShip,
        newOrder.customerNotes,
        newOrder.status,
        newOrder.createdAt,
        newOrder.freeSpoonGift ? 1 : 0,
        newOrder.assignedStaffId || '',
        newOrder.isInTemporaryTrash ? 1 : 0,
        now
      );
    }
  }

  return newOrder;
}

export async function updateOrder(
  orderCode: string,
  updates: Partial<DbOrder>,
  env?: CloudflareEnv
): Promise<DbOrder | null> {
  const db = await getDb(env);
  const existing = await getOrderByQuery(orderCode, env);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: DbOrder = {
    ...existing,
    ...updates,
    orderCode: existing.orderCode,
    assignedStaffId:
      'assignedStaffId' in updates ? updates.assignedStaffId || undefined : existing.assignedStaffId,
    updatedAt: now,
  };

  if (db) {
    if (isD1Database(db)) {
      await db
        .prepare(`
        UPDATE orders SET
          customerName = ?,
          customerEmail = ?,
          customerAddress = ?,
          pickupOrShip = ?,
          customerNotes = ?,
          status = ?,
          assignedStaffId = ?,
          isInTemporaryTrash = ?,
          updatedAt = ?
        WHERE orderCode = ?
      `)
        .bind(
          updated.customerName,
          updated.customerEmail,
          updated.customerAddress,
          updated.pickupOrShip,
          updated.customerNotes || '',
          updated.status,
          updated.assignedStaffId || '',
          updated.isInTemporaryTrash ? 1 : 0,
          now,
          existing.orderCode
        )
        .run();
    } else {
      db.prepare(`
        UPDATE orders SET
          customerName = ?,
          customerEmail = ?,
          customerAddress = ?,
          pickupOrShip = ?,
          customerNotes = ?,
          status = ?,
          assignedStaffId = ?,
          isInTemporaryTrash = ?,
          updatedAt = ?
        WHERE orderCode = ?
      `).run(
        updated.customerName,
        updated.customerEmail,
        updated.customerAddress,
        updated.pickupOrShip,
        updated.customerNotes || '',
        updated.status,
        updated.assignedStaffId || '',
        updated.isInTemporaryTrash ? 1 : 0,
        now,
        existing.orderCode
      );
    }
  }

  return updated;
}

export async function deleteOrder(orderCode: string, env?: CloudflareEnv): Promise<boolean> {
  const db = await getDb(env);
  if (!db) return false;

  if (isD1Database(db)) {
    await db.prepare('DELETE FROM orders WHERE orderCode = ?').bind(orderCode).run();
    return true;
  }

  db.prepare('DELETE FROM orders WHERE orderCode = ?').run(orderCode);
  return true;
}
