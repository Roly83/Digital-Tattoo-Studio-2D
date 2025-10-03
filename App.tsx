import React, { useState, useCallback, ChangeEvent, DragEvent, useRef } from 'react';
import { Asset, Layer, TattooStyle } from './types';
import { generateTattooImage } from './services/geminiService';
import { CubeIcon, DownloadIcon, EraserIcon, LockIcon, SelectIcon, SparklesIcon, TrashIcon, UploadIcon } from './components/icons';

// --- Helper Functions ---
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getImageDimensions = (src: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = src;
  });
};

// --- Child Components defined outside App ---
interface AssetPanelProps {
  assets: Asset[];
  onAssetDragStart: (e: DragEvent<HTMLImageElement>, asset: Asset) => void;
}
const AssetPanel: React.FC<AssetPanelProps> = ({ assets, onAssetDragStart }) => (
  <div className="p-4 space-y-4 overflow-y-auto">
    <h2 className="text-sm font-semibold text-cyan-300 tracking-wider uppercase">Assets</h2>
    <div className="grid grid-cols-3 gap-3">
      {assets.map((asset) => (
        <div key={asset.id} className="aspect-square bg-gray-800 rounded-md overflow-hidden border-2 border-transparent hover:border-cyan-400 transition-colors duration-200">
          <img
            src={asset.src}
            alt="Tattoo Asset"
            className="w-full h-full object-cover cursor-grab"
            draggable
            onDragStart={(e) => onAssetDragStart(e, asset)}
          />
        </div>
      ))}
    </div>
  </div>
);

interface AIGeneratorProps {
  onImageGenerated: (asset: Asset) => void;
}
const AIGenerator: React.FC<AIGeneratorProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<TattooStyle>(TattooStyle.AmericanTraditional);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for your tattoo.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const generatedSrc = await generateTattooImage(prompt, style);
      const newAsset: Asset = {
        id: `ai-${Date.now()}`,
        src: generatedSrc,
      };
      onImageGenerated(newAsset);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-3 border-t border-cyan-500/20">
      <h2 className="text-sm font-semibold text-cyan-300 tracking-wider uppercase flex items-center gap-2"><SparklesIcon className="w-4 h-4" /> AI Tattoo Generator</h2>
      <div className="space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., a roaring lion with a crown"
          className="w-full h-20 p-2 bg-[#1a1f26] border border-gray-600 rounded-md text-sm text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition"
          disabled={isLoading}
        />
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as TattooStyle)}
          className="w-full p-2 bg-[#1a1f26] border border-gray-600 rounded-md text-sm text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition"
          disabled={isLoading}
        >
          {Object.values(TattooStyle).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-md transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-t-transparent border-black rounded-full animate-spin"></div>
              Generating...
            </>
          ) : "Generate"}
        </button>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    </div>
  );
};

