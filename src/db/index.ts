import Dexie, { type Table } from 'dexie';
import type { Product, Sale, CategoryConfig, MaterialSupply } from '../types';

export class InventoryDB extends Dexie {
  products!: Table<Product, number>;
  sales!: Table<Sale, number>;
  categories!: Table<CategoryConfig, number>;
  supplies!: Table<MaterialSupply, number>;

  constructor() {
    super('FeriaInventarioDB');
    
    this.version(7).stores({
      products: '++id, &sku, name, category, stock',
      sales: '++id, timestamp, paymentMethod, syncedWithBackend',
      categories: '++id, &name',
      supplies: '++id, name, category, unit'
    });
  }
}

export const db = new InventoryDB();

export async function seedInitialData() {
  const categoriesCount = await db.categories.count();
  if (categoriesCount === 0) {
    await db.categories.bulkAdd([
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
          },
          {
            name: 'Forma',
            type: 'select',
            options: ['Circular', 'Corazón', 'Estrella'],
            variantOptions: [
              { label: 'Circular', defaultCost: 0, mode: 'direct_cost' },
              { label: 'Corazón', defaultCost: 0.5, mode: 'direct_cost' },
              { label: 'Estrella', defaultCost: 0.8, mode: 'direct_cost' }
            ],
            defaultValue: 'Circular'
          }
        ]
      },
      {
        name: 'Stickers',
        fields: [
          {
            name: 'Tamaño del Sticker',
            type: 'select',
            options: ['Mini (1-2cm)', 'Normal (2-6cm)', 'Grande (6-8cm)'],
            variantOptions: [
              { 
                label: 'Mini (1-2cm)', 
                mode: 'sheet_yield', 
                baseSheetFormat: 'A4', 
                baseYield: 55, 
                extraYields: [{ sheet: 'A3', yield: 110 }, { sheet: 'CARTA', yield: 48 }] 
              },
              { 
                label: 'Normal (2-6cm)', 
                mode: 'sheet_yield', 
                baseSheetFormat: 'A4', 
                baseYield: 24, 
                extraYields: [{ sheet: 'A3', yield: 50 }, { sheet: 'CARTA', yield: 20 }] 
              },
              { 
                label: 'Grande (6-8cm)', 
                mode: 'sheet_yield', 
                baseSheetFormat: 'A4', 
                baseYield: 10, 
                extraYields: [{ sheet: 'A3', yield: 22 }, { sheet: 'CARTA', yield: 8 }] 
              }
            ],
            defaultValue: 'Normal (2-6cm)'
          },
          {
            name: 'Material Adhesivo',
            type: 'select',
            options: ['Papel Fotográfico Glossy', 'Vinil Mate', 'Vinil Holográfico'],
            variantOptions: [
              { label: 'Papel Fotográfico Glossy', defaultCost: 0, mode: 'direct_cost' },
              { label: 'Vinil Mate', defaultCost: 0.3, mode: 'direct_cost' },
              { label: 'Vinil Holográfico', defaultCost: 0.7, mode: 'direct_cost' }
            ],
            defaultValue: 'Papel Fotográfico Glossy'
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
          },
          {
            name: 'Tipo de Papel',
            type: 'select',
            options: ['Opalina 220g', 'Fotográfico Mate 200g'],
            defaultValue: 'Opalina 220g'
          }
        ]
      },
      {
        name: 'Crochet / Amigurumis',
        fields: [
          {
            name: 'Tipo de Lana',
            type: 'select',
            options: ['Lana Rabbit', 'Algodón', 'Acrílico'],
            defaultValue: 'Lana Rabbit'
          }
        ]
      }
    ]);
  }

  const suppliesCount = await db.supplies.count();
  if (suppliesCount === 0) {
    await db.supplies.bulkAdd([
      { name: 'Hoja Papel Fotográfico Adhesivo', category: 'Papelería', unit: 'hoja A4', sheetFormat: 'A4', costPerUnit: 7.0, containerCost: 70, containerCapacity: 10, unitType: 'sheet_bundle' },
      { name: 'Hoja Vinil Adhesivo Mate', category: 'Papelería', unit: 'hoja A4', sheetFormat: 'A4', costPerUnit: 9.0, containerCost: 90, containerCapacity: 10, unitType: 'sheet_bundle' },
      { name: 'Pase Impresión Láser A4', category: 'Imprenta Externa', unit: 'hoja A4', sheetFormat: 'A4', costPerUnit: 5.0, containerCost: 5, containerCapacity: 1, unitType: 'sheet_bundle' },
      { name: 'Lámina Holográfica A4', category: 'Laminado', unit: 'hoja A4', sheetFormat: 'A4', costPerUnit: 8.0, containerCost: 8, containerCapacity: 1, unitType: 'sheet_bundle' },
      { name: 'Ovillo Lana Rabbit (100g)', category: 'Crochet', unit: 'ovillo 100g', costPerUnit: 18.0, containerCost: 18, containerCapacity: 100, unitType: 'weight' },
      { name: 'Bolsa Relleno Siliconado (1000g)', category: 'Crochet', unit: 'bolsa 1000g', costPerUnit: 35.0, containerCost: 35, containerCapacity: 1000, unitType: 'weight' },
      { name: 'Bolsita celofán con cartoncito', category: 'Empaque', unit: 'unidad', costPerUnit: 0.40, containerCost: 20, containerCapacity: 50, unitType: 'unit' }
    ]);
  }
}

seedInitialData();