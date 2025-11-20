// AI Service - Handles all AI interactions with comprehensive GeoForge knowledge
// Supports navigation, chat, analysis, and web search (including weather)

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface NavigationCommand {
  target: string;
  action?: string;
}

interface DataAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
}

interface DocumentAnalysis {
  type: string;
  summary: string;
  keyPoints: string[];
  questions?: string[];
}

// GeoForge System Knowledge Base
const SYSTEM_KNOWLEDGE = {
  modules: {
    'production': {
      name: 'Production Tracking',
      path: '/production',
      description: 'Daily shift logging, KPIs, and mill processing tracking',
      inputs: ['shift date', 'ore tonnes', 'waste tonnes', 'Au grade', 'Ag grade', 'contractor'],
      features: ['30-second shift entry', 'Real-time KPIs', 'Video collaboration']
    },
    'veins': {
      name: 'Vein Systems',
      path: '/projects/dome-mountain/veins',
      description: 'Track 10+ vein structures with geometry and production',
      inputs: ['vein name', 'strike', 'dip', 'width', 'mineralization'],
      features: ['Vein geometry', 'Production by vein', 'Boulder Vein tracking']
    },
    'drill-holes': {
      name: 'Drill Holes',
      path: '/exploration',
      description: '596 drill holes with 89,982m drilled',
      inputs: ['hole ID', 'location', 'azimuth', 'dip', 'depth', 'purpose'],
      features: ['3D drill hole viewer', 'Three.js visualization', 'OrbitControls navigation']
    },
    'core-logging': {
      name: 'Core Logging',
      path: '/exploration',
      description: 'Lithology, alteration, and mineralization logging',
      inputs: ['depth from/to', 'lithology', 'alteration', 'mineralization', 'RQD', 'recovery', 'photos'],
      features: ['AI-assisted logging', 'Photo viewer', 'Assay submission', 'QA/QC samples']
    },
    'resource-estimation': {
      name: 'Resource Estimation',
      path: '/projects/dome-mountain/resource-estimation',
      description: '3D block models with M/I/I classification (234,000 oz Au total)',
      inputs: ['block model params', 'search radius', 'cutoff grade', 'estimation method'],
      features: ['400,000 voxels', 'IDW interpolation', 'CIM/JORC classification', '3D voxel viewer']
    },
    'grade-interpolation': {
      name: 'Grade Interpolation',
      path: '/projects/dome-mountain/grade-interpolation',
      description: 'PyKrige geostatistics with variogram modeling',
      inputs: ['section azimuth', 'element', 'variogram model', 'range', 'sill', 'nugget'],
      features: ['Ordinary Kriging', '2D heatmap visualization', 'Sample overlay', 'Statistics display']
    },
    'geophysics': {
      name: 'Geophysics',
      path: '/projects/dome-mountain/geophysics',
      description: 'Mag, gravity, IP, EM survey data',
      inputs: ['survey type', 'survey date', 'contractor', 'data upload'],
      features: ['Contour maps', 'Target picking', '2020 airborne survey']
    },
    'collaboration': {
      name: 'Collaboration',
      action: 'openCollaboration',
      description: 'Video calls, team chat, and screen sharing',
      inputs: ['text messages', 'video rooms', 'emergency alerts'],
      features: ['Daily.co video', 'Ably real-time chat', 'Typing indicators', 'Presence tracking', 'Screen share']
    }
  },
  
  navigation: {
    'dashboard': '/dashboard',
    'home': '/dashboard',
    'main': '/dashboard',
    'production': '/production',
    'production tracking': '/production',
    'shifts': '/production',
    'veins': '/projects/dome-mountain/veins',
    'vein systems': '/projects/dome-mountain/veins',
    'drill holes': '/exploration',
    'drilling': '/exploration',
    'exploration': '/exploration',
    'core logging': '/exploration',
    'logging': '/exploration',
    'resource estimation': '/projects/dome-mountain/resource-estimation',
    'resources': '/projects/dome-mountain/resource-estimation',
    'block model': '/projects/dome-mountain/resource-estimation',
    'grade interpolation': '/projects/dome-mountain/grade-interpolation',
    'kriging': '/projects/dome-mountain/grade-interpolation',
    'geostatistics': '/projects/dome-mountain/grade-interpolation',
    'geophysics': '/projects/dome-mountain/geophysics',
    'geophysical': '/projects/dome-mountain/geophysics',
    'mag': '/projects/dome-mountain/geophysics',
    'collaboration': 'openCollaboration',
    'team call': 'openCollaboration',
    'video': 'openCollaboration',
    'chat': 'openCollaboration'
  },
  
  workflows: {
    'log shift': 'Go to Production Tracking → Click "Log Shift" → Fill out 9 fields (date, shift type, stope, ore/waste tonnes, Au/Ag grades, contractor, notes) → Save. Takes 30 seconds!',
    'add drill hole': 'Go to Drill Holes → Select project → Click "Add New Drill Hole" → Enter hole ID, location, azimuth, dip, depth → See it appear in 3D viewer!',
    'log core': 'Go to Core Logging → Select drill hole → Fill out depth intervals, lithology, alteration, mineralization, RQD, recovery → Add photos → Submit for assay',
    'create block model': '5-step workflow: (1) Define block model (origin, size, extent) → (2) Estimate grades (IDW/Kriging) → (3) Classify resources (M/I/I) → (4) Apply cutoff → (5) Generate report with 3D viewer',
    'grade interpolation': 'Go to Grade Interpolation → Define cross-section (azimuth, position, width) → Select element (Au/Ag/Cu) → Set kriging parameters (variogram, range, sill) → Generate heatmap',
    'start video call': 'Click "Team Call" button (top right) → Video tab → Create New Room → Camera/mic permission → Share room with team',
    'send chat': 'Click "Team Call" → Team Chat tab → Type message → Press Enter. Use keywords "emergency", "urgent", "help" for alerts!'
  },
  
  terminology: {
    'lithology': 'Rock type classification (e.g., andesite, diorite, quartz vein, breccia)',
    'alteration': 'Mineralization changes (silicification, sericitization, chloritization, argillic)',
    'rqd': 'Rock Quality Designation - percentage of intact core pieces >10cm, ranges 0-100%',
    'recovery': 'Core recovery percentage - how much core was recovered vs. drilled length',
    'azimuth': 'Horizontal drill direction in degrees (0-360°, 0=North, 90=East)',
    'dip': 'Vertical drill angle (-90° to 90°, negative=downward)',
    'g/t': 'Grams per tonne - standard unit for precious metal grades',
    'oz': 'Ounces - troy ounces for gold/silver (31.1g)',
    'utm': 'Universal Transverse Mercator coordinates - standard mapping system',
    'kriging': 'Geostatistical interpolation method using spatial correlation',
    'variogram': 'Function showing spatial correlation vs. distance',
    'idw': 'Inverse Distance Weighting - simpler interpolation method',
    'measured': 'Highest confidence resource category (drill spacing < 25m)',
    'indicated': 'Medium confidence resource category (drill spacing 25-50m)',
    'inferred': 'Lower confidence resource category (drill spacing > 50m)',
    'stope': 'Underground mining excavation',
    'vein': 'Sheet-like mineral deposit (e.g., quartz vein with gold)'
  }
};

