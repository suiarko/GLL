// ethical-config.ts - Configuration for ethical parameters

export interface EthicalGuidelines {
  maxDailyTransformations: number;
  diversityScore: number;
  transparencyRequired: boolean;
  mentalHealthWarnings: boolean;
  biasDetection: boolean;
}

export interface MentalHealthResource {
  name: string;
  url: string;
  phone?: string;
  description: string;
}

export interface DiversityMetrics {
  ethnicitiesRepresented: string[];
  ageGroupsSupported: string[];
  hairTypesIncluded: string[];
  culturalStylesRespected: string[];
}

export const ETHICAL_CONFIG: EthicalGuidelines = {
  maxDailyTransformations: 12, // Increased for better UX
  diversityScore: 0.95,
  transparencyRequired: true,
  mentalHealthWarnings: true,
  biasDetection: true,
};

// A gradual approach to limits
export const PROGRESSIVE_LIMITS = {
  // First 5 transformations - no limits
  phase1: { 
    transformations: 5, 
    cooldown: 0,
    message: null 
  },
  // 6-8 transformations - gentle reminders
  phase2: { 
    transformations: 3, 
    cooldown: 15 * 1000, // 15 seconds
    message: "Taking a quick moment between styles helps you appreciate each one! ✨" 
  },
  // 9-12 transformations - soft warnings
  phase3: { 
    transformations: 4, 
    cooldown: 30 * 1000, // 30 seconds
    message: "You're exploring so many looks! Remember, you're beautiful in every style 💖" 
  },
  // 12+ - gentle limit
  phase4: { 
    transformations: 0, 
    cooldown: 0,
    message: "You've had quite the styling session! How about taking a break and appreciating your natural beauty? 🌟" 
  }
};

export const MENTAL_HEALTH_RESOURCES: MentalHealthResource[] = [
  {
    name: "Crisis Text Line",
    url: "https://www.crisistextline.org",
    phone: "Text HOME to 741741",
    description: "24/7 crisis support via text message"
  },
  {
    name: "National Eating Disorders Association",
    url: "https://www.nationaleatingdisorders.org",
    phone: "1-800-931-2237",
    description: "Support for eating disorders and body image issues"
  },
  {
    name: "Mental Health America",
    url: "https://www.mhanational.org",
    description: "Mental health resources and screening tools"
  },
  {
    name: "Body Positive Movement",
    url: "https://www.bodypositive.com",
    description: "Resources for body acceptance and self-love"
  }
];

export const DIVERSITY_METRICS: DiversityMetrics = {
  ethnicitiesRepresented: [
    "African/African-American",
    "Asian/Pacific Islander", 
    "Caucasian/European",
    "Hispanic/Latino",
    "Middle Eastern",
    "Mixed/Multiracial",
    "Indigenous/Native American"
  ],
  ageGroupsSupported: [
    "Teens (13-19)",
    "Young Adults (20-29)", 
    "Adults (30-49)",
    "Mature Adults (50+)"
  ],
  hairTypesIncluded: [
    "Type 1 (Straight)",
    "Type 2 (Wavy)",
    "Type 3 (Curly)",
    "Type 4 (Coily/Kinky)",
    "All porosities",
    "All densities"
  ],
  culturalStylesRespected: [
    "African Traditional",
    "African-American Heritage",
    "Asian Traditional",
    "European Classical",
    "Latin American",
    "Indigenous Styles",
    "Contemporary Global"
  ]
};

export const POSITIVE_AFFIRMATIONS = [
  "Your natural beauty radiates from within! ✨",
  "You're exploring styles, not fixing anything - you're already perfect! 💖",
  "Every hairstyle looks amazing because YOU wear it with confidence!",
  "Your unique features make every style special 🌟",
  "Remember: this is just for fun - you're beautiful as you are! 🌸",
  "Confidence is your best accessory, and you've got plenty! 💫",
  "Your smile makes any hairstyle look perfect! 😊",
  "Beauty isn't about perfection - it's about authenticity, and you shine! ⭐",
  "Every person has their own unique beauty signature - yours is amazing! 🎨",
  "These styles are inspiration, not pressure - you're already complete! 🌺"
];

