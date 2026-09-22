import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface Props {
  onScanSuccess: (scannedSku: string) => void;
  onClose: () => void;
}

export const ScannerModal: React.FC<Props> = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear().then(() => {
          onScanSuccess(decodedText);
        }).catch(() => {
          onScanSuccess(decodedText);
        });
      },
      () => {
        // Frames de escaneo ignorados deliberadamente
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div 
        className="rounded-3xl p-5 max-w-sm w-full relative shadow-2xl border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-full hover:opacity-80 transition cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>
        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Escanear Código / QR
        </h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Apunta la cámara a la etiqueta del producto.
        </p>
        <div id="reader" className="w-full overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border-card)' }}></div>
      </div>
    </div>
  );
};