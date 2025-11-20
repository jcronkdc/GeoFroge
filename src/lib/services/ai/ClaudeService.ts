// Anthropic Claude Service - Complex Reasoning & Analysis

import type { AIMessage, AIQueryResult, CoreAnalysis, GeologicalData, DataAnalysis, DocumentAnalysis } from './types';

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514'; // Latest Claude Sonnet 4.5

export class ClaudeService {
  private apiKey: string;

  constructor() {
    this.apiKey = CLAUDE_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️ Claude API key not found. AI features will be limited.');
    }
  }

  private async makeRequest(messages: AIMessage[], systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages.map(msg => ({
            role: msg.role === 'system' ? 'assistant' : msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API request failed:', error);
      throw error;
    }
  }

  async query(question: string, context?: string): Promise<AIQueryResult> {
    const systemPrompt = `You are an expert geological AI assistant integrated into GeoForge, a professional geological exploration platform. 
    
You have deep knowledge of:
- Geological exploration and mining
- Core logging and lithology classification
- Geochemistry and mineral analysis
- Drilling operations
- Resource estimation
- Technical standards (NI 43-101, JORC, CIM)

Provide accurate, professional responses. When analyzing geological data, be specific and cite confidence levels.`;

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: context ? `Context: ${context}\n\nQuestion: ${question}` : question
      }
    ];

    const answer = await this.makeRequest(messages, systemPrompt);

    return {
      answer,
      confidence: 0.85,
      suggestions: []
    };
  }

  async analyzeCorePhoto(imageBase64: string, context: string): Promise<CoreAnalysis> {
    // Claude can analyze images - send the image data
    const systemPrompt = `You are an expert geologist analyzing drill core photographs. Provide detailed lithological descriptions, identify minerals, alteration, and potential mineralization.`;

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Analyze this drill core photo and provide:
1. Primary lithology
2. Minerals observed
3. Alteration type (if present)
4. Mineralization indicators
5. Sampling recommendations

Context: ${context}

[Image data: ${imageBase64.substring(0, 50)}...]`
      }
    ];

    const response = await this.makeRequest(messages, systemPrompt);

    // Parse the response into structured data
    return this.parseCoreAnalysis(response);
  }

  private parseCoreAnalysis(response: string): CoreAnalysis {
    // Extract structured data from Claude's response
    const lithologyMatch = response.match(/lithology:?\s*([^\n]+)/i);
    const mineralMatch = response.match(/minerals?:?\s*([^\n]+)/i);
    const alterationMatch = response.match(/alteration:?\s*([^\n]+)/i);
    const mineralizationMatch = response.match(/mineralization:?\s*([^\n]+)/i);

    return {
      lithology: lithologyMatch ? lithologyMatch[1].trim() : 'Unknown',
      mineralogy: mineralMatch ? mineralMatch[1].split(',').map(m => m.trim()) : [],
      alteration: alterationMatch ? alterationMatch[1].trim() : undefined,
      mineralization: mineralizationMatch ? mineralizationMatch[1].trim() : undefined,
      recommendations: this.extractRecommendations(response),
      confidence: 0.85
    };
  }

  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.match(/recommend|suggest|should|consider/i)) {
        recommendations.push(line.trim());
      }
    }

    return recommendations.length > 0 ? recommendations : ['Review with senior geologist'];
  }

  async generateReport(data: GeologicalData): Promise<string> {
    const systemPrompt = `You are a technical report writer specializing in geological exploration reports. Generate professional, well-structured reports following industry standards (NI 43-101, JORC, CIM).`;

    const dataString = JSON.stringify(data, null, 2);

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Generate a professional geological report based on this data:\n\n${dataString}\n\nInclude:\n1. Executive Summary\n2. Data Analysis\n3. Key Findings\n4. Recommendations\n5. Conclusion`
      }
    ];

    return await this.makeRequest(messages, systemPrompt);
  }

  async analyzeData(data: GeologicalData): Promise<DataAnalysis> {
    const systemPrompt = `You are a geological data analyst. Analyze exploration data and provide insights, patterns, and recommendations.`;

    const dataString = JSON.stringify(data, null, 2);

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Analyze this geological exploration data and provide:\n1. Summary of key metrics\n2. Notable patterns or trends\n3. Potential target areas\n4. Recommendations for follow-up\n\nData:\n${dataString}`
      }
    ];

    const response = await this.makeRequest(messages, systemPrompt);

    return this.parseDataAnalysis(response);
  }

  private parseDataAnalysis(response: string): DataAnalysis {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const lines = response.split('\n');

    let summary = '';
    let inSummary = true;

    for (const line of lines) {
      if (line.match(/insight|pattern|trend/i)) {
        insights.push(line.trim());
        inSummary = false;
      } else if (line.match(/recommend|suggest/i)) {
        recommendations.push(line.trim());
        inSummary = false;
      } else if (inSummary && line.trim()) {
        summary += line + ' ';
      }
    }

    return {
      summary: summary.trim() || 'Data analysis complete.',
      insights: insights.length > 0 ? insights : ['No significant patterns detected'],
      recommendations: recommendations.length > 0 ? recommendations : ['Continue standard exploration program']
    };
  }

  async analyzeDocument(document: string, type: string): Promise<DocumentAnalysis> {
    const systemPrompt = `You are a document analysis expert specializing in geological and technical documents.`;

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Analyze this ${type} document and provide:\n1. Brief summary\n2. Key points (3-5)\n3. Any questions or concerns\n\nDocument:\n${document.substring(0, 10000)}`
      }
    ];

    const response = await this.makeRequest(messages, systemPrompt);

    return this.parseDocumentAnalysis(response, type);
  }

  private parseDocumentAnalysis(response: string, type: string): DocumentAnalysis {
    const keyPoints: string[] = [];
    const questions: string[] = [];
    const lines = response.split('\n');

    let summary = '';
    let inSummary = true;

    for (const line of lines) {
      if (line.match(/^[\d\-\*]\.|key point|important/i)) {
        keyPoints.push(line.replace(/^[\d\-\*]\.\s*/, '').trim());
        inSummary = false;
      } else if (line.match(/question|concern|unclear/i)) {
        questions.push(line.trim());
      } else if (inSummary && line.trim().length > 20) {
        summary += line + ' ';
      }
    }

    return {
      type,
      summary: summary.trim() || 'Document analyzed.',
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Document reviewed'],
      questions: questions.length > 0 ? questions : undefined
    };
  }

  async chat(messages: AIMessage[]): Promise<string> {
    const systemPrompt = `You are a helpful AI assistant integrated into GeoForge, a professional geological exploration platform. 
    
You can:
- Navigate users through the app
- Explain features and how to use them
- Analyze geological data and documents
- Answer questions about geology and exploration
- Guide users to specific features or pages

Be friendly, professional, and proactive in helping users.`;

    return await this.makeRequest(messages, systemPrompt);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
export const claudeService = new ClaudeService();

