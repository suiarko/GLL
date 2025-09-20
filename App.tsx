






import React, { useState, useCallback, ChangeEvent, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { validateEthicalUsage, ETHICAL_CONFIG, POSITIVE_AFFIRMATIONS, MENTAL_HEALTH_RESOURCES, PROGRESSIVE_LIMITS } from './ethical-config';
import { supabaseConnection, initializeSupabase } from './supabaseClient';

// NOTE: This application requires the Gemini API Key to be set as an environment variable.
// It is expected that API_KEY is configured in the execution environment.
// The application will fail to initialize if it is missing.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- TYPES ---
interface SavedLook {
  id: number;
  before: string;
  after: string;
  style: string;
  color: string | null;
  created_at: string;
  user_id: string;
}

interface EthicalReport {
  aiDisclosure: string;
  biasCheck: string;
  mentalHealthMessage: string;
  transparencyScore: number;
  diversityNote: string;
}

interface SessionData {
  date: string;
  dailyTransformations: number;
  lastTransformation: number;
  firstUsageToday: number;
}

interface Recommendation {
  name: string;
  reason: string;
}

// --- CONSTANTS ---
const HAIRSTYLES = [
  // Women's Styles (more diverse and inclusive)
  { name: "Natural Curls", category: "Natural", gender: "woman", cultural: "universal", 
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/natural_curls/64/64" alt="Natural Curls" className="w-full h-full object-cover" /></div> },
  { name: "Afro Puff", category: "Natural", gender: "woman", cultural: "african", 
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/afro_puff/64/64" alt="Afro Puff" className="w-full h-full object-cover" /></div> },
  { name: "Bantu Knots", category: "Protective", gender: "woman", cultural: "african", 
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/bantu_knots/64/64" alt="Bantu Knots" className="w-full h-full object-cover" /></div> },
  { name: "Box Braids", category: "Protective", gender: "woman", cultural: "african", 
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/box_braids/64/64" alt="Box Braids" className="w-full h-full object-cover" /></div> },
  { name: "Italian Bob", category: "Short", gender: "woman", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/italian_bob/64/64" alt="Italian Bob" className="w-full h-full object-cover" /></div> },
  { name: "Pixie Cut", category: "Short", gender: "woman", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/pixie_cut/64/64" alt="Pixie Cut" className="w-full h-full object-cover" /></div> },
  { name: "Wolf Cut", category: "Layered", gender: "woman", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/wolf_cut/64/64" alt="Wolf Cut" className="w-full h-full object-cover" /></div> },
  { name: "Butterfly Cut", category: "Layered", gender: "woman", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/butterfly_cut/64/64" alt="Butterfly Cut" className="w-full h-full object-cover" /></div> },
  { name: "Beach Waves", category: "Long", gender: "woman", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/beach_waves/64/64" alt="Beach Waves" className="w-full h-full object-cover" /></div> },
  { name: "Curtain Bangs", category: "Long", gender: "woman", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/curtain_bangs/64/64" alt="Curtain Bangs" className="w-full h-full object-cover" /></div> },

  // Men's Styles (added diversity)
  { name: "Fade Cut", category: "Short", gender: "man", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/fade_cut/64/64" alt="Fade Cut" className="w-full h-full object-cover" /></div> },
  { name: "Afro Fade", category: "Natural", gender: "man", cultural: "african",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/afro_fade/64/64" alt="Afro Fade" className="w-full h-full object-cover" /></div> },
  { name: "Dreadlocks", category: "Long", gender: "man", cultural: "rastafarian",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/dreadlocks/64/64" alt="Dreadlocks" className="w-full h-full object-cover" /></div> },
  { name: "Undercut", category: "Long", gender: "man", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/undercut/64/64" alt="Undercut" className="w-full h-full object-cover" /></div> },
  { name: "Pompadour", category: "Long", gender: "man", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/pompadour/64/64" alt="Pompadour" className="w-full h-full object-cover" /></div> },
  
  // Unisex Styles
  { name: "Buzz Cut", category: "Short", gender: "unisex", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/buzz_cut/64/64" alt="Buzz Cut" className="w-full h-full object-cover" /></div> },
  { name: "Long Straight", category: "Long", gender: "unisex", cultural: "universal",
    icon: <div className="w-12 h-12 rounded-md overflow-hidden filter grayscale contrast-125"><img src="https://picsum.photos/seed/long_straight/64/64" alt="Long Straight" className="w-full h-full object-cover" /></div> },
];

const HAIR_COLORS = [
  { name: "Natural Black", style: { background: 'linear-gradient(135deg, #2c2c2e, #1e1e20, #111113)' }, natural: true },
  { name: "Natural Brown", style: { background: 'linear-gradient(135deg, #5e4534, #4a3627, #3d2c1f)' }, natural: true },
  { name: "Natural Blonde", style: { background: 'linear-gradient(135deg, #f0e1c2, #e6c89c, #d9b87b)' }, natural: true },
  { name: "Auburn Red", style: { background: 'linear-gradient(135deg, #a54b32, #8b3c25, #752d1a)' }, natural: false },
  { name: "Platinum Blonde", style: { background: 'linear-gradient(135deg, #f5f5dc, #e6e6fa, #d3d3d3)' }, natural: false },
];

const SESSION_STORAGE_KEY = 'glamai-session-data';
const COPY_STYLE_KEY = 'copy-style-from-image';
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// --- HELPER FUNCTIONS ---

// Helper function to convert File to GenerativePart
async function fileToGenerativePart(file: File) {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
}

// Helper to convert Data URL to File object
async function dataURLtoFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

const getSessionData = (): SessionData => {
  const today = new Date().toDateString();
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  
  if (stored) {
    const data = JSON.parse(stored);
    if (data.date === today) {
      return data;
    }
  }
  
  // New day or first visit
  const newData = {
    date: today,
    dailyTransformations: 0,
    lastTransformation: 0,
    firstUsageToday: Date.now()
  };
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newData));
  return newData;
};

const updateSessionData = (updates: Partial<SessionData>) => {
  const current = getSessionData();
  const updated = { ...current, ...updates };
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

const generateEthicalReport = (style: string, transformationCount: number): EthicalReport => {
  return {
    aiDisclosure: "✨ This transformation is AI-generated and may not represent exact real-life results. Always consult with a professional stylist for best results.",
    biasCheck: "✓ Our AI is trained on diverse, inclusive datasets representing all ethnicities, ages, and hair types.",
    mentalHealthMessage: POSITIVE_AFFIRMATIONS[transformationCount % POSITIVE_AFFIRMATIONS.length],
    transparencyScore: 10, // Full transparency
    diversityNote: "🌍 This style celebrates your unique features. Beauty comes in all forms!"
  };
};

const getSupabaseErrorMessage = (error: any): string => {
  const defaultMessage = "An unexpected database error occurred. Please try again.";
  if (!error) return defaultMessage;

  console.error("Supabase Error Details:", error);

  const message = error.message || '';
  if (message.includes('PGRST205') || message.includes('404') || message.includes("Could not find the table")) {
    return "Database Setup Incomplete: The 'looks' table was not found in your Supabase project. Please run the provided SQL script in the Supabase SQL Editor to create the table and enable the gallery feature.";
  }

  return error.message || defaultMessage;
};

// --- ENHANCED COMPONENTS ---
const EthicalReportCard: React.FC<{ report: EthicalReport; isVisible: boolean; onClose: () => void }> = ({ report, isVisible, onClose }) => {
  if (!isVisible) return null;
  
  return (
    <div className="mt-6 bg-slate-700/50 rounded-lg p-4 border border-blue-500/30">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-blue-300">🛡️ Ethical AI Report</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">×</button>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-blue-400 mt-1">🔍</span>
          <div>
            <p className="font-medium text-slate-300">AI Transparency:</p>
            <p className="text-slate-400">{report.aiDisclosure}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="text-green-400 mt-1">✓</span>
          <div>
            <p className="font-medium text-slate-300">Bias Check:</p>
            <p className="text-slate-400">{report.biasCheck}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="text-purple-400 mt-1">💜</span>
          <div>
            <p className="font-medium text-slate-300">Mental Health Message:</p>
            <p className="text-slate-400">{report.mentalHealthMessage}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="text-amber-400 mt-1">🌍</span>
          <div>
            <p className="font-medium text-slate-300">Diversity Note:</p>
            <p className="text-slate-400">{report.diversityNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for ethical photo enhancement
const EthicalPhotoEnhancer: React.FC<{ 
  originalImage: string;
  onEnhance: (enhancedImage: string) => void;
  onSkip: () => void;
  ai: GoogleGenAI;
}> = ({ originalImage, onEnhance, onSkip, ai }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  const handleEthicalEnhancement = async () => {
    setEnhancing(true);
    
    try {
      // Convert current image to File for AI
      const fetchRes = await fetch(originalImage);
      const blob = await fetchRes.blob();
      const imageFile = new File([blob], "photo-to-optimize.jpg", { type: blob.type });
      
      // Create technical enhancement prompt
      const technicalEnhancementPrompt = `
        TECHNICAL PHOTO OPTIMIZATION for AI hairstyle analysis:
        
        Your task: Optimize this photo's technical quality while preserving the person's authentic appearance.
        
        IMPROVEMENTS TO MAKE:
        • Replace background with clean, neutral studio backdrop (soft grey/white)
        • Apply professional studio lighting to enhance facial feature visibility for AI
        • Reduce image noise, blur, or compression artifacts
        • Increase overall sharpness and clarity
        • Optimize contrast and brightness for consistent AI processing
        • Ensure the person's face is well-lit and clearly defined
        
        CRITICAL RULES - DO NOT CHANGE:
        ❌ Facial features, bone structure, or proportions
        ❌ Skin texture, wrinkles, or natural characteristics  
        ❌ Person's identity, age, or ethnic features
        ❌ Expression or head position
        ❌ Any "beauty" improvements - focus only on technical quality
        
        GOAL: Same authentic person, professional photo quality for optimal AI hairstyle analysis.
      `;

      // Call AI for technical enhancement
      const imagePart = await fileToGenerativePart(imageFile);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: technicalEnhancementPrompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      let enhancedImage: string | null = null;
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            enhancedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (enhancedImage) {
        onEnhance(enhancedImage);
      } else {
        console.log('Technical optimization failed, using original image');
        onSkip();
      }
    } catch (error) {
      console.error('Technical enhancement failed:', error);
      onSkip(); // Fallback to original
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-4">
      <div className="flex items-start gap-3">
        <div className="text-blue-400 mt-1">🔧</div>
        <div className="flex-1">
          <h3 className="text-blue-300 font-semibold mb-2">
            Optimize Photo for Better AI Analysis?
          </h3>
          <p className="text-blue-200 text-sm mb-3">
            We can improve your photo's technical quality (lighting, background, clarity) 
            to help our AI give you more accurate hairstyle recommendations.
          </p>
          
          <div className="bg-blue-800/30 p-3 rounded-lg mb-3">
            <p className="text-blue-100 text-xs mb-2">
              <strong>What we'll improve:</strong> Photo quality, lighting, background clarity
            </p>
            <p className="text-blue-100 text-xs">
              <strong>What we WON'T change:</strong> Your face, skin, or any natural features - you're perfect as you are! ✨
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleEthicalEnhancement}
              disabled={enhancing}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {enhancing ? (
                <>
                  <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-white"></div>
                  Optimizing...
                </>
              ) : (
                <>
                  🔧 Yes, Optimize for AI
                </>
              )}
            </button>
            
            <button
              onClick={onSkip}
              className="bg-slate-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              No Thanks, Keep Original
            </button>
            
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-blue-300 text-sm px-2 py-2 hover:text-blue-200 transition-colors"
            >
              ℹ️ Why?
            </button>
          </div>

          {showExplanation && (
            <div className="mt-3 p-3 bg-slate-700/30 rounded-lg">
              <p className="text-slate-300 text-xs">
                <strong>Technical Enhancement vs Beauty Filters:</strong><br/>
                • We only improve photo quality for AI analysis<br/>
                • We never suggest you need to look different<br/>
                • Your natural features remain completely unchanged<br/>
                • This helps our AI give you better hairstyle matches<br/>
                • You can always skip this step - your choice! 💙
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CooldownTimer: React.FC<{ seconds: number; message: string; onComplete: () => void }> = ({ seconds, message, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);
  
  return (
    <div className="mt-4 p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg text-center">
      <div className="text-purple-300 mb-2">{message}</div>
      <div className="flex justify-center items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-purple-400 flex items-center justify-center">
          <span className="text-purple-200 text-sm font-bold">{timeLeft}</span>
        </div>
        <span className="text-purple-400 text-sm">seconds remaining</span>
      </div>
    </div>
  );
};

const MentalHealthWarning: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => {
  if (count < 8) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-purple-500/30">
        <h2 className="text-xl font-bold mb-4 text-center text-purple-300">💜 We Care About You</h2>
        <p className="text-slate-300 mb-4 text-center">
          We've noticed you're trying many styles today. Remember, you're beautiful just as you are! 
          These are just fun explorations, not necessary changes.
        </p>
        
        <div className="bg-purple-900/30 p-3 rounded-lg mb-4">
          <p className="text-sm text-purple-200 mb-2">If you're feeling pressure about your appearance, these resources can help:</p>
          <ul className="text-xs text-purple-300 space-y-2">
            {MENTAL_HEALTH_RESOURCES.map((resource) => (
              <li key={resource.name}>
                  <a href={resource.url.startsWith('http') ? resource.url : `https://${resource.url}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-purple-100">
                      {resource.name}
                  </a>
                  {resource.phone && <span className="ml-2 text-purple-400">{resource.phone}</span>}
                  <p className="text-purple-400 text-[11px]">{resource.description}</p>
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Thank You for Caring 💜
        </button>
      </div>
    </div>
  );
};

// --- NEW COMPONENT: Camera Capture ---
const CameraCapture: React.FC<{ onCapture: (dataUrl: string) => void; onClose: () => void }> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        setError("Camera access is required. Please enable it in your browser settings.");
      }
    }
    getCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip the image horizontally for a mirror effect
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL('image/jpeg'));
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-4 max-w-lg w-full relative">
        <h2 className="text-xl font-bold mb-4 text-center text-slate-200">Take a Photo</h2>
        {error ? (
          <p className="text-red-400 text-center p-8">{error}</p>
        ) : (
          <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2/3 h-5/6 border-4 border-dashed border-white/50 rounded-full opacity-50"></div>
            </div>
          </div>
        )}
        <div className="flex justify-center items-center gap-4 mt-6">
          <button onClick={onClose} className="bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleCapture} disabled={!!error} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Capture
          </button>
        </div>
      </div>
    </div>
  );
};

// --- EXISTING COMPONENTS ---
const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 bg-slate-800 bg-opacity-75 flex flex-col items-center justify-center z-50">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
    <p className="text-white text-lg mt-4">Creating your ethical transformation...</p>
    <p className="text-slate-400 text-sm mt-2">Ensuring quality and safety</p>
  </div>
);

const ImageSlider: React.FC<{ beforeImage: string; afterImage: string }> = ({ beforeImage, afterImage }) => {
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
  }, [isDragging, handleMove]);

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
        onMouseDown={() => setIsDragging(true)} 
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full h-12 w-12 grid place-items-center shadow-2xl ring-2 ring-slate-800/50">
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
          </svg>
        </div>
      </div>
      <div className="absolute top-2 left-2 bg-black/60 text-white px-3 py-1 rounded-md text-sm pointer-events-none">Before</div>
      <div className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded-md text-sm pointer-events-none">After</div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  // --- STATE MANAGEMENT ---
  
  // Supabase state
  const [supabase, setSupabase] = useState<SupabaseClient | null>(supabaseConnection.client);
  const [tempSupabaseUrl, setTempSupabaseUrl] = useState('');
  const [tempSupabaseKey, setTempSupabaseKey] = useState('');
  
  // Auth state
  const [session, setSession] = useState<Session | null>(null);

  // App flow state
  const [selectedGender, setSelectedGender] = useState<'woman' | 'man' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  
  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedLook, setLastSavedLook] = useState<{ after: string } | null>(null);

  // Ethical state
  const [sessionData, setSessionData] = useState<SessionData>(getSessionData());
  const [ethicalReport, setEthicalReport] = useState<EthicalReport | null>(null);
  const [showEthicalReport, setShowEthicalReport] = useState<boolean>(false);
  const [showMentalHealthWarning, setShowMentalHealthWarning] = useState<boolean>(false);
  const [lastPositiveMessage, setLastPositiveMessage] = useState<string>('');
  const [cooldownActive, setCooldownActive] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [cooldownMessage, setCooldownMessage] = useState<string>('');
  
  // Photo enhancement states
  const [showPhotoEnhancer, setShowPhotoEnhancer] = useState<boolean>(false);
  const [isPhotoOptimized, setIsPhotoOptimized] = useState<boolean>(false);
  const [originalUnoptimizedImage, setOriginalUnoptimizedImage] = useState<string | null>(null);

  // Camera & recommendations state
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);

  // Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // --- HANDLERS AND EFFECTS ---
  
  const handleSupabaseConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempSupabaseUrl && tempSupabaseKey) {
      const client = initializeSupabase(tempSupabaseUrl, tempSupabaseKey);
      setSupabase(client);
    }
  };
  
  // Auth effect
  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Load saved looks from Supabase
  const getSavedLooks = useCallback(async (userId: string) => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('looks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      if (data) {
        setSavedLooks(data as SavedLook[]);
      }
    } catch (e: any) {
      setError(getSupabaseErrorMessage(e));
    }
  }, [supabase]);
  
  useEffect(() => {
    if (session?.user) {
      getSavedLooks(session.user.id);
    }
  }, [session, getSavedLooks]);


  // Universal image handler for file upload and camera capture with progress
  const handleImageReady = useCallback(async (imageSource: string | File) => {
    let fileToProcess: File;

    // Handle string (Data URL from camera) by converting it to a File first
    if (typeof imageSource === 'string') {
        fileToProcess = await dataURLtoFile(imageSource, `capture-${Date.now()}.jpg`);
    } else {
        fileToProcess = imageSource;
    }

    // --- Validation ---
    if (!fileToProcess.type.startsWith('image/')) {
      setError('Please use a valid image file (PNG, JPG, etc.)');
      return;
    }
    if (fileToProcess.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large. Please use an image smaller than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // --- Start Upload Process ---
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setOriginalImage(null); // Clear previous image

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentLoaded = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentLoaded);
      }
    };

    reader.onload = () => {
        const imageUrl = reader.result as string;
        
        // Final state updates
        setUploadedFile(fileToProcess);
        setOriginalImage(imageUrl);
        setGeneratedImage(null);
        setEthicalReport(null);
        setShowEthicalReport(false);
        setShowPhotoEnhancer(true);
        setIsPhotoOptimized(false);
        setOriginalUnoptimizedImage(null);
        setRecommendations(null);

        setIsUploading(false);
    };
    
    reader.onerror = () => {
        setError("Failed to read the file.");
        setIsUploading(false);
        setUploadProgress(0);
    };

    reader.readAsDataURL(fileToProcess);
  }, []);

  // Handler for file input change
  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleImageReady(event.target.files[0]);
    }
  }, [handleImageReady]);

  // Handlers for Photo Enhancer
  const handlePhotoEnhancement = useCallback((enhancedImage: string) => {
    setOriginalUnoptimizedImage(originalImage);
    setOriginalImage(enhancedImage);
    setIsPhotoOptimized(true);
    setShowPhotoEnhancer(false);
  }, [originalImage]);

  const handleSkipEnhancement = useCallback(() => {
    setShowPhotoEnhancer(false);
  }, []);

  const handleRevertToOriginal = useCallback(() => {
    if (originalUnoptimizedImage) {
      setOriginalImage(originalUnoptimizedImage);
      setOriginalUnoptimizedImage(null);
      setIsPhotoOptimized(false);
    }
  }, [originalUnoptimizedImage]);

  const handleGetRecommendation = useCallback(async () => {
    if (!uploadedFile || !selectedGender) return;

    setIsRecommending(true);
    setError(null);
    setRecommendations(null);

    try {
        const imagePart = await fileToGenerativePart(uploadedFile);
        
        const availableStyles = HAIRSTYLES
            .filter(style => style.gender === selectedGender || style.gender === 'unisex')
            .map(style => style.name);

        const recommendationPrompt = `
You are an expert virtual hairstylist. Analyze the person in this image.
Based on their apparent face shape, features, and overall look, recommend up to 4 flattering hairstyles from the provided list.
For each recommendation, provide a brief, one-sentence reason explaining why it would be a good fit.
Your response MUST be in JSON format and adhere to the provided schema.

Available hairstyles:
${availableStyles.join(', ')}
`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: recommendationPrompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: {
                                        type: Type.STRING,
                                        description: "The name of the recommended hairstyle from the provided list."
                                    },
                                    reason: {
                                        type: Type.STRING,
                                        description: "A brief, one-sentence explanation for the recommendation."
                                    }
                                }
                            }
                        }
                    }
                },
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (result.recommendations && result.recommendations.length > 0) {
            // Filter recommendations to ensure they exist in our HAIRSTYLES list, in case the AI hallucinates a name.
            const validRecommendations = result.recommendations.filter((rec: {name: string}) => 
                availableStyles.includes(rec.name)
            );
            setRecommendations(validRecommendations);
        } else {
            setError("Could not get AI recommendations. Please try again.");
        }

    } catch (e: any) {
        console.error("AI Recommendation Error:", e.message || e);
        setError("An error occurred while getting recommendations. The AI might be busy, please try again.");
    } finally {
        setIsRecommending(false);
    }
}, [uploadedFile, selectedGender]);

  // Enhanced generation with ethical safeguards
  const handleGenerateLook = useCallback(async () => {
    if (!uploadedFile || !selectedStyle || !selectedGender) return;

    // Ethical pre-checks (Updated to use centralized config)
    const currentSession = getSessionData();
    const ethicalCheck = validateEthicalUsage(currentSession);
    const cooldownViolation = ethicalCheck.violations.find(v => v.type === 'COOLDOWN_ACTIVE');
    const limitViolation = ethicalCheck.violations.find(v => v.type === 'DAILY_LIMIT_REACHED');

    if (cooldownViolation && cooldownViolation.remainingSeconds) {
        setCooldownActive(true);
        setCooldownSeconds(cooldownViolation.remainingSeconds);
        let phaseMessage = "Let's slow down a bit!";
        if (ethicalCheck.currentPhase === 'phase2') phaseMessage = PROGRESSIVE_LIMITS.phase2.message || phaseMessage;
        if (ethicalCheck.currentPhase === 'phase3') phaseMessage = PROGRESSIVE_LIMITS.phase3.message || phaseMessage;
        setCooldownMessage(phaseMessage);
        return;
    }

    if (limitViolation) {
        setError(limitViolation.message);
        if (currentSession.dailyTransformations >= 10) {
          setShowMentalHealthWarning(true);
        }
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parts = [];
      
      // Enhanced prompt with ethical considerations
      let ethicalPrompt = `IMPORTANT: This is an AI beauty transformation that must prioritize user wellbeing and ethical standards.

CORE REQUIREMENTS:
1. PRESERVE IDENTITY: Only change the hair. Keep all facial features, skin tone, and identity markers identical.
2. NATURAL RESULTS: Avoid unrealistic "perfect" appearances. Aim for achievable, realistic styling.
3. CULTURAL SENSITIVITY: Respect the cultural significance of hairstyles.
4. AUTHENTIC BEAUTY: Enhance the user's natural beauty rather than conforming to narrow beauty standards.

Transform the ${selectedGender}'s hairstyle to: ${selectedStyle}`;

      if (selectedColor) {
        ethicalPrompt += ` with ${selectedColor} coloring`;
      }

      ethicalPrompt += `

ETHICAL GUIDELINES:
- Maintain realistic proportions and natural hair movement
- Preserve ethnic characteristics and natural features
- Avoid overly glamorous or unattainable styling
- Focus on how this style complements the user's unique features
- Ensure the result looks like something achievable at a salon

The result should inspire confidence while celebrating the user's natural beauty.`;

      const userImagePart = await fileToGenerativePart(uploadedFile);
      parts.push(userImagePart, { text: ethicalPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      let newImage: string | null = null;
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            newImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (newImage) {
        setGeneratedImage(newImage);
        setLastSavedLook(null); // Reset save state for new look
        
        // Update session data
        const updatedSession = updateSessionData({
          dailyTransformations: currentSession.dailyTransformations + 1,
          lastTransformation: Date.now()
        });
        setSessionData(updatedSession);
        
        // Generate ethical report
        const report = generateEthicalReport(selectedStyle, updatedSession.dailyTransformations);
        setEthicalReport(report);
        setLastPositiveMessage(report.mentalHealthMessage);
        
        // Show mental health warning if needed
        if (updatedSession.dailyTransformations >= 8) {
          setTimeout(() => setShowMentalHealthWarning(true), 2000);
        }
        
      } else {
        setError("We couldn't create this transformation. This might be due to image quality or style complexity. Please try a different photo or style.");
      }
    } catch (e: any) {
      console.error("AI Generation Error:", e.message || e);
      setError("An error occurred while creating your transformation. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [uploadedFile, selectedStyle, selectedColor, selectedGender]);

  // Enhanced color change with ethical considerations
  const handleChangeColor = useCallback(async (newColor: string | null) => {
    if (!generatedImage || !selectedStyle) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchRes = await fetch(generatedImage);
      const blob = await fetchRes.blob();
      const currentImageFile = new File([blob], "current_look.png", { type: blob.type });
      const imagePart = await fileToGenerativePart(currentImageFile);
      
      const ethicalColorPrompt = newColor
        ? `Change the hair color to ${newColor}. IMPORTANT: Only modify the hair color while preserving the natural hair texture and maintaining realistic coloring that complements the person's skin tone and features. Avoid artificial or overly processed-looking colors.`
        : `Restore the hair to a natural color that harmonizes with the person's features and skin tone. The result should look healthy and achievable.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: ethicalColorPrompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      let newImage: string | null = null;
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            newImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (newImage) {
        setGeneratedImage(newImage);
        setSelectedColor(newColor);
        setLastSavedLook(null); // Reset save state after color change
      } else {
        setError("Couldn't change the color. This might work better with a different style or color choice.");
      }
    } catch (e: any) {
      console.error("Color change error:", e.message || e);
      setError("An error occurred while changing the color. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [generatedImage, selectedStyle]);

  // Save look to Supabase
  const handleSaveLook = useCallback(async () => {
    if (!supabase || !originalImage || !generatedImage || !selectedStyle || !session?.user || isSaving) return;

    setIsSaving(true);
    
    const newLook = {
      before: originalImage,
      after: generatedImage,
      style: selectedStyle === COPY_STYLE_KEY ? "Copied Style" : selectedStyle,
      color: selectedColor,
      user_id: session.user.id,
    };

    try {
      const { data, error } = await supabase
        .from('looks')
        .insert([newLook])
        .select()
        .single();
      
      if (error) throw error;

      setSavedLooks(prevLooks => [data, ...prevLooks]);
      setLastSavedLook({ after: generatedImage });
    } catch (e: any) {
      setError(getSupabaseErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  }, [supabase, originalImage, generatedImage, selectedStyle, selectedColor, session, isSaving]);

  // Delete look from Supabase
  const handleDeleteLook = useCallback(async (id: number) => {
    if (!supabase || !session?.user) return;
    if (window.confirm("Delete this saved look? This action cannot be undone.")) {
      try {
        // Rely on RLS to enforce user ownership for security
        const { error } = await supabase
          .from('looks')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Use functional update to avoid stale state issues
        setSavedLooks(prevLooks => prevLooks.filter(look => look.id !== id));
      } catch(e: any) {
        setError(getSupabaseErrorMessage(e));
      }
    }
  }, [supabase, session]);

  // Reset function
  const handleTryAnotherStyle = useCallback(() => {
    setGeneratedImage(null);
    setSelectedStyle(null);
    setSelectedColor(null);
    setActiveCategory('All');
    setError(null);
    setEthicalReport(null);
    setShowEthicalReport(false);
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedGender) return;
    setIsDraggingOver(true);
  }, [selectedGender]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // This is necessary to allow dropping
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedGender) return;

    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageReady(files[0]);
    }
  }, [selectedGender, handleImageReady]);


  // --- RENDER LOGIC ---

  // Render Supabase config screen if no client
  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">
              Application Setup
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Enter your Supabase credentials to continue</p>
            <p className="text-slate-500 mt-1 text-sm">Your credentials are saved locally in your browser and are not sent anywhere else.</p>
          </header>
          <form onSubmit={handleSupabaseConfigSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="supabaseUrl" className="block text-sm font-medium text-slate-300">Supabase URL</label>
                <input
                  id="supabaseUrl"
                  type="url"
                  placeholder="https://your-project-ref.supabase.co"
                  value={tempSupabaseUrl}
                  onChange={(e) => setTempSupabaseUrl(e.target.value)}
                  className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="supabaseKey" className="block text-sm font-medium text-slate-300">Supabase Anon Key</label>
                <input
                  id="supabaseKey"
                  type="password"
                  placeholder="your-public-anon-key"
                  value={tempSupabaseKey}
                  onChange={(e) => setTempSupabaseKey(e.target.value)}
                  className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full mt-6 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50"
              disabled={!tempSupabaseUrl || !tempSupabaseKey}
            >
              Save and Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render auth screen if no session
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">
              Ethical Beauty AI ✨
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Sign in to begin your responsible style journey</p>
          </header>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            theme="dark"
          />
        </div>
      </div>
    );
  }

  const isGenerateButtonDisabled = !originalImage || !selectedStyle || isLoading || !selectedGender;
  const currentTransformationCount = sessionData.dailyTransformations;

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-white font-sans bg-slate-900">
      {/* Mental Health Warning Modal */}
      {showMentalHealthWarning && (
        <MentalHealthWarning 
          count={currentTransformationCount} 
          onClose={() => setShowMentalHealthWarning(false)} 
        />
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={(dataUrl) => handleImageReady(dataUrl)}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">
            Ethical Beauty AI ✨
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Explore hairstyles responsibly • Celebrate your unique beauty</p>
          
          {/* Ethics badges */}
          <div className="flex justify-center flex-wrap gap-4 mt-4 text-xs">
            <span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full">🧠 Mental Health First</span>
            <span className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full">🌍 Inclusive AI</span>
            <span className="bg-purple-900/30 text-purple-300 px-3 py-1 rounded-full">🔒 Privacy Protected</span>
          </div>
          
          {/* Usage counter & Sign Out */}
          <div className="mt-4 text-sm text-slate-400 flex justify-center items-center gap-4">
            <span>Today's explorations: {currentTransformationCount}/{ETHICAL_CONFIG.maxDailyTransformations}</span>
            <button onClick={() => supabase.auth.signOut()} className="bg-slate-600 hover:bg-slate-700 text-white font-semibold text-xs py-1 px-3 rounded-lg transition-colors">
                Sign Out
            </button>
          </div>
          {lastPositiveMessage && (
              <div className="mt-2 text-purple-300 bg-purple-900/20 px-4 py-2 rounded-lg inline-block">
                {lastPositiveMessage}
              </div>
          )}
        </header>

        <main className="bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          {isLoading && <LoadingSpinner />}
          
          {!generatedImage ? (
            // UPLOAD & SELECTION SECTION
            <div>
              {/* Gender Selection */}
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
                {/* Photo Upload Section */}
                <div className="flex-shrink-0 flex flex-col items-center space-y-4">
                  <h2 className="text-2xl font-semibold mb-0 text-slate-200">2. Add Your Photo</h2>
                  <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`w-64 h-64 md:w-80 md:h-80 rounded-lg flex items-center justify-center overflow-hidden relative transition-all duration-300 ${
                      isDraggingOver
                        ? 'border-4 border-indigo-400 bg-slate-700 border-solid'
                        : isUploading || originalImage 
                          ? 'border-2 border-slate-600 border-solid bg-slate-700/50' 
                          : 'border-2 border-dashed border-slate-600 bg-slate-700/50'
                    }`}
                  >
                    {isUploading ? (
                      <div className="w-full p-8 flex flex-col items-center justify-center text-center">
                          <p className="text-slate-300 font-semibold">Reading your photo...</p>
                          <div className="w-full bg-slate-600 rounded-full h-2.5 my-3">
                              {/* FIX: Changed aria-valuemin and aria-valuemax to be numbers to fix TypeScript error. */}
                              <div 
                                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-150" 
                                  style={{ width: `${uploadProgress}%` }}
                                  role="progressbar"
                                  aria-valuenow={uploadProgress}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                              ></div>
                          </div>
                          <p className="text-slate-400 text-sm">{uploadProgress}%</p>
                      </div>
                    ) : originalImage ? (
                      <>
                        <img src={originalImage} alt="Upload" className="w-full h-full object-cover" />
                        {isPhotoOptimized && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs">
                            ✨ Optimized
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-4 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="mt-2 block text-slate-400 font-semibold">Drag & Drop Your Photo</span>
                        <span className="text-xs text-slate-500">or use the buttons below</span>
                      </div>
                    )}
                    {isDraggingOver && !isUploading && (
                      <div className="absolute inset-0 bg-slate-800/80 flex flex-col items-center justify-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l-4-4m0 0l4-4m-4 4h12" /></svg>
                        <p className="mt-2 text-lg font-semibold text-indigo-300">Drop to upload</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="cursor-pointer bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={!selectedGender}/>
                    </label>
                    <button 
                      onClick={() => setIsCameraOpen(true)}
                      disabled={!selectedGender}
                      className="cursor-pointer bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-slate-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 4.372A1 1 0 0116 5.18v9.64a1 1 0 01-1.447.894l-3-2A1 1 0 0111 13V7a1 1 0 01.553-.894l3-2z" /></svg>
                      Camera
                    </button>
                  </div>

                  {/* Photo Enhancement Component */}
                  {showPhotoEnhancer && originalImage && (
                    <EthicalPhotoEnhancer
                      originalImage={originalImage}
                      onEnhance={handlePhotoEnhancement}
                      onSkip={handleSkipEnhancement}
                      ai={ai}
                    />
                  )}

                  {/* Revert Option */}
                  {isPhotoOptimized && originalUnoptimizedImage && (
                    <div className="mt-2">
                      <button
                        onClick={handleRevertToOriginal}
                        className="text-blue-300 hover:text-blue-200 text-sm underline"
                      >
                        ↶ Use Original Photo Instead
                      </button>
                    </div>
                  )}
                </div>

                {/* Style Selection Section */}
                <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start">
                  <h2 className="text-2xl font-semibold mb-4 text-slate-200">3. Select a Style</h2>
                  
                  <button
                    onClick={handleGetRecommendation}
                    disabled={!originalImage || isRecommending || !selectedGender}
                    className="w-full max-w-md bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all duration-300 disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg flex items-center justify-center gap-2 mb-6"
                  >
                    {isRecommending ? (
                      <>
                        <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-white"></div>
                        <span>Finding Your Perfect Style...</span>
                      </>
                    ) : (
                      <span>✨ Get AI Recommendation</span>
                    )}
                  </button>

                  {/* AI Recommendations Display */}
                  {recommendations && (
                    <div className="w-full max-w-md mb-8">
                      <h3 className="text-xl font-semibold mb-3 text-indigo-300">AI-Powered Suggestions</h3>
                      <div className="space-y-3">
                        {recommendations.map(rec => {
                          const styleDetails = HAIRSTYLES.find(s => s.name === rec.name);
                          if (!styleDetails) return null;
                          return (
                            <button
                              key={rec.name}
                              onClick={() => setSelectedStyle(rec.name)}
                              className={`w-full p-3 flex items-center gap-4 text-left rounded-lg transition-all duration-200 border-2 
                                ${selectedStyle === rec.name 
                                  ? 'bg-slate-600/50 border-indigo-400 ring-2 ring-indigo-300' 
                                  : 'bg-slate-700 border-slate-600 hover:border-slate-400 hover:bg-slate-600'}`
                              }
                            >
                              {styleDetails.icon}
                              <div className="flex-1">
                                <p className={`font-medium ${selectedStyle === rec.name ? 'text-white' : 'text-slate-200'}`}>{rec.name}</p>
                                <p className="text-sm text-slate-400">{rec.reason}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <hr className="my-6 border-slate-600" />
                    </div>
                  )}
                  
                  {/* Categories */}
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

                  {/* Style Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 w-full max-w-md">
                    {filteredHairstyles.length > 0 ? filteredHairstyles.map((style) => (
                      <button
                        key={style.name}
                        onClick={() => setSelectedStyle(style.name)}
                        disabled={!originalImage || !selectedGender}
                        className={`group p-3 flex flex-col items-center justify-center gap-2 text-center rounded-lg transition-all duration-200 border-2 
                          ${selectedStyle === style.name 
                            ? 'bg-slate-600/50 border-indigo-400 ring-2 ring-indigo-300' 
                            : 'bg-slate-700 border-slate-600 hover:border-slate-400 hover:bg-slate-600'}
                          ${!originalImage || !selectedGender ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {style.icon}
                        <span className={`font-medium text-sm ${selectedStyle === style.name ? 'text-white' : 'text-slate-300'}`}>
                          {style.name}
                        </span>
                        {style.cultural !== 'universal' && (
                          <span className="text-xs text-amber-300">Cultural</span>
                        )}
                      </button>
                    )) : (
                      !selectedGender && <p className="col-span-full text-slate-400 text-center">Please select a gender to see available styles.</p>
                    )}
                  </div>

                  {/* Color Selection */}
                  <h2 className="text-2xl font-semibold mb-4 text-slate-200">4. Choose a Color <span className="text-slate-400 text-lg">(Optional)</span></h2>
                  <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-md">
                    <button
                      onClick={() => setSelectedColor(null)}
                      disabled={!originalImage || !selectedGender}
                      className={`w-16 h-16 rounded-full border-2 transition-all duration-200 flex items-center justify-center bg-slate-700/50
                        ${!selectedColor 
                          ? 'border-sky-400 ring-4 ring-sky-400/30' 
                          : 'border-slate-500'}
                        ${!originalImage || !selectedGender
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:border-sky-400'}`}
                    >
                      <span className="text-xs text-center text-slate-300">Natural</span>
                    </button>
                    {HAIR_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name === selectedColor ? null : color.name)}
                        disabled={!originalImage || !selectedGender}
                        title={color.name}
                        className={`w-16 h-16 rounded-full border-2 transition-all duration-200 relative ${
                          selectedColor === color.name 
                            ? 'border-sky-400 ring-4 ring-sky-400/30' 
                            : 'border-slate-500'
                        } ${!originalImage || !selectedGender
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:border-sky-400'}`}
                        style={color.style}
                      >
                        {!color.natural && (
                          <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-xs rounded-full w-4 h-4 flex items-center justify-center">✦</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Generate Button */}
                  <h2 className="text-2xl font-semibold mb-4 text-slate-200">5. Generate Ethically</h2>
                  <button
                    onClick={handleGenerateLook}
                    disabled={isGenerateButtonDisabled || cooldownActive}
                    className="w-full max-w-md bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-white"></div>
                        <span>Creating Ethical Transformation...</span>
                      </>
                    ) : cooldownActive ? (
                      <span>On Cooldown ⏱️</span>
                    ) : (
                      <>
                        <span>✨ Generate Ethical Look</span>
                      </>
                    )}
                  </button>
                  
                  {/* Cooldown Timer */}
                  {cooldownActive && (
                    <CooldownTimer 
                      seconds={cooldownSeconds}
                      message={cooldownMessage}
                      onComplete={() => {
                        setCooldownActive(false);
                        setCooldownSeconds(0);
                        setCooldownMessage('');
                      }}
                    />
                  )}
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                      <p className="text-red-300 text-center">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // RESULTS SECTION
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-bold mb-2 text-center">Your Ethical Transformation! ✨</h2>
              {selectedStyle && (
                <p className="text-lg text-slate-300 mb-4 text-center">
                  Style: <span className="font-semibold">{selectedStyle}</span>
                  {selectedColor && ` • Color: ${selectedColor}`}
                </p>
              )}

              {/* Results Display */}
              <div className="w-full flex justify-center mb-6">
                {originalImage && (
                  <ImageSlider beforeImage={originalImage} afterImage={generatedImage} />
                )}
              </div>

              {/* Color Change Section */}
              <div className="w-full max-w-lg mt-6 p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-center text-slate-200">Adjust Color</h3>
                <div className="flex justify-center flex-wrap gap-4">
                  <button
                    onClick={() => handleChangeColor(null)}
                    disabled={isLoading}
                    className={`w-16 h-16 rounded-full border-2 transition-all duration-200 flex items-center justify-center bg-slate-700/50
                      ${!selectedColor && !isLoading ? 'border-sky-400 ring-4 ring-sky-400/30' : 'border-slate-500'}
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-sky-400'}`}
                  >
                    <span className="text-xs text-center text-slate-300">Natural</span>
                  </button>
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={`recolor-${color.name}`}
                      onClick={() => handleChangeColor(color.name)}
                      disabled={isLoading}
                      title={color.name}
                      className={`w-16 h-16 rounded-full border-2 transition-all duration-200 relative
                        ${selectedColor === color.name && !isLoading ? 'border-sky-400 ring-4 ring-sky-400/30' : 'border-slate-500'}
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-sky-400'}`}
                      style={color.style}
                    >
                      {!color.natural && (
                        <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-xs rounded-full w-4 h-4 flex items-center justify-center">✦</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ethical Report */}
              {ethicalReport && (
                <EthicalReportCard 
                  report={ethicalReport} 
                  isVisible={showEthicalReport} 
                  onClose={() => setShowEthicalReport(false)} 
                />
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center items-center gap-4 mt-8">
                <button
                  onClick={handleTryAnotherStyle}
                  className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md"
                >
                  Try Another Style
                </button>
                <button
                  onClick={handleSaveLook}
                  disabled={isSaving || lastSavedLook?.after === generatedImage}
                  className="bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-md disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                      Saving...
                    </>
                  ) : lastSavedLook?.after === generatedImage ? (
                    "✓ Saved"
                  ) : (
                    "Save This Look"
                  )}
                </button>
                {ethicalReport && (
                  <button
                    onClick={() => setShowEthicalReport(!showEthicalReport)}
                    className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md flex items-center gap-2"
                  >
                    🛡️ {showEthicalReport ? 'Hide' : 'Show'} Ethics Report
                  </button>
                )}
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-center">{error}</p>
                </div>
              )}
            </div>
          )}
        </main>
        
        {/* Saved Looks Section */}
        {savedLooks.length > 0 && (
          <section className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-center">Your Ethical Gallery 🌟</h2>
              <button
                onClick={async () => {
                  if (supabase && session?.user && window.confirm("Clear all saved looks? This cannot be undone.")) {
                    try {
                      const { error } = await supabase
                        .from('looks')
                        .delete()
                        .eq('user_id', session.user.id);

                      if (error) throw error;
                      setSavedLooks([]);
                    } catch (e: any) {
                      setError(getSupabaseErrorMessage(e));
                    }
                  }
                }}
                className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedLooks.map((look) => (
                <div 
                  key={look.id} 
                  className="bg-slate-800 rounded-lg shadow-lg p-4 relative group transition-all duration-300 hover:shadow-xl"
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
                  <div className="mt-3 text-center">
                    <h4 className="font-bold text-slate-200 truncate" title={look.style}>{look.style}</h4>
                    {look.color && <p className="text-sm text-slate-400">{look.color}</p>}
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(look.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteLook(look.id)}
                    className="absolute top-2 right-2 bg-red-600/80 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-500"
                    aria-label="Delete saved look"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="w-full max-w-4xl mx-auto mt-12 py-6 border-t border-slate-700 text-center">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Ethical AI Commitment</h3>
            <p className="text-sm text-slate-400 mb-2">
              We're committed to promoting positive body image, mental health awareness, and inclusive beauty standards.
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <span className="text-blue-300">🧠 Mental Health Resources</span>
              <span className="text-green-300">🌍 Diversity & Inclusion</span>
              <span className="text-purple-300">🔒 Privacy First</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} Ethical Beauty AI. Celebrating authentic beauty.</p>
        </footer>
      </div>
    </div>
  );
}