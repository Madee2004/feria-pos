import React, { useEffect, useState } from 'react';
import { Store, PlusCircle, PackageCheck, Palette, Tag, Sliders, Sparkles } from 'lucide-react';
import { ThemeCustomizerModal } from './ThemeCustomizerModal';

interface Props {
  activeTab: 'pos' | 'inventory' | 'add' | 'supplies' | 'categories' | 'bestsellers';
  setActiveTab: (tab: 'pos' | 'inventory' | 'add' | 'supplies' | 'categories' | 'bestsellers') => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('app-theme') || 'sakura';
  });

  const [brandLogo, setBrandLogo] = useState<string | null>(() => {
    return localStorage.getItem('brand-logo') || null;
  });

  const [brandName, setBrandName] = useState<string>(() => {
    return localStorage.getItem('brand-name') || 'FeriaPOS';
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    if (theme === 'custom') {
      const saved = localStorage.getItem('custom-theme-colors');
      if (saved) {
        try {
          const colors = JSON.parse(saved);
          const root = document.documentElement;
          root.style.setProperty('--bg-main', colors.bgMain);
          root.style.setProperty('--bg-card', colors.bgCard);
          root.style.setProperty('--border-card', colors.borderCard);
          root.style.setProperty('--text-primary', colors.textPrimary);
          root.style.setProperty('--text-muted', colors.textMuted);
          root.style.setProperty('--accent', colors.accent);
          root.style.setProperty('--accent-soft', colors.accentSoft);
        } catch {}
      }
    } else {
      const root = document.documentElement;
      root.style.removeProperty('--bg-main');
      root.style.removeProperty('--bg-card');
      root.style.removeProperty('--border-card');
      root.style.removeProperty('--text-primary');
      root.style.removeProperty('--text-muted');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-soft');
    }

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const navItems = [
    { id: 'inventory' as const, label: 'Inventario', icon: PackageCheck },
    { id: 'pos' as const, label: 'Venta', icon: Store },
    { id: 'add' as const, label: 'Nuevo', icon: PlusCircle },
    { id: 'supplies' as const, label: 'Insumos', icon: Tag },
    { id: 'categories' as const, label: 'Ajustes', icon: Sliders },
    { id: 'bestsellers' as const, label: 'Best Sellers', icon: Sparkles },
  ];

  const optionStyle = {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
  };

  return (
    <>
      <header 
        className="border-b sticky top-0 z-40 w-full transition-colors duration-200 backdrop-blur-md overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 flex justify-between items-center h-14 sm:h-16 w-full">
          {/* Logo y Nombre del Artista */}
          <div className="flex items-center gap-2 shrink-0 min-w-0 pr-2">
            {brandLogo ? (
              <img 
                src={brandLogo} 
                alt="Logo" 
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl border p-0.5 shadow-2xs shrink-0"
                style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-card)' }}
              />
            ) : (
              <span className="text-xl sm:text-2xl select-none shrink-0">🎨</span>
            )}
            <h1 
              className="font-extrabold text-base sm:text-xl tracking-tight truncate max-w-[130px] sm:max-w-[260px]" 
              style={{ color: 'var(--accent)' }}
              title={brandName || 'FeriaPOS'}
            >
              {brandName.trim() ? brandName : 'FeriaPOS'}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Selector de Temas */}
            <div 
              className="flex items-center gap-1 rounded-xl sm:rounded-2xl px-2 py-1 border transition-colors"
              style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-main)' }}
            >
              <Palette size={13} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="text-[11px] sm:text-xs font-bold outline-none cursor-pointer max-w-[90px] sm:max-w-none transition-colors border-0"
                style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
              >
                <option value="sakura" style={optionStyle}>🌸 Sakura</option>
                <option value="cobalt" style={optionStyle}>💎 Cobalto</option>
                <option value="mint" style={optionStyle}>🌿 Menta</option>
                <option value="dark-cyber" style={optionStyle}>🌙 Noche</option>
                <option value="custom" style={optionStyle}>✨ Mi Marca</option>
              </select>

              <button
                type="button"
                onClick={() => setIsThemeModalOpen(true)}
                title="Personalizar colores y marca"
                className="p-1 rounded-md hover:opacity-75 cursor-pointer shrink-0"
                style={{ color: 'var(--accent)' }}
              >
                <Sparkles size={13} />
              </button>
            </div>

            {/* Menú de Escritorio */}
            <nav className="hidden md:flex gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    style={{
                      backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                    }}
                  >
                    <Icon size={16} /> {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Dock Inferior Móvil */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg px-1 py-1 flex justify-around items-center shadow-lg transition-colors w-full"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 min-w-0"
              style={{
                backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <Icon size={18} className={isActive ? 'scale-110 transition-transform' : ''} />
              <span className="text-[9px] font-bold mt-0.5 tracking-tight truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        onApplyTheme={(t) => setTheme(t)}
        onLogoChange={(newLogo) => setBrandLogo(newLogo)}
        onBrandNameChange={(newName) => setBrandName(newName)}
      />
    </>
  );
};