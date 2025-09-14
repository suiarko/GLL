
import React, { useState, useCallback, ChangeEvent, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Constants ---
const HAIRSTYLES = [
  { name: "Wavy Bob", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M4 8c0 4.418 3.582 8 8 8s8-3.582 8-8c0-4.418-3.582-8-8-8-1.57 0-3.05.45-4.33 1.25M8 12c0 2.21 1.79 4 4 4s4-1.79 4-4"/><path d="M4 8c-2 2-2 5 0 7s5 2 7 0"/><path d="M20 8c2 2 2 5 0 7s-5 2-7 0"/></svg> },
  { name: "Classic Bun", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M19 14.5c0 1.38-1.12 2.5-2.5 2.5S14 15.88 14 14.5c0-1.07.67-1.98 1.6-2.37"/><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M16.5 17c1.93 0 3.5-1.57 3.5-3.5S18.43 10 16.5 10c-.3 0-.58.04-.86.11"/></svg> },
  { name: "Sleek Ponytail", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M13 5c0-1.66-1.34-3-3-3S7 3.34 7 5s1.34 3 3 3h3"/><path d="M11 8V5c0-1.1.9-2 2-2s2 .9 2 2v3"/><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v1m4 0c1.1 0 2-.9 2-2s-.9-2-2-2h-1"/><path d="M16 10c-3 1.5-3 5.5 0 7s3-1.5 3-7c0-2-1-3-3-3"/></svg> },
  { name: "Pixie Cut", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M10 5.5L8 4"/><path d="M13 6l-2-2"/><path d="M16 7l-2-2"/><path d="M12 11V9"/><path d="M15 12h-2"/></svg> },
  { name: "Boho Braids", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M8 4l1.5 1.5L8 7"/><path d="M16 4l-1.5 1.5L16 7"/><path d="M8 20l1.5-1.5L8 17"/><path d="M16 20l-1.5-1.5L16 17"/><path d="M12 12l1.5 1.5L12 15"/><path d="M9.5 5.5s-1 2-1 6.5 1 6.5 1 6.5"/><path d="M14.5 5.5s1 2 1 6.5-1 6.5-1 6.5"/></svg> },
  { name: "Short Spiky", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M12 4V2"/><path d="M15 5l1-1"/><path d="M9 5l-1-1"/><path d="M17 8l2-1"/><path d="M7 8L5 7"/></svg> },
  { name: "Long Straight", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M8 4v16"/><path d="M16 4v16"/></svg> },
  { name: "Curly Afro", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><circle cx="12" cy="12" r="10"/><path d="M12 18H8c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4h1c1.1 0 2 .9 2 2v10.5c0 .83.67 1.5 1.5 1.5H14"/><path d="M16 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M10 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M13 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg> },
  { name: "Retro Waves", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-300"><path d="M4 8c4-4 8 4 12 0"/><path d="M6 12c4-4 8 4 12 0"/><path d="M8 16c4-4 8 4 12 0"/><path d="M12 20c4-4 8 4 12 0"/></svg> },
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

interface Adjustments {
  brightness: number;
  contrast: number;
  temperature: number;
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
  adjustments: Adjustments;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ beforeImage, afterImage, adjustments }) => {
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

  const temperatureOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    mixBlendMode: 'overlay',
  };
  
  const temperatureValue = adjustments.temperature;
  const maxOpacity = 0.3; // max 30% overlay
  
  if (temperatureValue > 0) {
    temperatureOverlayStyle.backgroundColor = `rgba(255, 165, 0, ${(temperatureValue / 50) * maxOpacity})`;
  } else if (temperatureValue < 0) {
    temperatureOverlayStyle.backgroundColor = `rgba(0, 120, 255, ${(Math.abs(temperatureValue) / 50) * maxOpacity})`;
  } else {
    temperatureOverlayStyle.backgroundColor = 'transparent';
  }

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
          style={{ filter: `brightness(${adjustments.brightness / 100}) contrast(${adjustments.contrast / 100})`}}
          draggable="false"
        />
        <div style={temperatureOverlayStyle}></div>
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


// --- Main App Component ---
export default function App() {
  // --- State Management ---
  // Core functionality state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image enhancement state
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);

  // Saved looks state
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [isCurrentLookSaved, setIsCurrentLookSaved] = useState(false);
  const [activeLookId, setActiveLookId] = useState<number | null>(null);

  // Adjustment state
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 100,
    contrast: 100,
    temperature: 0,
  });


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

  const resetAdjustments = useCallback(() => {
    setAdjustments({ brightness: 100, contrast: 100, temperature: 0 });
  }, []);

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
      resetAdjustments();
    }
  }, [resetAdjustments]);

  // Handles the selection of a hairstyle
  const handleStyleSelect = useCallback((style: string) => {
    setSelectedStyle(style);
  }, []);

  // Enhances the original image to a studio-quality portrait
  const handleEnhanceImage = useCallback(async () => {
    if (!initialFile) return;

    setIsEnhancing(true);
    setError(null);

    try {
      const imagePart = await fileToGenerativePart(initialFile);
      const textPart = { text: "Enhance this photo to look like a professional studio portrait. Improve the lighting to be dramatic and flattering, replace the background with a clean, neutral studio backdrop (like a soft grey or off-white), and increase the overall image sharpness and quality. It is crucial that the person's face, features, and expression remain completely unchanged." };

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
    if (!uploadedFile || !selectedStyle) return;

    setIsLoading(true);
    setError(null);
    setIsCurrentLookSaved(false);
    setActiveLookId(null);
    resetAdjustments();

    try {
      const imagePart = await fileToGenerativePart(uploadedFile);
      const textPart = { text: `Give the person in the image a ${selectedStyle} hairstyle. Make it look realistic.` };

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
  }, [uploadedFile, selectedStyle, resetAdjustments]);

  // Resets the state to allow the user to try another style with the same photo
  const handleTryAnotherStyle = useCallback(() => {
    setGeneratedImage(null);
    setSelectedStyle(null);
    setError(null);
    setIsCurrentLookSaved(false);
    setActiveLookId(null);
    resetAdjustments();
  }, [resetAdjustments]);
  
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

  // Clears all saved looks
  const handleClearAllLooks = useCallback(() => {
    if (window.confirm("Are you sure you want to delete all your saved looks? This action cannot be undone.")) {
      setSavedLooks([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);
  
  // Sets a saved look as the active view
  const handleViewLook = useCallback((look: SavedLook) => {
    setOriginalImage(look.before);
    setGeneratedImage(look.after);
    setActiveLookId(look.id);
    setSelectedStyle(null);
    setError(null);
    setIsCurrentLookSaved(true);
    resetAdjustments();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetAdjustments]);

  const handleAdjustmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdjustments(prev => ({ ...prev, [name]: parseInt(value, 10) }));
  };

  const isGenerateButtonDisabled = !originalImage || !selectedStyle || isLoading;

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
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              <div className="flex-shrink-0 flex flex-col items-center space-y-4">
                <div className="w-64 h-64 md:w-80 md:h-80 bg-slate-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600">
                  {originalImage ? (
                    <img src={originalImage} alt="Original upload" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-slate-400">Your Photo Here</span>
                  )}
                </div>
                <label className="cursor-pointer bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md">
                  Choose Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                {originalImage && (
                  <div className="mt-4 w-full max-w-xs text-center">
                    <h2 className="text-lg font-semibold mb-2 text-slate-300">Want a better shot?</h2>
                    {!isEnhanced ? (
                      <button 
                        onClick={handleEnhanceImage}
                        disabled={isEnhancing}
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
                <h2 className="text-2xl font-semibold mb-4 text-slate-200">1. Select a Style</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 w-full max-w-md">
                  {HAIRSTYLES.map((style) => (
                    <button
                      key={style.name}
                      onClick={() => handleStyleSelect(style.name)}
                      disabled={!originalImage}
                      className={`group p-3 flex flex-col items-center justify-center gap-2 text-center rounded-lg transition-all duration-200 border-2 
                        ${selectedStyle === style.name 
                          ? 'bg-slate-600/50 border-indigo-400 ring-2 ring-indigo-300' 
                          : 'bg-slate-700 border-slate-600 hover:border-slate-400 hover:bg-slate-600'}
                        ${!originalImage ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {React.cloneElement(style.icon, { className: `w-12 h-12 transition-colors duration-200 ${selectedStyle === style.name ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'}` })}
                      <span className={`font-medium text-sm ${selectedStyle === style.name ? 'text-white' : 'text-slate-300'}`}>{style.name}</span>
                    </button>
                  ))}
                </div>
                <h2 className="text-2xl font-semibold mb-4 text-slate-200">2. Generate</h2>
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
          ) : (
            // --- RESULTS SECTION ---
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-bold mb-6 text-center">Your New Look!</h2>
              <div className="w-full flex justify-center mb-4">
                {originalImage && (
                  <ImageSlider beforeImage={originalImage} afterImage={generatedImage} adjustments={adjustments} />
                )}
              </div>
              
               <div className="w-full max-w-lg my-4 bg-slate-700/50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-center text-slate-200">Adjust Look</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 items-center gap-2">
                    <label htmlFor="brightness" className="text-slate-300 col-span-1 text-sm sm:text-base">Brightness</label>
                    <input type="range" id="brightness" name="brightness" min="50" max="150" value={adjustments.brightness} onChange={handleAdjustmentChange} className="col-span-3 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-2">
                    <label htmlFor="contrast" className="text-slate-300 col-span-1 text-sm sm:text-base">Contrast</label>
                    <input type="range" id="contrast" name="contrast" min="50" max="150" value={adjustments.contrast} onChange={handleAdjustmentChange} className="col-span-3 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-2">
                    <label htmlFor="temperature" className="text-slate-300 col-span-1 text-sm sm:text-base">Temperature</label>
                    <input type="range" id="temperature" name="temperature" min="-50" max="50" value={adjustments.temperature} onChange={handleAdjustmentChange} className="col-span-3 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <button onClick={resetAdjustments} className="bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-slate-500 transition-colors duration-300 text-sm">
                    Reset Adjustments
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
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
    </div>
  );
}
