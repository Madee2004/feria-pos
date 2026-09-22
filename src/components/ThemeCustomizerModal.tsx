import React, { useState } from 'react';
import { X, Check, Sparkles, Sun, Moon, Upload, Type, Trash2 } from 'lucide-react';

interface CustomThemeColors {
  bgMain: string;
  bgCard: string;
  borderCard: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyTheme: (themeName: string) => void;
  onLogoChange?: (logo: string | null) => void;
  onBrandNameChange?: (name: string) => void;
}

export const ThemeCustomizerModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onApplyTheme, 
  onLogoChange,
  onBrandNameChange
}) => {
  const [colors, setColors] = useState<CustomThemeColors>(() => {
    const saved = localStorage.getItem('custom-theme-colors');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      bgMain: '#d6e9f0',
      bgCard: '#ffffff',
      borderCard: '#b8d8e3',
      textPrimary: '#241c1d',
      textMuted: '#68828c',
      accent: '#9b2c32',
      accentSoft: '#fef3c7',
    };
  });

  const [brandName, setBrandName] = useState<string>(() => {
    return localStorage.getItem('brand-name') || '';
  });

  const [brandLogo, setBrandLogo] = useState<string | null>(() => localStorage.getItem('brand-logo') || null);

  // Tipografías
  const [bodyFontName, setBodyFontName] = useState<string>(() => localStorage.getItem('brand-font-body-name') || '');
  const [headingFontName, setHeadingFontName] = useState<string>(() => localStorage.getItem('brand-font-heading-name') || '');
  const [useSameFont, setUseSameFont] = useState<boolean>(() => {
    return localStorage.getItem('brand-font-use-same') !== 'false';
  });

  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = localStorage.getItem('brand-font-scale');
    return saved ? Number(saved) : 1;
  });

  if (!isOpen) return null;

  const applyColorsToDOM = (themeColors: CustomThemeColors) => {
    const root = document.documentElement;
    root.style.setProperty('--bg-main', themeColors.bgMain);
    root.style.setProperty('--bg-card', themeColors.bgCard);
    root.style.setProperty('--border-card', themeColors.borderCard);
    root.style.setProperty('--text-primary', themeColors.textPrimary);
    root.style.setProperty('--text-muted', themeColors.textMuted);
    root.style.setProperty('--accent', themeColors.accent);
    root.style.setProperty('--accent-soft', themeColors.accentSoft);
  };

  const handleColorChange = (key: keyof CustomThemeColors, value: string) => {
    const updated = { ...colors, [key]: value };
    setColors(updated);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      applyColorsToDOM(updated);
    }
  };

  const handleBrandNameChange = (val: string) => {
    setBrandName(val);
    localStorage.setItem('brand-name', val);
    if (onBrandNameChange) onBrandNameChange(val);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setBrandLogo(base64);
      localStorage.setItem('brand-logo', base64);
      if (onLogoChange) onLogoChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setBrandLogo(null);
    localStorage.removeItem('brand-logo');
    if (onLogoChange) onLogoChange(null);
  };

  const processFontFile = (file: File, type: 'body' | 'heading') => {
    const reader = new FileReader();
    reader.onload = async () => {
      const fontData = reader.result as ArrayBuffer;
      const cleanFontName = `${type}_${file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")}`;

      try {
        const fontFace = new FontFace(cleanFontName, fontData);
        await fontFace.load();
        document.fonts.add(fontFace);

        const base64Font = btoa(
          new Uint8Array(fontData).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        if (type === 'body') {
          localStorage.setItem('brand-font-body-data', base64Font);
          localStorage.setItem('brand-font-body-name', cleanFontName);
          setBodyFontName(cleanFontName);
          document.documentElement.style.setProperty('--font-body', `'${cleanFontName}', 'Plus Jakarta Sans', sans-serif`);
          if (useSameFont) {
            document.documentElement.style.setProperty('--font-heading', `'${cleanFontName}', 'Plus Jakarta Sans', sans-serif`);
          }
        } else {
          localStorage.setItem('brand-font-heading-data', base64Font);
          localStorage.setItem('brand-font-heading-name', cleanFontName);
          setHeadingFontName(cleanFontName);
          document.documentElement.style.setProperty('--font-heading', `'${cleanFontName}', 'Plus Jakarta Sans', sans-serif`);
        }
      } catch (err) {
        console.error("Error al cargar la fuente:", err);
        alert("Hubo un error procesando el archivo tipográfico.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRemoveFont = (type: 'body' | 'heading') => {
    if (type === 'body') {
      localStorage.removeItem('brand-font-body-data');
      localStorage.removeItem('brand-font-body-name');
      setBodyFontName('');
      document.documentElement.style.setProperty('--font-body', "'Plus Jakarta Sans', system-ui, sans-serif");
      if (useSameFont) {
        document.documentElement.style.setProperty('--font-heading', "'Plus Jakarta Sans', system-ui, sans-serif");
      }
    } else {
      localStorage.removeItem('brand-font-heading-data');
      localStorage.removeItem('brand-font-heading-name');
      setHeadingFontName('');
      const fallback = useSameFont && bodyFontName ? `'${bodyFontName}', sans-serif` : "'Plus Jakarta Sans', sans-serif";
      document.documentElement.style.setProperty('--font-heading', fallback);
    }
  };

  const handleScaleChange = (scale: number) => {
    setFontScale(scale);
    document.documentElement.style.setProperty('--font-scale', String(scale));
    localStorage.setItem('brand-font-scale', String(scale));
  };

  const handleToggleSameFont = (checked: boolean) => {
    setUseSameFont(checked);
    localStorage.setItem('brand-font-use-same', String(checked));

    if (checked) {
      const font = bodyFontName ? `'${bodyFontName}', 'Plus Jakarta Sans', sans-serif` : "'Plus Jakarta Sans', sans-serif";
      document.documentElement.style.setProperty('--font-heading', font);
    } else {
      const font = headingFontName ? `'${headingFontName}', 'Plus Jakarta Sans', sans-serif` : "'Plus Jakarta Sans', sans-serif";
      document.documentElement.style.setProperty('--font-heading', font);
    }
  };

  const handleApplyPresetDirect = (type: 'brand-light' | 'brand-dark' | 'sakura-v2') => {
    let preset: CustomThemeColors;
    if (type === 'brand-light') {
      preset = {
        bgMain: '#d6e9f0',
        bgCard: '#ffffff',
        borderCard: '#b8d8e3',
        textPrimary: '#241c1d',
        textMuted: '#58737d',
        accent: '#9b2c32',
        accentSoft: '#fef3c7',
      };
    } else if (type === 'brand-dark') {
      preset = {
        bgMain: '#141e24',
        bgCard: '#1c2830',
        borderCard: '#2b3d49',
        textPrimary: '#f1f6f8',
        textMuted: '#8ba2b0',
        accent: '#f26170',
        accentSoft: '#2a2228',
      };
    } else {
      preset = {
        bgMain: '#faf6f5',
        bgCard: '#ffffff',
        borderCard: '#f2e6e3',
        textPrimary: '#3d2b33',
        textMuted: '#8c737d',
        accent: '#e07a9b',
        accentSoft: '#fdf0f4',
      };
    }

    setColors(preset);
    applyColorsToDOM(preset);
    localStorage.setItem('custom-theme-colors', JSON.stringify(preset));
    localStorage.setItem('app-theme', 'custom');
    document.documentElement.setAttribute('data-theme', 'custom');
    onApplyTheme('custom');
  };

  const handleSaveAndApply = () => {
    localStorage.setItem('custom-theme-colors', JSON.stringify(colors));
    localStorage.setItem('brand-name', brandName);
    localStorage.setItem('app-theme', 'custom');
    document.documentElement.setAttribute('data-theme', 'custom');
    applyColorsToDOM(colors);
    onApplyTheme('custom');
    onClose();
  };

  const safeHexForPicker = (val: string, fallback: string) => {
    return /^#[0-9A-Fa-f]{6}$/.test(val) ? val : fallback;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs box-border overflow-hidden">
      <div 
        className="w-[94vw] max-w-sm sm:max-w-md rounded-3xl p-4 sm:p-5 shadow-2xl border flex flex-col max-h-[92vh] box-border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        {/* Cabecera */}
        <div className="flex justify-between items-center border-b pb-2.5 shrink-0" style={{ borderColor: 'var(--border-card)' }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles size={16} className="shrink-0" style={{ color: 'var(--accent)' }} />
            <h3 className="font-extrabold text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>
              Identidad de Marca y Estilos
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:opacity-70 cursor-pointer shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="overflow-y-auto overflow-x-hidden py-3 space-y-4 flex-1 pr-0.5">
          
          {/* SECCIÓN 1: NOMBRE DEL ARTISTA Y LOGO */}
          <div className="space-y-3 p-3 rounded-2xl border" style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-main)' }}>
            <span className="text-[10px] font-bold block uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Nombre y Logo
            </span>

            {/* Input Nombre de Marca */}
            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                Nombre del Artista o Tienda:
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => handleBrandNameChange(e.target.value)}
                placeholder="Por defecto: FeriaPOS"
                className="w-full border rounded-xl p-2 text-xs font-bold outline-none"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-card)', 
                  color: 'var(--text-primary)' 
                }}
              />
            </div>

            {/* Subir Logo */}
            <div className="flex items-center justify-between gap-2 border-t pt-2.5" style={{ borderColor: 'var(--border-card)' }}>
              <div className="flex items-center gap-2">
                {brandLogo ? (
                  <img src={brandLogo} alt="Logo" className="w-9 h-9 object-contain rounded-xl border bg-white/10" style={{ borderColor: 'var(--border-card)' }} />
                ) : (
                  <div className="w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold" style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}>
                    🎨
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>Logo del Stand</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PNG, JPG o SVG</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <label className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer flex items-center gap-1 transition" style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  <Upload size={12} /> Subir
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {brandLogo && (
                  <button onClick={handleRemoveLogo} className="p-1.5 text-red-400 hover:text-red-600 cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: TIPOGRAFÍAS Y ESCALA */}
          <div className="space-y-3 p-3 rounded-2xl border" style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-main)' }}>
            <span className="text-[10px] font-bold block uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Tipografía y Tamaño
            </span>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Tamaño de Letra Global:</span>
                <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
                  {Math.round(fontScale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>A</span>
                <input
                  type="range"
                  min="0.85"
                  max="1.30"
                  step="0.05"
                  value={fontScale}
                  onChange={(e) => handleScaleChange(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--accent)', backgroundColor: 'var(--border-card)' }}
                />
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>A</span>
              </div>
            </div>

            {/* Fuente Principal */}
            <div className="flex items-center justify-between gap-2 border-t pt-2.5" style={{ borderColor: 'var(--border-card)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0" style={{ borderColor: 'var(--border-card)', color: 'var(--accent)' }}>
                  <Type size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate" style={{ color: 'var(--text-primary)' }}>Fuente General</span>
                  <span className="text-[10px] truncate block" style={{ color: 'var(--text-muted)' }}>
                    {bodyFontName ? bodyFontName.replace('body_', '') : 'Predeterminada'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <label className="px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer flex items-center gap-1 transition" style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  <Upload size={12} /> {bodyFontName ? 'Cambiar' : 'Subir'}
                  <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={(e) => e.target.files?.[0] && processFontFile(e.target.files[0], 'body')} className="hidden" />
                </label>
                {bodyFontName && (
                  <button onClick={() => handleRemoveFont('body')} className="p-1 text-red-400 hover:text-red-600 cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-1" style={{ color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={useSameFont}
                onChange={(e) => handleToggleSameFont(e.target.checked)}
                className="rounded accent-rose-600"
              />
              Misma fuente para encabezados y títulos
            </label>

            {!useSameFont && (
              <div className="flex items-center justify-between gap-2 border-t pt-2.5" style={{ borderColor: 'var(--border-card)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0" style={{ borderColor: 'var(--border-card)', color: 'var(--accent)' }}>
                    <span className="text-xs font-black">H1</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate" style={{ color: 'var(--text-primary)' }}>Fuente de Títulos</span>
                    <span className="text-[10px] truncate block" style={{ color: 'var(--text-muted)' }}>
                      {headingFontName ? headingFontName.replace('heading_', '') : 'Predeterminada'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <label className="px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer flex items-center gap-1 transition" style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    <Upload size={12} /> {headingFontName ? 'Cambiar' : 'Subir'}
                    <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={(e) => e.target.files?.[0] && processFontFile(e.target.files[0], 'heading')} className="hidden" />
                  </label>
                  {headingFontName && (
                    <button onClick={() => handleRemoveFont('heading')} className="p-1 text-red-400 hover:text-red-600 cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: PRESETS RÁPIDOS */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold block" style={{ color: 'var(--text-muted)' }}>
              Temas Rápidos:
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPresetDirect('brand-light')}
                className="py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition hover:opacity-90 shadow-2xs"
                style={{ backgroundColor: '#d6e9f0', color: '#241c1d', borderColor: '#b8d8e3' }}
              >
                <Sun size={13} className="text-amber-600 shrink-0" />
                <span className="truncate">Mi Marca Claro</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPresetDirect('brand-dark')}
                className="py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition hover:opacity-90 shadow-2xs"
                style={{ backgroundColor: '#141e24', color: '#f1f6f8', borderColor: '#2b3d49' }}
              >
                <Moon size={13} className="text-rose-400 shrink-0" />
                <span className="truncate">Mi Marca Oscuro</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleApplyPresetDirect('sakura-v2')}
              className="w-full py-1.5 px-2 rounded-xl text-xs font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition hover:opacity-90 shadow-2xs"
              style={{ backgroundColor: '#faf6f5', color: '#3d2b33', borderColor: '#f2e6e3' }}
            >
              Versión 2
            </button>
          </div>

          {/* SECCIÓN 4: COLORES HEXADECIMALES */}
          <div className="border-t pt-2" style={{ borderColor: 'var(--border-card)' }}>
            <span className="text-[10px] font-bold block mb-2" style={{ color: 'var(--text-muted)' }}>
              Paleta Hexadecimal:
            </span>

            <div className="space-y-2">
              {[
                { label: 'Color Acento:', key: 'accent' as const, val: colors.accent, def: '#9b2c32' },
                { label: 'Fondo Pantalla:', key: 'bgMain' as const, val: colors.bgMain, def: '#d6e9f0' },
                { label: 'Fondo Tarjetas:', key: 'bgCard' as const, val: colors.bgCard, def: '#ffffff' },
                { label: 'Texto Principal:', key: 'textPrimary' as const, val: colors.textPrimary, def: '#241c1d' },
                { label: 'Color Bordes:', key: 'borderCard' as const, val: colors.borderCard, def: '#b8d8e3' },
                { label: 'Chips / Resaltado:', key: 'accentSoft' as const, val: colors.accentSoft, def: '#fef3c7' },
              ].map((item) => (
                <div key={item.key} className="flex justify-between items-center text-xs gap-2">
                  <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={item.val}
                      onChange={(e) => handleColorChange(item.key, e.target.value)}
                      className="w-20 border rounded-lg px-1.5 py-1 font-mono text-[11px] text-center font-bold outline-none"
                      style={{ 
                        borderColor: 'var(--border-card)', 
                        backgroundColor: 'var(--bg-main)', 
                        color: 'var(--text-primary)' 
                      }}
                    />
                    <input
                      type="color"
                      value={safeHexForPicker(item.val, item.def)}
                      onChange={(e) => handleColorChange(item.key, e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="pt-2.5 border-t shrink-0 flex gap-2" style={{ borderColor: 'var(--border-card)' }}>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-2xl text-xs font-semibold border cursor-pointer"
            style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Check size={15} /> Guardar Ajustes
          </button>
        </div>
      </div>
    </div>
  );
};