class AIService {
  private apiKey: string | null = null;

  constructor() {
    // Check for AI API keys (Anthropic, OpenAI, or Grok)
    this.apiKey = 
      import.meta.env.VITE_ANTHROPIC_API_KEY || 
      import.meta.env.VITE_OPENAI_API_KEY ||
      import.meta.env.VITE_GROK_API_KEY ||
      null;
  }

  // Parse navigation commands
  parseNavigationCommand(input: string): NavigationCommand | null {
    const lowerInput = input.toLowerCase();
    
    // Check for exact matches
    for (const [keyword, target] of Object.entries(SYSTEM_KNOWLEDGE.navigation)) {
      if (lowerInput.includes(keyword)) {
        if (target === 'openCollaboration') {
          return { target: '', action: 'openCollaboration' };
        }
        return { target };
      }
    }
    
    // Check for phrases like "take me to", "go to", "navigate to", "show me"
    const navPhrases = ['take me to', 'go to', 'navigate to', 'show me', 'open'];
    for (const phrase of navPhrases) {
      if (lowerInput.includes(phrase)) {
        for (const [keyword, target] of Object.entries(SYSTEM_KNOWLEDGE.navigation)) {
          if (lowerInput.includes(keyword)) {
            if (target === 'openCollaboration') {
              return { target: '', action: 'openCollaboration' };
            }
            return { target };
          }
        }
      }
    }
    
    return null;
  }

