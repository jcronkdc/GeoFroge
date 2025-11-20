# 🔒 Hybrid AI Architecture - Local + Cloud Options

**Date**: 2025-11-20  
**Status**: CRITICAL REQUIREMENT - Enterprise NDA Compliance  
**Priority**: HIGH (Blocker for enterprise adoption)

---

## 🎯 BUSINESS REQUIREMENT

**Problem**: Geological exploration companies operate under strict NDAs. They cannot send confidential data (assays, drill results, resource estimates) to external AI APIs like OpenAI, Anthropic, or Grok.

**Solution**: Hybrid AI architecture with TWO modes:

1. **🔒 LOCAL MODE (Private)** - AI runs on company servers, data never leaves infrastructure
2. **🌐 CLOUD MODE (Internet-Enabled)** - AI uses external APIs, can access web resources

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│              GeoForge AI Engine                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User Configuration: LOCAL or CLOUD                     │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │   🔒 LOCAL MODE   │      │  🌐 CLOUD MODE   │       │
│  │   (Private/NDA)   │      │  (Web-Enabled)   │       │
│  └──────────────────┘      └──────────────────┘       │
│           │                          │                  │
│           │                          │                  │
│  ┌────────▼─────────┐      ┌────────▼────────┐        │
│  │ Local AI Models  │      │ External APIs    │        │
│  ├──────────────────┤      ├─────────────────┤        │
│  │ Ollama (Llama 3) │      │ Claude (Anthropic)│       │
│  │ LM Studio        │      │ GPT-4 (OpenAI)   │       │
│  │ LocalAI          │      │ Grok (xAI)       │       │
│  │ llama.cpp        │      │                  │       │
│  └──────────────────┘      │ + Web Access     │       │
│           │                │ + Internet Docs   │       │
│           │                └──────────────────┘       │
│           │                          │                 │
│           └──────────┬───────────────┘                │
│                      │                                 │
│              ┌───────▼────────┐                       │
│              │  Unified API   │                       │
│              │  (Same Interface)│                     │
│              └────────────────┘                       │
│                      │                                 │
│              ┌───────▼────────┐                       │
│              │  GeoForge App  │                       │
│              │  (No changes)  │                       │
│              └────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 LOCAL MODE (Private/NDA Compliant)

### Recommended Local AI Stack

#### **Option 1: Ollama (Recommended)**
- **What**: Open-source local AI runtime
- **Models**: Llama 3.3 70B, Mistral Large, DeepSeek V3, Qwen 2.5
- **Setup**: One command (`ollama run llama3.3:70b`)
- **Hardware**: Runs on Mac/Linux/Windows with GPU or CPU
- **Cost**: FREE (open-source)
- **Best For**: Easy deployment, great performance

#### **Option 2: LM Studio**
- **What**: Desktop app for local LLMs
- **Models**: Llama, Mistral, Phi, Gemma, etc.
- **Setup**: GUI-based, drag-and-drop models
- **Hardware**: Mac/Windows with GPU recommended
- **Cost**: FREE
- **Best For**: Non-technical users, visual interface

#### **Option 3: LocalAI**
- **What**: Self-hosted OpenAI-compatible API
- **Models**: All open-source models
- **Setup**: Docker container or binary
- **Hardware**: Server deployment
- **Cost**: FREE (open-source)
- **Best For**: Enterprise server deployment

#### **Option 4: llama.cpp**
- **What**: Pure C++ inference engine
- **Models**: All GGUF format models
- **Setup**: Command-line binary
- **Hardware**: CPU-only capable (no GPU required)
- **Cost**: FREE (open-source)
- **Best For**: Resource-constrained environments

### Recommended Model: Llama 3.3 70B Instruct

**Why Llama 3.3 70B?**
- ✅ **Performance**: Matches GPT-4 on most tasks
- ✅ **Geological Knowledge**: Trained on diverse scientific data
- ✅ **Context Window**: 128K tokens (can process entire drill logs)
- ✅ **FREE**: Fully open-source (Meta license)
- ✅ **Privacy**: Runs 100% locally, data never leaves server
- ✅ **Hardware**: Runs on 48GB RAM or 2x RTX 4090 GPUs
- ✅ **Speed**: ~20 tokens/sec on modern hardware

**Alternative Models**:
- **DeepSeek V3 671B**: Best reasoning (requires more GPU)
- **Mistral Large 2**: Excellent instruction following
- **Qwen 2.5 72B**: Strong multilingual support
- **Llama 3.1 8B**: Smaller, faster, good for basic tasks

