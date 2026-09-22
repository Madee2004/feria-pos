import Dexie, { type Table } from 'dexie';
import type { Product, Sale, CategoryConfig, MaterialSupply, Machinery } from '../types';

export class InventoryDB extends Dexie {
  products!: Table<Product, number>;
  sales!: Table<Sale, number>;
  categories!: Table<CategoryConfig, number>;
  supplies!: Table<MaterialSupply, number>;
  machinery!: Table<Machinery, number>; // <-- Nueva tabla

  constructor() {
    super('FeriaInventarioDB');
    
    this.version(8).stores({
      products: '++id, &sku, name, category, stock',
      sales: '++id, timestamp, paymentMethod, syncedWithBackend',
      categories: '++id, &name',
      supplies: '++id, name, category, unit',
      machinery: '++id, name, type'
    });
  }
}

export const db = new InventoryDB();

export async function seedInitialData() {
  const categoriesCount = await db.categories.count();
  if (categoriesCount === 0) {
    await db.categories.bulkAdd([
      {
        name: 'Stickers',
        fields: [
          {
            name: 'Tamaño',
            type: 'select',
            options: ['Mini (1-2cm)', 'Normal (2-6cm)', 'Grande (6-8cm)'],
            variantOptions: [
              { label: 'Mini (1-2cm)', mode: 'sheet_yield', baseSheetFormat: 'A4', baseYield: 55 },
              { label: 'Normal (2-6cm)', mode: 'sheet_yield', baseSheetFormat: 'A4', baseYield: 24 },
              { label: 'Grande (6-8cm)', mode: 'sheet_yield', baseSheetFormat: 'A4', baseYield: 10 }
            ],
            defaultValue: 'Normal (2-6cm)'
          },
          {
            name: 'Acabado / Laminado',
            type: 'select',
            options: ['Sin Laminar (Glossy)', 'Laminado Mate', 'Laminado Holográfico', 'Laminado Glitter'],
            defaultValue: 'Sin Laminar (Glossy)'
          }
        ]
      },
      {
        name: 'Pines',
        fields: [
          {
            name: 'Tamaño',
            type: 'select',
            options: ['32mm', '44mm', '58mm'],
            variantOptions: [
              { label: '32mm', defaultCost: 2.2, mode: 'direct_cost' },
              { label: '44mm', defaultCost: 2.5, mode: 'direct_cost' },
              { label: '58mm', defaultCost: 2.8, mode: 'direct_cost' }
            ],
            defaultValue: '44mm'
          }
        ]
      },
      {
        name: 'Prints / Láminas',
        fields: [
          {
            name: 'Tamaño de Print',
            type: 'select',
            options: ['A4 (1 por hoja)', 'A5 (2 por hoja)', 'A6 (4 por hoja)'],
            variantOptions: [
              { label: 'A4 (1 por hoja)', mode: 'sheet_yield', baseSheetFormat: 'A4', baseYield: 1 },
              { label: 'A5 (2 por hoja)', mode: 'sheet_yield', baseSheetFormat: 'A4', baseYield: 2 },
              { label: 'A6 (4 por hoja)', mode: 'sheet_yield', baseSheetFormat: 'A4', baseYield: 4 }
            ],
            defaultValue: 'A6 (4 por hoja)'
          }
        ]
      }
    ]);
  }

  const suppliesCount = await db.supplies.count();
  if (suppliesCount === 0) {
    await db.supplies.bulkAdd([
      { name: 'Papel Fotográfico Adhesivo A4', category: 'Papelería', unit: 'hoja A4', sheetFormat: 'A4', costPerUnit: 2.5, containerCost: 50, containerCapacity: 20, unitType: 'sheet_bundle' },
      { name: 'Lámina Holográfica Estrellas A4', category: 'Laminado', unit: 'hoja A4', sheetFormat: 'A4', costPerUnit: 3.5, containerCost: 35, containerCapacity: 10, unitType: 'sheet_bundle' },
      { name: 'Papel Opalina 240g A4', category: 'Papelería', unit: 'hoja A4', sheetFormat: 'A4', costPerUnit: 1.2, containerCost: 60, containerCapacity: 50, unitType: 'sheet_bundle' },
      { name: 'Bolsita de Celofán 7x10cm', category: 'Empaque', unit: 'unidad', costPerUnit: 0.15, containerCost: 15, containerCapacity: 100, unitType: 'unit' }
    ]);
  }

  const machineryCount = await db.machinery.count();
  if (machineryCount === 0) {
    await db.machinery.bulkAdd([
      { name: 'Impresora Fotográfica', purchasePrice: 1800, estimatedLifespanUses: 6000, depreciationPerUse: 0.30, type: 'printer' },
      { name: 'Plotter de Corte / Cameo', purchasePrice: 2200, estimatedLifespanUses: 4000, depreciationPerUse: 0.55, type: 'cutter' },
      { name: 'Máquina Prensa de Pines', purchasePrice: 650, estimatedLifespanUses: 3000, depreciationPerUse: 0.22, type: 'badge_press' }
    ]);
  }
}

seedInitialData();