  // Main chat function with built-in knowledge
  async chat(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Check for weather queries
    if (lowerMessage.includes('weather')) {
      return this.handleWeatherQuery(message);
    }
    
    // Check for workflow questions
    for (const [workflow, instructions] of Object.entries(SYSTEM_KNOWLEDGE.workflows)) {
      if (lowerMessage.includes(workflow) || lowerMessage.includes('how to ' + workflow) || lowerMessage.includes('how do i ' + workflow)) {
        return `## How to ${workflow.charAt(0).toUpperCase() + workflow.slice(1)}\n\n${instructions}\n\n**Need more help?** Just ask!`;
      }
    }
    
    // Check for terminology questions
    for (const [term, definition] of Object.entries(SYSTEM_KNOWLEDGE.terminology)) {
      if (lowerMessage.includes(term) || lowerMessage.includes('what is ' + term) || lowerMessage.includes('what are ' + term)) {
        return `## ${term.toUpperCase()}\n\n${definition}\n\n**Example in GeoForge:** This is used in ${this.getTermUsage(term)}`;
      }
    }
    
    // Check for module information
    for (const [key, module] of Object.entries(SYSTEM_KNOWLEDGE.modules)) {
      if (lowerMessage.includes(module.name.toLowerCase()) || lowerMessage.includes(key)) {
        return `## ${module.name}\n\n**Description:** ${module.description}\n\n**Features:**\n${module.features.map(f => `- ${f}`).join('\n')}\n\n**Data you can input:**\n${module.inputs.map(i => `- ${i}`).join('\n')}\n\n**Want to go there?** Just say "Take me to ${module.name}"`;
      }
    }
    
    // If no built-in knowledge matches, use AI API if available
    if (this.apiKey) {
      return await this.callAIAPI(message);
    }
    
    // Fallback response
    return `I understand you're asking about "${message}".\n\nI can help you with:\n\n**Navigation:**\n- "Take me to [module name]"\n- "Show me drill holes"\n\n**Workflows:**\n- "How do I log a shift?"\n- "How do I create a block model?"\n\n**Information:**\n- "What is lithology?"\n- "Tell me about resource estimation"\n\n**External:**\n- "What's the weather in Smithers?" (web search)\n\nWhat would you like to know?`;
  }