### Setup for Local Mode

```bash
# Install Ollama (Mac/Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Pull Llama 3.3 70B model
ollama pull llama3.3:70b

# Start Ollama server (OpenAI-compatible API)
ollama serve
# Runs on http://localhost:11434

# Test the model
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.3:70b",
  "prompt": "Identify the rock type: gray, fine-grained, contains pyrite"
}'
```

### Data Flow - Local Mode

```
User uploads core photo
   ↓
GeoForge Frontend (browser)
   ↓
GeoForge Backend (company server)
   ↓
Local AI Model (Ollama on same server)
   ↓
Analysis results
   ↓
GeoForge Backend
   ↓
User sees results

❌ No data ever leaves company network
✅ NDA compliant
✅ 100% private
✅ No per-API-call costs
```

---

## 🌐 CLOUD MODE (Internet-Enabled)

### When to Use Cloud Mode

1. **No NDA restrictions**: Early exploration, public domain data
2. **Web research needed**: "Find similar deposits globally"
3. **Latest AI models**: Access to GPT-4, Claude Sonnet 4.5, Grok
4. **Document analysis**: Can fetch papers, technical reports from web
5. **Real-time data**: Weather, commodity prices, news

### Cloud AI Stack (Already Configured)

- ✅ **Claude (Anthropic)**: Complex reasoning, technical reports
- ✅ **GPT-4 (OpenAI)**: Vision analysis, core photos
- ✅ **Grok (xAI)**: Geological context, web search

### Data Flow - Cloud Mode

```
User uploads core photo
   ↓
GeoForge Frontend (browser)
   ↓
GeoForge Backend (company server)
   ↓
External AI API (OpenAI/Anthropic/xAI)
   ↓
Analysis results
   ↓
GeoForge Backend
   ↓
User sees results

⚠️ Data sent to external APIs
⚠️ Requires NDA approval
✅ Can access web resources
✅ Latest AI models
```

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Configuration System

Create `.env.local` configuration:

```bash
# AI Mode Selection
VITE_AI_MODE=local  # Options: 'local' or 'cloud'

# Local AI Configuration
VITE_LOCAL_AI_URL=http://localhost:11434  # Ollama endpoint
VITE_LOCAL_AI_MODEL=llama3.3:70b          # Model to use

# Cloud AI Configuration (existing)
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
VITE_OPENAI_API_KEY=sk-proj-...
VITE_GROK_API_KEY=xai-...
```

### Phase 2: Unified AI Service

Create `src/lib/services/ai/AIService.ts`:

```typescript
import { ClaudeService } from './ClaudeService';
import { GPT4Service } from './GPT4Service';
import { GrokService } from './GrokService';
import { OllamaService } from './OllamaService';

export type AIMode = 'local' | 'cloud';

interface AIServiceConfig {
  mode: AIMode;
  localUrl?: string;
  localModel?: string;
}

export class AIService {
  private mode: AIMode;
  private localService?: OllamaService;
  private claudeService?: ClaudeService;
  private gpt4Service?: GPT4Service;
  private grokService?: GrokService;

  constructor(config: AIServiceConfig) {
    this.mode = config.mode;

    if (this.mode === 'local') {
      this.localService = new OllamaService({
        url: config.localUrl || 'http://localhost:11434',
        model: config.localModel || 'llama3.3:70b'
      });
    } else {
      this.claudeService = new ClaudeService();
      this.gpt4Service = new GPT4Service();
      this.grokService = new GrokService();
    }
  }

  async analyzeCorePhoto(imageData: string, context: string): Promise<CoreAnalysis> {
    if (this.mode === 'local') {
      // Use local Ollama model
      return await this.localService!.analyzeCorePhoto(imageData, context);
    } else {
      // Use cloud GPT-4 Vision
      return await this.gpt4Service!.analyzeCorePhoto(imageData, context);
    }
  }

  async generateReport(data: GeologicalData): Promise<string> {
    if (this.mode === 'local') {
      // Use local Ollama model
      return await this.localService!.generateReport(data);
    } else {
      // Use cloud Claude (best at reports)
      return await this.claudeService!.generateReport(data);
    }
  }

  async naturalLanguageQuery(query: string, webSearch: boolean = false): Promise<QueryResult> {
    if (this.mode === 'local') {
      if (webSearch) {
        throw new Error('Web search not available in local mode. Switch to cloud mode for internet access.');
      }
      return await this.localService!.query(query);
    } else {
      // Use cloud Grok (has web access)
      return await this.grokService!.query(query, webSearch);
    }
  }

  getMode(): AIMode {
    return this.mode;
  }

  switchMode(newMode: AIMode): void {
    // Reinitialize services for new mode
    this.mode = newMode;
    // ... reload config
  }
}
```

