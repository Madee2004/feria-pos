export type SupplyUnitType = 'sheet_bundle' | 'weight' | 'volume' | 'length' | 'unit';

export interface MaterialSupply {
  id?: number;
  name: string;
  category: string;
  unit: string;
  costPerUnit: number; // Costo por unidad mínima o por hoja
  unitType?: SupplyUnitType;
  sheetFormat?: string; // 'A4', 'Carta', 'A3', 'Pliego', etc.
  containerCost?: number;
  containerCapacity?: number;
}

export interface SheetYieldEntry {
  sheet: string;  // 'A4', 'Carta', 'A3'
  yield: number;  // 24, 4, etc.
}

export interface VariantOption {
  label: string;
  mode?: 'direct_cost' | 'sheet_yield' | 'fractional_supply';
  defaultCost?: number;
  baseSheetFormat?: string; // Hoja principal (ej: 'A4')
  baseYield?: number;        // Cantidad que entra en la hoja principal (ej: 24)
  extraYields?: SheetYieldEntry[]; // Rendimientos adicionales opcionales
  linkedSupplyId?: number;
}

export interface CategoryField {
  name: string;
  type: 'select' | 'text' | 'number';
  options: string[];
  variantOptions?: VariantOption[];
  defaultValue?: string;
}

export interface CategoryConfig {
  id?: number;
  name: string;
  fields: CategoryField[];
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Product {
  id?: number;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStockAlert: number;
  imageUrl?: string;
  attributes: ProductAttribute[];
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id?: number;
  items: CartItem[];
  total: number;
  paymentMethod: 'efectivo' | 'qr';
  timestamp: string;
  syncedWithBackend: boolean;
}