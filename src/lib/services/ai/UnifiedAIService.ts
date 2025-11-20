// Unified AI Service - God Mode AI Assistant
// Coordinates Claude, GPT-4, and Grok for maximum capability

import { claudeService } from './ClaudeService';
import { gpt4Service } from './GPT4Service';
import { grokService } from './GrokService';
import type { 
  AIMode, 
  AIMessage, 
  AIQueryResult, 
  CoreAnalysis, 
  GeologicalData, 
  NavigationCommand,
  FeatureExplanation,
  DataAnalysis,
  DocumentAnalysis
} from './types';

export class UnifiedAIService {
  private mode: AIMode = 'cloud'; // Default to cloud mode
  private conversationHistory: AIMessage[] = [];

  constructor() {
    console.log('🤖 GeoForge AI Assistant initialized (God Mode)');
    this.checkAPIKeys();
  }

  private checkAPIKeys(): void {
    const available: string[] = [];
    const missing: string[] = [];

    if (claudeService.isConfigured()) available.push('Claude');
    else missing.push('Claude');

    if (gpt4Service.isConfigured()) available.push('GPT-4');
    else missing.push('GPT-4');

    if (grokService.isConfigured()) available.push('Grok');
    else missing.push('Grok');

    console.log('✅ Available AI engines:', available.join(', '));
    if (missing.length > 0) {
      console.warn('⚠️ Missing AI engines:', missing.join(', '));
    }
  }

  // ============================================================================
  // CORE PHOTO ANALYSIS - Uses GPT-4 Vision (best for images)
  // ============================================================================
  async analyzeCorePhoto(imageBase64: string, context: string): Promise<CoreAnalysis> {
    console.log('🔍 Analyzing core photo with GPT-4 Vision...');
    return await gpt4Service.analyzeCorePhoto(imageBase64, context);
  }

  // ============================================================================
  // GEOLOGICAL QUERIES - Uses Grok (best for geological knowledge)
  // ============================================================================
  async geologicalQuery(question: string, context?: string, webSearch?: boolean): Promise<AIQueryResult> {
    console.log('🌍 Processing geological query with Grok...');
    return await grokService.query(question, context, webSearch);
  }

  // ============================================================================
  // DATA ANALYSIS - Uses Claude (best for complex reasoning)
  // ============================================================================
  async analyzeData(data: GeologicalData): Promise<DataAnalysis> {
    console.log('📊 Analyzing data with Claude...');
    return await claudeService.analyzeData(data);
  }

  // ============================================================================
  // DOCUMENT ANALYSIS - Uses Claude (best for technical documents)
  // ============================================================================
  async analyzeDocument(document: string, type: string): Promise<DocumentAnalysis> {
    console.log('📄 Analyzing document with Claude...');
    return await claudeService.analyzeDocument(document, type);
  }

  // ============================================================================
  // REPORT GENERATION - Uses Claude (best for writing)
  // ============================================================================
  async generateReport(data: GeologicalData): Promise<string> {
    console.log('📝 Generating report with Claude...');
    return await claudeService.generateReport(data);
  }

  // ============================================================================
  // NATURAL LANGUAGE CHAT - Multi-engine routing based on intent
  // ============================================================================
  async chat(message: string): Promise<string> {
    const userMessage: AIMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    this.conversationHistory.push(userMessage);

    let response: string;

    // Route to best engine based on message intent
    if (this.isNavigationRequest(message)) {
      response = await this.handleNavigation(message);
    } else if (this.isFeatureExplanationRequest(message)) {
      response = await this.explainFeature(message);
    } else if (this.isDataAnalysisRequest(message)) {
      response = await this.handleDataAnalysis(message);
    } else {
      // Default to Claude for general conversation
      response = await claudeService.chat(this.conversationHistory.slice(-10)); // Last 10 messages
    }

    const assistantMessage: AIMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    this.conversationHistory.push(assistantMessage);

    return response;
  }