export const CULTURAL_SENSITIVITY_GUIDELINES = {
  respectfulApproach: [
    "Always acknowledge the cultural origins of traditional hairstyles",
    "Educate users about the history and significance of cultural styles", 
    "Distinguish between cultural appreciation and appropriation",
    "Recommend culturally appropriate styles based on user's background",
    "Provide context about traditional styling techniques and meanings"
  ],
  
  warningFlags: [
    "Sacred or ceremonial hairstyles should be clearly marked",
    "Styles with deep cultural significance need proper context",
    "Historical oppression context should be acknowledged",
    "Traditional techniques should be credited to their origins"
  ],
  
  educationalContent: {
    "Box Braids": "Originated in Africa over 3,000 years ago. A protective style with deep cultural roots.",
    "Bantu Knots": "Traditional African hairstyle with spiritual significance in many cultures.",
    "Dreadlocks": "Found in many cultures worldwide, with particular significance in Rastafarian culture.",
    "Cornrows": "Ancient African braiding technique with over 3,000 years of history.",
    "Top Knot": "Found in many Asian cultures, often with spiritual or social significance."
  }
};

export const BIAS_DETECTION_PROMPTS = {
  facialFeatureCheck: `
    Analyze this AI-generated transformation for potential bias:
    1. Are facial features preserved exactly as in the original?
    2. Has skin tone been altered inappropriately?
    3. Are ethnic characteristics maintained respectfully?
    4. Does the result avoid Eurocentric beauty standards?
    5. Is the transformation realistic and achievable?
    
    Rate bias risk: LOW/MEDIUM/HIGH
    Provide specific concerns if any.
  `,
  
  beautificationCheck: `
    Evaluate this transformation for unrealistic beautification:
    1. Does it maintain natural imperfections and authenticity?
    2. Are proportions realistic and unaltered?
    3. Does it avoid "Instagram filter" effects?
    4. Is the styling achievable in real life?
    5. Does it celebrate natural features rather than "correcting" them?
    
    Authenticity score: 1-10
    List any unrealistic enhancements.
  `,
  
  culturalSensitivityCheck: `
    Assess this hairstyle transformation for cultural sensitivity:
    1. Is the style culturally appropriate for this user?
    2. Are traditional elements used respectfully?
    3. Is proper cultural context provided?
    4. Does it avoid stereotypical representations?
    5. Is the styling technique authentic to its origins?
    
    Cultural sensitivity rating: APPROPRIATE/QUESTIONABLE/INAPPROPRIATE
    Explain reasoning.
  `
};

export const TRANSPARENCY_DISCLOSURES = {
  aiGeneration: {
    title: "AI-Generated Transformation",
    message: "This image has been created using artificial intelligence. Results are approximations and may not reflect exact real-life outcomes. Always consult with a professional stylist for accurate expectations.",
    icon: "🤖"
  },
  
  dataProcessing: {
    title: "Privacy-First Processing", 
    message: "Your photos are processed with privacy as our top priority. Images are analyzed temporarily and not stored on our servers unless you explicitly save them.",
    icon: "🔒"
  },
  
  mentalHealth: {
    title: "Wellbeing Reminder",
    message: "Remember, you're beautiful just as you are! These transformations are for inspiration and fun, not because you need to change anything about yourself.",
    icon: "💚"
  },
  
  limitations: {
    title: "AI Limitations",
    message: "AI has limitations in understanding context, cultural nuance, and individual needs. Professional consultation is always recommended for significant changes.",
    icon: "⚠️"
  }
};

export const USAGE_ANALYTICS = {
  ethicalMetrics: [
    'daily_transformation_count',
    'cooldown_violations',
    'mental_health_warnings_shown',
    'ethical_consent_rate',
    'bias_detection_triggers',
    'cultural_sensitivity_flags',
    'user_wellbeing_feedback'
  ],
  
  diversityTracking: [
    'ethnicity_representation',
    'age_group_usage',
    'hair_type_coverage',
    'cultural_style_popularity',
    'gender_distribution',
    'accessibility_usage'
  ],
  
  qualityMetrics: [
    'transformation_success_rate', 
    'user_satisfaction_scores',
    'ethical_compliance_rating',
    'cultural_accuracy_feedback',
    'realistic_expectation_alignment'
  ]
};

