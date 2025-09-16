
import React, { useState, useCallback, ChangeEvent, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Constants ---
const HAIRSTYLES = [
  // Women's Styles
  { name: "Italian Bob", category: "Short", gender: "woman", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M4 8c0 4.418 3.582 8 8 8s8-3.582 8-8c0-4.418-3.582-8-8-8-1.57 0-3.05.45-4.33 1.25M8 12c0 2.21 1.79 4 4 4s4-1.79 4-4"/><path d="M4 8c-2 2-2 5 0 7s5 2 7 0"/><path d="M20 8c2 2 2 5 0 7s-5 2-7 0"/></svg> },
  { name: "Bixie Cut", category: "Short", gender: "woman", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M10 5.5L8 4"/><path d="M13 6l-2-2"/><path d="M16 7l-2-2"/><path d="M12 11V9"/><path d="M15 12h-2"/><path d="M16 14c-1 1-2 1.5-3 1.5"/></svg> },
  { name: "Wolf Cut", category: "Layered", gender: "woman", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M9 5l-2 2m8-2l2 2m-4-3v3m-3 2l-2 3m8-3l2 3m-4 1v3"/></svg> },
  { name: "Butterfly Cut", category: "Layered", gender: "woman", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M8 8 C 6 10, 6 14, 8 16"/><path d="M16 8 C 18 10, 18 14, 16 16"/><path d="M10 12 C 8 13, 8 15, 10 16"/><path d="M14 12 C 16 13, 16 15, 14 16"/></svg> },
  { name: "Sleek Straight", category: "Long", gender: "woman", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M8 4v16"/><path d="M16 4v16"/></svg> },
  { name: "Curtain Bangs", category: "Long", gender: "woman", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M9 4 C 7 8, 7 12, 9 16"/><path d="M15 4 C 17 8, 17 12, 15 16"/><path d="M12 2 L 12 6"/></svg> },
  { name: "Deep Side Part", category: "Long", gender: "woman", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M9 4v16"/><path d="M16 4v16"/><path d="M9 4 C 14 4 16 6 16 8"/></svg> },
  { name: "French Braid", category: "Braids & Waves", gender: "woman", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M11 4 l 2 2 l -2 2 l 2 2 l -2 2 l 2 2 l -2 2"/></svg> },
  { name: "Boho Mermaid Waves", category: "Braids & Waves", gender: "woman", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M4 8c4-4 8 4 12 0"/><path d="M6 12c4-4 8 4 12 0"/><path d="M8 16c4-4 8 4 12 0"/><path d="M12 20c4-4 8 4 12 0"/></svg> },
  { name: "Voluminous Curls", category: "Curls", gender: "woman", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><circle cx="12" cy="12" r="10"/><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M16 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M10 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M13 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg> },

  // Men's Styles
  { name: "Short Spiky", category: "Short", gender: "man", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M12 4V2"/><path d="M15 5l1-1"/><path d="M9 5l-1-1"/><path d="M17 8l2-1"/><path d="M7 8L5 7"/></svg> },
  { name: "Crew Cut", category: "Short", gender: "man", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M12 4V3"/><path d="M14.5 5l.5-1"/><path d="M9.5 5l-.5-1"/><path d="M16 7l1-1"/><path d="M8 7l-1-1"/></svg> },
  { name: "Undercut", category: "Long", gender: "man", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M8 9V6"/><path d="M16 9V6"/><path d="M9 5c1-2 4-2 6 0"/></svg> },
  { name: "Pompadour", category: "Long", gender: "man", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M8 10V8"/><path d="M16 10V8"/><path d="M9 7c2-4 5-4 7 0a4 4 0 0 1-7 0z"/></svg> },
  { name: "Buzz Cut", category: "Short", gender: "man", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M12 6v-0.5m2.5 1l0.5-0.5m-5.5 0.5l-0.5-0.5m7 2.5l0.5-0.5m-9.5 0.5l-0.5-0.5"/></svg> },
  
  // Unisex Styles
  { name: "Long Straight", category: "Long", gender: "unisex", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M8 4v16"/><path d="M16 4v16"/></svg> },
  { name: "Curly Afro", category: "Short", gender: "unisex", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><circle cx="12" cy="12" r="10"/><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M16 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M10 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M13 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg> },
];
const HAIR_COLORS = [
    { name: "Light Golden Blonde", style: { background: 'linear-gradient(135deg, #f0e1c2, #e6c89c, #d9b87b, #c7a564)' } },
    { name: "Light Cool Brown", style: { background: 'linear-gradient(135deg, #a38e79, #8a7461, #766352, #655446)' } },
    { name: "Chocolate Brown", style: { background: 'linear-gradient(135deg, #5e4534, #4a3627, #3d2c1f, #2e2015)' } },
    { name: "Medium Auburn", style: { background: 'linear-gradient(135deg, #a54b32, #8b3c25, #752d1a, #612313)' } },
    { name: "Jet Black", style: { background: 'linear-gradient(135deg, #2c2c2e, #1e1e20, #111113, #080809)' } },
];
const LOCAL_STORAGE_KEY = 'glamai-saved-looks';
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// --- Types ---
interface SavedLook {
  id: number;
  before: string;
  after: string;
}

// --- AI Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- Helper Functions ---
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  const data = await base64EncodedDataPromise;
  return {
    inlineData: { data, mimeType: file.type },
  };
};

// --- Components ---

const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 bg-slate-800 bg-opacity-75 flex flex-col items-center justify-center z-50">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
    <p className="text-white text-lg mt-4">Generating your new look...</p>
    <p className="text-slate-400 text-sm mt-2">This may take a moment.</p>
  </div>
);

interface ImageSliderProps {
  beforeImage: string;
  afterImage: string;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!isDragging || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
  const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

  const handleMouseUp = () => setIsDragging(false);
  const handleTouchEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  return (
    <div 
      ref={imageContainerRef} 
      className="relative w-full max-w-lg aspect-square select-none rounded-lg overflow-hidden border-2 border-slate-600" 
      onMouseUp={handleMouseUp} 
      onMouseLeave={handleMouseUp}
    >
       <div
        className="absolute inset-0 w-full h-full"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={afterImage} 
          alt="After" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
          draggable="false"
        />
      </div>
      <img 
        src={beforeImage} 
        alt="Before" 
        className="w-full h-full object-cover pointer-events-none" 
        draggable="false"
      />
      <div 
        className="absolute inset-y-0 h-full w-1.5 bg-white/50 cursor-ew-resize backdrop-blur-sm" 
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }} 
        onMouseDown={handleMouseDown} 
        onTouchStart={handleTouchStart}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full h-12 w-12 grid place-items-center shadow-2xl ring-2 ring-slate-800/50">
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
        </div>
      </div>
      <div className="absolute top-2 left-2 bg-black/60 text-white px-3 py-1 rounded-md text-sm pointer-events-none">Before</div>
      <div className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded-md text-sm pointer-events-none">After</div>
    </div>
  );
};

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImage: string;
  afterImage: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, beforeImage, afterImage }) => {
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCompositeImage = useCallback(async () => {
    setIsGenerating(true);
    try {
      const before = new Image();
      const after = new Image();
      before.crossOrigin = "anonymous";
      after.crossOrigin = "anonymous";

      await Promise.all([
        new Promise(resolve => { before.onload = resolve; before.src = beforeImage; }),
        new Promise(resolve => { after.onload = resolve; after.src = afterImage; }),
      ]);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const imgWidth = before.width;
      const imgHeight = before.height;
      
      canvas.width = imgWidth * 2 * dpr;
      canvas.height = imgHeight * dpr;
      ctx.scale(dpr, dpr);

      // Draw before image
      ctx.drawImage(before, 0, 0, imgWidth, imgHeight);

      // Draw after image
      ctx.drawImage(after, imgWidth, 0, imgWidth, imgHeight);

      // Add labels and divider
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(imgWidth - 1, 0, 2, imgHeight); // Divider
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(10, imgHeight - 60, 140, 45);
      ctx.fillRect(imgWidth + 10, imgHeight - 60, 120, 45);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Before', 80, imgHeight - 25);
      ctx.fillText('After', imgWidth + 70, imgHeight - 25);

      setCompositeImage(canvas.toDataURL('image/jpeg', 0.9));
    } catch (error) {
      console.error("Error generating composite image:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [beforeImage, afterImage]);

  useEffect(() => {
    if (isOpen) {
      generateCompositeImage();
    } else {
      setCompositeImage(null);
    }
  }, [isOpen, generateCompositeImage]);

  if (!isOpen) return null;
  
  const handleDownload = () => {
    if (!compositeImage) return;
    const link = document.createElement('a');
    link.href = compositeImage;
    link.download = 'glamai-look.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const shareText = "Check out my new look from Glamai Look Lab! #AIHairstyle #Glamai";
  const encodedShareText = encodeURIComponent(shareText);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-center">Share Your Look</h2>
        <div className="aspect-video bg-slate-700/50 rounded-lg flex items-center justify-center mb-6">
          {isGenerating && <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-indigo-400"></div>}
          {compositeImage && <img src={compositeImage} alt="Before and After" className="max-w-full max-h-full object-contain rounded-lg" />}
        </div>
        <div className="flex flex-col gap-4">
          <button onClick={handleDownload} disabled={!compositeImage} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-all disabled:bg-slate-600">
            Download Image
          </button>
          <p className="text-slate-400 text-sm text-center">Download the image first, then share it on your favorite platform!</p>
          <div className="flex justify-center items-center gap-4">
             <a href={`https://twitter.com/intent/tweet?text=${encodedShareText}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-1.78 13.05h1.68L3.26 2.05H1.68l9.14 11.7z"/></svg>
            </a>
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/></svg>
            </a>
             <a href="https://pinterest.com/" target="_blank" rel="noopener noreferrer" aria-label="Share on Pinterest" className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a8 8 0 0 0-2.915 15.452c-.07-.633-.134-1.606.027-2.297.146-.625.938-3.977.938-3.977s-.239-.479-.239-1.187c0-1.113.645-1.943 1.448-1.943.682 0 1.012.512 1.012 1.127 0 .686-.437 1.712-.663 2.663-.188.796.4 1.446 1.185 1.446 1.422 0 2.515-1.5 2.515-3.664 0-1.915-1.377-3.254-3.342-3.254-2.276 0-3.612 1.707-3.612 3.471 0 .688.265 1.425.595 1.826a.24.24 0 0 1 .056.23c-.061.252-.196.796-.222.907-.035.146-.116.177-.268.107-1-.465-1.624-1.926-1.624-3.1 0-2.523 1.834-4.84 5.286-4.84 2.775 0 4.932 1.977 4.932 4.62 0 2.757-1.739 4.976-4.151 4.976-.811 0-1.573-.421-1.834-.919l-.498 1.902c-.181.695-.669 1.566-.995 2.097A8 8 0 1 0 8 0z"/></svg>
            </a>
             <a href={`https://www.reddit.com/submit?title=${encodedShareText}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit" className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M6.705 11.545c.325.325.855.325 1.18 0l1.9-1.9c.325-.325.325-.855 0-1.18s-.855-.325-1.18 0l-1.9 1.9c-.325.325-.325.855 0 1.18z"/><path d="M11.236 7.64a.848.848 0 0 0-1.196-.01.848.848 0 0 0-.01 1.196l1.35 1.35c.33.33.86.33 1.19 0s.33-.86 0-1.19l-1.344-1.346zm-5.59-1.206c.33-.33.86-.33 1.19 0s.33.86 0 1.19L5.49 10.01c-.33.33-.86.33-1.19 0a.848.848 0 0 1 0-1.19l1.342-1.344z"/><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm4.243 12.243a.848.848 0 0 1-1.196 0l-1.345-1.345a.848.848 0 0 1 0-1.196.848.848 0 0 1 1.196 0l1.345 1.345a.848.848 0 0 1 0 1.196zm-4.137 1.393a.848.848 0 0 1-1.196-.01.848.848 0 0 1-.01-1.196l1.345-1.345a.848.848 0 0 1 1.196 0 .848.848 0 0 1 0 1.196l-1.345 1.345zM8 5.795c-1.258 0-2.28 1.022-2.28 2.28s1.022 2.28 2.28 2.28 2.28-1.022 2.28-2.28S9.258 5.795 8 5.795z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
export default function App() {
  // --- State Management ---
  // Core functionality state
  const [selectedGender, setSelectedGender] = useState<'woman' | 'man' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [previousSelectedStyle, setPreviousSelectedStyle] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Image enhancement state
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);

  // Saved looks state
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [isCurrentLookSaved, setIsCurrentLookSaved] = useState(false);
  const [activeLookId, setActiveLookId] = useState<number | null>(null);

  // Load saved looks from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setSavedLooks(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load saved looks:", e);
    }
  }, []);

  // Reset style selections when gender changes for a cleaner UX
  useEffect(() => {
    setSelectedStyle(null);
    setPreviousSelectedStyle(null);
    setActiveCategory('All');
  }, [selectedGender]);

  // Handles the file input change event
  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // File validation
      if (!file.type.startsWith('image/')) {
        setError('Invalid file type. Please upload a valid image file (e.g., PNG, JPG).');
        setUploadedFile(null);
        setOriginalImage(null);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large. Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB.`);
        setUploadedFile(null);
        setOriginalImage(null);
        return;
      }
      
      const fileUrl = URL.createObjectURL(file);
      setUploadedFile(file);
      setOriginalImage(fileUrl);
      setInitialFile(file);
      setInitialImageUrl(fileUrl);
      setIsEnhanced(false);
      setGeneratedImage(null);
      setError(null);
      setActiveLookId(null);
    }
  }, []);

  // Handles the selection of a hairstyle and saves the previous state for undo
  const handleStyleSelect = useCallback((style: string) => {
    setSelectedStyle(currentStyle => {
      if (currentStyle !== style) {
        setPreviousSelectedStyle(currentStyle);
      }
      return style;
    });
  }, []);
  
  // Reverts the hairstyle to the previously selected one
  const handleUndoStyle = useCallback(() => {
    if (previousSelectedStyle) {
      setSelectedStyle(previousSelectedStyle);
      setPreviousSelectedStyle(null); // Allows for only one step back
    }
  }, [previousSelectedStyle]);

  // Enhances the original image to a studio-quality portrait
  const handleEnhanceImage = useCallback(async () => {
    if (!initialFile) return;

    setIsEnhancing(true);
    setError(null);

    try {
      const imagePart = await fileToGenerativePart(initialFile);
      const textPart = { text: "Transform this photo into a high-quality studio portrait. Apply professional studio lighting to add depth and dimension to the subject's face. Replace the existing background with a clean, neutral studio backdrop (e.g., soft grey or off-white). Perform subtle, natural skin smoothing to reduce minor blemishes and imperfections, while preserving the original skin texture to avoid an artificial or over-processed look. Increase the overall image sharpness and clarity. It is absolutely crucial that the person's facial features, facial structure, head shape, and expression remain completely unchanged. Do not stretch, compress, or otherwise alter the dimensions of the face." };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });
      
      let enhancedImage: { data: string, mimeType: string } | null = null;
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            enhancedImage = { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
            break;
          }
        }
      }

      if (enhancedImage) {
        const enhancedImageUrl = `data:${enhancedImage.mimeType};base64,${enhancedImage.data}`;
        
        const fetchRes = await fetch(enhancedImageUrl);
        const blob = await fetchRes.blob();
        const enhancedFile = new File([blob], initialFile.name, { type: enhancedImage.mimeType });
        
        setUploadedFile(enhancedFile);
        setOriginalImage(enhancedImageUrl);
        setIsEnhanced(true);
      } else {
        setError("The AI couldn't enhance this image. Please try a different photo.");
      }
    } catch (e) {
      console.error("AI Enhancement Error:", e);
      setError("An error occurred while enhancing the image. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  }, [initialFile]);

  // Reverts the image back to the original upload
  const handleRevertToOriginal = useCallback(() => {
    if (initialFile && initialImageUrl) {
      setUploadedFile(initialFile);
      setOriginalImage(initialImageUrl);
      setIsEnhanced(false);
    }
  }, [initialFile, initialImageUrl]);


  // Generates the new look using the Gemini API
  const handleGenerateLook = useCallback(async () => {
    if (!uploadedFile || !selectedStyle || !selectedGender) return;

    setIsLoading(true);
    setError(null);
    setIsCurrentLookSaved(false);
    setActiveLookId(null);

    try {
      const imagePart = await fileToGenerativePart(uploadedFile);
      const prompt = `Apply a ${selectedColor ? selectedColor + ' ' : ''}${selectedStyle} hairstyle to the ${selectedGender} in the image. It is absolutely crucial that you only change the hair. The person's facial features, head shape, jawline, expression, and all other physical attributes must remain completely unchanged from the original photo. Do not alter the dimensions or structure of the face. The new hairstyle should look realistic and blend naturally with the original image.`;
      const textPart = { text: prompt };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [imagePart, textPart],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      let newImage: string | null = null;
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            newImage = `data:${mimeType};base64,${base64ImageBytes}`;
            break;
          }
        }
      }

      if (newImage) {
        setGeneratedImage(newImage);
      } else {
        setError("The AI couldn't generate a new look from this image. It might be the image quality, angle, or the selected style. Please try a different photo.");
      }
    } catch (e) {
      console.error("AI Generation Error:", e);
      if (e instanceof Error) {
        if (e.message.includes('400')) {
          setError("The request was invalid. Please check the uploaded image and try again.");
        } else if (e.message.includes('500')) {
          setError("The AI service is currently unavailable. Please try again later.");
        } else {
          setError("An error occurred while generating your look. Please check your connection and try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [uploadedFile, selectedStyle, selectedColor, selectedGender]);

  // Resets the state to allow the user to try another style with the same photo
  const handleTryAnotherStyle = useCallback(() => {
    setGeneratedImage(null);
    setSelectedStyle(null);
    setPreviousSelectedStyle(null);
    setSelectedColor(null);
    setActiveCategory('All');
    setError(null);
    setIsCurrentLookSaved(false);
    setActiveLookId(null);
  }, []);
  
  // Saves the current look to localStorage
  const handleSaveLook = useCallback(() => {
    if (!originalImage || !generatedImage || isCurrentLookSaved) return;

    const newLook: SavedLook = {
      id: Date.now(),
      before: originalImage,
      after: generatedImage,
    };

    const updatedLooks = [...savedLooks, newLook];
    setSavedLooks(updatedLooks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLooks));
    setIsCurrentLookSaved(true);
  }, [originalImage, generatedImage, savedLooks, isCurrentLookSaved]);

  // Deletes a saved look
  const handleDeleteLook = useCallback((id: number) => {
    const updatedLooks = savedLooks.filter(look => look.id !== id);
    setSavedLooks(updatedLooks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLooks));
  }, [savedLooks]);

  // Clears all saved looks and resets the UI to a consistent state
  const handleClearAllLooks = useCallback(() => {
    if (window.confirm("Are you sure you want to delete all your saved looks? This action cannot be undone.")) {
      setSavedLooks([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      // If a result is being shown, reset the view to the selection screen
      if (generatedImage) {
        handleTryAnotherStyle();
      }
    }
  }, [generatedImage, handleTryAnotherStyle]);
  
  // Sets a saved look as the active view
  const handleViewLook = useCallback(async (look: SavedLook) => {
    try {
      // Set images to display the saved look result
      setOriginalImage(look.before);
      setGeneratedImage(look.after);

      // Convert the base64 'before' image back to a File object.
      // This is crucial so that the "Try Another Style" button works correctly,
      // as the generation function requires a File object.
      const fetchRes = await fetch(look.before);
      const blob = await fetchRes.blob();
      const file = new File([blob], `saved_look_${look.id}.png`, { type: blob.type });
      setUploadedFile(file);
      
      // Reset styling state and scroll to the top to show the result
      setActiveLookId(look.id);
      setSelectedStyle(null);
      setPreviousSelectedStyle(null);
      setSelectedColor(null);
      setActiveCategory('All');
      setError(null);
      setIsCurrentLookSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error("Error preparing saved look for re-styling:", e);
      // Still show the look, but inform the user re-styling might fail.
      setError("Could not fully load the image for re-styling. You can view it, but generating new styles from it might not work.");
      // Still display the look even if file conversion fails
      setOriginalImage(look.before);
      setGeneratedImage(look.after);
      setActiveLookId(look.id);
      setIsCurrentLookSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const isGenerateButtonDisabled = !originalImage || !selectedStyle || isLoading || !selectedGender;

  const availableCategories = selectedGender
    ? ['All', ...Array.from(new Set(HAIRSTYLES
        .filter(style => style.gender === selectedGender || style.gender === 'unisex')
        .map(style => style.category)
      ))]
    : ['All'];

  const filteredHairstyles = selectedGender ? HAIRSTYLES
      .filter(style => style.gender === selectedGender || style.gender === 'unisex')
      .filter(style => activeCategory === 'All' ? true : style.category === activeCategory)
      : [];
  
  const Footer: React.FC = () => (
    <footer className="w-full max-w-4xl mx-auto mt-8 py-6 border-t border-slate-700 text-center">
      <div className="flex justify-center items-center gap-6 mb-4">
         <a href="#" aria-label="Our X account" className="text-slate-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-1.78 13.05h1.68L3.26 2.05H1.68l9.14 11.7z"/></svg>
        </a>
         <a href="#" aria-label="Our Facebook page" className="text-slate-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/></svg>
        </a>
         <a href="#" aria-label="Our Instagram profile" className="text-slate-400 hover:text-white transition-colors">
           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.282.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.282-.705.416-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.282-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.232s.008-2.389.046-3.232c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.843-.038 1.096-.047 3.232-.047zM8 4.908a3.092 3.092 0 1 0 0 6.184 3.092 3.092 0 0 0 0-6.184zm0 5.068a1.977 1.977 0 1 1 0-3.955 1.977 1.977 0 0 1 0 3.955zm3.592-5.926a.744.744 0 1 0 0-1.488.744.744 0 0 0 0 1.488z"/></svg>
        </a>
      </div>
      <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} Glamai Look Lab. All rights reserved.</p>
    </footer>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-white font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">
            Glamai Look Lab
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Upload a photo and let AI create your new look.</p>
        </header>

        <main className="bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          {isLoading && <LoadingSpinner />}
          
          {!generatedImage ? (
            // --- INTERACTIVE SECTION ---
            <div>
              <div className="flex flex-col items-center mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-slate-200">1. Who are you styling?</h2>
                  <div className="flex justify-center gap-4 w-full max-w-sm">
                      <button
                          onClick={() => setSelectedGender('woman')}
                          className={`w-full text-lg font-bold py-3 px-6 rounded-lg border-2 transition-all duration-200 ${
                              selectedGender === 'woman'
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                              : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500 text-slate-300'
                          }`}
                      >
                          Woman
                      </button>
                      <button
                          onClick={() => setSelectedGender('man')}
                          className={`w-full text-lg font-bold py-3 px-6 rounded-lg border-2 transition-all duration-200 ${
                              selectedGender === 'man'
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                              : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500 text-slate-300'
                          }`}
                      >
                          Man
                      </button>
                  </div>
              </div>

              <div className={`flex flex-col lg:flex-row items-start justify-center gap-8 transition-opacity duration-500 ${!selectedGender ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'opacity-100'}`}>
                <div className="flex-shrink-0 flex flex-col items-center space-y-4">
                  <h2 className="text-2xl font-semibold mb-0 text-slate-200">2. Upload Photo</h2>
                  <div className="w-64 h-64 md:w-80 md:h-80 bg-slate-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600">
                    {originalImage ? (
                      <img src={originalImage} alt="Original upload" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-slate-400">Your Photo Here</span>
                    )}
                  </div>
                  <label className="cursor-pointer bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md">
                    Choose Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={!selectedGender}/>
                  </label>
                  {originalImage && (
                    <div className="mt-4 w-full max-w-xs text-center">
                      <h2 className="text-lg font-semibold mb-2 text-slate-300">Want a better shot?</h2>
                      {!isEnhanced ? (
                        <button 
                          onClick={handleEnhanceImage}
                          disabled={isEnhancing || !selectedGender}
                          className="w-full bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isEnhancing ? (
                            <>
                              <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-slate-900"></div>
                              Enhancing...
                            </>
                          ) : (
                            "✨ Studio Enhance"
                          )}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <p className="flex-grow text-left py-2 px-3 bg-green-900/50 text-green-300 rounded-lg text-sm">✓ Enhanced!</p>
                          <button 
                            onClick={handleRevertToOriginal}
                            className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors duration-300 text-sm"
                          >
                            Revert
                          </button>
                        </div>
                      )}
                      <p className="text-slate-400 text-xs mt-2">Let AI give your photo a professional studio look.</p>
                    </div>
                  )}
                </div>

                <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start">
                  <div className="w-full max-w-md flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-slate-200">3. Select a Style</h2>
                    <button
                        onClick={handleUndoStyle}
                        disabled={!previousSelectedStyle}
                        className="text-sm font-semibold text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        aria-label="Undo last style selection"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Undo
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {availableCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        disabled={!originalImage || !selectedGender}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeCategory === category
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        } ${!originalImage || !selectedGender ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 w-full max-w-md">
                    {filteredHairstyles.length > 0 ? filteredHairstyles.map((style) => (
                      <button
                        key={style.name}
                        onClick={() => handleStyleSelect(style.name)}
                        disabled={!originalImage || !selectedGender}
                        className={`group p-3 flex flex-col items-center justify-center gap-2 text-center rounded-lg transition-all duration-200 border-2 
                          ${selectedStyle === style.name 
                            ? 'bg-slate-600/50 border-indigo-400 ring-2 ring-indigo-300' 
                            : 'bg-slate-700 border-slate-600 hover:border-slate-400 hover:bg-slate-600'}
                          ${!originalImage || !selectedGender ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {React.cloneElement(style.icon, { className: `w-12 h-12 transition-colors duration-200 ${selectedStyle === style.name ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'}` })}
                        <span className={`font-medium text-sm ${selectedStyle === style.name ? 'text-white' : 'text-slate-300'}`}>{style.name}</span>
                      </button>
                    )) : (
                      <p className="col-span-full text-slate-400 text-center">Please select a gender to see available styles.</p>
                    )}
                  </div>

                  <h2 className="text-2xl font-semibold mb-4 text-slate-200">4. Choose a Color <span className="text-slate-400 text-lg">(Optional)</span></h2>
                  <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-md">
                    <button
                          key="no-color"
                          onClick={() => setSelectedColor(null)}
                          disabled={!originalImage || !selectedGender}
                          aria-label="Keep original hair color"
                          title="Keep Original Color"
                          className={`w-16 h-16 rounded-full border-2 transition-all duration-200 flex items-center justify-center bg-slate-700/50
                              ${!selectedColor 
                                  ? 'border-sky-400 ring-4 ring-sky-400/30' 
                                  : 'border-slate-500'}
                              ${!originalImage || !selectedGender
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : 'hover:border-sky-400'}`}
                      >
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                          </svg>
                      </button>
                    {HAIR_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name === selectedColor ? null : color.name)}
                        disabled={!originalImage || !selectedGender}
                        aria-label={`Select ${color.name} hair color`}
                        className={`w-16 h-16 rounded-full border-2 transition-all duration-200 ${
                          selectedColor === color.name 
                              ? 'border-sky-400 ring-4 ring-sky-400/30' 
                              : 'border-slate-500'
                        } ${!originalImage || !selectedGender
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:border-sky-400'}`}
                        style={color.style}
                      />
                    ))}
                  </div>

                  <h2 className="text-2xl font-semibold mb-4 text-slate-200">5. Generate</h2>
                  <button
                    onClick={handleGenerateLook}
                    disabled={isGenerateButtonDisabled}
                    className="w-full max-w-md bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
                  >
                    Generate New Look
                  </button>
                  {error && (
                    <p className="text-red-400 mt-4 text-center w-full max-w-sm">{error}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // --- RESULTS SECTION ---
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-bold mb-6 text-center">Your New Look!</h2>
              <div className="w-full flex justify-center mb-6">
                {originalImage && (
                  <ImageSlider beforeImage={originalImage} afterImage={generatedImage} />
                )}
              </div>
              
              <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
                <button
                  onClick={handleTryAnotherStyle}
                  className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md"
                >
                  Try Another Style
                </button>
                 <button
                  onClick={handleSaveLook}
                  disabled={isCurrentLookSaved}
                  className="bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-md disabled:bg-slate-600 disabled:opacity-70"
                >
                  {isCurrentLookSaved ? 'Saved!' : 'Save Look'}
                </button>
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="bg-sky-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-600 transition-all duration-300 shadow-md flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                  Share Look
                </button>
              </div>
            </div>
          )}
        </main>
        
        {savedLooks.length > 0 && (
          <section className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-center">Your Saved Looks</h2>
              <button
                onClick={handleClearAllLooks}
                className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedLooks.slice().reverse().map((look) => (
                <div 
                  key={look.id} 
                  className={`bg-slate-800 rounded-lg shadow-lg p-4 relative group transition-all duration-300 cursor-pointer ${activeLookId === look.id ? 'ring-2 ring-indigo-400' : 'ring-2 ring-transparent'}`}
                  onClick={() => handleViewLook(look)}
                >
                  <div className="flex gap-4">
                    <div className="w-1/2">
                       <h3 className="text-lg font-semibold text-slate-300 mb-2 text-center">Before</h3>
                       <img src={look.before} alt="Saved before" className="w-full h-auto object-cover rounded" />
                    </div>
                    <div className="w-1/2">
                       <h3 className="text-lg font-semibold text-slate-300 mb-2 text-center">After</h3>
                       <img src={look.after} alt="Saved after" className="w-full h-auto object-cover rounded" />
                    </div>
                  </div>
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLook(look.id);
                    }}
                    className="absolute top-2 right-2 bg-red-600/80 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-500"
                    aria-label="Delete saved look"
                  >
                    &#x2715;
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
        {generatedImage && originalImage && (
            <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            beforeImage={originalImage}
            afterImage={generatedImage}
            />
        )}
      <Footer />
    </div>
  );
}
