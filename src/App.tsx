import React, { useState, useCallback, ChangeEvent, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Session } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { CULTURAL_SENSITIVITY_GUIDELINES, validateEthicalUsage, ETHICAL_CONFIG, POSITIVE_AFFIRMATIONS, MENTAL_HEALTH_RESOURCES, PROGRESSIVE_LIMITS, detectPotentialBias } from './ethical-config';
import { supabase } from './supabaseClient';

// Use environment variable from Vite, this is the correct way
// Powered by Nano Banano - the most advanced AI for hairstyle transformations!
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

// --- TYPES, CONSTANTS, HELPERS, and SUB-COMPONENTS ---
interface SavedLook {
  id: string;
  user_id: string;
  original_image_url: string;
  generated_image_url: string;
  prompt: string;
  created_at: string;
}

const STYLE_PROMPTS = {
  "woman": {
    "Wolf Cut": "A woman with a trendy wolf cut hairstyle - layered, face-framing cut with choppy ends and textured layers, keeping the rest of her appearance exactly the same.",
    "Curtain Bangs": "A woman with curtain bangs hairstyle - face-framing bangs that part naturally in the middle like curtains, keeping the rest of her appearance exactly the same.",
    "Shag Cut": "A woman with a textured shag cut hairstyle - messy, layered cut with choppy ends and volume, keeping the rest of her appearance exactly the same.",
    "Lob": "A woman with a long bob (lob) hairstyle - shoulder-length bob cut with subtle layers, keeping the rest of her appearance exactly the same.",
    "Mullet": "A woman with a modern mullet hairstyle - short at the front and sides, longer at the back, keeping the rest of her appearance exactly the same.",
    "French Crop": "A woman with a French crop hairstyle - short, textured crop with longer fringe, keeping the rest of her appearance exactly the same.",
    "Pixie with Curtains": "A woman with a pixie cut with curtain bangs hairstyle - short pixie cut with face-framing curtain bangs, keeping the rest of her appearance exactly the same.",
    "Balayage Waves": "A woman with balayage waves hairstyle - natural, sun-kissed waves with dimensional color, keeping the rest of her appearance exactly the same."
  },
  "man": {
    "French Crop": "A man with a French crop hairstyle - short on the sides and back, slightly longer textured top, keeping the rest of his appearance exactly the same.",
    "Caesar Cut": "A man with a Caesar cut hairstyle - horizontal fringe across forehead, short sides and back, keeping the rest of his appearance exactly the same.",
    "Pompadour": "A man with a pompadour hairstyle - high, voluminous top swept back, short sides, keeping the rest of his appearance exactly the same.",
    "Undercut": "A man with an undercut hairstyle - shaved underneath, longer hair on top, keeping the rest of his appearance exactly the same.",
    "Quiff": "A man with a quiff hairstyle - styled up fringe, short sides and back, keeping the rest of his appearance exactly the same.",
    "Curtains": "A man with curtains hairstyle - longer hair parted in the middle like curtains, keeping the rest of his appearance exactly the same.",
    "Faux Hawk": "A man with a faux hawk hairstyle - shaved sides, strip of longer hair down the center, keeping the rest of his appearance exactly the same.",
    "Slicked Back": "A man with slicked back hairstyle - all hair combed back smoothly with product, keeping the rest of his appearance exactly the same."
  }
};

const STYLE_CATEGORIES = {
    "Trending Now": ["Wolf Cut", "Curtain Bangs", "Shag Cut", "French Crop", "Undercut", "Lob", "Caesar Cut", "Balayage Waves"],
    "Classic Cuts": ["Lob", "Caesar Cut", "Pompadour", "Slicked Back", "Quiff"],
    "Edgy & Bold": ["Mullet", "Faux Hawk", "Undercut", "Shag Cut"],
    "Face-Framing": ["Curtain Bangs", "Curtains", "Pixie with Curtains", "Wolf Cut"],
    "Textured Styles": ["Shag Cut", "Balayage Waves", "French Crop", "Pompadour"]
};

