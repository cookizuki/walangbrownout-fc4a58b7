// Domain model + seed data for the WalangBrownout Inventory OS prototype.
// Mirrors the normalized schema described in the case study:
// roles, users, categories, suppliers, products, warehouse_location,
// inventory_batch, transaction_type, transaction_log, alerts, purchase_order,
// purchase_order_item.

export type ABC = "A" | "B" | "C";
export type AlertType = "LOW_STOCK" | "SEASONAL_REORDER" | "NEAR_EXPIRY" | "VARIANCE";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type TxType = "RECEIPT" | "SALE" | "RETURN" | "TRANSFER" | "ADJUSTMENT" | "WRITE_OFF";
export type Channel = "IN_STORE" | "ONLINE" | "WAREHOUSE";

export interface Supplier { id: number; name: string; contact: string; }
export interface Category { id: number; name: string; description: string; }
export interface WarehouseLocation { id: number; code: string; description: string; }
export interface Product {
  sku: string;
  name: string;
  categoryId: number;
  supplierId: number;
  unitCost: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  seasonalFlag: boolean;
  isFifoCritical: boolean;
  abc: ABC;
  avgDailyUsage: number;
  seasonalFactor?: number;
  safetyStock: number;
}
export interface InventoryBatch {
  id: string;
  sku: string;
  locationId: number;
  quantityReceived: number;
  quantityRemaining: number;
  dateReceived: string;
  expirationDate?: string;
}
export interface TxLog {
  id: string;
  batchId: string | null;
  sku: string;
  userId: number;
  type: TxType;
  quantityDelta: number;
  timestamp: string;
  channel: Channel;
}
export interface Alert {
  id: string;
  sku: string;
  batchId?: string;
  type: AlertType;
  message: string;
  status: AlertStatus;
  createdAt: string;
}

export const suppliers: Supplier[] = [
  { id: 1, name: "CoolAir Distributors PH", contact: "Ana Reyes" },
  { id: 2, name: "PureBreathe Filters Co.", contact: "Miguel Santos" },
  { id: 3, name: "SmartHome Imports", contact: "Jenny Cruz" },
];

export const categories: Category[] = [
  { id: 1, name: "Cooling", description: "Portable AC & fans" },
  { id: 2, name: "Air Quality", description: "Purifiers & filters" },
  { id: 3, name: "Smart Home", description: "Thermostats & sensors" },
];

export const locations: WarehouseLocation[] = [
  { id: 1, code: "A-01", description: "Zone A · Aisle 01 · Cooling" },
  { id: 2, code: "B-03", description: "Zone B · Aisle 03 · Filters" },
  { id: 3, code: "C-02", description: "Zone C · Aisle 02 · Smart Home" },
];

export const products: Product[] = [
  {
    sku: "ACU-014", name: "Portable AC Unit 1.5HP",
    categoryId: 1, supplierId: 1, unitCost: 18500,
    reorderPoint: 520, reorderQuantity: 300, leadTimeDays: 14,
    seasonalFlag: true, isFifoCritical: false, abc: "A",
    avgDailyUsage: 10, seasonalFactor: 3.0, safetyStock: 100,
  },
  {
    sku: "APU-100", name: "Air Purifier Carbon Filter",
    categoryId: 2, supplierId: 2, unitCost: 1250,
    reorderPoint: 80, reorderQuantity: 200, leadTimeDays: 7,
    seasonalFlag: false, isFifoCritical: true, abc: "B",
    avgDailyUsage: 6, safetyStock: 30,
  },
  {
    sku: "THM-201", name: "Smart Thermostat Gen 3",
    categoryId: 3, supplierId: 3, unitCost: 4800,
    reorderPoint: 55, reorderQuantity: 60, leadTimeDays: 10,
    seasonalFlag: false, isFifoCritical: false, abc: "A",
    avgDailyUsage: 4, safetyStock: 15,
  },
  {
    sku: "FAN-050", name: "Tower Fan Silent",
    categoryId: 1, supplierId: 1, unitCost: 3200,
    reorderPoint: 40, reorderQuantity: 80, leadTimeDays: 5,
    seasonalFlag: true, isFifoCritical: false, abc: "B",
    avgDailyUsage: 3, seasonalFactor: 2.2, safetyStock: 25,
  },
  {
    sku: "SEN-011", name: "Room Humidity Sensor",
    categoryId: 3, supplierId: 3, unitCost: 780,
    reorderPoint: 25, reorderQuantity: 50, leadTimeDays: 6,
    seasonalFlag: false, isFifoCritical: false, abc: "C",
    avgDailyUsage: 1, safetyStock: 10,
  },
];

