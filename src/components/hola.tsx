import React from 'react';
import { Link } from 'react-router-dom';

export const HolaPage: React.FC = () => {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}
    >
      <div className="w-full max-w-md rounded-3xl border p-8 text-center shadow-sm"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <span className="inline-block rounded-full px-3 py-1 text-xs font-bold mb-4"
          style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          Ruta nueva
        </span>
        <h1 className="text-3xl font-black mb-3">Hola</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Esta es una vista de ejemplo conectada con la navegación por rutas.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold"
          style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
};