// A more complex style selector
const StyleSelector: React.FC<{
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  selectedStyle: string | null;
  setSelectedStyle: (style: string) => void;
}> = ({ activeCategory, setActiveCategory, selectedStyle, setSelectedStyle }) => {
    return (
        <div>
            <div className="flex space-x-2 mb-4 overflow-x-auto">
                {Object.keys(STYLE_CATEGORIES).map(category => (
                    <button
                        key={category}
                        className={`px-4 py-2 text-sm rounded-full transition-colors whitespace-nowrap ${activeCategory === category ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                        onClick={() => setActiveCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {STYLE_CATEGORIES[activeCategory as keyof typeof STYLE_CATEGORIES].map(style => (
                    <button
                        key={style}
                        className={`p-4 rounded-lg text-center transition-colors ${selectedStyle === style ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                        onClick={() => setSelectedStyle(style)}
                    >
                        {style}
                    </button>
                ))}
            </div>
        </div>
    );
};



const ImageUploader: React.FC<{ onFileSelect: (file: File) => void, originalImage: string | null }> = ({ onFileSelect, originalImage }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div
            className="w-full h-48 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            {originalImage ? (
                <img src={originalImage} alt="Original" className="h-full w-full object-cover rounded-xl" />
            ) : (
                <p>Drag & Drop or Click to Upload</p>
            )}
        </div>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  // --- STATE MANAGEMENT ---
  const [session, setSession] = useState<Session | null>(null);
  const [selectedGender, setSelectedGender] = useState<'woman' | 'man' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success' | 'info', message: string } | null>(null);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [userUsage, setUserUsage] = useState<{ dailyTransformations: number, lastTransformation: number }>({ dailyTransformations: 0, lastTransformation: 0 });

  // --- HANDLERS AND EFFECTS ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Load usage data from local storage
    const storedUsage = localStorage.getItem('ethicalUsage');
    if (storedUsage) {
      setUserUsage(JSON.parse(storedUsage));
    }

    return () => subscription.unsubscribe();
  }, []);
  
  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
        setOriginalImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleGenerateLook = async () => {
    setNotification(null);
    if (!uploadedFile || !selectedGender || !selectedStyle) {
        setNotification({ type: 'error', message: "Please upload a photo, select a gender, and choose a hairstyle." });
        return;
    }

    // 1. Ethical Usage Validation
    const validationResult = validateEthicalUsage(userUsage);
    if (!validationResult.isCompliant) {
        const violation = validationResult.violations[0];
        setNotification({ type: 'error', message: violation.message });
        return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
        // Check if API key is available
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured');
        }
        
        const model = ai.getGenerativeModel({ model: "gemini-pro-vision" });

        // Convert uploaded file to base64 for Gemini API
        const imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(uploadedFile);
        });

        // Construct the prompt based on selected gender and style
        const basePrompt = STYLE_PROMPTS[selectedGender][selectedStyle as keyof typeof STYLE_PROMPTS['woman' | 'man']];
        const ethicalPrompt = `
ETHICAL TRANSFORMATION REQUIREMENTS:
1. PRESERVE IDENTITY: Only modify hair. All facial features, body, and clothing must remain identical to the original image.
2. NATURAL RESULTS: The hairstyle should look realistic and achievable in a salon. Avoid any "perfect" or artificial appearances.
3. CULTURAL RESPECT: If the style has cultural origins, represent it respectfully.
4. BIAS CHECK: Do not alter skin tone or ethnic features. The result must not conform to Eurocentric beauty standards.

Based on these rules, apply the following style: ${basePrompt}`;

        const result = await model.generateContent([
            ethicalPrompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: uploadedFile.type,
                },
            },
        ]);

        const response = result.response;
        const part = response.candidates?.[0]?.content.parts[0];

        if (part && 'inlineData' in part) {
            const { mimeType, data } = part.inlineData;
            setGeneratedImage(`data:${mimeType};base64,${data}`);
            setNotification({ type: 'success', message: 'Your new hairstyle is ready!' });

            // 2. Update and save usage data
            const newUsage = {
                dailyTransformations: userUsage.dailyTransformations + 1,
                lastTransformation: Date.now()
            };
            setUserUsage(newUsage);
            localStorage.setItem('ethicalUsage', JSON.stringify(newUsage));
        } else {
            const responseText = response.text();
            console.error("AI Error/Refusal:", responseText);
            setNotification({ type: 'error', message: "The AI was unable to perform this transformation. It may be due to safety or bias concerns." });
        }

    } catch (error) {
        console.error('Error generating hairstyle:', error);
        setNotification({
            type: 'error',
            message: 'Failed to generate hairstyle. Please try again.'
        });
    } finally {
        setIsLoading(false);
    }
  };


  // --- RENDER LOGIC ---
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">
              Ethical Hairstyle AI ✨
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Sign in to discover professional hairstyles crafted by master stylists</p>
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

  return (
    <div className="min-h-screen flex flex-col items-start justify-start p-4 sm:p-6 lg:p-8 text-white font-sans bg-slate-900">
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">Ethical Hairstyle AI</h1>
          <div className="flex items-center gap-4">
            <p className="text-slate-300">Welcome, {session.user.email}</p>
            <button
              onClick={handleSignOut}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* --- Left Column: Controls --- */}
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-slate-100">1. Upload Your Photo</h2>
              <ImageUploader onFileSelect={handleFileSelect} originalImage={originalImage} />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-slate-100">2. Select Gender</h2>
              <div className="flex gap-4">
                <button className={`p-4 rounded-lg flex-1 ${selectedGender === 'woman' ? 'bg-purple-600' : 'bg-slate-700'}`} onClick={() => setSelectedGender('woman')}>Woman</button>
                <button className={`p-4 rounded-lg flex-1 ${selectedGender === 'man' ? 'bg-purple-600' : 'bg-slate-700'}`} onClick={() => setSelectedGender('man')}>Man</button>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4 text-slate-100">3. Choose Your Professional Hairstyle</h2>
              <p className="text-slate-400 text-sm mb-4">Select from trending cuts crafted by master stylists</p>
              {/* Style options will go here */}
              <StyleSelector
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                selectedStyle={selectedStyle}
                setSelectedStyle={setSelectedStyle}
              />
            </div>

            <button
              onClick={handleGenerateLook}
              disabled={isLoading || !originalImage || !selectedGender || !selectedStyle}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Analyzing with Nano Banano AI...' : 'Generate Hairstyle'}
            </button>

            {notification && (
              <div className={`p-4 mt-4 rounded-lg text-center ${
                notification.type === 'error' ? 'bg-red-900 text-red-200' :
                notification.type === 'success' ? 'bg-green-900 text-green-200' :
                'bg-blue-900 text-blue-200'
              }`}>
                {notification.message}
              </div>
            )}
          </div>

          {/* --- Right Column: Results --- */}
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold mb-4 text-slate-100 self-start">4. See Your New Hairstyle</h2>
            <div className="w-full h-96 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">
              {generatedImage ? <img src={generatedImage} alt="Generated hairstyle" className="h-full w-full object-contain"/> : 'Your new hairstyle will appear here'}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}