export const batches: InventoryBatch[] = [
  { id: "B-1101", sku: "ACU-014", locationId: 1, quantityReceived: 400, quantityRemaining: 340, dateReceived: "2026-06-10" },
  { id: "B-1120", sku: "ACU-014", locationId: 1, quantityReceived: 200, quantityRemaining: 200, dateReceived: "2026-07-01" },
  { id: "B-1055", sku: "APU-100", locationId: 2, quantityReceived: 180, quantityRemaining: 145, dateReceived: "2026-03-22", expirationDate: "2026-12-22" },
  { id: "B-1078", sku: "APU-100", locationId: 2, quantityReceived: 220, quantityRemaining: 220, dateReceived: "2026-05-14", expirationDate: "2027-02-14" },
  { id: "B-1090", sku: "THM-201", locationId: 3, quantityReceived: 80, quantityRemaining: 42, dateReceived: "2026-06-05" },
  { id: "B-1122", sku: "FAN-050", locationId: 1, quantityReceived: 120, quantityRemaining: 78, dateReceived: "2026-06-28" },
  { id: "B-1130", sku: "SEN-011", locationId: 3, quantityReceived: 60, quantityRemaining: 52, dateReceived: "2026-07-08" },
];

export const transactions: TxLog[] = [
  { id: "T-9001", batchId: "B-1090", sku: "THM-201", userId: 2, type: "SALE", quantityDelta: -2, timestamp: "2026-07-22T09:14:00", channel: "ONLINE" },
  { id: "T-9002", batchId: "B-1101", sku: "ACU-014", userId: 3, type: "SALE", quantityDelta: -8, timestamp: "2026-07-22T10:02:00", channel: "IN_STORE" },
  { id: "T-9003", batchId: "B-1055", sku: "APU-100", userId: 3, type: "SALE", quantityDelta: -5, timestamp: "2026-07-22T11:45:00", channel: "IN_STORE" },
  { id: "T-9004", batchId: "B-1120", sku: "ACU-014", userId: 4, type: "RECEIPT", quantityDelta: 200, timestamp: "2026-07-21T08:20:00", channel: "WAREHOUSE" },
  { id: "T-9005", batchId: "B-1090", sku: "THM-201", userId: 4, type: "ADJUSTMENT", quantityDelta: -3, timestamp: "2026-07-20T16:10:00", channel: "WAREHOUSE" },
];

export const users = [
  { id: 1, name: "Kim Maturan", role: "Administrator" },
  { id: 2, name: "Nick Merilles", role: "Inventory Manager" },
  { id: 3, name: "Lizle Ocariza", role: "Warehouse Staff" },
  { id: 4, name: "Nhimfa Pacao", role: "Purchasing Manager" },
];

// --- Derived helpers -------------------------------------------------------

export function onHand(sku: string, allBatches = batches): number {
  return allBatches.filter(b => b.sku === sku).reduce((s, b) => s + b.quantityRemaining, 0);
}

/** Non-seasonal ROP = (Avg Daily Usage × Lead Time) + Safety Stock */
export function ropStandard(p: Product): number {
  return p.avgDailyUsage * p.leadTimeDays + p.safetyStock;
}

/** Seasonal ROP = (Avg Daily Usage × Seasonal Factor × Lead Time) + Seasonal Safety Stock */
export function ropSeasonal(p: Product): number {
  const factor = p.seasonalFactor ?? 1;
  return Math.round(p.avgDailyUsage * factor * p.leadTimeDays + p.safetyStock);
}

export function daysUntil(dateISO?: string): number | null {
  if (!dateISO) return null;
  const ms = new Date(dateISO).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** Auto-generate alerts from current product + batch state. */
export function deriveAlerts(): Alert[] {
  const out: Alert[] = [];
  for (const p of products) {
    const stock = onHand(p.sku);
    const rop = p.seasonalFlag ? ropSeasonal(p) : ropStandard(p);
    if (stock <= rop) {
      out.push({
        id: `A-${p.sku}-ROP`,
        sku: p.sku,
        type: p.seasonalFlag ? "SEASONAL_REORDER" : "LOW_STOCK",
        message: p.seasonalFlag
          ? `Seasonal ROP hit — on hand ${stock} ≤ ${rop} (factor ${p.seasonalFactor}×)`
          : `Below reorder point — on hand ${stock} ≤ ${rop}`,
        status: "OPEN",
        createdAt: new Date().toISOString(),
      });
    }
  }
  for (const b of batches) {
    const d = daysUntil(b.expirationDate);
    if (d !== null && d <= 30) {
      out.push({
        id: `A-${b.id}-EXP`,
        sku: b.sku,
        batchId: b.id,
        type: "NEAR_EXPIRY",
        message: `Batch ${b.id} expires in ${d} days — release first (FIFO)`,
        status: "OPEN",
        createdAt: new Date().toISOString(),
      });
    }
  }
  return out;
}

/** FIFO pick order: oldest dateReceived first. */
export function fifoOrder(sku: string): InventoryBatch[] {
  return batches
    .filter(b => b.sku === sku && b.quantityRemaining > 0)
    .sort((a, b) => a.dateReceived.localeCompare(b.dateReceived));
}

export const money = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
