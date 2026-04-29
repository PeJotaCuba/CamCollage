/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Grid, Download, Share2, Plus, X, ArrowLeft, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
type View = 'landing' | 'camera' | 'editor' | 'result';

interface PhotoItem {
  id: string;
  dataUrl: string;
}

// --- Utils ---
const getGridDimensions = (count: number) => {
  if (count === 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 1, rows: 2 };
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 2, rows: 3 };
  if (count <= 9) return { cols: 3, rows: 3 };
  return { cols: 3, rows: 4 }; // Up to 12
};

// --- Views ---

interface LandingViewProps {
  onStart: () => void;
}

const LandingView = ({ onStart }: LandingViewProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-pure-dark"
    >
      <div className="relative mb-8">
        <motion.div
           animate={{ rotate: [0, 5, -5, 0] }}
           transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
           className="w-40 h-40 border border-border-dim rounded-sm flex items-center justify-center"
        >
           <Grid className="text-accent/20 w-16 h-16" />
        </motion.div>
        <div className="absolute inset-0 border border-accent/10 -rotate-3 rounded-sm pointer-events-none" />
      </div>

      <h1 className="text-6xl font-serif tracking-tight text-white mb-6">CollageCam</h1>
      <p className="text-dim-text max-w-sm mb-16 text-sm uppercase tracking-[0.3em] font-light italic">
        Mejora de imagen en alta resolución.<br/>Sin pérdida de calidad.
      </p>
      
      <div className="flex flex-col gap-4 items-center">
        <button 
          id="start-button"
          onClick={onStart}
          className="group relative px-12 py-6 border border-border-dim hover:border-accent transition-all duration-500 overflow-hidden"
        >
          <div className="relative z-10 flex items-center gap-4">
            <span className="text-xs uppercase tracking-[0.4em] font-bold text-white group-hover:text-accent transition-colors">Abrir Cámara</span>
            <Camera className="w-4 h-4 text-accent" />
          </div>
          <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-[95%] transition-transform duration-500 opacity-10" />
        </button>

        {deferredPrompt && (
          <button 
            onClick={handleInstall}
            className="text-[10px] uppercase tracking-[0.3em] text-accent/60 hover:text-accent transition-colors mt-4 flex items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            Instalar App Nativa
          </button>
        )}
      </div>

      <footer className="fixed bottom-8 text-[9px] uppercase tracking-[0.3em] text-[#444]">
        Versión 1.0.5 - Procesamiento HD Activo
      </footer>
    </motion.div>
  );
};

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  photosCount: number;
  onCapture: () => void;
  onClose: () => void;
  onDone: () => void;
  lastPhoto: string | null;
}

