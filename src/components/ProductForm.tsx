import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { ProductAttribute } from '../types';
import { CostCalculatorModal } from './CostCalculatorModal';
import { Plus, Trash2, Check, Calculator, Upload, Image as ImageIcon } from 'lucide-react';

interface Props {
  onSuccess?: () => void;
  // Pregunta 1: prop nueva tipada y usada en JSX.
  formTitle?: string;
  subtitle?: string;
}

export const ProductForm: React.FC<Props> = ({
  onSuccess,
  formTitle = 'Registrar Producto',
  subtitle = 'Agrega el nombre final con la marca editado al guardar.',
}) => {
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const supplies = useLiveQuery(() => db.supplies.toArray()) ?? [];

  const [name, setName] = useState('');
  // Pregunta 2: nuevo estado controlado para texto final del nombre.
  const [nameSuffix, setNameSuffix] = useState('editado');
  const [selectedCategoryName, setSelectedCategoryName] = useState('Pines');
  const [costPrice, setCostPrice] = useState('2.5');
  const [salePrice, setSalePrice] = useState('15');
  const [stock, setStock] = useState('10');
  const [minStockAlert] = useState('2');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');

  const [categoryAttributes, setCategoryAttributes] = useState<Record<string, string>>({});
  const [customAttributes, setCustomAttributes] = useState<ProductAttribute[]>([]);
  const [attrKey, setAttrKey] = useState('');
  const [attrVal, setAttrVal] = useState('');

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const currentCategoryConfig = categories.find((c) => c.name === selectedCategoryName);
  const hasCategoryFields = Boolean(
    currentCategoryConfig && Array.isArray(currentCategoryConfig.fields) && currentCategoryConfig.fields.length > 0
  );
  const finalProductName = `${name.trim()}${nameSuffix.trim() ? ` ${nameSuffix.trim()}` : ''}`.trim();

  useEffect(() => {
    if (currentCategoryConfig && Array.isArray(currentCategoryConfig.fields)) {
      const defaults: Record<string, string> = {};
      let initialCost = 0;

      currentCategoryConfig.fields.forEach((field) => {
        if (!field) return;
        const optionsList = Array.isArray(field.options) ? field.options : [];
        const defaultVal = field.defaultValue || (optionsList.length > 0 ? optionsList[0] : '');
        defaults[field.name] = defaultVal;

        if (Array.isArray(field.variantOptions)) {
          const matched = field.variantOptions.find((vo) => vo && vo.label === defaultVal);
          if (matched && typeof matched.defaultCost === 'number') {
            initialCost += matched.defaultCost;
          }
        }
      });

      setCategoryAttributes(defaults);
      if (initialCost > 0) {
        setCostPrice(initialCost.toFixed(2));
        setSalePrice(String(Math.ceil(initialCost * 2.5)));
      }
    }
  }, [selectedCategoryName, categories]);

  // Asociación y suma fraccionaria exacta
  const handleAttributeChange = (fieldName: string, value: string) => {
    const updated = { ...categoryAttributes, [fieldName]: value };
    setCategoryAttributes(updated);

    if (!currentCategoryConfig || !Array.isArray(currentCategoryConfig.fields)) return;

    // 1. Detectar el tamaño y su hoja base
    let unitsPerSheet = 24;

    const sizeField = currentCategoryConfig.fields.find(
      (f) => f && f.name && (f.name.toLowerCase().includes('tamaño') || f.name.toLowerCase().includes('medida'))
    );

    if (sizeField && Array.isArray(sizeField.variantOptions)) {
      const selectedSizeLabel = updated[sizeField.name];
      const matchedVo = sizeField.variantOptions.find((vo) => vo && vo.label === selectedSizeLabel);
      if (matchedVo) {
        unitsPerSheet = matchedVo.baseYield || 24;
      }
    }

    // 2. Sumar costos de cada propiedad seleccionada
    let totalCalculatedCost = 0;

    currentCategoryConfig.fields.forEach((field) => {
      if (!field) return;
      const selectedVal = updated[field.name];

      // Verificar si coincide con un insumo directamente
      const matchedSupply = supplies.find(
        (s) => s.name.toLowerCase() === selectedVal.toLowerCase() || s.unit.toLowerCase().includes(selectedVal.toLowerCase())
      );

      if (matchedSupply && unitsPerSheet > 0) {
        totalCalculatedCost += matchedSupply.costPerUnit / unitsPerSheet;
        return;
      }

      const vo = Array.isArray(field.variantOptions)
        ? field.variantOptions.find((v) => v && v.label === selectedVal)
        : undefined;

      if (!vo) return;

      if (vo.mode === 'direct_cost' || (typeof vo.defaultCost === 'number' && !vo.mode)) {
        totalCalculatedCost += Number(vo.defaultCost) || 0;
      } else if (vo.mode === 'fractional_supply' && vo.linkedSupplyId) {
        const linked = supplies.find((s) => s.id === vo.linkedSupplyId);
        if (linked && typeof linked.costPerUnit === 'number' && unitsPerSheet > 0) {
          totalCalculatedCost += linked.costPerUnit / unitsPerSheet;
        }
      }
    });

    if (totalCalculatedCost > 0 && Number.isFinite(totalCalculatedCost)) {
      setCostPrice(totalCalculatedCost.toFixed(2));
      setSalePrice(String(Math.ceil(totalCalculatedCost * 2.5)));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateQuickSku = () => {
    const prefix = selectedCategoryName.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${randomNum}`);
  };

  const handleAddCustomAttribute = () => {
    if (!attrKey.trim() || !attrVal.trim()) return;
    setCustomAttributes([...customAttributes, { name: attrKey.trim(), value: attrVal.trim() }]);
    setAttrKey('');
    setAttrVal('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !salePrice) {
      alert('Nombre y precio de venta son requeridos');
      return;
    }

    const allAttributes: ProductAttribute[] = [
      ...Object.entries(categoryAttributes).map(([k, v]) => ({ name: k, value: String(v) })),
      ...customAttributes,
    ];

    const trimmedName = name.trim();
    const finalName = `${trimmedName}${nameSuffix.trim() ? ` ${nameSuffix.trim()}` : ''}`.trim();
    const finalSku = sku.trim() || `PROD-${Date.now().toString().slice(-6)}`;

    try {
      await db.products.add({
        name: finalName,
        category: selectedCategoryName,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice) || 0,
        stock: Number(stock) || 0,
        minStockAlert: Number(minStockAlert) || 2,
        sku: finalSku,
        imageUrl: imageUrl || undefined,
        attributes: allAttributes,
        createdAt: new Date().toISOString(),
      });

      alert('¡Producto guardado en inventario!');
      setName('');
      setNameSuffix('editado');
      setSku('');
      setImageUrl('');
      setCustomAttributes([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert('Error: SKU duplicado o fallo en base de datos local.');
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-main)',
    borderColor: 'var(--border-card)',
    color: 'var(--text-primary)',
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 sm:p-6 rounded-3xl shadow-sm border max-w-2xl mx-auto space-y-5 transition-colors"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
    >
      <div className="flex justify-between items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {formTitle}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
            //pregunta 1 JSX
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsCalculatorOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border"
          style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
        >
          <Calculator size={15} /> Calcular Costo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            Nombre del producto *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Sticker Toast, Print A6, Pin Tamaki..."
            className="w-full border rounded-xl p-2.5 text-xs sm:text-sm outline-none transition"
            style={inputStyle}
          />
          <p className="mt-2 text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            Nombre final: <span style={{ color: 'var(--accent)' }}>{finalProductName || 'Tu producto editado'}</span>
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            Categoría
          </label>
          <select
            value={selectedCategoryName}
            onChange={(e) => setSelectedCategoryName(e.target.value)}
            className="w-full border rounded-xl p-2.5 text-xs sm:text-sm outline-none cursor-pointer transition"
            style={inputStyle}
          >
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name} style={inputStyle}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pregunta 3: render condicional reescrito con ternario en vez de &&. */}
      {hasCategoryFields ? (
        <div className="p-4 rounded-2xl border space-y-3" style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-main)' }}>
          <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
            Propiedades de {currentCategoryConfig?.name}:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentCategoryConfig?.fields?.map((field) => {
              if (!field || !field.name) return null;
              const optionsList = Array.isArray(field.options) ? field.options : [];

              return (
                <div key={field.name}>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    {field.name}
                  </label>
                  <select
                    value={categoryAttributes[field.name] || ''}
                    onChange={(e) => handleAttributeChange(field.name, e.target.value)}
                    className="w-full border rounded-xl p-2 text-xs outline-none cursor-pointer transition"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', color: 'var(--text-primary)' }}
                  >
                    {optionsList.map((opt) => (
                      <option key={opt} value={opt} style={inputStyle}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {/* Pregunta 2: input controlado del nuevo campo que se suma al nombre final. */}
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            Texto final del nombre
          </label>
          <input
            type="text"
            value={nameSuffix}
            onChange={(e) => setNameSuffix(e.target.value)}
            placeholder="editado"
            className="w-full border rounded-xl p-2.5 text-xs sm:text-sm outline-none transition"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Precios y Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            Costo Manufactura (Bs.)
          </label>
          <input
            type="number"
            step="0.05"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            className="w-full border rounded-xl p-2.5 text-xs sm:text-sm outline-none font-bold"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            Precio de Venta (Bs.) *
          </label>
          <input
            type="number"
            step="0.5"
            required
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            className="w-full border rounded-xl p-2.5 text-xs sm:text-sm outline-none font-bold"
            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)', color: 'var(--accent)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            Stock Inicial
          </label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full border rounded-xl p-2.5 text-xs sm:text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      {/* SKU */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
          Código SKU
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="STK-01, PRNT-01..."
            className="w-full border rounded-xl p-2.5 text-xs sm:text-sm outline-none font-mono"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={generateQuickSku}
            className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            Generar SKU
          </button>
        </div>
      </div>

      {/* Subida de Imagen */}
      <div className="border p-3 rounded-2xl flex items-center gap-3" style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-main)' }}>
        {imageUrl ? (
          <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-card)' }}>
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg cursor-pointer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl border border-dashed flex items-center justify-center shrink-0" style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}>
            <ImageIcon size={20} />
          </div>
        )}

        <div className="flex-1">
          <label className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
            Foto / Ilustración del Producto
          </label>
          <span className="text-[10px] block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Identificación visual en Inventario y POS.
          </span>
          <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer text-white" style={{ backgroundColor: 'var(--accent)' }}>
            <Upload size={13} /> Subir Imagen
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Atributos extra */}
      <div className="border-t pt-3" style={{ borderColor: 'var(--border-card)' }}>
        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Atributos personalizados extra (opcional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Propiedad (ej: Acabado)"
            value={attrKey}
            onChange={(e) => setAttrKey(e.target.value)}
            className="flex-1 border rounded-xl p-2 text-xs outline-none"
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Valor (ej: Glitter)"
            value={attrVal}
            onChange={(e) => setAttrVal(e.target.value)}
            className="flex-1 border rounded-xl p-2 text-xs outline-none"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={handleAddCustomAttribute}
            className="px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus size={14} /> Añadir
          </button>
        </div>

        {customAttributes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {customAttributes.map((attr, idx) => (
              <span key={idx} className="text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5" style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                <strong>{attr.name}:</strong> {attr.value}
                <button type="button" onClick={() => setCustomAttributes(customAttributes.filter((_, i) => i !== idx))}>
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full py-3.5 text-white font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        <Check size={18} /> Guardar Producto
      </button>

      {isCalculatorOpen && (
        <CostCalculatorModal
          categoryName={selectedCategoryName}
          onApplyCost={(calcCost, suggSale) => {
            setCostPrice(String(calcCost));
            setSalePrice(String(suggSale));
          }}
          onClose={() => setIsCalculatorOpen(false)}
        />
      )}
    </form>
  );
};