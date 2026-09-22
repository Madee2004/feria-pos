// 1. Tipo de Insumos físicos
export type SupplyUnitType = 'sheet_bundle' | 'weight' | 'volume' | 'length' | 'unit';

export interface MaterialSupply {
  id?: number;
  name: string;
  category: string;
  unit: string;
  costPerUnit: number;
  unitType?: SupplyUnitType;
  sheetFormat?: string; // 'A4', 'Carta', 'A3', 'Pliego'
  containerCost?: number;
  containerCapacity?: number;
}

// 2. Maquinaria y Equipamiento (Impresoras, Plotters, Máquina de Pines, Cuchillas)
export interface Machinery {
  id?: number;
  name: string;                   // ej: "Impresora Epson L8050", "Plotter Cameo 4", "Prensa Pines 44mm"
  purchasePrice: number;          // Costo de compra (Bs.)
  estimatedLifespanUses: number;  // Cuántas hojas / bajadas / cortes rinde en su vida útil
  depreciationPerUse: number;     // purchasePrice / estimatedLifespanUses (Bs. por uso)
  type: 'printer' | 'cutter' | 'badge_press' | 'other';
}

// 3. Reglas de cálculo para la calculadora
export type ProductionOrigin = 'in_house' | 'outsourced';

export interface OutsourcedConfig {
  pricingMode: 'per_sheet' | 'per_unit'; // Por hoja de taller o por pieza directa
  sheetFormat?: string;                  // 'A4', 'A3', 'Tabloide'
  sheetCost?: number;                    // Costo que cobra la imprenta por esa hoja (ej: Bs. 6.0)
  unitsPerSheet?: number;                // Cuántos productos caben en esa hoja (ej: 24)
  directUnitCost?: number;               // Si cobran por pieza terminada (ej: Bs. 2.50 por pin)
}

export interface InHouseConfig {
  sheetSupplyId?: number;                // Papel base usado
  laminateSupplyId?: number;             // Lámina holográfica/glitter usada (opcional)
  unitsPerSheet?: number;                // Cuántos salen por hoja
  selectedMachineryIds?: number[];       // Impresora + Plotter usados
  laborSeconds?: number;                 // Tiempo de confección/corte
  hourlyWage?: number;                   // Tarifa horaria
}

// Modelos estándar de Categoría y Producto
export interface SheetYieldEntry {
  sheet: string;
  yield: number;
}

export interface VariantOption {
  label: string;
  mode?: 'direct_cost' | 'sheet_yield' | 'fractional_supply';
  defaultCost?: number;
  baseSheetFormat?: string;
  baseYield?: number;
  extraYields?: SheetYieldEntry[];
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
  productionOrigin?: ProductionOrigin; // 'in_house' o 'outsourced'
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