  private isNavigationRequest(message: string): boolean {
    const navKeywords = ['go to', 'take me to', 'navigate', 'open', 'show me the', 'find'];
    return navKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isFeatureExplanationRequest(message: string): boolean {
    const explainKeywords = ['how do i', 'how to', 'what is', 'explain', 'help with', 'use'];
    return explainKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isDataAnalysisRequest(message: string): boolean {
    const dataKeywords = ['analyze', 'show data', 'find patterns', 'calculate', 'statistics'];
    return dataKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  // ============================================================================
  // NAVIGATION HANDLER - Takes users anywhere in the app
  // ============================================================================
  private async handleNavigation(message: string): Promise<string> {
    const command = this.parseNavigationCommand(message);
    
    if (command) {
      // This will be handled by the UI component
      return `Navigating to ${command.target}...`;
    }

    return "I can help you navigate. Try asking: 'Take me to the dashboard' or 'Show me drill holes'";
  }

  parseNavigationCommand(message: string): NavigationCommand | null {
    const msg = message.toLowerCase();

    // Dashboard
    if (msg.includes('dashboard') || msg.includes('home')) {
      return { action: 'navigate', target: '/dashboard' };
    }

    // Drill Holes
    if (msg.includes('drill') || msg.includes('drill holes') || msg.includes('drilling')) {
      return { action: 'navigate', target: '/projects/:projectId/drill-holes' };
    }

    // Core Logging
    if (msg.includes('core') || msg.includes('logging') || msg.includes('log')) {
      return { action: 'navigate', target: '/drill-holes/:drillHoleId/core-logs' };
    }

    // Landing Page
    if (msg.includes('landing') || msg.includes('welcome')) {
      return { action: 'navigate', target: '/' };
    }

    return null;
  }

  // ============================================================================
  // FEATURE EXPLANATION - Teaches users how to use GeoForge
  // ============================================================================
  private async explainFeature(message: string): Promise<string> {
    const feature = this.identifyFeature(message);

    if (feature) {
      return this.generateFeatureExplanation(feature);
    }

    // If no specific feature found, ask Claude
    return await claudeService.chat([
      {
        role: 'user',
        content: `${message}\n\nI'm asking about features in GeoForge, a geological exploration platform. Please explain how to use this feature.`
      }
    ]);
  }

  private identifyFeature(message: string): FeatureExplanation | null {
    const msg = message.toLowerCase();

    if (msg.includes('drill hole') || msg.includes('drilling')) {
      return {
        name: 'Drill Hole Management',
        description: 'Manage drilling operations, track drill hole locations, and monitor progress',
        howToUse: '1. Go to Projects → Select Project → Drill Holes\n2. Click "Add Drill Hole" to create new hole\n3. Enter collar details (location, elevation, azimuth, dip)\n4. View drill holes on map or in list view',
        location: 'Dashboard → Project → Drill Holes',
        relatedFeatures: ['Core Logging', '3D Visualization', 'Assay Management']
      };
    }

    if (msg.includes('core log') || msg.includes('logging')) {
      return {
        name: 'Core Logging Interface',
        description: 'Digital core logging with AI assistance, photo upload, and lithology classification',
        howToUse: '1. Select a drill hole\n2. Click "Create Core Log"\n3. Enter depth intervals\n4. Upload core photos (optional - AI will analyze)\n5. Describe lithology, alteration, mineralization\n6. Save log entries',
        location: 'Drill Holes → Select Hole → Core Logs',
        relatedFeatures: ['AI Core Analysis', 'Sample Selection', 'Photo Management']
      };
    }

    if (msg.includes('ai') || msg.includes('artificial intelligence')) {
      return {
        name: 'AI Assistant (God Mode)',
        description: 'Comprehensive AI assistant that can navigate, explain features, analyze data, and answer questions',
        howToUse: 'Just ask questions naturally:\n- "Take me to drill holes"\n- "How do I create a core log?"\n- "Analyze my assay data"\n- "Explain this feature"',
        location: 'Available everywhere (floating icon)',
        relatedFeatures: ['Core Photo Analysis', 'Data Analysis', 'Report Generation']
      };
    }

    if (msg.includes('collaboration') || msg.includes('team')) {
      return {
        name: 'Team Collaboration',
        description: 'Real-time collaboration with video, messaging, and shared workspace',
        howToUse: '1. Click collaboration icon (top right)\n2. Invite team members\n3. Start video call or chat\n4. Share your screen\n5. Work together in real-time',
        location: 'Available on all pages (top right icon)',
        relatedFeatures: ['Video Calls', 'Team Messaging', 'Screen Sharing']
      };
    }

    return null;
  }

  private generateFeatureExplanation(feature: FeatureExplanation): string {
    return `# ${feature.name}

**Description:** ${feature.description}

**How to Use:**
${feature.howToUse}

**Location:** ${feature.location}

${feature.relatedFeatures ? `**Related Features:** ${feature.relatedFeatures.join(', ')}` : ''}

Need more help? Just ask!`;
  }

  // ============================================================================
  // DATA ANALYSIS HANDLER
  // ============================================================================
  private async handleDataAnalysis(message: string): Promise<string> {
    // This will be enhanced with actual project data access
    return "To analyze your data, I need access to your project. Please select a project first, or try: 'Analyze data for Project X'";
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  clearHistory(): void {
    this.conversationHistory = [];
    console.log('🧹 Conversation history cleared');
  }

  getHistory(): AIMessage[] {
    return [...this.conversationHistory];
  }

  setMode(mode: AIMode): void {
    this.mode = mode;
    console.log(`🔧 AI mode set to: ${mode}`);
  }

  getMode(): AIMode {
    return this.mode;
  }

  isConfigured(): boolean {
    return claudeService.isConfigured() || gpt4Service.isConfigured() || grokService.isConfigured();
  }

  // ============================================================================
  // QUICK ACCESS METHODS
  // ============================================================================
  async quickAnalyze(type: 'core' | 'data' | 'document', input: any): Promise<any> {
    switch (type) {
      case 'core':
        return await this.analyzeCorePhoto(input.image, input.context || '');
      case 'data':
        return await this.analyzeData(input);
      case 'document':
        return await this.analyzeDocument(input.text, input.type);
      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }
  }

  // ============================================================================
  // SYSTEM STATUS
  // ============================================================================
  getSystemStatus(): {
    mode: AIMode;
    engines: { name: string; available: boolean }[];
    conversationLength: number;
  } {
    return {
      mode: this.mode,
      engines: [
        { name: 'Claude Sonnet 4.5', available: claudeService.isConfigured() },
        { name: 'GPT-4 Omni Vision', available: gpt4Service.isConfigured() },
        { name: 'Grok Beta', available: grokService.isConfigured() }
      ],
      conversationLength: this.conversationHistory.length
    };
  }
}

// Singleton instance - God Mode AI
export const aiService = new UnifiedAIService();

// Export individual services for direct access if needed
export { claudeService, gpt4Service, grokService };

