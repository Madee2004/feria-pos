import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Product, CartItem } from '../types';
import { ScannerModal } from './ScannerModal';
import { Camera, Trash2, CheckCircle2, Search, Plus, Minus, CreditCard, Banknote } from 'lucide-react';

export const QuickPOS: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'qr'>('efectivo');
  const [searchTerm, setSearchTerm] = useState('');
  const [cashGiven, setCashGiven] = useState('');

  const products = useLiveQuery(() => db.products.toArray()) ?? [];

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`¡${product.name} no tiene stock disponible!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Solo quedan ${product.stock} unidades en inventario.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.salePrice }
            : item
        );
      }
      return [...prev, { product, quantity: 1, subtotal: product.salePrice }];
    });
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Solo hay ${item.product.stock} unidades disponibles.`);
              return item;
            }
            return newQty > 0
              ? { ...item, quantity: newQty, subtotal: newQty * item.product.salePrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleScannedSku = async (sku: string) => {
    setIsScannerOpen(false);
    const product = await db.products.where('sku').equals(sku.trim()).first();
    if (product) {
      addToCart(product);
    } else {
      alert(`Producto con SKU "${sku}" no encontrado.`);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const cashNum = Number(cashGiven) || 0;
  const changeDue = cashNum > total ? cashNum - total : 0;

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;

    try {
      await db.transaction('rw', db.products, db.sales, async () => {
        for (const item of cart) {
          const current = await db.products.get(item.product.id!);
          if (current) {
            await db.products.update(item.product.id!, {
              stock: Math.max(0, current.stock - item.quantity),
            });
          }
        }

        await db.sales.add({
          items: cart,
          total,
          paymentMethod,
          timestamp: new Date().toISOString(),
          syncedWithBackend: false,
        });
      });

      setCart([]);
      setCashGiven('');
      alert('✨ ¡Venta registrada y stock descontado exitosamente!');
    } catch (error) {
      console.error(error);
      alert('Error al procesar la venta.');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna Izquierda: Botón Escáner + Buscador + Catálogo Táctil con Fotos */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-white shadow-sm transition cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Camera size={20} />
            Escanear Código / QR
          </button>

          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar producto para venta manual..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-2xl border outline-none transition"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Grilla de Productos con Fotos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.length === 0 ? (
            <div 
              className="col-span-full p-8 text-center rounded-3xl border border-dashed"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
            >
              No hay productos para mostrar con ese criterio.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const outOfStock = p.stock <= 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={outOfStock}
                  className="p-3 rounded-2xl border text-left flex flex-col justify-between h-36 transition cursor-pointer relative overflow-hidden shadow-2xs hover:border-gray-400"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-card)',
                    opacity: outOfStock ? 0.45 : 1,
                  }}
                >
                  <div className="flex gap-2 items-start w-full">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border"
                        style={{ borderColor: 'var(--border-card)' }}
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 text-base"
                        style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}
                      >
                        🎨
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </p>
                      <span className="text-[10px] font-semibold block truncate" style={{ color: 'var(--text-muted)' }}>
                        {p.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end w-full mt-2">
                    <span className="font-extrabold text-sm sm:text-base" style={{ color: 'var(--accent)' }}>
                      Bs. {p.salePrice.toFixed(2)}
                    </span>
                    <span 
                      className="text-[10px] px-2 py-0.5 rounded-md font-bold"
                      style={{
                        backgroundColor: p.stock <= p.minStockAlert ? '#fee2e2' : 'var(--accent-soft)',
                        color: p.stock <= p.minStockAlert ? '#b91c1c' : 'var(--accent)'
                      }}
                    >
                      {outOfStock ? 'Agotado' : `Stock: ${p.stock}`}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Columna Derecha: Orden Actual */}
      <div 
        className="p-5 rounded-3xl border shadow-sm flex flex-col justify-between h-fit sticky top-20"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-extrabold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
              Orden Actual
            </h2>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] font-semibold text-red-500 hover:text-red-700 cursor-pointer"
              >
                Vaciar
              </button>
            )}
          </div>
            {/*{cart.length === 0 && (*/}
          {cart.length === 0 ? (
            <p className="text-xs text-center py-10" style={{ color: 'var(--text-muted)' }}>
              Escanea un código o toca un producto para agregarlo a la cuenta.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div 
                  key={item.product.id} 
                  className="flex justify-between items-center text-xs border-b pb-2"
                  style={{ borderColor: 'var(--border-card)' }}
                >
                  <div className="flex-1 pr-2">
                    <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.product.name}
                    </p>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Bs. {item.product.salePrice.toFixed(2)} c/u
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCartQuantity(item.product.id!, -1)}
                      className="w-6 h-6 rounded-md border flex items-center justify-center font-bold hover:bg-black/5 cursor-pointer"
                      style={{ borderColor: 'var(--border-card)', color: 'var(--text-primary)' }}
                    >
                      <Minus size={11} />
                    </button>
                    <span className="font-extrabold text-xs w-5 text-center" style={{ color: 'var(--text-primary)' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id!, 1)}
                      className="w-6 h-6 rounded-md border flex items-center justify-center font-bold hover:bg-black/5 cursor-pointer"
                      style={{ borderColor: 'var(--border-card)', color: 'var(--text-primary)' }}
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <span className="font-extrabold text-xs w-16 text-right" style={{ color: 'var(--text-primary)' }}>
                    Bs. {item.subtotal.toFixed(2)}
                  </span>

                  <button 
                    onClick={() => removeFromCart(item.product.id!)}
                    className="text-gray-400 hover:text-red-500 pl-2 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zona de Cobro */}
        <div className="pt-4 border-t mt-4 space-y-3.5" style={{ borderColor: 'var(--border-card)' }}>
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-xs" style={{ color: 'var(--text-muted)' }}>Total a cobrar:</span>
            <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              Bs. {total.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('efectivo')}
              className="py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: paymentMethod === 'efectivo' ? 'var(--accent-soft)' : 'transparent',
                borderColor: paymentMethod === 'efectivo' ? 'var(--accent)' : 'var(--border-card)',
                color: paymentMethod === 'efectivo' ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <Banknote size={15} /> Efectivo
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('qr')}
              className="py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: paymentMethod === 'qr' ? 'var(--accent-soft)' : 'transparent',
                borderColor: paymentMethod === 'qr' ? 'var(--accent)' : 'var(--border-card)',
                color: paymentMethod === 'qr' ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <CreditCard size={15} /> QR / Transfer
            </button>
          </div>

          {paymentMethod === 'efectivo' && total > 0 && (
            <div className="p-2.5 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-main)' }}>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Paga con (Bs.):</span>
                <input
                  type="number"
                  placeholder={String(total)}
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  className="w-24 border rounded-lg p-1 text-right font-bold text-xs outline-none"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', color: 'var(--text-primary)' }}
                />
              </div>
              {cashNum > 0 && (
                <div className="flex justify-between text-xs font-bold pt-1 border-t" style={{ borderColor: 'var(--border-card)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cambio / Vuelto:</span>
                  <span style={{ color: changeDue >= 0 ? '#16a34a' : '#dc2626' }}>
                    Bs. {changeDue.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleFinalizeSale}
            disabled={cart.length === 0}
            className="w-full py-3.5 text-white font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <CheckCircle2 size={18} /> Confirmar Venta
          </button>
        </div>
      </div>

      {isScannerOpen && (
        <ScannerModal
          onScanSuccess={handleScannedSku}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};