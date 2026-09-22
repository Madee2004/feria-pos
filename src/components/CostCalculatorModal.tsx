import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  X, 
  Calculator, 
  Check, 
  Home, 
  Truck, 
  Layers, 
  Clock, 
  Cpu, 
  Package 
} from 'lucide-react';
import type { ProductionOrigin } from '../types';

interface Props {
  categoryName: string;
  onApplyCost: (cost: number, suggestedPrice: number) => void;
  onClose: () => void;
}

export const CostCalculatorModal: React.FC<Props> = ({ categoryName, onApplyCost, onClose }) => {
  const supplies = useLiveQuery(() => db.supplies.toArray()) ?? [];
  const machinery = useLiveQuery(() => db.machinery.toArray()) ?? [];

  // Pestaña Principal: Hecho en Casa vs. Tercerizado
  const [origin, setOrigin] = useState<ProductionOrigin>('outsourced');

  // ==========================================
  // ESTADOS: TERCERIZADO / FUERA DE CASA
  // ==========================================
  const [outsourcedType, setOutsourcedType] = useState<'sheet' | 'unit'>('sheet');
  const [outsourcedSheetName, setOutsourcedSheetName] = useState('A4');
  const [outsourcedSheetCost, setOutsourcedSheetCost] = useState('6.0'); // Lo que cobra la imprenta por hoja
  const [outsourcedYield, setOutsourcedYield] = useState('24');          // Cuántos salen de esa hoja
  const [outsourcedDirectUnitCost, setOutsourcedDirectUnitCost] = useState('2.5'); // Si cobra por unidad (pines)
  const [extraPackagingCost, setExtraPackagingCost] = useState('0.20'); // Bolsita/empaque adicional

  // ==========================================
  // ESTADOS: HECHO EN CASA
  // ==========================================
  const [selectedBasePaperId, setSelectedBasePaperId] = useState<string>('');
  const [selectedLaminateId, setSelectedLaminateId] = useState<string>('');
  const [inHouseYield, setInHouseYield] = useState('24'); // Cuántos salen de la hoja casera
  const [selectedMachineryIds, setSelectedMachineryIds] = useState<number[]>([]);
  const [laborMinutes, setLaborMinutes] = useState('1.5');
  const [hourlyWage, setHourlyWage] = useState('25'); // Bs. por hora

  // Margen de ganancia general
  const [profitMargin, setProfitMargin] = useState('50');

  // ------------------------------------------
  // CÁLCULO DE COSTO EN VIVO
  // ------------------------------------------
  let unitCostCalculated = 0;

  if (origin === 'outsourced') {
    if (outsourcedType === 'sheet') {
      const sheetPrice = Number(outsourcedSheetCost) || 0;
      const pieces = Number(outsourcedYield) || 1;
      const basePieceCost = pieces > 0 ? sheetPrice / pieces : 0;
      unitCostCalculated = basePieceCost + (Number(extraPackagingCost) || 0);
    } else {
      unitCostCalculated = (Number(outsourcedDirectUnitCost) || 0) + (Number(extraPackagingCost) || 0);
    }
  } else {
    // Hecho en casa:
    const basePaper = supplies.find((s) => s.id === Number(selectedBasePaperId));
    const laminate = supplies.find((s) => s.id === Number(selectedLaminateId));
    const pieces = Number(inHouseYield) || 1;

    const paperCostPerPiece = basePaper && pieces > 0 ? basePaper.costPerUnit / pieces : 0;
    const laminateCostPerPiece = laminate && pieces > 0 ? laminate.costPerUnit / pieces : 0;

    // Desgaste de máquinas seleccionadas
    const machineryDepreciation = selectedMachineryIds.reduce((acc, id) => {
      const m = machinery.find((item) => item.id === id);
      return acc + (m ? m.depreciationPerUse / (pieces > 0 ? pieces : 1) : 0);
    }, 0);

    // Mano de obra por pieza
    const minutes = Number(laborMinutes) || 0;
    const wage = Number(hourlyWage) || 0;
    const laborCostPerPiece = (minutes / 60) * wage;

    unitCostCalculated = paperCostPerPiece + laminateCostPerPiece + machineryDepreciation + laborCostPerPiece + (Number(extraPackagingCost) || 0);
  }

  const marginNum = Number(profitMargin) || 0;
  const suggestedSalePrice = Math.max(1, Math.ceil(unitCostCalculated * (1 + marginNum / 100)));

  const toggleMachinery = (id: number) => {
    setSelectedMachineryIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-main)',
    borderColor: 'var(--border-card)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div 
        className="rounded-3xl p-5 sm:p-6 max-w-lg w-full relative shadow-2xl border max-h-[94vh] overflow-y-auto space-y-4 my-auto"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        {/* Cabecera */}
        <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border-card)' }}>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calculator size={18} style={{ color: 'var(--accent)' }} /> Calculadora: {categoryName}
            </h3>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Elige cómo fabricas esta pieza para obtener el costo real exacto.
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:opacity-70 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* SELECTOR DUAL DE MODO: TERCERIZADO VS HECHO EN CASA */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
          <button
            type="button"
            onClick={() => setOrigin('outsourced')}
            className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            style={{
              backgroundColor: origin === 'outsourced' ? 'var(--accent)' : 'transparent',
              color: origin === 'outsourced' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <Truck size={15} /> Pedido a Tercero / Taller
          </button>

          <button
            type="button"
            onClick={() => setOrigin('in_house')}
            className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            style={{
              backgroundColor: origin === 'in_house' ? 'var(--accent)' : 'transparent',
              color: origin === 'in_house' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <Home size={15} /> Hecho en Casa
          </button>
        </div>

        {/* ======================================================== */}
        {/* CASO 1: PEDIDO A TERCERO / IMPRENTA EXTERNA             */}
        {/* ======================================================== */}
        {origin === 'outsourced' && (
          <div className="space-y-3.5 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                Modalidad de cobro del taller:
              </span>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setOutsourcedType('sheet')}
                  className="px-2.5 py-1 rounded-lg border font-bold cursor-pointer"
                  style={{
                    backgroundColor: outsourcedType === 'sheet' ? 'var(--accent-soft)' : 'transparent',
                    borderColor: outsourcedType === 'sheet' ? 'var(--accent)' : 'var(--border-card)',
                    color: outsourcedType === 'sheet' ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  Por Hoja/Pliego
                </button>
                <button
                  type="button"
                  onClick={() => setOutsourcedType('unit')}
                  className="px-2.5 py-1 rounded-lg border font-bold cursor-pointer"
                  style={{
                    backgroundColor: outsourcedType === 'unit' ? 'var(--accent-soft)' : 'transparent',
                    borderColor: outsourcedType === 'unit' ? 'var(--accent)' : 'var(--border-card)',
                    color: outsourcedType === 'unit' ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  Por Pieza Unitaria
                </button>
              </div>
            </div>

            {outsourcedType === 'sheet' ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                      Tamaño de Hoja:
                    </label>
                    <input
                      type="text"
                      value={outsourcedSheetName}
                      onChange={(e) => setOutsourcedSheetName(e.target.value.toUpperCase())}
                      placeholder="A4, A3, Carta"
                      className="w-full border rounded-xl p-2 text-xs font-mono font-bold text-center outline-none"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                      Costo Hoja (Bs.):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={outsourcedSheetCost}
                      onChange={(e) => setOutsourcedSheetCost(e.target.value)}
                      placeholder="Ej: 6.00"
                      className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                      Entran en la hoja:
                    </label>
                    <input
                      type="number"
                      value={outsourcedYield}
                      onChange={(e) => setOutsourcedYield(e.target.value)}
                      placeholder="Ej: 24"
                      className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border flex justify-between items-center text-xs" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Costo base por cada sticker/print:</span>
                  <strong style={{ color: 'var(--accent)' }}>
                    Bs. {Number(outsourcedYield) > 0 ? ((Number(outsourcedSheetCost) || 0) / Number(outsourcedYield)).toFixed(3) : '0.00'}
                  </strong>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Tarifa del taller por cada unidad terminada (Bs.):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={outsourcedDirectUnitCost}
                  onChange={(e) => setOutsourcedDirectUnitCost(e.target.value)}
                  placeholder="Ej: 2.50"
                  className="w-full sm:w-40 border rounded-xl p-2 text-xs font-bold text-center outline-none"
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                Bolsita o empaque adicional por unidad (Bs.):
              </label>
              <input
                type="number"
                step="0.05"
                value={extraPackagingCost}
                onChange={(e) => setExtraPackagingCost(e.target.value)}
                className="w-28 border rounded-xl p-1.5 text-xs text-center font-bold outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CASO 2: HECHO EN CASA (INSUMOS + MÁQUINAS + MANO DE OBRA)*/}
        {/* ======================================================== */}
        {origin === 'in_house' && (
          <div className="space-y-3.5 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
            {/* 1. Insumos */}
            <div className="space-y-2">
              <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Layers size={14} style={{ color: 'var(--accent)' }} /> 1. Materiales de tu inventario:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Papel / Material base:</label>
                  <select
                    value={selectedBasePaperId}
                    onChange={(e) => setSelectedBasePaperId(e.target.value)}
                    className="w-full border rounded-xl p-2 text-xs outline-none"
                    style={inputStyle}
                  >
                    <option value="">-- Seleccionar papel base --</option>
                    {supplies.map((s) => (
                      <option key={s.id} value={s.id} style={inputStyle}>
                        {s.name} (Bs. {s.costPerUnit} / {s.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Laminado / Acabado (opcional):</label>
                  <select
                    value={selectedLaminateId}
                    onChange={(e) => setSelectedLaminateId(e.target.value)}
                    className="w-full border rounded-xl p-2 text-xs outline-none"
                    style={inputStyle}
                  >
                    <option value="">-- Ninguno / Sin Laminar --</option>
                    {supplies.map((s) => (
                      <option key={s.id} value={s.id} style={inputStyle}>
                        {s.name} (Bs. {s.costPerUnit} / {s.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Unidades que rinde esa hoja entera en casa:
                </label>
                <input
                  type="number"
                  value={inHouseYield}
                  onChange={(e) => setInHouseYield(e.target.value)}
                  className="w-28 border rounded-xl p-1.5 text-xs text-center font-bold outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 2. Maquinaria usada */}
            {machinery.length > 0 && (
              <div className="border-t pt-2.5 space-y-1.5" style={{ borderColor: 'var(--border-card)' }}>
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Cpu size={14} style={{ color: 'var(--accent)' }} /> 2. Desgaste de Maquinaria utilizada:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {machinery.map((m) => {
                    const isChecked = selectedMachineryIds.includes(m.id!);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMachinery(m.id!)}
                        className="p-2 rounded-xl border text-left flex justify-between items-center text-xs transition cursor-pointer"
                        style={{
                          backgroundColor: isChecked ? 'var(--accent-soft)' : 'var(--bg-card)',
                          borderColor: isChecked ? 'var(--accent)' : 'var(--border-card)',
                          color: isChecked ? 'var(--accent)' : 'var(--text-primary)',
                        }}
                      >
                        <span className="font-semibold truncate">{m.name}</span>
                        <span className="text-[10px] font-bold shrink-0 ml-1">+Bs. {m.depreciationPerUse.toFixed(2)}/uso</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Mano de Obra */}
            <div className="border-t pt-2.5 space-y-2" style={{ borderColor: 'var(--border-card)' }}>
              <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Clock size={14} style={{ color: 'var(--accent)' }} /> 3. Tiempo de Confección / Armado:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Minutos por pieza:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={laborMinutes}
                    onChange={(e) => setLaborMinutes(e.target.value)}
                    className="w-full border rounded-xl p-1.5 text-xs text-center font-bold outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Salario por hora (Bs./h):</label>
                  <input
                    type="number"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(e.target.value)}
                    className="w-full border rounded-xl p-1.5 text-xs text-center font-bold outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MARGEN DE GANANCIA */}
        <div className="flex justify-between items-center text-xs px-1">
          <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>
            Margen de Ganancia Deseado (%):
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              className="w-20 border rounded-xl p-1.5 font-bold text-center outline-none"
              style={inputStyle}
            />
            <span className="font-bold text-xs" style={{ color: 'var(--text-muted)' }}>%</span>
          </div>
        </div>

        {/* RESULTADO Y APLICAR */}
        <div className="p-3.5 rounded-2xl space-y-1 border" style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'var(--border-card)' }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Costo Unitario Real ({origin === 'outsourced' ? 'Taller' : 'Taller Casero'}):</span>
            <strong className="font-bold" style={{ color: 'var(--text-primary)' }}>
              Bs. {unitCostCalculated.toFixed(2)}
            </strong>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Precio de Venta Sugerido:</span>
            <strong className="font-extrabold text-base" style={{ color: 'var(--accent)' }}>
              Bs. {suggestedSalePrice.toFixed(2)}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onApplyCost(Number(unitCostCalculated.toFixed(2)), suggestedSalePrice);
            onClose();
          }}
          className="w-full py-3.5 text-white font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Check size={18} /> Aplicar al Formulario de Producto
        </button>
      </div>
    </div>
  );
};