interface PropertiesPanelProps {
  selectedLayer: Layer | null;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerDelete: (id: string) => void;
  onLayerFix: (id: string) => void;
}
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedLayer, onLayerUpdate, onLayerDelete, onLayerFix }) => {
  if (!selectedLayer || selectedLayer.isFixed) {
    return (
      <div className="w-72 bg-[#1a1f26] text-gray-400 flex items-center justify-center h-full p-4 text-sm">
        <p>Select a tattoo on the canvas to edit its properties.</p>
      </div>
    );
  }

  const handleSliderChange = (prop: keyof Layer, value: number) => {
    onLayerUpdate(selectedLayer.id, { [prop]: value });
  };
  
  return (
    <div className="w-72 bg-[#1a1f26] text-white flex flex-col h-full">
      <div className="p-4 border-b border-cyan-500/20">
         <h2 className="text-sm font-semibold text-cyan-300 tracking-wider uppercase">Properties</h2>
      </div>
      <div className="flex-grow p-4 space-y-6 overflow-y-auto">
        <div>
            <h3 className="text-xs font-bold text-gray-400 mb-2">IMAGE ADJUSTMENTS</h3>
            <div className="space-y-4">
                <PropertySlider label="Scale" value={selectedLayer.scale} min={0.1} max={3} step={0.01} onChange={(val) => handleSliderChange('scale', val)} />
                <PropertySlider label="Rotation" value={selectedLayer.rotation} min={0} max={360} step={1} onChange={(val) => handleSliderChange('rotation', val)} />
                <PropertySlider label="Brightness" value={selectedLayer.brightness} min={0} max={200} step={1} onChange={(val) => handleSliderChange('brightness', val)} />
                <PropertySlider label="Contrast" value={selectedLayer.contrast} min={0} max={200} step={1} onChange={(val) => handleSliderChange('contrast', val)} />
            </div>
        </div>
      </div>
      <div className="p-4 border-t border-cyan-500/20 space-y-2">
         <button onClick={() => onLayerFix(selectedLayer.id)} className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
            <LockIcon className="w-4 h-4" /> Fix Tattoo
        </button>
        <button onClick={() => onLayerDelete(selectedLayer.id)} className="w-full flex items-center justify-center gap-2 bg-red-600/50 hover:bg-red-500/50 text-red-100 font-bold py-2 px-4 rounded-md transition-colors duration-200">
            <TrashIcon className="w-4 h-4" /> Delete Tattoo
        </button>
      </div>
    </div>
  );
};

const PropertySlider: React.FC<{ label: string, value: number, min: number, max: number, step: number, onChange: (value: number) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div>
        <div className="flex justify-between items-center text-xs mb-1">
            <label className="text-gray-300">{label}</label>
            <span className="text-cyan-400 font-mono">{value.toFixed(2)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
    </div>
);


interface TattooLayerProps {
    layer: Layer;
    isSelected: boolean;
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, updates: Partial<Layer>) => void;
    canvasRef: React.RefObject<HTMLDivElement>;
}

const TattooLayer: React.FC<TattooLayerProps> = ({ layer, isSelected, onSelect, onUpdate, canvasRef }) => {
    const layerRef = useRef<HTMLDivElement>(null);
    const interactionRef = useRef<{
        type: 'move' | 'scale' | 'rotate' | null;
        startX: number;
        startY: number;
        originalX: number;
        originalY: number;
        originalWidth: number;
        originalHeight: number;
        originalScale: number;
        originalRotation: number;
        centerX: number;
        centerY: number;
    } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'scale' | 'rotate') => {
        if (layer.isFixed) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect(layer.id);

        const rect = layerRef.current!.getBoundingClientRect();
        const canvasRect = canvasRef.current!.getBoundingClientRect();
        
        interactionRef.current = {
            type,
            startX: e.clientX,
            startY: e.clientY,
            originalX: layer.x,
            originalY: layer.y,
            originalWidth: rect.width / layer.scale,
            originalHeight: rect.height / layer.scale,
            originalScale: layer.scale,
            originalRotation: layer.rotation,
            centerX: rect.left - canvasRect.left + rect.width / 2,
            centerY: rect.top - canvasRect.top + rect.height / 2,
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!interactionRef.current) return;
        e.preventDefault();

        const { type, startX, startY, originalX, originalY, originalScale, originalRotation, centerX, centerY } = interactionRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (type === 'move') {
            onUpdate(layer.id, { x: originalX + dx, y: originalY + dy });
        } else if (type === 'scale') {
            const scaleFactor = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) / 100;
            const newScale = e.clientX > startX ? originalScale + scaleFactor : originalScale - scaleFactor;
            onUpdate(layer.id, { scale: Math.max(0.1, newScale) });
        } else if (type === 'rotate') {
             const angle = Math.atan2(e.clientY - startY - centerY + originalY, e.clientX - startX - centerX + originalX) * (180 / Math.PI);
             onUpdate(layer.id, { rotation: (originalRotation + angle) % 360 });
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        interactionRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    const style: React.CSSProperties = {
        left: `${layer.x}px`,
        top: `${layer.y}px`,
        transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
        filter: `brightness(${layer.brightness}%) contrast(${layer.contrast}%)`,
        position: 'absolute',
        cursor: layer.isFixed ? 'default' : 'grab',
        width: `${layer.width}px`,
        height: `${layer.height}px`,
    };

    return (
        <div ref={layerRef} style={style} onMouseDown={(e) => handleMouseDown(e, 'move')}>
            <img src={layer.src} alt="tattoo layer" className="w-full h-full pointer-events-none" />
            {isSelected && !layer.isFixed && (
                <>
                    <div className="absolute -top-2 -left-2 -right-2 -bottom-2 border-2 border-cyan-400 border-dashed pointer-events-none"></div>
                    <div
                        onMouseDown={(e) => handleMouseDown(e, 'scale')}
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-cyan-400 border-2 border-gray-900 rounded-full cursor-nwse-resize"
                    ></div>
                     <div
                        onMouseDown={(e) => handleMouseDown(e, 'rotate')}
                        className="absolute -top-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-400 border-2 border-gray-900 rounded-full cursor-alias"
                    ></div>
                </>
            )}
        </div>
    );
};


