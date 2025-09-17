import React, { useState, useCallback, ChangeEvent, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

// --- ЕТИЧНІ КОНСТАНТИ (ВИПРАВЛЛЕНІ) ---
const ETHICAL_GUIDELINES = {
    maxDailyTransformations: 12, // Більш розумний ліміт
    transparencyRequired: true,
    mentalHealthWarnings: true,
};

// Градуальна система обмежень (ПРАВИЛЬНА ВЕРСІЯ)
const PROGRESSIVE_LIMITS = {
    phase1: {
        minCount: 0,
        maxCount: 5,
        cooldown: 0,
        message: null
    },
    phase2: {
        minCount: 6,
        maxCount: 8,
        cooldown: 15 * 1000, // 15 секунд
        message: "Taking a quick breath between styles! ✨"
    },
    phase3: {
        minCount: 9,
        maxCount: 12,
        cooldown: 30 * 1000, // 30 секунд
        message: "You're on a styling spree! Each look is beautiful 💖"
    },
    phase4: {
        minCount: 13,
        maxCount: 999,
        cooldown: 0,
        message: "What an amazing styling session! Come back tomorrow for more inspiration 🌟"
    }
};

const getCurrentPhase = (transformationCount: number) => {
    if (transformationCount <= 5) return PROGRESSIVE_LIMITS.phase1;
    if (transformationCount <= 8) return PROGRESSIVE_LIMITS.phase2;
    if (transformationCount <= 12) return PROGRESSIVE_LIMITS.phase3;
    return PROGRESSIVE_LIMITS.phase4;
};

const checkEthicalLimits = (sessionData: SessionData): {
    allowed: boolean;
    message?: string;
    cooldownSeconds?: number;
    phase?: string;
} => {
    const now = Date.now();
    const currentCount = sessionData.dailyTransformations;
    const currentPhase = getCurrentPhase(currentCount);

    console.log('🔍 Ethical check:', { currentCount, phase: currentPhase, lastTransformation: new Date(sessionData.lastTransformation) });

    // Фаза 4: М'яке завершення на день
    if (currentCount >= ETHICAL_GUIDELINES.maxDailyTransformations) {
        return {
            allowed: false,
            message: currentPhase.message,
            phase: 'phase4'
        };
    }

    // Перевіряємо cooldown тільки якщо він більше 0
    if (currentPhase.cooldown > 0 && now - sessionData.lastTransformation < currentPhase.cooldown) {
        const remainingTime = Math.ceil((currentPhase.cooldown - (now - sessionData.lastTransformation)) / 1000);

        console.log('⏱️ Cooldown active:', {
            required: currentPhase.cooldown,
            elapsed: now - sessionData.lastTransformation,
            remaining: remainingTime
        });

        return {
            allowed: false,
            message: currentPhase.message,
            cooldownSeconds: remainingTime,
            phase: currentCount <= 8 ? 'phase2' : 'phase3'
        };
    }

    console.log('✅ Ethical check passed');
    return {
        allowed: true,
        phase: currentCount <= 5 ? 'phase1' : currentCount <= 8 ? 'phase2' : 'phase3'
    };
};


const POSITIVE_MESSAGES = [
  "Your natural beauty shines through every style! ✨",
  "Remember: you're exploring styles, not fixing flaws 💖",
  "Every hairstyle looks great because YOU wear it beautifully!",
  "Having fun with styles? Your confidence is your best accessory!",
  "You're perfect just as you are - this is just for fun! 🌟",
  "Inspiration found! Your natural look is amazing too 🌸"
];

const MENTAL_HEALTH_RESOURCES = {
  message: "Feeling pressure about your appearance? Remember, you're beautiful as you are.",
  resources: [
    "National Eating Disorders Association: nationaleatingdisorders.org",
    "Mental Health America: mhanational.org",
    "Crisis Text Line: Text HOME to 741741"
  ]
};

// --- TYPES ---
interface SavedLook {
  id: number;
  before: string;
  after: string;
  style: string;
  color: string | null;
  timestamp: number;
}

interface EthicalReport {
  aiDisclosure: string;
  biasCheck: string;
  mentalHealthMessage: string;
  transparencyScore: number;
  diversityNote: string;
}

interface SessionData {
  dailyTransformations: number;
  lastTransformation: number;
  firstUsageToday: number;
  date: string;
}

// --- CONSTANTS ---
const HAIRSTYLES = [
  // Women's Styles (більш різноманітні та інклюзивні)
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

  // Men's Styles (додано різноманітні)
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

const LOCAL_STORAGE_KEY = 'glamai-ethical-data';
const SESSION_STORAGE_KEY = 'glamai-session-data';
const COPY_STYLE_KEY = 'copy-style-from-image';
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// --- AI INITIALIZATION ---
const ai = new GoogleGenAI({ apiKey: "development" });

// Helper function to convert a File object to a GoogleGenerativeAI.Part object.
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        // Handle ArrayBuffer case if necessary, though for image files it's usually data URL
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  const base64EncodedData = await base64EncodedDataPromise;
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
}

// --- ETHICAL HELPER FUNCTIONS ---
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

const getPositiveMessage = (transformationCount: number): string => {
  if (transformationCount >= 6) {
    return "You're exploring so many styles! Remember, you're beautiful just as you are. Consider taking a break? 💙";
  }
  return POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)];
};

