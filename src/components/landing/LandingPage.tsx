import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mountain, 
  Sparkles, 
  Video, 
  Zap, 
  Brain, 
  Globe, 
  Shield, 
  TrendingUp,
  ArrowRight,
  Check,
  Layers,
  Database,
  Cpu,
  Cloud,
  Users,
  MessageSquare,
  Eye,
  Map
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Core Analysis",
      description: "GPT-4 Vision automatically identifies lithology, alteration, and mineralization from core photos. Reduce logging time by 40%.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Real-Time Collaboration",
      description: "Video calls with cursor control built into every module. Field geologists connect with seniors instantly for core reviews.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Natural Language Queries",
      description: "Ask 'Show me all holes with gold >1g/t in altered volcanics' - Grok AI understands geological context.",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Cloud-Native Architecture",
      description: "Zero installation, instant collaboration, automatic updates. Access from any device, anywhere in the world.",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const advantages = [
    {
      icon: <Cpu className="w-6 h-6" />,
      title: "AI-First Design",
      competitor: "Micromine: Basic AI tools",
      geoforge: "Claude + GPT-4 + Grok for lithology classification, predictive assays, anomaly detection"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Built-in Collaboration",
      competitor: "Micromine: Separate Nexus subscription",
      geoforge: "Video + chat + cursor control in every module by default"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Cloud-Native",
      competitor: "Micromine: Desktop-heavy Windows apps",
      geoforge: "Web-based, mobile-first, works on iPads in the field offline"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Modern UI/UX",
      competitor: "Micromine: Legacy desktop interface",
      geoforge: "React 18, responsive, touch-optimized, beautiful glassmorphism design"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Transparent Pricing",
      competitor: "Micromine: Enterprise licensing, $50K+ upfront",
      geoforge: "SaaS model, start at $500/month for 3 users, no hidden costs"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Data Portability",
      competitor: "Micromine: Limited export formats",
      geoforge: "Export to ALL formats: Surpac, Datamine, Leapfrog, even Micromine's own format"
    }
  ];

  const stats = [
    { value: "40%", label: "Faster Core Logging" },
    { value: "100%", label: "Cloud Native" },
    { value: "24/7", label: "Global Access" },
    { value: "AI", label: "Powered Analysis" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl"
          style={{
            top: '10%',
            left: '10%',
            transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.05}px)`
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl"
          style={{
            top: '50%',
            right: '10%',
            transform: `translate(${-scrollY * 0.08}px, ${scrollY * 0.06}px)`
          }}
        />
        <div 
          className="absolute w-[700px] h-[700px] rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-3xl"
          style={{
            bottom: '10%',
            left: '30%',
            transform: `translate(${scrollY * 0.06}px, ${-scrollY * 0.04}px)`
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mountain className="w-8 h-8 text-amber-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                GeoForge
              </span>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-gray-300 hover:text-white transition-colors">
                Features
              </button>
              <button className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </button>
              <button className="text-gray-300 hover:text-white transition-colors">
                Docs
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
              >
                Launch App
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 backdrop-blur-xl bg-white/5 mb-8 group hover:border-amber-400/50 transition-colors">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-gray-300">AI-Powered Geological Platform</span>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Geological Exploration
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              The first cloud-native exploration platform with AI core analysis, real-time collaboration, 
              and natural language queries. Built for modern geologists who demand speed, accuracy, and intelligence.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/dashboard')}
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all shadow-2xl shadow-amber-500/25 flex items-center gap-2 text-lg font-semibold"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-xl border border-white/20 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all text-lg font-semibold">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, idx) => (
                <div 
                  key={idx}
                  className="p-6 rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Revolutionary Features
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to transform exploration workflows, powered by cutting-edge AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`group p-8 rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer ${
                  activeFeature === idx ? 'ring-2 ring-amber-400/50 border-amber-400/50' : ''
                }`}
                onMouseEnter={() => setActiveFeature(idx)}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Layers />, title: "3D Visualization", desc: "Three.js powered drill hole viewer" },
              { icon: <Database />, title: "PostgreSQL + PostGIS", desc: "Industry-standard geological database" },
              { icon: <Users />, title: "Team Management", desc: "Invite-only security, role-based access" },
              { icon: <MessageSquare />, title: "Real-Time Chat", desc: "Ably-powered team messaging" },
              { icon: <Eye />, title: "Offline Mode", desc: "Core logging without internet, auto-sync" },
              { icon: <Map />, title: "GIS Integration", desc: "Export to ArcGIS, QGIS, all formats" }
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center mb-4 text-amber-400 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Why Choose GeoForge?
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              How we surpass legacy platforms like Micromine
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {advantages.map((adv, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    {adv.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">{adv.title}</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <p className="text-sm text-gray-400">{adv.competitor}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-200">{adv.geoforge}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl border border-white/10 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Ready to Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Exploration Workflow?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join the next generation of geological exploration. AI-powered, cloud-native, collaboration-first.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all shadow-2xl shadow-amber-500/25 flex items-center gap-2 text-lg font-semibold"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-xl border border-white/20 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all text-lg font-semibold">
                Schedule Demo
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-xl bg-black/20 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mountain className="w-6 h-6 text-amber-400" />
              <span className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                GeoForge
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 GeoForge. Built for Modern Geologists.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