const CameraView = ({ videoRef, stream, photosCount, onCapture, onClose, onDone, lastPhoto }: CameraViewProps) => {
  // Ensure video connects to stream on mount/update
  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#080808] flex flex-col z-50 overflow-hidden"
    >
      <div className="relative flex-1 overflow-hidden bg-zinc-950 flex items-center justify-center border-b border-border-dim">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          className="w-full h-full object-cover opacity-90"
        />

        {/* Guía visual para el reporte de radio */}
        <div className="absolute inset-x-12 inset-y-24 border-2 border-accent/30 border-dashed rounded-sm pointer-events-none flex flex-col items-center justify-center">
            <div className="bg-accent/10 px-4 py-1 text-[10px] text-accent font-bold uppercase tracking-[0.3em] mb-4">
                Encuadrar Reporte (Horizontal)
            </div>
            {/* Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent" />
        </div>
        
        <div className="absolute top-8 left-8 flex items-baseline gap-2 bg-black/40 backdrop-blur-md px-6 py-3 border border-border-dim">
          <span className="text-2xl font-serif text-accent">{photosCount < 10 ? `0${photosCount}` : photosCount}</span>
          <span className="text-[#444] text-sm font-serif">/ 12</span>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-black/40 backdrop-blur-md rounded-full text-dim-text border border-border-dim hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="h-48 bg-panel flex items-center justify-center relative px-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-dim to-transparent" />
        
        {lastPhoto && (
          <button 
            onClick={onDone}
            className="absolute left-10 w-20 h-20 rounded-sm overflow-hidden border border-border-dim shadow-2xl group transition-transform active:scale-95"
          >
            <img src={lastPhoto} alt="Preview" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/20 transition-colors">
              <span className="text-accent text-xs font-serif italic tracking-widest">{photosCount}</span>
            </div>
          </button>
        )}

        <button 
          id="shutter-button"
          onClick={onCapture}
          className="relative group w-24 h-24 flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full border border-border-dim group-hover:border-accent transition-colors duration-500" />
          <div className="w-16 h-16 rounded-full border-2 border-accent flex items-center justify-center group-active:scale-90 transition-transform">
             <div className="w-14 h-14 rounded-full bg-accent/10" />
          </div>
        </button>

        {photosCount > 0 && (
          <button 
            onClick={onDone}
            className="absolute right-10 flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 rounded-full border border-border-dim flex items-center justify-center group-hover:border-accent transition-colors">
              <Check className="w-5 h-5 text-accent" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-dim-text group-hover:text-white transition-colors">Finalizar</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

interface EditorViewProps {
  photos: PhotoItem[];
  isProcessing: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onGenerate: () => void;
}

const EditorView = ({ photos, isProcessing, onAdd, onRemove, onGenerate }: EditorViewProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="min-h-screen bg-pure-dark flex flex-col"
  >
    <header className="px-8 h-20 flex items-center justify-between border-b border-border-dim bg-panel">
      <button 
        onClick={onAdd}
        className="group flex items-center gap-3 text-dim-text hover:text-accent transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-xs uppercase tracking-[0.3em]">Cámara</span>
      </button>
      
      <div className="flex items-center gap-2">
          <span className="text-3xl font-serif text-accent">{photos.length < 10 ? `0${photos.length}` : photos.length}</span>
          <span className="text-[#444] text-lg font-serif">/ 12</span>
      </div>

      <div className="w-20" />
    </header>

    <div className="flex-1 p-8 pb-32 overflow-y-auto">
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-dim-text">
          <Camera className="w-16 h-16 mb-4 opacity-10" />
          <p className="text-xs uppercase tracking-[0.2em]">Captura algunas fotos primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
              {photos.map((item) => (
              <motion.div 
                  layout
                  key={item.id} 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="relative aspect-video border border-border-dim bg-[#111] p-1 group shadow-xl"
              >
                  <img src={item.dataUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Captured" />
                  <button 
                  onClick={() => onRemove(item.id)}
                  className="absolute top-3 right-3 p-2 bg-black/80 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                  >
                  <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-2 left-2 text-[8px] uppercase tracking-widest text-[#444] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      FOTO_{item.id.slice(-4)}
                  </div>
              </motion.div>
              ))}
          </AnimatePresence>
          {photos.length < 12 && (
            <button 
              onClick={onAdd}
              className="aspect-square border border-dashed border-[#333] flex flex-col items-center justify-center text-[#444] hover:border-accent hover:text-accent transition-all duration-500 bg-[#080808]"
            >
              <Plus className="w-6 h-6 mb-2 font-light" />
              <span className="text-[10px] uppercase tracking-[0.3em]">Añadir</span>
            </button>
          )}
        </div>
      )}
    </div>

    <div className="fixed bottom-0 left-0 right-0 p-8 border-t border-border-dim bg-panel/90 backdrop-blur-xl">
      <div className="max-w-md mx-auto">
          <button 
          id="generate-button"
          disabled={photos.length === 0 || isProcessing}
          onClick={onGenerate}
          className="w-full group relative bg-accent text-pure-dark py-5 text-xs font-black uppercase tracking-[0.4em] overflow-hidden transition-all hover:bg-accent-dim disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-[#222]"
          >
          <div className="relative z-10 flex items-center justify-center gap-4">
              {isProcessing ? (
                  <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                  </>
              ) : (
                  <>
                  <Sparkles className="w-4 h-4" />
                  <span>Revelar Collage HD</span>
                  </>
              )}
          </div>
          </button>
          <p className="text-center text-[9px] text-dim-text uppercase tracking-widest mt-4 italic opacity-50">
              Mejora de imagen activada
          </p>
      </div>
    </div>
  </motion.div>
);

interface ResultViewProps {
  collageUrl: string | null;
  onEdit: () => void;
  onShare: () => void;
  onDownload: () => void;
  onNew: () => void;
}

const ResultView = ({ collageUrl, onEdit, onShare, onDownload, onNew }: ResultViewProps) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-screen bg-pure-dark flex flex-col lg:flex-row"
  >
    <div className="lg:w-72 bg-panel border-b lg:border-b-0 lg:border-r border-border-dim p-8 flex flex-col">
      <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#666] mb-8">Información</h3>
      <div className="space-y-8">
          <div className="space-y-2">
              <p className="text-[10px] text-dim-text uppercase tracking-widest">Dimensiones</p>
              <p className="text-2xl font-serif text-accent">Landscape HD</p>
          </div>
          <div className="p-4 bg-[#161616] border border-[#222]">
              <p className="text-[10px] text-dim-text uppercase tracking-tighter leading-relaxed italic">
                  Calidad HD aplicada. Composición terminada con éxito.
              </p>
          </div>
      </div>
      <div className="mt-auto hidden lg:block pt-8 text-[9px] uppercase tracking-widest text-[#444] space-y-2">
          <div className="flex justify-between">
              <span>Estado</span>
              <span className="text-[#25D366]">Listo</span>
          </div>
          <div className="flex justify-between">
              <span>Formato</span>
              <span>JPEG HD</span>
          </div>
      </div>
    </div>

    <main className="flex-1 bg-[#080808] p-8 lg:p-12 flex items-center justify-center relative">
      <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
           <button onClick={onEdit} className="text-accent text-xs uppercase tracking-widest underline decoration-accent/30 underline-offset-4">Regresar</button>
      </div>
      <div className="max-w-2xl w-full">
          <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="aspect-[4/3] bg-[#111] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-border-dim p-1 transform transition-transform hover:scale-[1.01]"
          >
          {collageUrl && <img src={collageUrl} className="w-full h-full object-contain" alt="Final Collage" />}
          </motion.div>
      </div>
    </main>

    <aside className="lg:w-80 bg-panel border-t lg:border-t-0 lg:border-l border-border-dim p-8 flex flex-col gap-6">
      <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#666] mb-4">Exportar</h3>
      <button 
        id="share-button"
        onClick={onShare}
        className="w-full py-5 border border-[#25D366] text-[#25D366] text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#25D366]/5 transition-all"
      >
        <Share2 className="w-4 h-4" />
        WhatsApp
      </button>
      <button 
        id="download-button"
        onClick={onDownload}
        className="w-full bg-accent text-pure-dark py-5 text-xs font-black uppercase tracking-[0.3em] hover:bg-accent-dim transition-all shadow-xl"
      >
        Guardar Foto
      </button>
      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-border-dim"></div>
        <span className="flex-shrink mx-4 text-[9px] text-[#444] uppercase tracking-widest italic">Opciones</span>
        <div className="flex-grow border-t border-border-dim"></div>
      </div>
      <button 
          onClick={onNew}
          className="w-full py-4 border border-border-dim text-dim-text text-[10px] uppercase tracking-widest hover:text-white transition-colors"
      >
          Nuevo Collage
      </button>
    </aside>
  </motion.div>
);

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [collageUrl, setCollageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(newStream);
      setView('camera');
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("No se pudo acceder a la cámara. Por favor, asegúrate de dar los permisos necesarios.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const newPhotos = [...photos, { id: Date.now().toString(), dataUrl }];
    setPhotos(newPhotos);
    
    if (newPhotos.length >= 12) {
      stopCamera();
      setView('editor');
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const generateCollage = async () => {
    if (photos.length === 0) return;
    setIsProcessing(true);
    
    const { cols, rows } = getGridDimensions(photos.length);
    const canvas = document.createElement('canvas');
    const gap = 24;
    const baseWidth = 1200; // Landscape width
    const baseHeight = 900; // Landscape height (4:3)
    
    canvas.width = baseWidth * cols + gap * (cols + 1);
    canvas.height = baseHeight * rows + gap * (rows + 1);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const loadImg = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = url;
      });
    };

    for (let i = 0; i < photos.length; i++) {
        const img = await loadImg(photos[i].dataUrl);
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const x = gap + col * (baseWidth + gap);
        const y = gap + row * (baseHeight + gap);
        
        const imgRatio = img.width / img.height;
        const targetRatio = baseWidth / baseHeight;
        let sw, sh, sx, sy;

        if (imgRatio > targetRatio) {
            sh = img.height;
            sw = img.height * targetRatio;
            sx = (img.width - sw) / 2;
            sy = 0;
        } else {
            sw = img.width;
            sh = img.width / targetRatio;
            sx = 0;
            sy = (img.height - sh) / 2;
        }

        ctx.filter = 'contrast(1.1) brightness(1.02) saturate(1.05)';
        ctx.drawImage(img, sx, sy, sw, sh, x, y, baseWidth, baseHeight);
        ctx.filter = 'none';

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    }

    const finalUrl = canvas.toDataURL('image/jpeg', 1.0);
    setCollageUrl(finalUrl);
    setIsProcessing(false);
    setView('result');
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const shareCollage = async () => {
    if (!collageUrl) return;
    try {
      const response = await fetch(collageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'collage.jpg', { type: 'image/jpeg' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Reporte de Radio - CollageCam',
          text: 'Reporte digitalizado en alta resolución.',
        });
      } else {
        throw new Error('Web Share API not supported for files');
      }
    } catch (err) {
      console.error("Error sharing:", err);
      // Mensaje explicativo para el usuario
      alert("Para compartir directamente por WhatsApp, abre esta app en una pestaña nueva o instálala en tu pantalla de inicio. Por ahora, guardaremos la foto en tu galería.");
      downloadCollage();
    }
  };

  const downloadCollage = () => {
    if (!collageUrl) return;
    const link = document.createElement('a');
    link.download = 'collage-cam.jpg';
    link.href = collageUrl;
    link.click();
  };

  return (
    <div className="bg-pure-dark text-main min-h-screen font-sans selection:bg-accent selection:text-pure-dark">
      <AnimatePresence mode="wait">
        {view === 'landing' && <LandingView key="landing" onStart={startCamera} />}
        {view === 'camera' && (
          <CameraView 
            key="camera"
            videoRef={videoRef}
            stream={stream}
            photosCount={photos.length}
            onCapture={capturePhoto}
            onClose={() => { stopCamera(); setView('landing'); }}
            onDone={() => { stopCamera(); setView('editor'); }}
            lastPhoto={photos.length > 0 ? photos[photos.length-1].dataUrl : null}
          />
        )}
        {view === 'editor' && (
          <EditorView 
            key="editor"
            photos={photos}
            isProcessing={isProcessing}
            onAdd={startCamera}
            onRemove={removePhoto}
            onGenerate={generateCollage}
          />
        )}
        {view === 'result' && (
          <ResultView 
            key="result"
            collageUrl={collageUrl}
            onEdit={() => setView('editor')}
            onShare={shareCollage}
            onDownload={downloadCollage}
            onNew={() => { setPhotos([]); setCollageUrl(null); setView('landing'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


