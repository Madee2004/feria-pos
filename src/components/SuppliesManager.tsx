import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { MaterialSupply, SupplyUnitType } from '../types';
import { Plus, Trash2, Tag, Edit2, X, Check, Package, Scale, Droplet, Box } from 'lucide-react';

export const SuppliesManager: React.FC = () => {
  const supplies = useLiveQuery(() => db.supplies.toArray()) ?? [];

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Papelería / Imprenta');
  const [unitType, setUnitType] = useState<SupplyUnitType>('sheet_bundle');

  // Modo Hoja / Pliego (A4, Carta, A3)
  const [sheetFormat, setSheetFormat] = useState('A4');
  const [sheetPricingMode, setSheetPricingMode] = useState<'per_sheet' | 'per_pack'>('per_sheet');
  const [singleSheetCost, setSingleSheetCost] = useState('5.0');
  const [packCost, setPackCost] = useState('70.0');
  const [sheetsInPack, setSheetsInPack] = useState('10');

  // Modo Peso / Volumen / Unidad
  const [genericTotalCost, setGenericTotalCost] = useState('18.0');
  const [genericCapacity, setGenericCapacity] = useState('100');
  const [genericUnitLabel, setGenericUnitLabel] = useState('g');

  const [editingSupply, setEditingSupply] = useState<MaterialSupply | null>(null);

  // Cálculo de costo unitario
  let calculatedUnitCost = 0;
  let finalUnitString = '';

  if (unitType === 'sheet_bundle') {
    if (sheetPricingMode === 'per_sheet') {
      calculatedUnitCost = Number(singleSheetCost) || 0;
      finalUnitString = `hoja ${sheetFormat}`;
    } else {
      const pCost = Number(packCost) || 0;
      const pQty = Number(sheetsInPack) || 1;
      calculatedUnitCost = pQty > 0 ? pCost / pQty : 0;
      finalUnitString = `hoja ${sheetFormat} (paq. ${pQty} uds)`;
    }
  } else {
    const cost = Number(genericTotalCost) || 0;
    const cap = Number(genericCapacity) || 1;
    calculatedUnitCost = cap > 0 ? cost / cap : 0;
    finalUnitString = genericUnitLabel.trim() || 'unidad';
  }

  const handleAddSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || calculatedUnitCost <= 0) {
      alert('Ingresa un nombre y costo válido.');
      return;
    }

    await db.supplies.add({
      name: name.trim(),
      category: category.trim(),
      unitType,
      sheetFormat: unitType === 'sheet_bundle' ? sheetFormat : undefined,
      costPerUnit: Number(calculatedUnitCost.toFixed(3)),
      unit: finalUnitString,
      containerCost: unitType === 'sheet_bundle' && sheetPricingMode === 'per_pack' ? Number(packCost) : Number(genericTotalCost),
      containerCapacity: unitType === 'sheet_bundle' && sheetPricingMode === 'per_pack' ? Number(sheetsInPack) : Number(genericCapacity),
    });

    setName('');
    if (unitType === 'sheet_bundle' && sheetPricingMode === 'per_sheet') {
      setSingleSheetCost('');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupply?.id) return;

    await db.supplies.update(editingSupply.id, {
      name: editingSupply.name.trim(),
      category: editingSupply.category.trim(),
      costPerUnit: Number(editingSupply.costPerUnit),
      unit: editingSupply.unit.trim(),
      sheetFormat: editingSupply.sheetFormat,
    });

    setEditingSupply(null);
  };

  const handleDelete = async (id: number, supplyName: string) => {
    if (confirm(`¿Eliminar el insumo "${supplyName}"?`)) {
      await db.supplies.delete(id);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-main)',
    borderColor: 'var(--border-card)',
    color: 'var(--text-primary)',
  };

  return (
    <div 
      className="p-5 sm:p-6 rounded-3xl border shadow-xs max-w-4xl mx-auto space-y-6 transition-colors" 
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
    >
      <div className="flex items-center gap-2">
        <Tag size={22} style={{ color: 'var(--accent)' }} />
        <div>
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Insumos y Costos por Hoja / Pliego
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Registra servicios de imprenta externa (por hoja A4/A3) o materiales propios (papeles, laminados, lanas).
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form 
        onSubmit={handleAddSupply} 
        className="p-4 rounded-2xl border space-y-3.5" 
        style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-main)' }}
      >
        <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
          + Agregar Insumo o Servicio de Imprenta
        </span>

        {/* Tipo de Insumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setUnitType('sheet_bundle')}
            className="py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer transition"
            style={{
              backgroundColor: unitType === 'sheet_bundle' ? 'var(--accent)' : 'var(--bg-card)',
              borderColor: 'var(--border-card)',
              color: unitType === 'sheet_bundle' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <Package size={13} /> Por Hoja / Pliego
          </button>
          <button
            type="button"
            onClick={() => { setUnitType('weight'); setGenericUnitLabel('gramo'); }}
            className="py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer transition"
            style={{
              backgroundColor: unitType === 'weight' ? 'var(--accent)' : 'var(--bg-card)',
              borderColor: 'var(--border-card)',
              color: unitType === 'weight' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <Scale size={13} /> Gramos
          </button>
          <button
            type="button"
            onClick={() => { setUnitType('volume'); setGenericUnitLabel('ml'); }}
            className="py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer transition"
            style={{
              backgroundColor: unitType === 'volume' ? 'var(--accent)' : 'var(--bg-card)',
              borderColor: 'var(--border-card)',
              color: unitType === 'volume' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <Droplet size={13} /> Mililitros (ml)
          </button>
          <button
            type="button"
            onClick={() => { setUnitType('unit'); setGenericUnitLabel('unidad'); }}
            className="py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer transition"
            style={{
              backgroundColor: unitType === 'unit' ? 'var(--accent)' : 'var(--bg-card)',
              borderColor: 'var(--border-card)',
              color: unitType === 'unit' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <Box size={13} /> Pieza / Unidad
          </button>
        </div>

        {/* Nombres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
              Nombre del insumo o servicio:
            </label>
            <input
              type="text"
              placeholder="Ej: Impresión Láser A4, Papel Fotográfico, Lámina Glitter..."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-xl p-2 text-xs font-bold outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
              Categoría:
            </label>
            <input
              type="text"
              placeholder="Imprenta Externa, Papel, Laminado, Lana..."
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-xl p-2 text-xs outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Configuración específica para Hojas / Pliegos */}
        {unitType === 'sheet_bundle' ? (
          <div className="p-3 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Tamaño del pliego/hoja:
                </label>
                <input
                  type="text"
                  placeholder="A4, Carta, A3, Pliego..."
                  value={sheetFormat}
                  onChange={(e) => setSheetFormat(e.target.value.toUpperCase())}
                  className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none font-mono"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  ¿Cómo te cobran?:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSheetPricingMode('per_sheet')}
                    className="py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer"
                    style={{
                      backgroundColor: sheetPricingMode === 'per_sheet' ? 'var(--accent-soft)' : 'transparent',
                      borderColor: sheetPricingMode === 'per_sheet' ? 'var(--accent)' : 'var(--border-card)',
                      color: sheetPricingMode === 'per_sheet' ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    Por Hoja Suelta
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetPricingMode('per_pack')}
                    className="py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer"
                    style={{
                      backgroundColor: sheetPricingMode === 'per_pack' ? 'var(--accent-soft)' : 'transparent',
                      borderColor: sheetPricingMode === 'per_pack' ? 'var(--accent)' : 'var(--border-card)',
                      color: sheetPricingMode === 'per_pack' ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    Por Paquete
                  </button>
                </div>
              </div>
            </div>

            {sheetPricingMode === 'per_sheet' ? (
              <div>
                <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Costo de cada hoja {sheetFormat} (Bs.):
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 5.00"
                  value={singleSheetCost}
                  onChange={(e) => setSingleSheetCost(e.target.value)}
                  className="w-full sm:w-48 border rounded-xl p-2 text-xs font-bold text-center outline-none"
                  style={inputStyle}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Costo del paquete entero (Bs.):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ej: 70.00"
                    value={packCost}
                    onChange={(e) => setPackCost(e.target.value)}
                    className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Hojas que incluye el paquete:
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 10"
                    value={sheetsInPack}
                    onChange={(e) => setSheetsInPack(e.target.value)}
                    className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-2.5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                Costo Total de Compra (Bs.):
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ej: 18.00"
                value={genericTotalCost}
                onChange={(e) => setGenericTotalCost(e.target.value)}
                className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                Cantidad Neta:
              </label>
              <input
                type="number"
                placeholder="Ej: 100"
                value={genericCapacity}
                onChange={(e) => setGenericCapacity(e.target.value)}
                className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                Nombre de la unidad:
              </label>
              <input
                type="text"
                placeholder="gramo, ml, unidad..."
                value={genericUnitLabel}
                onChange={(e) => setGenericUnitLabel(e.target.value)}
                className="w-full border rounded-xl p-2 text-xs text-center outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Costo unitario registrado: <strong style={{ color: 'var(--accent)' }}>Bs. {calculatedUnitCost.toFixed(2)}</strong> por {finalUnitString}
          </span>

          <button 
            type="submit" 
            className="px-5 py-2.5 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto justify-center" 
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus size={16} /> Guardar Insumo
          </button>
        </div>
      </form>

      {/* Lista */}
      <div className="divide-y" style={{ borderColor: 'var(--border-card)' }}>
        {supplies.map((s) => (
          <div key={s.id} className="py-3 flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                {s.sheetFormat && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    Formato: {s.sheetFormat}
                  </span>
                )}
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}>
                  {s.category}
                </span>
              </div>
              <span className="text-[11px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Unidad: {s.unit} • Costo registrado: <strong>Bs. {s.costPerUnit.toFixed(2)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setEditingSupply(s)} 
                className="p-1.5 rounded-lg border hover:opacity-80 cursor-pointer"
                style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => handleDelete(s.id!, s.name)} 
                className="p-1.5 rounded-lg border text-red-500 hover:bg-red-500/10 cursor-pointer"
                style={{ borderColor: 'var(--border-card)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edición */}
      {editingSupply && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSaveEdit}
            className="p-6 rounded-3xl border shadow-xl max-w-md w-full space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
          >
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border-card)' }}>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Editar Insumo</h3>
              <button type="button" onClick={() => setEditingSupply(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Nombre:</label>
              <input
                type="text"
                required
                value={editingSupply.name}
                onChange={(e) => setEditingSupply({ ...editingSupply, name: e.target.value })}
                className="w-full border rounded-xl p-2 text-xs font-bold outline-none"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Formato (ej: A4, A3):</label>
                <input
                  type="text"
                  value={editingSupply.sheetFormat || ''}
                  onChange={(e) => setEditingSupply({ ...editingSupply, sheetFormat: e.target.value.toUpperCase() })}
                  className="w-full border rounded-xl p-2 text-xs outline-none font-mono"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Costo por Hoja/Unidad (Bs.):</label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={editingSupply.costPerUnit}
                  onChange={(e) => setEditingSupply({ ...editingSupply, costPerUnit: Number(e.target.value) })}
                  className="w-full border rounded-xl p-2 text-xs font-bold outline-none text-center"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSupply(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
                style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1 cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Check size={16} /> Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};