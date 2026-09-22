import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Product, ProductAttribute } from '../types';
import { CostCalculatorModal } from './CostCalculatorModal';
import {
    Search,
    Trash2,
    Edit2,
    AlertTriangle,
    Image as ImageIcon,
    X,
    Check,
    Upload,
    Plus,
    Minus,
    Calculator
} from 'lucide-react';

export const InventoryView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editCategoryAttrs, setEditCategoryAttrs] = useState<Record<string, string>>({});
    const [editCustomAttrs, setEditCustomAttrs] = useState<ProductAttribute[]>([]);
    const [newCustomKey, setNewCustomKey] = useState('');
    const [newCustomVal, setNewCustomVal] = useState('');

    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

    const products = useLiveQuery(() => db.products.toArray()) ?? [];
    const categories = useLiveQuery(() => db.categories.toArray()) ?? [];

    const currentCategoryConfig = categories.find((c) => c.name === editingProduct?.category);

    useEffect(() => {
        if (editingProduct) {
            const catConfig = categories.find((c) => c.name === editingProduct.category);
            const standardKeys = new Set(catConfig?.fields.map((f) => f.name) || []);

            const catAttrs: Record<string, string> = {};
            const customAttrs: ProductAttribute[] = [];

            (editingProduct.attributes || []).forEach((attr) => {
                if (standardKeys.has(attr.name)) {
                    catAttrs[attr.name] = attr.value;
                } else {
                    customAttrs.push(attr);
                }
            });

            catConfig?.fields.forEach((f) => {
                if (!catAttrs[f.name]) {
                    catAttrs[f.name] = f.defaultValue || (f.options && f.options.length > 0 ? f.options[0] : '');
                }
            });

            setEditCategoryAttrs(catAttrs);
            setEditCustomAttrs(customAttrs);
        }
    }, [editingProduct?.id, editingProduct?.category, categories]);

    const handleCategoryChangeInEdit = (newCatName: string) => {
        if (!editingProduct) return;
        setEditingProduct({ ...editingProduct, category: newCatName });
    };

    const handleCategoryAttrChange = (fieldName: string, value: string) => {
        setEditCategoryAttrs((prev) => ({ ...prev, [fieldName]: value }));
    };

    const handleAddCustomAttr = () => {
        if (!newCustomKey.trim() || !newCustomVal.trim()) return;
        setEditCustomAttrs((prev) => [
            ...prev,
            { name: newCustomKey.trim(), value: newCustomVal.trim() },
        ]);
        setNewCustomKey('');
        setNewCustomVal('');
    };

    const handleRemoveCustomAttr = (idx: number) => {
        setEditCustomAttrs((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleImageChangeInEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingProduct) return;

        const reader = new FileReader();
        reader.onload = () => {
            setEditingProduct({ ...editingProduct, imageUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProductEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct || !editingProduct.id) return;

        const mergedAttributes: ProductAttribute[] = [
            ...Object.entries(editCategoryAttrs).map(([name, value]) => ({ name, value: String(value) })),
            ...editCustomAttrs,
        ];

        try {
            await db.products.update(editingProduct.id, {
                name: editingProduct.name,
                category: editingProduct.category,
                costPrice: Number(editingProduct.costPrice) || 0,
                salePrice: Number(editingProduct.salePrice) || 0,
                stock: Number(editingProduct.stock) || 0,
                minStockAlert: Number(editingProduct.minStockAlert) || 2,
                sku: editingProduct.sku.trim(),
                imageUrl: editingProduct.imageUrl || undefined,
                attributes: mergedAttributes,
            });
            setEditingProduct(null);
        } catch (error) {
            console.error(error);
            alert('Error al actualizar el producto (verifica que el SKU no esté duplicado).');
        }
    };

    const handleQuickStockChange = async (productId: number, currentStock: number, delta: number) => {
        const nextStock = Math.max(0, currentStock + delta);
        await db.products.update(productId, { stock: nextStock });
    };

    const handleDelete = async (id: number, name: string) => {
        if (confirm(`¿Estás segura de eliminar "${name}" del inventario?`)) {
            await db.products.delete(id);
        }
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const inputStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg-main)',
        borderColor: 'var(--border-card)',
        color: 'var(--text-primary)',
    };

    return (
        <div className="space-y-4 max-w-5xl mx-auto">
            {/* Filtros */}
            <div
                className="p-4 rounded-3xl border shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
            >
                <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border outline-none transition"
                        style={inputStyle}
                    />
                </div>

                <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('Todas')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border"
                        style={{
                            backgroundColor: selectedCategory === 'Todas' ? 'var(--accent)' : 'var(--bg-main)',
                            color: selectedCategory === 'Todas' ? '#ffffff' : 'var(--text-muted)',
                            borderColor: 'var(--border-card)',
                        }}
                    >
                        Todas
                    </button>
                    {categories.map((c) => (
                        <button
                            key={c.name}
                            type="button"
                            onClick={() => setSelectedCategory(c.name)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border"
                            style={{
                                backgroundColor: selectedCategory === c.name ? 'var(--accent)' : 'var(--bg-main)',
                                color: selectedCategory === c.name ? '#ffffff' : 'var(--text-muted)',
                                borderColor: 'var(--border-card)',
                            }}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de Productos */}
            {filteredProducts.length === 0 ? (
                <div
                    className="p-10 text-center rounded-3xl border border-dashed space-y-1"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
                >
                    <p className="font-bold text-sm">No se encontraron productos</p>
                    <p className="text-xs">Registra piezas nuevas desde la pestaña "Nuevo".</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredProducts.map((product) => {
                        const isLowStock = product.stock <= product.minStockAlert;
                        const isOutOfStock = product.stock === 0;

                        return (
                            <div
                                key={product.id}
                                className="p-3.5 sm:p-4 rounded-3xl border shadow-2xs flex gap-3.5 items-start transition relative overflow-hidden"
                                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
                            >
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border"
                                        style={{ borderColor: 'var(--border-card)' }}
                                    />
                                ) : (
                                    <div
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex flex-col items-center justify-center shrink-0 text-xl"
                                        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
                                    >
                                        <ImageIcon size={22} className="opacity-40" />
                                        <span className="text-[9px] font-bold mt-0.5 opacity-60">Sin foto</span>
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-1">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                <span>{product.category}</span>
                                                <span>•</span>
                                                <span className="font-mono text-[10px]">{product.sku}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => setEditingProduct(product)}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg cursor-pointer transition"
                                                title="Editar producto completo"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id!, product.name)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer transition"
                                                title="Eliminar producto"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {product.attributes && product.attributes.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {product.attributes.map((attr, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-[10px] px-2 py-0.5 rounded-md border font-medium truncate max-w-[130px]"
                                                    style={{
                                                        backgroundColor: 'var(--bg-main)',
                                                        borderColor: 'var(--border-card)',
                                                        color: 'var(--text-primary)',
                                                    }}
                                                >
                                                    <strong>{attr.name}:</strong> {attr.value}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-end mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-card)' }}>
                                        <div>
                                            <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>
                                                Costo: Bs. {product.costPrice.toFixed(2)}
                                            </span>
                                            <span className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--accent)' }}>
                                                Bs. {product.salePrice.toFixed(2)}
                                            </span>
                                        </div>

                                        <div
                                            className="flex items-center gap-1 p-1 rounded-2xl border transition shadow-2xs"
                                            style={{
                                                backgroundColor: isOutOfStock
                                                    ? '#fee2e2'
                                                    : isLowStock
                                                        ? '#fef3c7'
                                                        : 'var(--accent-soft)',
                                                borderColor: isOutOfStock
                                                    ? '#fca5a5'
                                                    : isLowStock
                                                        ? '#fde68a'
                                                        : 'var(--accent)',
                                                color: isOutOfStock
                                                    ? '#991b1b'
                                                    : isLowStock
                                                        ? '#92400e'
                                                        : 'var(--accent)',
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleQuickStockChange(product.id!, product.stock, -1)}
                                                disabled={product.stock <= 0}
                                                className="w-6 h-6 rounded-xl border flex items-center justify-center cursor-pointer transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
                                                style={{ borderColor: 'currentColor' }}
                                            >
                                                <Minus size={11} strokeWidth={2.5} />
                                            </button>

                                            <div
                                                onClick={() => setEditingProduct(product)}
                                                className="px-1.5 flex items-center gap-1 cursor-pointer select-none"
                                            >
                                                {isLowStock && <AlertTriangle size={11} className="shrink-0" />}
                                                <span className="text-xs font-black min-w-[18px] text-center">
                                                    {product.stock}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleQuickStockChange(product.id!, product.stock, 1)}
                                                className="w-6 h-6 rounded-xl border flex items-center justify-center cursor-pointer transition hover:bg-black/5"
                                                style={{ borderColor: 'currentColor' }}
                                            >
                                                <Plus size={11} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Completo de Edición */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
                    <form

                        onSubmit={handleSaveProductEdit}
                        className="p-5 sm:p-6 rounded-3xl border shadow-2xl max-w-lg w-full space-y-4 my-auto max-h-[92vh] overflow-y-auto"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
                    >
                        <div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                                        Nombre del producto:
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-xs font-bold outline-none"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                        </div>
                        <div className="flex justify-between items-center border-b pb-2.5" style={{ borderColor: 'var(--border-card)' }}>
                            <div>
                                <h3 className="font-extrabold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                                    Editar Producto
                                </h3>
                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                    Modifica propiedades, recalcula o añade etiquetas personalizadas.
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                className="p-1 rounded-full hover:opacity-70 cursor-pointer"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Imagen */}
                        <div className="flex items-center gap-3 p-2.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
                            {editingProduct.imageUrl ? (
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden border shrink-0" style={{ borderColor: 'var(--border-card)' }}>
                                    <img src={editingProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setEditingProduct({ ...editingProduct, imageUrl: undefined })}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg cursor-pointer"
                                        title="Quitar foto"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-14 h-14 rounded-xl border border-dashed flex items-center justify-center shrink-0" style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}>
                                    <ImageIcon size={20} />
                                </div>
                            )}
                            <div className="flex-1">
                                <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>Ilustración / Foto</span>
                                <label className="inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-xl text-[11px] font-bold cursor-pointer text-white" style={{ backgroundColor: 'var(--accent)' }}>
                                    <Upload size={12} /> {editingProduct.imageUrl ? 'Cambiar Foto' : 'Subir Foto'}
                                    <input type="file" accept="image/*" onChange={handleImageChangeInEdit} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {/* Nombre y Categoría */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                                    Nombre del producto:
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-xs font-bold outline-none"
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                                    Categoría:
                                </label>
                                <select
                                    value={editingProduct.category}
                                    onChange={(e) => handleCategoryChangeInEdit(e.target.value)}
                                    className="w-full border rounded-xl p-2.5 text-xs outline-none cursor-pointer"
                                    style={inputStyle}
                                >
                                    {categories.map((c) => (
                                        <option key={c.name} value={c.name} style={inputStyle}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Propiedades dinámicas de la categoría */}
                        {currentCategoryConfig && currentCategoryConfig.fields.length > 0 && (
                            <div className="p-3.5 rounded-2xl border space-y-2.5" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
                                <span className="text-[11px] font-bold block" style={{ color: 'var(--accent)' }}>
                                    Propiedades de {currentCategoryConfig.name}:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {currentCategoryConfig.fields.map((field) => (
                                        <div key={field.name}>
                                            <label className="block text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                                                {field.name}:
                                            </label>
                                            <select
                                                value={editCategoryAttrs[field.name] || ''}
                                                onChange={(e) => handleCategoryAttrChange(field.name, e.target.value)}
                                                className="w-full border rounded-xl p-2 text-xs outline-none cursor-pointer"
                                                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', color: 'var(--text-primary)' }}
                                            >
                                                {(field.options || []).map((opt) => (
                                                    <option key={opt} value={opt} style={inputStyle}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Precios, Stock y Botón Recalcular */}
                        <div className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--border-card)' }}>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Precios y Stock
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsCalculatorOpen(true)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border cursor-pointer transition"
                                    style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                                >
                                    <Calculator size={13} /> Recalcular Costo
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                                        Costo (Bs.):
                                    </label>
                                    <input
                                        type="number"
                                        step="0.05"
                                        required
                                        value={editingProduct.costPrice}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                                        className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none"
                                        style={inputStyle}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                                        Venta (Bs.):
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        required
                                        value={editingProduct.salePrice}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: Number(e.target.value) })}
                                        className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none"
                                        style={{ ...inputStyle, color: 'var(--accent)' }}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                                        Stock Actual:
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={editingProduct.stock}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                                        className="w-full border rounded-xl p-2 text-xs font-bold text-center outline-none"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                                    Código SKU:
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingProduct.sku}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                                    className="w-full border rounded-xl p-2 text-xs font-mono outline-none"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Atributos personalizados extra */}
                        <div className="border-t pt-3 space-y-2" style={{ borderColor: 'var(--border-card)' }}>
                            <label className="block text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                                Atributos personalizados extra:
                            </label>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Propiedad (ej: Acabado)"
                                    value={newCustomKey}
                                    onChange={(e) => setNewCustomKey(e.target.value)}
                                    className="flex-1 border rounded-xl p-1.5 text-xs outline-none"
                                    style={inputStyle}
                                />
                                <input
                                    type="text"
                                    placeholder="Valor (ej: Glitter)"
                                    value={newCustomVal}
                                    onChange={(e) => setNewCustomVal(e.target.value)}
                                    className="flex-1 border rounded-xl p-1.5 text-xs outline-none"
                                    style={inputStyle}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomAttr}
                                    className="px-3 py-1.5 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shrink-0"
                                    style={{ backgroundColor: 'var(--accent)' }}
                                >
                                    <Plus size={13} /> Añadir
                                </button>
                            </div>

                            {editCustomAttrs.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {editCustomAttrs.map((attr, idx) => (
                                        <span
                                            key={idx}
                                            className="text-[10px] px-2 py-1 rounded-lg border flex items-center gap-1.5 font-medium"
                                            style={{
                                                backgroundColor: 'var(--accent-soft)',
                                                borderColor: 'var(--accent)',
                                                color: 'var(--accent)',
                                            }}
                                        >
                                            <strong>{attr.name}:</strong> {attr.value}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCustomAttr(idx)}
                                                className="hover:opacity-75 cursor-pointer ml-0.5"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-card)' }}>
                            <button
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer"
                                style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                style={{ backgroundColor: 'var(--accent)' }}
                            >
                                <Check size={16} /> Guardar Cambios
                            </button>
                        </div>
                    </form>

                    {isCalculatorOpen && (
                        <CostCalculatorModal
                            categoryName={editingProduct.category}
                            onApplyCost={(calcCost, suggSale) => {
                                setEditingProduct((prev) =>
                                    prev ? { ...prev, costPrice: calcCost, salePrice: suggSale } : null
                                );
                            }}
                            onClose={() => setIsCalculatorOpen(false)}
                        />
                    )}
                </div>
            )}
        </div>
    );
};