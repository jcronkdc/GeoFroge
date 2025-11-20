// OpenAI GPT-4 Service - Vision Analysis & Core Logging

import type { AIMessage, AIQueryResult, CoreAnalysis, GeologicalData } from './types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o'; // GPT-4 Omni with vision

export class GPT4Service {
  private apiKey: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not found. Vision features will be limited.');
    }
  }

  private async makeRequest(messages: AIMessage[], systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const formattedMessages = systemPrompt 
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: formattedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: 2048,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }

  async analyzeCorePhoto(imageBase64: string, context: string): Promise<CoreAnalysis> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert geologist analyzing drill core photographs. Provide detailed, accurate descriptions of lithology, minerals, alteration, and mineralization.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this drill core photograph and provide:
1. Primary lithology (rock type)
2. Minerals visible
3. Alteration type and intensity
4. Mineralization indicators
5. Recommendations for sampling

Context: ${context}

Format your response as:
LITHOLOGY: [rock type]
MINERALS: [list minerals]
ALTERATION: [type and intensity]
MINERALIZATION: [indicators or none]
RECOMMENDATIONS: [sampling advice]`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI Vision API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;

      return this.parseCoreAnalysis(analysisText);
    } catch (error) {
      console.error('GPT-4 Vision analysis failed:', error);
      throw error;
    }
  }

  private parseCoreAnalysis(text: string): CoreAnalysis {
    const lithologyMatch = text.match(/LITHOLOGY:?\s*([^\n]+)/i);
    const mineralsMatch = text.match(/MINERALS:?\s*([^\n]+)/i);
    const alterationMatch = text.match(/ALTERATION:?\s*([^\n]+)/i);
    const mineralizationMatch = text.match(/MINERALIZATION:?\s*([^\n]+)/i);
    const recommendationsMatch = text.match(/RECOMMENDATIONS:?\s*([^\n]+)/i);

    return {
      lithology: lithologyMatch ? lithologyMatch[1].trim() : 'Unable to classify',
      mineralogy: mineralsMatch ? mineralsMatch[1].split(',').map(m => m.trim()) : [],
      alteration: alterationMatch ? alterationMatch[1].trim() : undefined,
      mineralization: mineralizationMatch ? mineralizationMatch[1].trim() : undefined,
      recommendations: recommendationsMatch ? [recommendationsMatch[1].trim()] : ['Consult senior geologist'],
      confidence: 0.8
    };
  }

  async query(question: string, context?: string): Promise<AIQueryResult> {
    const systemPrompt = `You are a geological AI assistant integrated into GeoForge. Provide accurate, professional responses about geology, exploration, and mining.`;

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: context ? `Context: ${context}\n\nQuestion: ${question}` : question
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
    const systemPrompt = `You are a helpful AI assistant in GeoForge, a geological exploration platform. Help users navigate, understand features, and analyze data.`;

    return await this.makeRequest(messages, systemPrompt);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
export const gpt4Service = new GPT4Service();

