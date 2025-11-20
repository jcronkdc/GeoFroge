// AI Service Types for GeoForge

export type AIMode = 'local' | 'cloud';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface AIQueryResult {
  answer: string;
  sources?: string[];
  confidence?: number;
  suggestions?: string[];
}

export interface CoreAnalysis {
  lithology: string;
  mineralogy: string[];
  alteration?: string;
  mineralization?: string;
  recommendations: string[];
  confidence: number;
}

export interface GeologicalData {
  projectId?: string;
  drillHoles?: any[];
  coreLogs?: any[];
  assays?: any[];
  samples?: any[];
  [key: string]: any;
}

export interface NavigationCommand {
  action: 'navigate' | 'scroll' | 'highlight' | 'open';
  target: string;
  params?: Record<string, any>;
}

export interface FeatureExplanation {
  name: string;
  description: string;
  howToUse: string;
  location: string;
  relatedFeatures?: string[];
}

export interface DataAnalysis {
  summary: string;
  insights: string[];
  visualizations?: any[];
  recommendations: string[];
}

export interface DocumentAnalysis {
  type: string;
  summary: string;
  keyPoints: string[];
  questions?: string[];
}