// --- Main App Component ---
export default function App() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([
      { id: 'dragon-1', src: 'https://i.imgur.com/vH1C2T6.png' } // Sample asset with transparent BG
  ]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  
  const modelUploadRef = useRef<HTMLInputElement>(null);
  const assetUploadRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'model' | 'asset') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      if (type === 'model') {
        setModelImage(dataUrl);
      } else {
        const newAsset: Asset = { id: `upload-${Date.now()}`, src: dataUrl };
        setAssets(prev => [newAsset, ...prev]);
      }
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Could not load image file.");
    }
     e.target.value = ''; // Reset input
  };
  
  const handleAssetDragStart = (e: DragEvent<HTMLImageElement>, asset: Asset) => {
      e.dataTransfer.setData('application/json', JSON.stringify(asset));
  };
  
  const handleCanvasDrop = async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const assetJSON = e.dataTransfer.getData('application/json');
      if (!assetJSON) return;
      
      const asset: Asset = JSON.parse(assetJSON);
      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if(!canvasBounds) return;

      const { width, height } = await getImageDimensions(asset.src);
      const aspectRatio = width / height;
      const initialWidth = 150;
      
      const newLayer: Layer = {
          id: `layer-${Date.now()}`,
          assetId: asset.id,
          src: asset.src,
          originalSrc: asset.src,
          x: e.clientX - canvasBounds.left - (initialWidth / 2),
          y: e.clientY - canvasBounds.top - (initialWidth / aspectRatio / 2),
          width: initialWidth,
          height: initialWidth / aspectRatio,
          scale: 1,
          rotation: 0,
          brightness: 100,
          contrast: 100,
          isFixed: false,
      };
      setLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
  };
  
  const handleUpdateLayer = useCallback((id: string, updates: Partial<Layer>) => {
      setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const handleDeleteLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) {
        setSelectedLayerId(null);
    }
  }, [selectedLayerId]);

  const handleFixLayer = useCallback((id: string) => {
    handleUpdateLayer(id, { isFixed: true });
    setSelectedLayerId(null);
  }, [handleUpdateLayer]);
  
  const handleExport = async () => {
    const fixedLayers = layers.filter(l => l.isFixed);
    if (fixedLayers.length === 0) {
      alert("No fixed tattoos to export. Please 'fix' a tattoo using the properties panel first.");
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    fixedLayers.forEach(l => {
      const w = l.width * l.scale;
      const h = l.height * l.scale;
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + w);
      maxY = Math.max(maxY, l.y + h);
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = maxX - minX;
    canvas.height = maxY - minY;

    const imagePromises = fixedLayers.map(layer => {
        return new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.save();
                ctx.filter = `brightness(${layer.brightness}%) contrast(${layer.contrast}%)`;
                
                const w = layer.width * layer.scale;
                const h = layer.height * layer.scale;

                // Translate to the image's center point in the new canvas
                ctx.translate(layer.x - minX + w / 2, layer.y - minY + h / 2);
                ctx.rotate(layer.rotation * Math.PI / 180);

                ctx.drawImage(img, -w / 2, -h / 2, w, h);
                ctx.restore();
                resolve();
            };
            img.src = layer.src;
        });
    });

    await Promise.all(imagePromises);

    const link = document.createElement('a');
    link.download = 'tattoo-collage.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId) || null;

  return (
    <div className="h-screen w-screen bg-[#101317] text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#1a1f26] h-16 flex items-center justify-between px-6 border-b border-cyan-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-md flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-xl font-bold tracking-wider">Virtual Tattoo Studio</h1>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => modelUploadRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-700/50 border border-gray-600 rounded-md hover:bg-gray-600/50 transition-colors">
            <UploadIcon className="w-4 h-4" /> Import Model
          </button>
           <button onClick={() => assetUploadRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-700/50 border border-gray-600 rounded-md hover:bg-gray-600/50 transition-colors">
            <CubeIcon className="w-4 h-4" /> Import Tattoos
          </button>
          <input type="file" accept="image/*" ref={modelUploadRef} onChange={(e) => handleFileUpload(e, 'model')} className="hidden" />
          <input type="file" accept="image/*" ref={assetUploadRef} onChange={(e) => handleFileUpload(e, 'asset')} className="hidden" multiple={false} />
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left Panel */}
        <aside className="w-72 bg-[#1a1f26] flex-shrink-0 flex flex-col border-r border-cyan-500/20">
          <div className="flex-grow overflow-y-auto">
            <AssetPanel assets={assets} onAssetDragStart={handleAssetDragStart} />
          </div>
          <AIGenerator onImageGenerated={(asset) => setAssets(prev => [asset, ...prev])} />
        </aside>

        {/* Toolbar */}
        <nav className="w-16 bg-[#101317] flex-shrink-0 flex flex-col items-center py-4 gap-4 border-r border-cyan-500/10">
            <button className="p-3 bg-cyan-500/20 text-cyan-300 rounded-lg transition-colors">
                <SelectIcon className="w-6 h-6" />
            </button>
             <button className="p-3 text-gray-400 hover:bg-gray-700/50 hover:text-white rounded-lg transition-colors" title="Eraser tool (coming soon)">
                <EraserIcon className="w-6 h-6 opacity-50" />
            </button>
        </nav>

        {/* Canvas */}
        <main className="flex-grow flex flex-col bg-black relative" onDragOver={(e) => e.preventDefault()} onDrop={handleCanvasDrop} onClick={() => setSelectedLayerId(null)}>
          <div ref={canvasRef} className="w-full h-full relative overflow-hidden">
            {modelImage ? (
                <img src={modelImage} className="max-w-full max-h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain" alt="Model" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <p>Import a model image to begin</p>
                </div>
            )}
            {layers.map(layer => (
                <div key={layer.id} onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id) }}>
                    <TattooLayer 
                        layer={layer} 
                        isSelected={selectedLayerId === layer.id}
                        onSelect={setSelectedLayerId}
                        onUpdate={handleUpdateLayer}
                        canvasRef={canvasRef}
                    />
                </div>
            ))}
          </div>
           {/* Footer */}
          <footer className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-end px-6 gap-4">
              <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-cyan-500 text-black rounded-md hover:bg-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all">
                <DownloadIcon className="w-5 h-5" /> Export Collage
              </button>
          </footer>
        </main>
        
        {/* Right Panel */}
        <PropertiesPanel 
          selectedLayer={selectedLayer}
          onLayerUpdate={handleUpdateLayer}
          onLayerDelete={handleDeleteLayer}
          onLayerFix={handleFixLayer}
        />
      </div>
    </div>
  );
}