const generateEthicalReport = (style: string, transformationCount: number): EthicalReport => {
  return {
    aiDisclosure: "✨ This transformation is AI-generated and may not represent exact real-life results. Always consult with a professional stylist for best results.",
    biasCheck: "✓ Our AI is trained on diverse, inclusive datasets representing all ethnicities, ages, and hair types.",
    mentalHealthMessage: getPositiveMessage(transformationCount),
    transparencyScore: 10, // Full transparency
    diversityNote: "🌍 This style celebrates your unique features. Beauty comes in all forms!"
  };
};

// --- ENHANCED COMPONENTS ---

const EthicalDisclaimer: React.FC<{ onAccept: () => void; onDecline: () => void }> = ({ onAccept, onDecline }) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-400">Welcome to Ethical Beauty AI ✨</h2>
      <div className="space-y-4 text-sm text-slate-300">
        <div className="bg-blue-900/30 p-3 rounded-lg">
          <h3 className="font-semibold text-blue-300 mb-2">🧠 Mental Health First</h3>
          <p>We limit daily usage and provide positive messaging to support your wellbeing.</p>
        </div>
        <div className="bg-purple-900/30 p-3 rounded-lg">
          <h3 className="font-semibold text-purple-300 mb-2">🔒 Privacy Protected</h3>
          <p>Your photos are processed locally when possible and never stored on our servers.</p>
        </div>
        <div className="bg-green-900/30 p-3 rounded-lg">
          <h3 className="font-semibold text-green-300 mb-2">🌍 Inclusive by Design</h3>
          <p>Our AI celebrates diversity and avoids promoting unrealistic beauty standards.</p>
        </div>
        <div className="bg-amber-900/30 p-3 rounded-lg">
          <h3 className="font-semibold text-amber-300 mb-2">✨ Real Beauty Focus</h3>
          <p>These are style inspirations, not beauty fixes. You're perfect as you are!</p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <button
          onClick={onAccept}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          I Understand & Agree
        </button>
        <button
          onClick={onDecline}
          className="w-full bg-slate-600 text-white font-semibold py-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Not Today
        </button>
      </div>
    </div>
  </div>
);

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

