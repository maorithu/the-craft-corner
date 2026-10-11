import { craftItems } from '../src/data/items';
import { initialOrders } from '../src/data/orders';
import fs from 'node:fs';

const lines: string[] = [];
const now = new Date().toISOString();
const esc = (s: unknown) => (s ? String(s).replace(/'/g, "''") : '');

for (const it of craftItems) {
  const priceNum = parseFloat(it.displayPrice.replace(/[^0-9.]/g, '')) || 0;
  const staff = it.staffInCharge || '';

  lines.push(
    `INSERT OR IGNORE INTO products (id, itemNumber, name, shortName, category, categoryLabel, subCategory, subCategoryLabel, staffInCharge, stock, price, displayPrice, tag, accent, icon, imageUrl, description, materials, isBlindBox, sizes, createdAt, updatedAt) VALUES ('${esc(it.id)}', '${esc(it.itemNumber || 'Item ' + it.id)}', '${esc(it.name)}', '${esc(it.shortName || it.name)}', '${esc(it.category)}', '${esc(it.categoryLabel || it.category)}', '${esc(it.subCategory || 'all')}', '${esc(it.subCategoryLabel || '')}', '${esc(staff)}', 25, ${priceNum}, '${esc(it.displayPrice)}', '${esc(it.tag || '')}', '${esc(it.accent || 'butter')}', '${esc(it.icon || '✨')}', '${esc(it.imageUrl || '')}', '${esc(it.description || '')}', '${esc(it.materials || '')}', ${it.isBlindBox ? 1 : 0}, '${esc(it.sizes ? JSON.stringify(it.sizes) : '')}', '${now}', '${now}');`
  );
}

for (const ord of initialOrders) {
  lines.push(
    `INSERT OR IGNORE INTO orders (orderCode, orderNumber, customerNumber, customerName, customerEmail, customerAddress, cardNumberMasked, paymentMethod, paypalOrderId, items, total, formattedTotal, pickupOrShip, customerNotes, status, createdAt, freeSpoonGift, assignedStaffId, isInTemporaryTrash, updatedAt) VALUES ('${esc(ord.orderCode)}', ${ord.orderNumber}, ${ord.customerNumber ?? 'NULL'}, '${esc(ord.customerName)}', '${esc(ord.customerEmail)}', '${esc(ord.customerAddress)}', '${esc(ord.cardNumberMasked || '')}', '${esc(ord.paymentMethod || 'paypal')}', '${esc(ord.paypalOrderId || '')}', '${esc(JSON.stringify(ord.items || []))}', ${ord.total}, '${esc(ord.formattedTotal)}', '${esc(ord.pickupOrShip)}', '${esc(ord.customerNotes || '')}', '${esc(ord.status)}', '${esc(ord.createdAt)}', ${ord.freeSpoonGift ? 1 : 0}, '${esc(ord.assignedStaffId || '')}', ${ord.isInTemporaryTrash ? 1 : 0}, '${now}');`
  );
}

fs.writeFileSync('scripts/seed.sql', lines.join('\n') + '\n');
console.log('Successfully generated scripts/seed.sql with', lines.length, 'queries.');