// Helper functions for ethical compliance
export const validateEthicalUsage = (sessionData: any) => {
  const now = Date.now();
  const violations = [];
  const currentCount = sessionData.dailyTransformations;
  
  // Determine the current phase
  let currentPhase = PROGRESSIVE_LIMITS.phase1;
  let phaseStartCount = 0;
  
  if (currentCount >= 9) {
    currentPhase = PROGRESSIVE_LIMITS.phase3;
    phaseStartCount = 8;
  } else if (currentCount >= 6) {
    currentPhase = PROGRESSIVE_LIMITS.phase2;
    phaseStartCount = 5;
  }
  
  // Check daily limit
  if (currentCount >= ETHICAL_CONFIG.maxDailyTransformations) {
    violations.push({
      type: 'DAILY_LIMIT_REACHED',
      message: PROGRESSIVE_LIMITS.phase4.message,
      severity: 'HIGH',
      action: 'GENTLE_BLOCK',
      showResources: true
    });
  }
  
  // Check cooldown for phases 2 and 3
  if (currentCount >= 6 && now - sessionData.lastTransformation < currentPhase.cooldown) {
    const remainingTime = Math.ceil((currentPhase.cooldown - (now - sessionData.lastTransformation)) / 1000);
    violations.push({
      type: 'COOLDOWN_ACTIVE',
      message: `${currentPhase.message} (${remainingTime}s remaining)`,
      severity: 'MEDIUM',
      action: 'SHOW_TIMER',
      remainingSeconds: remainingTime
    });
  }
  
  // Gentle wellbeing reminder
  if (currentCount >= 8 && currentCount < 12) {
    violations.push({
      type: 'WELLBEING_REMINDER',
      message: 'Having fun exploring? Remember to stay confident in your natural beauty too! 💫',
      severity: 'LOW',
      action: 'SHOW_POSITIVE_MESSAGE'
    });
  }
  
  return {
    isCompliant: violations.filter(v => v.severity === 'HIGH').length === 0,
    violations,
    currentPhase: currentCount >= 9 ? 'phase3' : currentCount >= 6 ? 'phase2' : 'phase1',
    recommendations: generateEthicalRecommendations(violations, currentCount)
  };
};

export const generateEthicalRecommendations = (violations: any[], transformationCount: number) => {
  const recommendations = [];
  
  if (violations.some(v => v.type === 'DAILY_LIMIT_REACHED')) {
    recommendations.push({
      type: 'GENTLE_BREAK',
      message: 'What a styling adventure! Come back tomorrow for more inspiration',
      tone: 'encouraging',
      resources: MENTAL_HEALTH_RESOURCES.slice(0, 1), // Only one resource
      showMascot: true // Can add a cute character
    });
  }
  
  if (violations.some(v => v.type === 'WELLBEING_REMINDER')) {
    recommendations.push({
      type: 'CONFIDENCE_BOOST',
      message: POSITIVE_AFFIRMATIONS[Math.floor(Math.random() * POSITIVE_AFFIRMATIONS.length)],
      tone: 'supportive',
      showTimer: false
    });
  }
  
  // Personalized advice based on count
  if (transformationCount >= 10) {
    recommendations.push({
      type: 'STYLE_ANALYSIS',
      message: "Wow! You've explored so many looks. Which ones made you feel most confident?",
      tone: 'reflective',
      action: 'SHOW_FAVORITES_PROMPT'
    });
  }
  
  return recommendations;
};

// Bias detection utilities
export const detectPotentialBias = async (originalImage: string, transformedImage: string) => {
  // This would integrate with an AI bias detection service
  // For now, return a mock assessment
  return {
    biasScore: 0.15, // Lower is better (0-1 scale)
    concerns: [],
    passed: true,
    recommendations: [
      'Maintain ethnic characteristics',
      'Preserve natural skin tone',
      'Avoid unrealistic beautification'
    ]
  };
};

export const culturalContextProvider = (styleName: string) => {
  const context = (CULTURAL_SENSITIVITY_GUIDELINES.educationalContent as any)[styleName];
  
  if (context) {
    return {
      hasContext: true,
      origin: context,
      respectfulUsage: `When wearing ${styleName}, it's important to understand and respect its cultural origins.`,
      learningResource: `Learn more about the history and significance of ${styleName} in its cultural context.`
    };
  }
  
  return {
    hasContext: false,
    message: `${styleName} is a contemporary or universal style with no specific cultural restrictions.`
  };
};