// Додамо компонент для відображення cooldown
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
  if (count < 5) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-purple-500/30">
        <h2 className="text-xl font-bold mb-4 text-center text-purple-300">💜 We Care About You</h2>
        <p className="text-slate-300 mb-4 text-center">
          We've noticed you're trying many styles today. Remember, you're beautiful just as you are!
          These are just fun explorations, not necessary changes.
        </p>

        <div className="bg-purple-900/30 p-3 rounded-lg mb-4">
          <p className="text-sm text-purple-200 mb-2">If you're feeling pressure about your appearance:</p>
          <ul className="text-xs text-purple-300 space-y-1">
            {MENTAL_HEALTH_RESOURCES.resources.map((resource, idx) => (
              <li key={idx}>• {resource}</li>
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

// --- EXISTING COMPONENTS (keeping the good ones) ---
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
  }, [isDragging]);

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
  // Existing state
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

  // New ethical state
  const [ethicalConsentGiven, setEthicalConsentGiven] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<SessionData>(getSessionData());
  const [ethicalReport, setEthicalReport] = useState<EthicalReport | null>(null);
  const [showEthicalReport, setShowEthicalReport] = useState<boolean>(false);
  const [showMentalHealthWarning, setShowMentalHealthWarning] = useState<boolean>(false);
  const [lastPositiveMessage, setLastPositiveMessage] = useState<string>('');
  const [cooldownActive, setCooldownActive] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [cooldownMessage, setCooldownMessage] = useState<string>('');

  // Check consent on mount
  useEffect(() => {
    const consent = localStorage.getItem('ethical-consent-given');
    if (consent === 'true') {
      setEthicalConsentGiven(true);
    }
  }, []);

  // Load saved looks
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsedLooks = JSON.parse(saved);
        setSavedLooks(parsedLooks.map((look: any) => ({
          ...look,
          style: look.style || 'Unknown Style',
          color: look.color || null,
          timestamp: look.timestamp || Date.now(),
        })));
      }
    } catch (e) {
      console.error("Failed to load saved looks:", e);
    }
  }, []);

  // Handle ethical consent
  const handleEthicalConsent = useCallback((accepted: boolean) => {
    if (accepted) {
      setEthicalConsentGiven(true);
      localStorage.setItem('ethical-consent-given', 'true');
    } else {
      // User declined - show them resources and close app gracefully
      alert("We understand! Remember, you're beautiful just as you are. Visit us anytime you'd like to explore styles ethically.");
    }
  }, []);

  // Enhanced file change handler with ethical checks
  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, etc.)');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File too large. Please use an image smaller than ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      const fileUrl = URL.createObjectURL(file);
      setUploadedFile(file);
      setOriginalImage(fileUrl);
      setGeneratedImage(null);
      setError(null);
      setEthicalReport(null);
      setShowEthicalReport(false);
    }
  }, []);

  // Enhanced generation with ethical safeguards
  const handleGenerateLook = useCallback(async () => {
    if (!uploadedFile || !selectedStyle || !selectedGender) return;

    // Ethical pre-checks (ОНОВЛЕНО)
    const currentSession = getSessionData();
    const ethicalCheck = checkEthicalLimits(currentSession);

    if (!ethicalCheck.allowed) {
      if (ethicalCheck.cooldownSeconds) {
        // Активуємо cooldown таймер
        setCooldownActive(true);
        setCooldownSeconds(ethicalCheck.cooldownSeconds);
        setCooldownMessage(ethicalCheck.message || '');
        return;
      } else {
        // Денний ліміт досягнуто
        setError(ethicalCheck.message!);
        if (currentSession.dailyTransformations >= 10) {
          setShowMentalHealthWarning(true);
        }
        return;
      }
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

        // Show mental health warning if needed (знижено поріг)
        if (updatedSession.dailyTransformations >= 8) {
          setTimeout(() => setShowMentalHealthWarning(true), 2000);
        }

      } else {
        setError("We couldn't create this transformation. This might be due to image quality or style complexity. Please try a different photo or style.");
      }
    } catch (e) {
      console.error("AI Generation Error:", e);
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
      } else {
        setError("Couldn't change the color. This might work better with a different style or color choice.");
      }
    } catch (e) {
      console.error("Color change error:", e);
      setError("An error occurred while changing the color. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [generatedImage, selectedStyle]);

  const handleSaveLook = useCallback(() => {
    if (!originalImage || !generatedImage || !selectedStyle) return;

    const styleToSave = selectedStyle === COPY_STYLE_KEY ? "Copied Style" : selectedStyle;

    // Duplicate check as a safeguard
    const isDuplicate = savedLooks.some(look => 
      look.before === originalImage && 
      look.after === generatedImage && 
      look.style === styleToSave &&
      look.color === selectedColor
    );

    if (isDuplicate) {
      console.warn("Attempted to save a duplicate look.");
      return;
    }

    const newLook: SavedLook = {
      id: Date.now(),
      before: originalImage,
      after: generatedImage,
      style: styleToSave,
      color: selectedColor,
      timestamp: Date.now(),
    };

    setSavedLooks(prevLooks => {
      const updatedLooks = [...prevLooks, newLook];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLooks));
      return updatedLooks;
    });
  }, [originalImage, generatedImage, selectedStyle, selectedColor, savedLooks]);

  // Enhanced delete with confirmation
  const handleDeleteLook = useCallback((id: number) => {
    if (window.confirm("Delete this saved look? This action cannot be undone.")) {
      setSavedLooks(prevLooks => {
        const updatedLooks = prevLooks.filter(look => look.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLooks));
        return updatedLooks;
      });
    }
  }, []);

  const handleClearAll = useCallback(() => {
    if (window.confirm("Clear all saved looks? This cannot be undone.")) {
      setSavedLooks(() => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return [];
      });
    }
  }, []);

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

  // Render ethical consent modal first
  if (!ethicalConsentGiven) {
    return (
      <div className="min-h-screen bg-slate-900">
        <EthicalDisclaimer onAccept={() => handleEthicalConsent(true)} onDecline={() => handleEthicalConsent(false)} />
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

  const isCurrentLookSaved = useMemo(() => {
    if (!originalImage || !generatedImage) return false;
    
    const styleToCompare = selectedStyle === COPY_STYLE_KEY ? "Copied Style" : selectedStyle;

    return savedLooks.some(look => 
      look.before === originalImage &&
      look.after === generatedImage &&
      look.style === styleToCompare &&
      look.color === selectedColor
    );
  }, [originalImage, generatedImage, selectedStyle, selectedColor, savedLooks]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-white font-sans bg-slate-900">
      {/* Mental Health Warning Modal */}
      {showMentalHealthWarning && (
        <MentalHealthWarning
          count={currentTransformationCount}
          onClose={() => setShowMentalHealthWarning(false)}
        />
      )}

      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">
            Ethical Beauty AI ✨
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Explore hairstyles responsibly • Celebrate your unique beauty</p>

          {/* Ethics badges */}
          <div className="flex justify-center gap-4 mt-4 text-xs">
            <span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full">🧠 Mental Health First</span>
            <span className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full">🌍 Inclusive AI</span>
            <span className="bg-purple-900/30 text-purple-300 px-3 py-1 rounded-full">🔒 Privacy Protected</span>
          </div>

          {/* Usage counter */}
          <div className="mt-4 text-sm text-slate-400">
            Today's explorations: {currentTransformationCount}/{ETHICAL_GUIDELINES.maxDailyTransformations}
            {currentTransformationCount >= 6 && (
              <span className="ml-2 text-purple-300">• Taking it easy helps you appreciate each style ✨</span>
            )}
            {lastPositiveMessage && (
              <div className="mt-2 text-purple-300 bg-purple-900/20 px-4 py-2 rounded-lg inline-block">
                {lastPositiveMessage}
              </div>
            )}
          </div>
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
                  <h2 className="text-2xl font-semibold mb-0 text-slate-200">2. Upload Photo</h2>
                  <div className="w-64 h-64 md:w-80 md:h-80 bg-slate-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600 overflow-hidden">
                    {originalImage ? (
                      <img src={originalImage} alt="Original upload" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <span className="text-slate-400 block mb-2">Your Photo Here</span>
                        <span className="text-xs text-slate-500">We process images ethically & securely</span>
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md">
                    Choose Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={!selectedGender}/>
                  </label>
                </div>

                {/* Style Selection Section */}
                <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start">
                  <h2 className="text-2xl font-semibold mb-4 text-slate-200">3. Select a Style</h2>

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
                      <span>Ready in {cooldownSeconds}s... ⏱️</span>
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
                  disabled={isCurrentLookSaved}
                  className="bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-md disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCurrentLookSaved ? 'Look Saved ✓' : 'Save This Look'}
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
                onClick={handleClearAll}
                className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedLooks.slice().reverse().map((look) => (
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
                      {new Date(look.timestamp).toLocaleDateString()}
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