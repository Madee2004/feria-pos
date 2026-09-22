import { useState, useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProductForm } from './components/ProductForm';
import { InventoryView } from './components/InventoryView';
import { SuppliesManager } from './components/SuppliesManager';
import { CategoriesManager } from './components/CategoriesManager';
import { QuickPOS } from './components/QuickPOS';
import { HolaPage } from './components/hola';

const pageTitles: Record<string, string> = {
  inventory: 'Inventario',
  pos: 'Punto de venta',
  add: 'Nuevo producto',
  supplies: 'Insumos',
  categories: 'Ajustes',
  bestsellers: 'Best Sellers',
};

function AppShell() {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'add' | 'supplies' | 'categories' | 'bestsellers'>('inventory');

  // Pregunta 4: useEffect que reacciona al cambio de estado activeTab.
  useEffect(() => {
    document.title = pageTitles[activeTab] || 'FeriaPOS';
  }, [activeTab]);

  useEffect(() => {
    const savedScale = localStorage.getItem('brand-font-scale');
    if (savedScale) {
      document.documentElement.style.setProperty('--font-scale', savedScale);
    }

    const loadFont = (keyData: string, keyName: string, cssVar: string) => {
      const data = localStorage.getItem(keyData);
      const name = localStorage.getItem(keyName);
      if (data && name) {
        try {
          const binary = atob(data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const fontFace = new FontFace(name, bytes.buffer);
          fontFace.load().then((loaded) => {
            document.fonts.add(loaded);
            document.documentElement.style.setProperty(cssVar, `'${name}', 'Plus Jakarta Sans', sans-serif`);
          });
        } catch (e) {
          console.error(`Error cargando fuente ${name}:`, e);
        }
      }
    };

    const useSame = localStorage.getItem('brand-font-use-same') !== 'false';
    loadFont('brand-font-body-data', 'brand-font-body-name', '--font-body');

    if (useSame) {
      loadFont('brand-font-body-data', 'brand-font-body-name', '--font-heading');
    } else {
      loadFont('brand-font-heading-data', 'brand-font-heading-name', '--font-heading');
    }
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden transition-colors duration-200" style={{ backgroundColor: 'var(--bg-main)' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-5 pb-24 md:pb-12 w-full overflow-x-hidden box-border">
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'pos' && <QuickPOS />}
        {activeTab === 'add' && (
          <ProductForm
            onSuccess={() => setActiveTab('inventory')}
            formTitle="Registrar Producto"
            subtitle="Agrega el nombre final con la marca editado al guardar."
          />
        )}
        {activeTab === 'supplies' && <SuppliesManager />}
        {activeTab === 'categories' && <CategoriesManager />}
        {activeTab === 'bestsellers' && (
          <div className="p-8 text-center font-bold space-y-4">
            {/* Pregunta 5: ruta nueva conectada con Link hacia /hola. */}
            <p>Holaa Pregunta 5</p>
            <Link
              to="/hola"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold"
              style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
            >
              Ir a la ruta Hola
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />} />
        <Route path="/hola" element={<HolaPage />} />
      </Routes>
    </BrowserRouter>
  );
}