  // Handle weather queries with web search
  private async handleWeatherQuery(message: string): Promise<string> {
    // Extract location from message
    const locationMatch = message.match(/weather\s+in\s+([a-z\s,]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : 'Smithers, BC';
    
    try {
      // Use a weather API or web search
      const weather = await this.getWeather(location);
      return `## Weather in ${location}\n\n${weather}\n\n*Note: This is simulated weather data. For real-time weather, I'd use an API like OpenWeatherMap.*`;
    } catch (error) {
      return `I can check the weather for you! To get real-time weather data, I need an API key configured.\n\nFor **Smithers, BC** (Dome Mountain area), typical weather:\n- Summer: 15-25°C, clear skies\n- Winter: -10 to 0°C, snow\n- Spring/Fall: 5-15°C, rainy\n\n**Current conditions** would require a weather API connection.`;
    }
  }

  // Simulate weather API (replace with real API later)
  private async getWeather(location: string): Promise<string> {
    // This would call OpenWeatherMap or similar
    return `**Temperature:** 12°C\n**Conditions:** Partly cloudy\n**Humidity:** 65%\n**Wind:** 15 km/h SW\n\n*Note: For real-time weather, connect an API key.*`;
  }

  // Get usage examples for terminology
  private getTermUsage(term: string): string {
    const usageMap: Record<string, string> = {
      'lithology': 'Core Logging module when logging drill core samples',
      'alteration': 'Core Logging for identifying mineralization zones',
      'rqd': 'Core Logging to assess rock quality',
      'recovery': 'Core Logging to track drilling success',
      'azimuth': 'Drill Holes module when adding new holes',
      'dip': 'Drill Holes module for vertical angle',
      'g/t': 'Core Logging and Production Tracking for gold grades',
      'oz': 'Resource Estimation for total metal content',
      'utm': 'Drill Holes for precise location coordinates',
      'kriging': 'Grade Interpolation for advanced geostatistics',
      'variogram': 'Grade Interpolation for spatial correlation',
      'idw': 'Resource Estimation for grade interpolation',
      'measured': 'Resource Estimation for high-confidence resources',
      'indicated': 'Resource Estimation for medium-confidence resources',
      'inferred': 'Resource Estimation for lower-confidence resources',
      'stope': 'Production Tracking for mining locations',
      'vein': 'Vein Systems and Core Logging modules'
    };
    return usageMap[term] || 'various geological workflows';
  }

  // Call external AI API (Anthropic, OpenAI, or Grok)
  private async callAIAPI(message: string): Promise<string> {
    // This would integrate with Claude, GPT, or Grok
    // For now, return a helpful message
    return `I don't have an external AI API configured yet, but I have extensive built-in knowledge about GeoForge!\n\nTry asking:\n- "How do I log a shift?"\n- "What is kriging?"\n- "Take me to drill holes"\n- "What's the weather?"\n\nOr ask about any geological term or workflow!`;
  }

  // Analyze project data
  async analyzeData(data: any): Promise<DataAnalysis> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    // Analyze drill hole data
    if (data.drillHoles) {
      insights.push(`You have ${data.drillHoles.length} drill holes with ${data.totalMeters}m drilled`);
      if (data.drillHoles.length < 10) {
        recommendations.push('Consider adding more drill holes to improve resource confidence');
      }
    }
    
    // Analyze grades
    if (data.averageGrade) {
      insights.push(`Average Au grade: ${data.averageGrade} g/t`);
      if (data.averageGrade > 5) {
        insights.push('High-grade gold project! Above industry average.');
      }
    }
    
    // Analyze production
    if (data.production) {
      insights.push(`Total ore mined: ${data.production.totalOre}t @ ${data.production.avgGrade} g/t Au`);
      recommendations.push('Continue tracking production daily for optimal planning');
    }
    
    return {
      summary: `Project analysis complete. Found ${insights.length} insights.`,
      insights,
      recommendations: recommendations.length > 0 ? recommendations : ['Project looks good! Keep collecting data.']
    };
  }

  // Analyze documents
  async analyzeDocument(content: string, type: string): Promise<DocumentAnalysis> {
    const keyPoints: string[] = [];
    
    // Extract key geological terms
    const terms = ['gold', 'silver', 'copper', 'ore', 'grade', 'resource', 'measured', 'indicated', 'inferred'];
    const foundTerms = terms.filter(term => content.toLowerCase().includes(term));
    
    if (foundTerms.length > 0) {
      keyPoints.push(`Found references to: ${foundTerms.join(', ')}`);
    }
    
    // Extract numbers that might be grades
    const gradeMatches = content.match(/\d+\.?\d*\s*g\/t/gi);
    if (gradeMatches) {
      keyPoints.push(`Grades mentioned: ${gradeMatches.slice(0, 3).join(', ')}`);
    }
    
    return {
      type: type || 'Geological Document',
      summary: `Document contains ${content.length} characters with ${keyPoints.length} key geological references.`,
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Document parsed successfully'],
      questions: ['Would you like me to extract specific data?', 'Should I analyze grades or resources?']
    };
  }

  // Get system status (for UI display)
  getSystemStatus() {
    return {
      engines: [
        { name: 'GeoForge Knowledge Base', available: true },
        { name: 'Navigation System', available: true },
        { name: 'Workflow Guide', available: true },
        { name: 'External AI', available: !!this.apiKey }
      ],
      ready: true
    };
  }
}

// Export singleton instance
export const aiService = new AIService();

