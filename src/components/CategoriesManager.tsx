import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { CategoryField, VariantOption } from '../types';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  FolderPlus
} from 'lucide-react';

export const CategoriesManager: React.FC = () => {
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const supplies = useLiveQuery(() => db.supplies.toArray()) ?? [];

  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  // Creación categoría
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Propiedades
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [editFieldName, setEditFieldName] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');

  // Opciones
  const [targetFieldIdxForOption, setTargetFieldIdxForOption] = useState<number | null>(null);
  const [quickOptionLabel, setQuickOptionLabel] = useState('');

  // Modal Avanzado de Opción
  const [activeEditingOption, setActiveEditingOption] = useState<{
    fieldIdx: number;
    optIdx: number;
    option: VariantOption;
  } | null>(null);

  // Extra sheet fields para el modal
  const [extraSheetName, setExtraSheetName] = useState('');
  const [extraSheetYield, setExtraSheetYield] = useState('');

  const currentCategory = categories.find((c) => c.id === selectedCatId) || categories[0];

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-main)',
    borderColor: 'var(--border-card)',
    color: 'var(--text-primary)',
  };

  // Creación limpia de categoría
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const newId = await db.categories.add({
        name: newCatName.trim(),
        fields: [
          {
            name: 'Tamaño',
            type: 'select',
            options: ['Estándar'],
            variantOptions: [
              {
                label: 'Estándar',
                mode: 'sheet_yield',
                baseSheetFormat: 'A4',
                baseYield: 24,
                extraYields: [],
              }
            ],
            defaultValue: 'Estándar',
          },
        ],
      });

      setNewCatName('');
      setIsCreatingCat(false);
      setSelectedCatId(Number(newId));
    } catch (error) {
      console.error(error);
      alert('Error al crear la categoría.');
    }
  };

  const handleDeleteCategory = async () => {
    if (!currentCategory?.id) return;
    if (confirm(`¿Eliminar la categoría "${currentCategory.name}"?`)) {
      await db.categories.delete(currentCategory.id);
      setSelectedCatId(null);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !currentCategory?.id) return;

    const newField: CategoryField = {
      name: newFieldName.trim(),
      type: 'select',
      options: ['Opción 1'],
      variantOptions: [
        { label: 'Opción 1', mode: 'direct_cost', defaultCost: 0 }
      ],
      defaultValue: 'Opción 1',
    };

    const updated = [...(currentCategory.fields || []), newField];
    await db.categories.update(currentCategory.id, { fields: updated });
    setNewFieldName('');
    setIsAddingField(false);
  };

  const handleSaveFieldName = async (fieldIdx: number) => {
    if (!editFieldName.trim() || !currentCategory?.id) return;
    const updated = [...currentCategory.fields];
    updated[fieldIdx].name = editFieldName.trim();
    await db.categories.update(currentCategory.id, { fields: updated });
    setEditingFieldIdx(null);
  };

  const handleDeleteField = async (fieldIdx: number) => {
    if (!currentCategory?.id) return;
    if (confirm('¿Eliminar esta propiedad?')) {
      const updated = currentCategory.fields.filter((_, i) => i !== fieldIdx);
      await db.categories.update(currentCategory.id, { fields: updated });
    }
  };

  const handleAddQuickOption = async (fieldIdx: number) => {
    if (!quickOptionLabel.trim() || !currentCategory?.id) return;

    const label = quickOptionLabel.trim();
    const updated = [...currentCategory.fields];
    const target = updated[fieldIdx];

    target.options = [...(target.options || []), label];
    target.variantOptions = [
      ...(target.variantOptions || []),
      {
        label,
        mode: 'sheet_yield',
        baseSheetFormat: 'A4',
        baseYield: 24,
        extraYields: [],
      }
    ];

    await db.categories.update(currentCategory.id, { fields: updated });
    setQuickOptionLabel('');
    setTargetFieldIdxForOption(null);
  };

  const handleDeleteOption = async (fieldIdx: number, optIdx: number) => {
    if (!currentCategory?.id) return;
    const updated = [...currentCategory.fields];
    const target = updated[fieldIdx];

    target.options = target.options.filter((_, i) => i !== optIdx);
    if (target.variantOptions) {
      target.variantOptions = target.variantOptions.filter((_, i) => i !== optIdx);
    }

    await db.categories.update(currentCategory.id, { fields: updated });
  };

  const handleSaveDetailedOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditingOption || !currentCategory?.id) return;

    const { fieldIdx, optIdx, option } = activeEditingOption;
    const updated = [...currentCategory.fields];
    const target = updated[fieldIdx];

    target.options[optIdx] = option.label;
    if (!target.variantOptions) target.variantOptions = [];
    target.variantOptions[optIdx] = option;

    await db.categories.update(currentCategory.id, { fields: updated });
    setActiveEditingOption(null);
  };

  // Agregar formato extra opcional sin obligar a llenar otros
  const handleAddExtraSheet = () => {
    if (!extraSheetName.trim() || !extraSheetYield || !activeEditingOption) return;
    const extras = activeEditingOption.option.extraYields || [];
    setActiveEditingOption({
      ...activeEditingOption,
      option: {
        ...activeEditingOption.option,
        extraYields: [
          ...extras,
          { sheet: extraSheetName.trim().toUpperCase(), yield: Number(extraSheetYield) }
        ]
      }
    });
    setExtraSheetName('');
    setExtraSheetYield('');
  };

  const handleRemoveExtraSheet = (idx: number) => {
    if (!activeEditingOption) return;
    const extras = (activeEditingOption.option.extraYields || []).filter((_, i) => i !== idx);
    setActiveEditingOption({
      ...activeEditingOption,
      option: { ...activeEditingOption.option, extraYields: extras }
    });
  };

  return (
    <div 
      className="p-5 sm:p-6 rounded-3xl border shadow-xs max-w-4xl mx-auto space-y-6 transition-colors"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Sliders size={22} style={{ color: 'var(--accent)' }} />
          <div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Configurar Categorías y Reglas de Cálculo
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Configura cuántas unidades entran por pliego (A4, Carta, A3) y cómo se asocian a tus insumos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingCat(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-xs self-start sm:self-auto"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <FolderPlus size={16} /> Nueva Categoría
        </button>
      </div>

      {/* Formulario Crear Categoría */}
      {isCreatingCat && (
        <form 
          onSubmit={handleCreateCategory} 
          className="p-4 border rounded-2xl space-y-3" 
          style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--accent-soft)' }}
        >
          <span className="text-xs font-bold block" style={{ color: 'var(--accent)' }}>
            Nueva Categoría de Producto
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre (ej: Prints, Stickers, Pines, Cuadernos)..."
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 border rounded-xl p-2 text-xs outline-none"
              style={inputStyle}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Check size={14} /> Crear Categoría
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingCat(false)}
              className="px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Selector de Categoría Activa */}
      {currentCategory && (
        <div 
          className="p-4 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3"
          style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-main)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Categoría:</span>
            <select
              value={currentCategory.id}
              onChange={(e) => setSelectedCatId(Number(e.target.value))}
              className="border rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', color: 'var(--text-primary)' }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} style={inputStyle}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleDeleteCategory} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer">
            <Trash2 size={14} /> Eliminar categoría
          </button>
        </div>
      )}

      {/* Propiedades */}
      {currentCategory && (
        <div className="space-y-4">
          {(currentCategory.fields || []).map((field, fIdx) => (
            <div 
              key={fIdx}
              className="p-4 rounded-2xl border space-y-3"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
            >
              <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border-card)' }}>
                {editingFieldIdx === fIdx ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editFieldName}
                      onChange={(e) => setEditFieldName(e.target.value)}
                      className="border rounded-lg px-2 py-1 text-xs font-bold outline-none"
                      style={inputStyle}
                    />
                    <button onClick={() => handleSaveFieldName(fIdx)} className="p-1 rounded-lg text-white" style={{ backgroundColor: 'var(--accent)' }}>
                      <Check size={13} />
                    </button>
                    <button onClick={() => setEditingFieldIdx(null)} className="p-1 rounded-lg border" style={{ borderColor: 'var(--border-card)' }}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <strong className="text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                      Propiedad: <span style={{ color: 'var(--accent)' }}>{field.name}</span>
                    </strong>
                    <button 
                      onClick={() => {
                        setEditingFieldIdx(fIdx);
                        setEditFieldName(field.name);
                      }}
                      className="p-1" 
                      style={{ color: 'var(--text-muted)' }}
                      title="Editar nombre"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}

                <button onClick={() => handleDeleteField(fIdx)} className="text-xs text-red-400 hover:text-red-600 cursor-pointer">
                  <Trash2 size={13} /> Quitar
                </button>
              </div>

              {/* Opciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {(field.options || []).map((optLabel, oIdx) => {
                  const vo = field.variantOptions?.[oIdx] || { label: optLabel, mode: 'direct_cost', defaultCost: 0 };

                  return (
                    <div 
                      key={oIdx}
                      className="p-3 rounded-2xl border flex justify-between items-start text-xs transition"
                      style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}
                    >
                      <div className="min-w-0 pr-1">
                        <strong className="block truncate font-bold" style={{ color: 'var(--text-primary)' }}>
                          {optLabel}
                        </strong>

                        {vo.mode === 'sheet_yield' ? (
                          <span className="text-[10px] block mt-0.5" style={{ color: 'var(--accent)' }}>
                            Rinde <strong>{vo.baseYield || 24}</strong> en {vo.baseSheetFormat || 'A4'}
                            {vo.extraYields && vo.extraYields.length > 0 && ` (+${vo.extraYields.length} tamaños)`}
                          </span>
                        ) : vo.mode === 'fractional_supply' && vo.linkedSupplyId ? (
                          <span className="text-[10px] block mt-0.5 text-blue-500 font-semibold">
                            Fracción de lámina/insumo
                          </span>
                        ) : (
                          <span className="text-[10px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Costo taller: <strong>Bs. {Number(vo.defaultCost || 0).toFixed(2)}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => setActiveEditingOption({ fieldIdx: fIdx, optIdx: oIdx, option: { ...vo, label: optLabel } })}
                          className="p-1 hover:opacity-80 cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                          title="Configurar rendimiento o fórmula"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDeleteOption(fIdx, oIdx)} className="p-1 text-red-400 hover:text-red-600 cursor-pointer">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Agregar Opción */}
              {targetFieldIdxForOption === fIdx ? (
                <div className="flex gap-2 items-center pt-1">
                  <input
                    type="text"
                    placeholder="Nueva opción (ej: Mediano 2-6cm, A6, Holográfico)..."
                    value={quickOptionLabel}
                    onChange={(e) => setQuickOptionLabel(e.target.value)}
                    className="flex-1 border rounded-xl p-2 text-xs outline-none"
                    style={inputStyle}
                  />
                  <button
                    onClick={() => handleAddQuickOption(fIdx)}
                    className="px-3 py-2 text-white font-bold rounded-xl text-xs cursor-pointer"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setTargetFieldIdxForOption(null)}
                    className="px-2 py-2 border rounded-xl text-xs cursor-pointer"
                    style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTargetFieldIdxForOption(fIdx);
                    setQuickOptionLabel('');
                  }}
                  className="text-xs font-bold flex items-center gap-1 pt-1 cursor-pointer"
                  style={{ color: 'var(--accent)' }}
                >
                  <Plus size={14} /> Añadir opción a {field.name}
                </button>
              )}
            </div>
          ))}

          {isAddingField ? (
            <form onSubmit={handleAddField} className="p-4 rounded-2xl border space-y-2" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--accent)' }}>
              <span className="text-xs font-bold block" style={{ color: 'var(--accent)' }}>
                Nueva Propiedad para {currentCategory.name}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la propiedad (ej: Tamaño, Tipo de Papel, Acabado)..."
                  required
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="flex-1 border rounded-xl p-2 text-xs outline-none"
                  style={inputStyle}
                />
                <button type="submit" className="px-4 py-2 text-white font-bold rounded-xl text-xs cursor-pointer" style={{ backgroundColor: 'var(--accent)' }}>
                  Crear Propiedad
                </button>
                <button type="button" onClick={() => setIsAddingField(false)} className="px-3 py-2 border rounded-xl text-xs cursor-pointer" style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingField(true)}
              className="w-full py-3 rounded-2xl border border-dashed flex items-center justify-center gap-1 text-xs font-bold cursor-pointer"
              style={{ borderColor: 'var(--border-card)', color: 'var(--accent)' }}
            >
              <Plus size={16} /> Agregar Nueva Propiedad a {currentCategory.name}
            </button>
          )}
        </div>
      )}

      {/* Modal Avanzado de Opción con Rendimiento Principal Editable y Extras Opcionales */}
      {activeEditingOption && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form 
            onSubmit={handleSaveDetailedOption}
            className="p-5 sm:p-6 rounded-3xl border shadow-2xl max-w-md w-full space-y-4 my-auto"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
          >
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border-card)' }}>
              <h3 className="font-extrabold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                Regla de Costo: {activeEditingOption.option.label}
              </h3>
              <button type="button" onClick={() => setActiveEditingOption(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Nombre / Etiqueta:</label>
              <input
                type="text"
                required
                value={activeEditingOption.option.label}
                onChange={(e) => setActiveEditingOption({
                  ...activeEditingOption,
                  option: { ...activeEditingOption.option, label: e.target.value }
                })}
                className="w-full border rounded-xl p-2 text-xs font-bold outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                ¿Cómo calcula el costo esta opción?
              </label>
              <select
                value={activeEditingOption.option.mode || 'sheet_yield'}
                onChange={(e) => setActiveEditingOption({
                  ...activeEditingOption,
                  option: { ...activeEditingOption.option, mode: e.target.value as any }
                })}
                className="w-full border rounded-xl p-2 text-xs outline-none font-bold cursor-pointer"
                style={inputStyle}
              >
                <option value="sheet_yield" style={inputStyle}>📄 Tamaño / Rendimiento por Hoja (A4, Carta, A3...)</option>
                <option value="fractional_supply" style={inputStyle}>✨ Fracción de Insumo (Lámina Holográfica, etc.)</option>
                <option value="direct_cost" style={inputStyle}>💵 Costo fijo de taller (Pines, manufactura)</option>
              </select>
            </div>

            {/* Configuración de Rendimiento */}
            {activeEditingOption.option.mode === 'sheet_yield' && (
              <div className="p-3.5 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
                <div>
                  <span className="text-xs font-bold block mb-1" style={{ color: 'var(--accent)' }}>
                    1. Hoja Principal por defecto:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Tamaño de la hoja:</label>
                      <input
                        type="text"
                        value={activeEditingOption.option.baseSheetFormat || 'A4'}
                        onChange={(e) => setActiveEditingOption({
                          ...activeEditingOption,
                          option: { ...activeEditingOption.option, baseSheetFormat: e.target.value.toUpperCase() }
                        })}
                        className="w-full border rounded-xl p-1.5 text-xs text-center font-bold outline-none font-mono"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Cuántos entran:</label>
                      <input
                        type="number"
                        value={activeEditingOption.option.baseYield || 24}
                        onChange={(e) => setActiveEditingOption({
                          ...activeEditingOption,
                          option: { ...activeEditingOption.option, baseYield: Number(e.target.value) }
                        })}
                        className="w-full border rounded-xl p-1.5 text-xs text-center font-bold outline-none"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Tamaños extras opcionales */}
                <div className="border-t pt-2 space-y-2" style={{ borderColor: 'var(--border-card)' }}>
                  <span className="text-[11px] font-bold block" style={{ color: 'var(--text-primary)' }}>
                    2. Otros tamaños opcionales (opcional):
                  </span>

                  {(activeEditingOption.option.extraYields || []).map((ex, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-1.5 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
                      <span>En <strong>{ex.sheet}</strong> entran <strong>{ex.yield}</strong></span>
                      <button type="button" onClick={() => handleRemoveExtraSheet(idx)} className="text-red-400 p-1 cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Hoja (ej: A3, Carta)"
                      value={extraSheetName}
                      onChange={(e) => setExtraSheetName(e.target.value)}
                      className="w-1/2 border rounded-xl p-1.5 text-xs outline-none font-mono"
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      placeholder="Entran"
                      value={extraSheetYield}
                      onChange={(e) => setExtraSheetYield(e.target.value)}
                      className="w-1/3 border rounded-xl p-1.5 text-xs outline-none text-center font-bold"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={handleAddExtraSheet}
                      className="px-2.5 py-1.5 text-white font-bold rounded-xl text-xs cursor-pointer"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Insumo Vinculado */}
            {activeEditingOption.option.mode === 'fractional_supply' && (
              <div className="p-3 rounded-2xl border space-y-2" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
                <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-muted)' }}>
                  Vincular al insumo:
                </label>
                <select
                  value={activeEditingOption.option.linkedSupplyId || ''}
                  onChange={(e) => setActiveEditingOption({
                    ...activeEditingOption,
                    option: { ...activeEditingOption.option, linkedSupplyId: Number(e.target.value) }
                  })}
                  className="w-full border rounded-xl p-2 text-xs outline-none"
                  style={inputStyle}
                >
                  <option value="">-- Seleccionar Insumo --</option>
                  {supplies.map((s) => (
                    <option key={s.id} value={s.id} style={inputStyle}>
                      {s.name} ({s.sheetFormat ? `Formato ${s.sheetFormat} - ` : ''}Bs. {s.costPerUnit.toFixed(2)} por {s.unit})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Costo Directo */}
            {activeEditingOption.option.mode === 'direct_cost' && (
              <div>
                <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Costo directo por pieza (Bs.):
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={activeEditingOption.option.defaultCost || 0}
                  onChange={(e) => setActiveEditingOption({
                    ...activeEditingOption,
                    option: { ...activeEditingOption.option, defaultCost: Number(e.target.value) }
                  })}
                  className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none"
                  style={inputStyle}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-card)' }}>
              <button
                type="button"
                onClick={() => setActiveEditingOption(null)}
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