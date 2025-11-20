// Grok AI Service - Contextual Knowledge & Natural Language

import type { AIMessage, AIQueryResult, GeologicalData } from './types';

const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-beta';

export class GrokService {
  private apiKey: string;

  constructor() {
    this.apiKey = GROK_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️ Grok API key not found. Natural language features will be limited.');
    }
  }

  private async makeRequest(messages: AIMessage[], systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Grok API key not configured');
    }

    try {
      const formattedMessages = systemPrompt 
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: GROK_MODEL,
          messages: formattedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: 2048,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Grok API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Grok API request failed:', error);
      throw error;
    }
  }

  async query(question: string, context?: string, webSearch: boolean = false): Promise<AIQueryResult> {
    const systemPrompt = `You are Grok, an AI assistant specialized in geological exploration and mining. You have deep knowledge of:
- Geological processes and mineral deposits
- Exploration techniques and methodologies  
- Mining operations and regulations
- Geochemistry and structural geology
- Global mining projects and deposits

Provide accurate, contextual responses with relevant geological knowledge.`;

    const userContent = context 
      ? `Context: ${context}\n\nQuestion: ${question}${webSearch ? '\n\n(Use web search if needed for current information)' : ''}`
      : question;

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: userContent
      }
    ];

    const answer = await this.makeRequest(messages, systemPrompt);

    return {
      answer,
      confidence: 0.85,
      suggestions: this.generateSuggestions(question),
      sources: webSearch ? ['Web search enabled'] : undefined
    };
  }

  private generateSuggestions(question: string): string[] {
    const suggestions: string[] = [];

    if (question.toLowerCase().includes('gold')) {
      suggestions.push('Would you like to see gold assay results?');
      suggestions.push('Show me gold anomalies on the map');
    }

    if (question.toLowerCase().includes('drill')) {
      suggestions.push('View drill hole locations');
      suggestions.push('Show me drill hole assays');
    }

    if (question.toLowerCase().includes('sample')) {
      suggestions.push('View sample locations');
      suggestions.push('Show me sample results');
    }

    return suggestions;
  }

  async analyzeGeologicalData(data: GeologicalData, question: string): Promise<AIQueryResult> {
    const systemPrompt = `You are analyzing geological exploration data. Provide insights, identify patterns, and answer questions about the data.`;

    const dataString = JSON.stringify(data, null, 2);

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Geological Data:\n${dataString}\n\nQuestion: ${question}\n\nProvide analysis and insights.`
      }
    ];

    const answer = await this.makeRequest(messages, systemPrompt);

    return {
      answer,
      confidence: 0.8,
      suggestions: []
    };
  }

  async chat(messages: AIMessage[]): Promise<string> {
    const systemPrompt = `You are Grok, a helpful AI assistant integrated into GeoForge. Help users with:
- Navigating the platform
- Understanding geological concepts
- Analyzing their data
- Answering exploration questions

Be friendly, professional, and knowledgeable.`;

    return await this.makeRequest(messages, systemPrompt);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
export const grokService = new GrokService();