### Phase 3: UI Toggle for AI Mode

Add to settings or dashboard:

```typescript
// AI Mode Selector Component
const AIModeSelector: React.FC = () => {
  const [aiMode, setAIMode] = useState<AIMode>('local');
  const [showWarning, setShowWarning] = useState(false);

  const handleModeChange = (mode: AIMode) => {
    if (mode === 'cloud') {
      setShowWarning(true);
    } else {
      setAIMode(mode);
      // Update config
    }
  };

  return (
    <div className="p-6 rounded-xl border border-white/10 backdrop-blur-xl bg-white/5">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-amber-400" />
        AI Mode Configuration
      </h3>
      
      <div className="space-y-4">
        {/* Local Mode */}
        <button
          onClick={() => handleModeChange('local')}
          className={`w-full p-4 rounded-lg border transition-all ${
            aiMode === 'local'
              ? 'border-green-500 bg-green-500/10'
              : 'border-white/10 bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-green-400" />
            <div className="text-left">
              <div className="font-semibold">🔒 Local Mode (Private)</div>
              <div className="text-sm text-gray-400">
                AI runs on your servers. Data never leaves your network.
              </div>
              <div className="text-xs text-green-400 mt-1">
                ✅ NDA Compliant • ✅ 100% Private • ✅ No API Costs
              </div>
            </div>
          </div>
        </button>

        {/* Cloud Mode */}
        <button
          onClick={() => handleModeChange('cloud')}
          className={`w-full p-4 rounded-lg border transition-all ${
            aiMode === 'cloud'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-white/10 bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-400" />
            <div className="text-left">
              <div className="font-semibold">🌐 Cloud Mode (Internet-Enabled)</div>
              <div className="text-sm text-gray-400">
                AI uses external APIs. Can access web resources.
              </div>
              <div className="text-xs text-blue-400 mt-1">
                ✅ Latest Models • ✅ Web Access • ⚠️ Requires NDA Approval
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="mt-4 p-4 rounded-lg border border-amber-500/50 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-400 mb-2">
                Cloud Mode Security Warning
              </div>
              <div className="text-sm text-gray-300 mb-3">
                Switching to Cloud Mode will send data to external AI APIs (OpenAI, Anthropic, xAI).
                Only use Cloud Mode if:
              </div>
              <ul className="text-sm text-gray-400 space-y-1 ml-4 mb-3">
                <li>• You have approval to use external AI services</li>
                <li>• Data is not covered under NDAs</li>
                <li>• Your company policy allows cloud AI</li>
              </ul>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAIMode('cloud');
                    setShowWarning(false);
                  }}
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-sm font-semibold"
                >
                  I Understand, Enable Cloud Mode
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-4 py-2 rounded border border-white/20 hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 🔐 SECURITY & COMPLIANCE

### Local Mode Guarantees

| Requirement | Status | Details |
|-------------|--------|---------|
| **Data Residency** | ✅ | All data stays on company servers |
| **NDA Compliance** | ✅ | No external data transmission |
| **GDPR Compliant** | ✅ | No personal data sent to third parties |
| **Air-Gap Ready** | ✅ | Can run without internet |
| **Audit Trail** | ✅ | All AI requests logged locally |
| **No Vendor Lock-in** | ✅ | Open-source models, portable |

### Cloud Mode Considerations

| Aspect | Details |
|--------|---------|
| **Data Transmission** | ⚠️ Data sent to OpenAI/Anthropic/xAI servers |
| **Storage** | ⚠️ May be temporarily stored by AI providers |
| **Compliance** | ⚠️ Requires legal review for NDA compliance |
| **Internet Required** | ⚠️ Cannot function offline |
| **Cost** | ⚠️ Per-token pricing from AI providers |

**Recommendation**: Use LOCAL mode by default for all exploration companies.

---

## 💰 COST COMPARISON

### Local Mode (Ollama + Llama 3.3 70B)

**One-Time Costs**:
- Server hardware: $5,000 - $15,000 (GPU server)
- OR use existing servers with GPU

**Ongoing Costs**:
- Electricity: ~$50-200/month (depending on usage)
- Maintenance: Included in IT budget

**Per-Query Cost**: $0.00 (unlimited)

**Total Year 1**: ~$5,000-15,000 one-time + ~$1,000/year ongoing  
**Total Year 2+**: ~$1,000/year

### Cloud Mode (Current Setup)

**Per-Query Costs**:
- Claude: ~$0.50 per core log analysis
- GPT-4: ~$0.30 per core photo analysis
- Grok: ~$0.20 per natural language query

**Monthly Estimate** (100 analyses/day):
- Core logging: 100 * $0.50 * 30 = $1,500/month
- Photo analysis: 50 * $0.30 * 30 = $450/month
- Queries: 200 * $0.20 * 30 = $1,200/month
- **Total**: ~$3,150/month = **$37,800/year**

**Breakeven**: Local mode pays for itself in ~6 months of heavy use.

---

## 📊 FEATURE MATRIX

| Feature | Local Mode | Cloud Mode |
|---------|------------|------------|
| **Core Photo Analysis** | ✅ (Llama Vision) | ✅ (GPT-4 Vision) |
| **Lithology Classification** | ✅ | ✅ |
| **Technical Reports** | ✅ | ✅ (Better with Claude) |
| **Natural Language Queries** | ✅ | ✅ |
| **Web Search** | ❌ | ✅ |
| **Internet Research** | ❌ | ✅ |
| **Real-time Updates** | ❌ | ✅ |
| **Multilingual** | ✅ | ✅ |
| **NDA Compliant** | ✅ | ⚠️ (Legal review required) |
| **Offline Operation** | ✅ | ❌ |
| **Cost** | FREE after setup | Per-token pricing |
| **Speed** | Fast (local GPU) | Depends on API |

---

## 🎯 RECOMMENDED DEPLOYMENT

### For Exploration Companies (NDA-Sensitive)

```
DEFAULT: 🔒 LOCAL MODE
- Use Ollama with Llama 3.3 70B
- All data processing on company servers
- NDA compliant by default
- No ongoing AI costs

OPTIONAL: 🌐 CLOUD MODE
- Enable for public/non-sensitive projects
- Require manager approval
- Log all cloud AI usage for audit
```

### Hardware Requirements - Local Mode

**Minimum** (Llama 3.1 8B):
- CPU: 8 cores
- RAM: 16GB
- GPU: Optional (runs on CPU)
- Storage: 10GB

**Recommended** (Llama 3.3 70B):
- CPU: 16+ cores
- RAM: 64GB
- GPU: 2x NVIDIA RTX 4090 (48GB VRAM) OR 1x A100 (80GB)
- Storage: 100GB SSD

**Enterprise** (DeepSeek V3 671B):
- CPU: 32+ cores
- RAM: 128GB+
- GPU: 4x NVIDIA H100 (320GB VRAM)
- Storage: 500GB SSD

---

## 🚀 IMPLEMENTATION TIMELINE

### Week 1: Local AI Setup
- Day 1-2: Install Ollama on server
- Day 3: Pull and test Llama 3.3 70B
- Day 4-5: Create OllamaService.ts integration

### Week 2: Unified AI Service
- Day 1-3: Build AIService.ts with mode switching
- Day 4-5: Create UI toggle component

### Week 3: Testing & Optimization
- Day 1-2: Test local mode with real geological data
- Day 3-4: Performance tuning (GPU optimization)
- Day 5: Security audit and documentation

### Week 4: Production Deployment
- Day 1-2: Deploy to staging environment
- Day 3: Client testing and feedback
- Day 4-5: Production rollout

---

## 🍄 MYCELIAL PATHWAY

```
Company configures AI mode
   ↓
┌─────────────┐
│ NDA data?   │
└─────┬───────┘
      │
      ├─→ YES → 🔒 LOCAL MODE
      │           ↓
      │        Ollama (Llama 3.3 70B)
      │           ↓
      │        Analysis on company server
      │           ↓
      │        Results (100% private)
      │
      └─→ NO  → 🌐 CLOUD MODE
                  ↓
               Claude + GPT-4 + Grok
                  ↓
               Can access web resources
                  ↓
               Results (with citations)
```

---

## ✅ NEXT STEPS

1. **Install Ollama** on development server
2. **Test Llama 3.3 70B** with geological prompts
3. **Build OllamaService.ts** service layer
4. **Create AI mode selector** UI component
5. **Update documentation** for enterprise clients
6. **Security review** by legal team
7. **Performance benchmark** local vs cloud
8. **Client demo** showing both modes

---

**🔒 GeoForge: The ONLY geological platform with true hybrid AI - Private when needed, Internet-enabled when desired.**

*Next agent: Begin Ollama integration and build OllamaService.ts*

