import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { X, Plus, Trash2, Calculator, Check } from 'lucide-react';

interface Props {
  categoryName: string;
  onApplyCost: (cost: number, suggestedPrice: number) => void;
  onClose: () => void;
}

interface SupplyUsageRow {
  supplyId: number;
  name: string;
  unitPrice: number;
  calcMode: 'grams' | 'batch';
  gramsUsed: number;
  totalGramsInPackage: number;
  quantityUsed: number;
  unitsProduced: number;
}

export const CostCalculatorModal: React.FC<Props> = ({ categoryName, onApplyCost, onClose }) => {
  const supplies = useLiveQuery(() => db.supplies.toArray()) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];

  const isSticker = categoryName.toLowerCase().includes('sticker') || categoryName.toLowerCase().includes('print');
  const isPin = categoryName.toLowerCase().includes('pin');

  const currentCategoryConfig = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());

  // STICKERS Y PRINTS
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [sheetPrice, setSheetPrice] = useState<number>(7.0);
  const [sheetFormat, setSheetFormat] = useState<string>('A4');
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string>('Normal (2-6cm)');
  const [stickersPerSheet, setStickersPerSheet] = useState<number>(24);
  const [laborSeconds, setLaborSeconds] = useState<number>(45);

  // PINES
  const [workshopUnitCost, setWorkshopUnitCost] = useState<number>(2.5);
  const [packagingExtra, setPackagingExtra] = useState<number>(0.4);

  // GENERAL / HECHO A MANO
  const [supplyRows, setSupplyRows] = useState<SupplyUsageRow[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState<string>('');
  const [laborTime, setLaborTime] = useState<number>(isSticker ? 45 : 2.5);
  const [timeUnit, setTimeUnit] = useState<'hours' | 'minutes' | 'seconds'>(isSticker ? 'seconds' : 'hours');
  const [hourlyWage, setHourlyWage] = useState<number>(20);
  const [profitMargin, setProfitMargin] = useState<number>(40);

  useEffect(() => {
    if (currentCategoryConfig && Array.isArray(currentCategoryConfig.fields)) {
      const sizeField = currentCategoryConfig.fields.find(
        (f) => f && f.name && (f.name.toLowerCase().includes('tamaño') || f.name.toLowerCase().includes('medida'))
      );

      if (sizeField && Array.isArray(sizeField.variantOptions) && sizeField.variantOptions.length > 0) {
        const normalOpt = sizeField.variantOptions.find((vo) => vo.label.toLowerCase().includes('normal') || vo.label.toLowerCase().includes('a6')) || sizeField.variantOptions[0];
        
        setSelectedSizeLabel(normalOpt.label);
        if (normalOpt.baseYield) setStickersPerSheet(normalOpt.baseYield);
        if (normalOpt.baseSheetFormat) setSheetFormat(normalOpt.baseSheetFormat);
        if (isPin && normalOpt.defaultCost) setWorkshopUnitCost(normalOpt.defaultCost);
      }
    }
  }, [currentCategoryConfig, isPin]);

  const handleStickerSizeSelect = (label: string) => {
    setSelectedSizeLabel(label);
    if (currentCategoryConfig && Array.isArray(currentCategoryConfig.fields)) {
      const sizeField = currentCategoryConfig.fields.find(
        (f) => f && f.name && (f.name.toLowerCase().includes('tamaño') || f.name.toLowerCase().includes('medida'))
      );
      const matched = sizeField?.variantOptions?.find((vo) => vo.label === label);
      if (matched) {
        if (matched.baseYield) setStickersPerSheet(matched.baseYield);
        if (matched.baseSheetFormat) setSheetFormat(matched.baseSheetFormat);
      }
    }
  };

  const handleSheetChange = (idStr: string) => {
    setSelectedSheetId(idStr);
    const item = supplies.find((s) => s.id === Number(idStr));
    if (item) {
      setSheetPrice(item.costPerUnit);
      if (item.sheetFormat) setSheetFormat(item.sheetFormat);
    }
  };

  const handleAddSupplyRow = () => {
    const s = supplies.find((item) => item.id === Number(selectedSupplyId));
    if (!s) return;
    const isWeight = s.unit.toLowerCase().includes('g') || s.unit.toLowerCase().includes('ovillo');

    setSupplyRows([
      ...supplyRows,
      {
        supplyId: s.id!,
        name: s.name,
        unitPrice: s.costPerUnit,
        calcMode: isWeight ? 'grams' : 'batch',
        gramsUsed: 25,
        totalGramsInPackage: s.unit.toLowerCase().includes('kilo') ? 1000 : 100,
        quantityUsed: 1,
        unitsProduced: 1,
      },
    ]);
    setSelectedSupplyId('');
  };

  // Cálculo final
  let calculatedCost = 0;
  if (isSticker) {
    const costPaper = stickersPerSheet > 0 ? sheetPrice / stickersPerSheet : 0;
    const costLabor = (laborSeconds / 3600) * hourlyWage;
    calculatedCost = costPaper + costLabor;
  } else if (isPin) {
    calculatedCost = workshopUnitCost + packagingExtra;
  } else {
    const matTotal = supplyRows.reduce((acc, row) => {
      if (row.calcMode === 'grams') {
        return acc + (row.unitPrice / (row.totalGramsInPackage || 100)) * row.gramsUsed;
      }
      return acc + (row.unitPrice * row.quantityUsed) / (row.unitsProduced || 1);
    }, 0);
    const timeInHours = timeUnit === 'hours' ? laborTime : timeUnit === 'minutes' ? laborTime / 60 : laborTime / 3600;
    calculatedCost = matTotal + timeInHours * hourlyWage;
  }

  const finalSuggestedPrice = Math.max(1, Math.ceil(calculatedCost * (1 + profitMargin / 100)));

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-main)',
    borderColor: 'var(--border-card)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
      <div 
        className="rounded-3xl p-5 sm:p-6 max-w-lg w-full relative shadow-2xl border max-h-[92vh] overflow-y-auto space-y-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="flex justify-between items-center border-b pb-2.5" style={{ borderColor: 'var(--border-card)' }}>
          <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calculator size={18} style={{ color: 'var(--accent)' }} /> Calculadora: {categoryName}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:opacity-70 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* STICKERS Y PRINTS */}
        {isSticker && (
          <div className="space-y-3.5 p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                1. Papel, Lámina o Servicio de Imprenta:
              </label>
              <select
                value={selectedSheetId}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="w-full text-xs border rounded-xl p-2 outline-none"
                style={inputStyle}
              >
                <option value="" style={inputStyle}>-- Seleccionar hoja de tu inventario --</option>
                {supplies.map((s) => (
                  <option key={s.id} value={s.id} style={inputStyle}>
                    {s.name} ({s.sheetFormat ? `${s.sheetFormat} - ` : ''}Bs. {s.costPerUnit} / {s.unit})
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between text-xs pt-1.5">
                <span style={{ color: 'var(--text-muted)' }}>Costo por hoja ({sheetFormat}):</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Bs.</span>
                  <input
                    type="number"
                    step="0.5"
                    value={sheetPrice}
                    onChange={(e) => setSheetPrice(Number(e.target.value))}
                    className="w-20 border rounded-lg p-1 text-center font-bold text-xs outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-2.5 space-y-2" style={{ borderColor: 'var(--border-card)' }}>
              <label className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                2. Tamaño del Producto (Rendimiento en {sheetFormat}):
              </label>

              {/* Botones de tamaños cargados dinámicamente */}
              <div className="flex flex-wrap gap-1.5">
                {currentCategoryConfig?.fields?.find(f => f.name.toLowerCase().includes('tamaño'))?.options?.map((sizeOpt) => (
                  <button
                    key={sizeOpt}
                    type="button"
                    onClick={() => handleStickerSizeSelect(sizeOpt)}
                    className="py-1.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer"
                    style={{
                      backgroundColor: selectedSizeLabel === sizeOpt ? 'var(--accent)' : 'var(--bg-card)',
                      color: selectedSizeLabel === sizeOpt ? '#ffffff' : 'var(--text-primary)',
                      borderColor: 'var(--border-card)',
                    }}
                  >
                    {sizeOpt}
                  </button>
                )) || (
                  ['Mini (1-2cm)', 'Normal (2-6cm)', 'Grande (6-8cm)'].map((sizeOpt) => (
                    <button
                      key={sizeOpt}
                      type="button"
                      onClick={() => handleStickerSizeSelect(sizeOpt)}
                      className="py-1.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer"
                      style={{
                        backgroundColor: selectedSizeLabel === sizeOpt ? 'var(--accent)' : 'var(--bg-card)',
                        color: selectedSizeLabel === sizeOpt ? '#ffffff' : 'var(--text-primary)',
                        borderColor: 'var(--border-card)',
                      }}
                    >
                      {sizeOpt}
                    </button>
                  ))
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Entran en la hoja {sheetFormat}:</span>
                  <input
                    type="number"
                    value={stickersPerSheet}
                    onChange={(e) => setStickersPerSheet(Number(e.target.value))}
                    className="w-full border rounded-lg p-1.5 text-center font-bold outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Mano de obra (segundos):</span>
                  <input
                    type="number"
                    value={laborSeconds}
                    onChange={(e) => setLaborSeconds(Number(e.target.value))}
                    className="w-full border rounded-lg p-1.5 text-center font-bold outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl border flex justify-between items-center text-xs" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Costo material por unidad:</span>
                <strong style={{ color: 'var(--accent)' }}>
                  Bs. {stickersPerSheet > 0 ? (sheetPrice / stickersPerSheet).toFixed(2) : '0.00'}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* PINES */}
        {isPin && (
          <div className="space-y-3 p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
            <div>
              <span className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                Tarifa de taller por pin:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs" style={{ color: 'var(--text-muted)' }}>Bs.</span>
                <input
                  type="number"
                  step="0.1"
                  value={workshopUnitCost}
                  onChange={(e) => setWorkshopUnitCost(Number(e.target.value))}
                  className="w-24 border rounded-xl p-2 text-xs font-bold outline-none text-center"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                Empaque / bolsita por unidad (Bs.):
              </label>
              <input
                type="number"
                step="0.1"
                value={packagingExtra}
                onChange={(e) => setPackagingExtra(Number(e.target.value))}
                className="w-24 border rounded-xl p-2 text-xs font-bold outline-none text-center"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* GENERAL / CROCHET */}
        {!isSticker && !isPin && (
          <div className="space-y-3 p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
            <div className="flex gap-2">
              <select
                value={selectedSupplyId}
                onChange={(e) => setSelectedSupplyId(e.target.value)}
                className="flex-1 text-xs border rounded-xl p-2 outline-none"
                style={inputStyle}
              >
                <option value="" style={inputStyle}>-- Seleccionar insumo --</option>
                {supplies.map((s) => (
                  <option key={s.id} value={s.id} style={inputStyle}>
                    {s.name} (Bs. {s.costPerUnit} / {s.unit})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddSupplyRow}
                disabled={!selectedSupplyId}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-40"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Plus size={14} /> Usar
              </button>
            </div>

            {supplyRows.map((row, idx) => (
              <div 
                key={idx} 
                className="p-3 rounded-2xl border space-y-2" 
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
              >
                <div className="flex justify-between items-center text-xs">
                  <strong style={{ color: 'var(--text-primary)' }}>{row.name}</strong>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Bs. {row.unitPrice} el paquete
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setSupplyRows(supplyRows.filter((_, i) => i !== idx))} 
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {row.calcMode === 'grams' ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Gramos usados:</span>
                      <input
                        type="number"
                        value={row.gramsUsed}
                        onChange={(e) => setSupplyRows(supplyRows.map((r, i) => i === idx ? { ...r, gramsUsed: Number(e.target.value) } : r))}
                        className="w-full border rounded-lg p-1 text-center font-bold outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Gramos paquete:</span>
                      <input
                        type="number"
                        value={row.totalGramsInPackage}
                        onChange={(e) => setSupplyRows(supplyRows.map((r, i) => i === idx ? { ...r, totalGramsInPackage: Number(e.target.value) } : r))}
                        className="w-full border rounded-lg p-1 text-center outline-none"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Cantidad usada:</span>
                      <input
                        type="number"
                        value={row.quantityUsed}
                        onChange={(e) => setSupplyRows(supplyRows.map((r, i) => i === idx ? { ...r, quantityUsed: Number(e.target.value) } : r))}
                        className="w-full border rounded-lg p-1 text-center font-bold outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Unidades que rinde:</span>
                      <input
                        type="number"
                        value={row.unitsProduced}
                        onChange={(e) => setSupplyRows(supplyRows.map((r, i) => i === idx ? { ...r, unitsProduced: Number(e.target.value) } : r))}
                        className="w-full border rounded-lg p-1 text-center outline-none"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="p-3 rounded-2xl border space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
              <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                Tiempo de elaboración por pieza:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={laborTime}
                  onChange={(e) => setLaborTime(Number(e.target.value))}
                  className="border rounded-xl p-2 text-xs font-bold text-center outline-none"
                  style={inputStyle}
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as any)}
                  className="border rounded-xl p-2 text-xs outline-none"
                  style={inputStyle}
                >
                  <option value="seconds" style={inputStyle}>Segundos</option>
                  <option value="minutes" style={inputStyle}>Minutos</option>
                  <option value="hours" style={inputStyle}>Horas</option>
                </select>
                <div className="relative">
                  <input
                    type="number"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(Number(e.target.value))}
                    className="w-full border rounded-xl p-2 text-xs text-center font-bold outline-none"
                    style={inputStyle}
                  />
                  <span className="text-[9px] block text-center mt-0.5" style={{ color: 'var(--text-muted)' }}>Bs./hora</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Margen */}
        <div className="flex justify-between items-center text-xs px-1">
          <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Margen de ganancia (%):</span>
          <input
            type="number"
            value={profitMargin}
            onChange={(e) => setProfitMargin(Number(e.target.value))}
            className="w-20 border rounded-xl p-1.5 font-bold text-center outline-none"
            style={inputStyle}
          />
        </div>

        {/* Resumen */}
        <div className="p-3.5 rounded-2xl space-y-1 border" style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'var(--border-card)' }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Costo Unitario Real:</span>
            <strong className="font-bold" style={{ color: 'var(--text-primary)' }}>
              Bs. {calculatedCost.toFixed(2)}
            </strong>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Precio Venta Sugerido:</span>
            <strong className="font-extrabold text-base" style={{ color: 'var(--accent)' }}>
              Bs. {finalSuggestedPrice.toFixed(2)}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onApplyCost(Number(calculatedCost.toFixed(2)), finalSuggestedPrice);
            onClose();
          }}
          className="w-full py-3 text-white font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Check size={18} /> Aplicar al Producto
        </button>
      </div>
    </div>
  );
};