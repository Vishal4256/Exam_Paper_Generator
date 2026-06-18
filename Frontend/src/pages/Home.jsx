import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Brain, Database, Shuffle, FileText, 
  Building2, Sliders, LayoutList, ShieldCheck, 
  CheckCircle2, ArrowRight, Star, Zap,
  GraduationCap, School, BookOpen, Users,
  Check
} from 'lucide-react';

const Home = () => {
  const handleAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/register';
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="bg-[#0B0F19] text-white font-sans w-full min-h-screen overflow-hidden selection:bg-indigo-500/30">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="text-left">
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                <span>ExamFlow AI 2.0 is now live</span>
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Generate Professional <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  Exam Papers
                </span> in Seconds
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
                Create, manage, and generate institution-ready exam papers with AI-powered question generation, customizable templates, PDF export, and smart question banks.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleAuth} className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => window.scrollTo({ top: document.getElementById('showcase').offsetTop, behavior: 'smooth' })} className="px-8 py-4 bg-gray-800/50 backdrop-blur-md text-white font-bold rounded-xl border border-gray-700 hover:bg-gray-800 transition-all">
                  View Demo
                </button>
              </motion.div>
            </motion.div>

            {/* Dashboard Mockup (CSS Wireframe) */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full aspect-[4/3] rounded-2xl bg-gray-900/50 backdrop-blur-xl border border-gray-800 shadow-2xl shadow-indigo-900/20 overflow-hidden flex flex-col"
            >
              {/* Mockup Header */}
              <div className="h-12 border-b border-gray-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className="ml-4 px-3 py-1 rounded bg-gray-800 text-xs text-gray-400 font-mono">examflow.ai/dashboard</div>
              </div>
              {/* Mockup Body */}
              <div className="flex-1 flex p-4 gap-4">
                <div className="w-48 h-full bg-gray-800/50 rounded-lg flex flex-col gap-2 p-3">
                  <div className="w-full h-8 bg-indigo-500/20 rounded"></div>
                  <div className="w-3/4 h-6 bg-gray-800 rounded mt-4"></div>
                  <div className="w-5/6 h-6 bg-gray-800 rounded"></div>
                  <div className="w-2/3 h-6 bg-gray-800 rounded"></div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="w-48 h-8 bg-gray-800 rounded"></div>
                    <div className="w-24 h-8 bg-indigo-600 rounded"></div>
                  </div>
                  <div className="flex-1 bg-gray-800/30 rounded-lg border border-gray-800 p-4">
                    <div className="w-full h-12 bg-gray-800 rounded mb-4"></div>
                    <div className="w-full h-12 bg-gray-800 rounded mb-4"></div>
                    <div className="w-full h-12 bg-gray-800 rounded"></div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. STATISTICS SECTION */}
      <section className="py-12 border-y border-gray-800 bg-gray-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10,000+", label: "Questions Generated" },
              { value: "500+", label: "Teachers" },
              { value: "100+", label: "Institutions" },
              { value: "99.9%", label: "Reliability" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to create exams</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">A complete toolkit designed for educators to streamline the entire assessment creation process.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Brain />, title: "AI Question Generator", desc: "Instantly create high-quality questions on any topic." },
              { icon: <Database />, title: "Smart Question Bank", desc: "Organize, tag, and search your entire question repository." },
              { icon: <Shuffle />, title: "Randomized Creation", desc: "Generate unique test variations instantly." },
              { icon: <FileText />, title: "PDF Export", desc: "Download print-ready, perfectly formatted PDFs." },
              { icon: <Building2 />, title: "Institution Branding", desc: "Add your school logo, watermarks, and custom headers." },
              { icon: <Sliders />, title: "Difficulty-Based", desc: "Balance exams based on easy, medium, and hard ratios." },
              { icon: <LayoutList />, title: "Multiple Types", desc: "Support for MCQs, True/False, and Descriptive." },
              { icon: <ShieldCheck />, title: "Secure Auth", desc: "Enterprise-grade security and role management." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-gray-800/30 border border-gray-800 hover:border-indigo-500/50 transition-colors backdrop-blur-sm group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-32 bg-gray-900/30 border-y border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-900/10 blur-[100px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">How ExamFlow Works</h2>
              <p className="text-gray-400 text-lg mb-12">From a blank canvas to a print-ready exam paper in four simple steps.</p>
              
              <div className="space-y-8">
                {[
                  { step: "01", title: "Add or Generate Questions", desc: "Input your own questions manually or let our AI generate them based on your syllabus." },
                  { step: "02", title: "Organize Question Bank", desc: "Categorize questions by subject, topic, and difficulty for easy retrieval later." },
                  { step: "03", title: "Configure Exam Pattern", desc: "Set total marks, duration, negative marking, and difficulty ratios." },
                  { step: "04", title: "Generate & Download", desc: "Click generate and instantly download a beautifully formatted PDF paper." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-indigo-400 font-mono font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2 text-white">{item.title}</h4>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Steps Visual Mockup */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-2xl bg-gray-800 p-8 border border-gray-700 shadow-2xl"
            >
               <div className="space-y-4">
                 <div className="p-4 rounded-xl bg-gray-700/50 border border-gray-600 flex items-center gap-4">
                   <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                   <div className="h-4 w-32 bg-gray-500 rounded"></div>
                 </div>
                 <div className="p-4 rounded-xl bg-gray-700/50 border border-gray-600 flex items-center gap-4">
                   <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                   <div className="h-4 w-48 bg-gray-500 rounded"></div>
                 </div>
                 <div className="p-4 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center gap-4 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]"></div>
                   <div className="w-8 h-8 rounded-full bg-indigo-500/50 flex items-center justify-center border border-indigo-400 animate-pulse"></div>
                   <div className="h-4 w-40 bg-indigo-300 rounded"></div>
                 </div>
                 <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 flex items-center gap-4 opacity-50">
                   <div className="w-8 h-8 rounded-full border border-gray-600"></div>
                   <div className="h-4 w-36 bg-gray-600 rounded"></div>
                 </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. SHOWCASE SECTION */}
      <section id="showcase" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for Modern Educators</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">A clean, intuitive interface that gets out of your way.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Grid of mockups */}
            <div className="md:col-span-2 h-80 rounded-2xl bg-gray-800/50 border border-gray-700 p-6 flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
               <Brain className="w-16 h-16 text-indigo-400 mb-4 opacity-80 group-hover:scale-110 transition-transform" />
               <h3 className="text-2xl font-bold text-white z-10">AI Generator Interface</h3>
            </div>
            <div className="h-80 rounded-2xl bg-gray-800/50 border border-gray-700 p-6 flex flex-col items-center justify-center relative overflow-hidden group">
               <Database className="w-16 h-16 text-purple-400 mb-4 opacity-80 group-hover:scale-110 transition-transform" />
               <h3 className="text-xl font-bold text-white z-10">Question Bank</h3>
            </div>
            <div className="h-80 rounded-2xl bg-gray-800/50 border border-gray-700 p-6 flex flex-col items-center justify-center relative overflow-hidden group">
               <Sliders className="w-16 h-16 text-emerald-400 mb-4 opacity-80 group-hover:scale-110 transition-transform" />
               <h3 className="text-xl font-bold text-white z-10">Exam Config</h3>
            </div>
            <div className="md:col-span-2 h-80 rounded-2xl bg-gray-800/50 border border-gray-700 p-6 flex flex-col items-center justify-center relative overflow-hidden group">
               <FileText className="w-16 h-16 text-blue-400 mb-4 opacity-80 group-hover:scale-110 transition-transform" />
               <h3 className="text-2xl font-bold text-white z-10">PDF Preview Engine</h3>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INSTITUTION FEATURES */}
      <section className="py-24 bg-indigo-900/20 border-y border-indigo-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <School />, title: "Schools", desc: "Perfect for K-12 assessments." },
              { icon: <GraduationCap />, title: "Colleges", desc: "Manage department-wide exams." },
              { icon: <Building2 />, title: "Universities", desc: "Scale across massive faculties." },
              { icon: <Users />, title: "Coaching", desc: "Rapid mock test generation." }
            ].map((inst, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  {inst.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{inst.title}</h3>
                <p className="text-indigo-200/60">{inst.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-20">Loved by Educators</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: "ExamFlow has cut my test preparation time by 80%. The AI generator understands exactly what level of difficulty I need.", author: "Dr. Sarah Jenkins", role: "University Professor" },
              { quote: "The PDF formatting is flawless. We use the institution branding feature to make all our mock tests look completely professional.", author: "Michael Chen", role: "Coaching Director" },
              { quote: "Having our entire question bank digitized and searchable has been a game changer for our high school science department.", author: "Emma Thompson", role: "High School Teacher" }
            ].map((t, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-gray-800/30 border border-gray-700 relative"
              >
                <div className="flex gap-1 text-yellow-500 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed">"{t.quote}"</p>
                <div>
                  <h4 className="font-bold text-white">{t.author}</h4>
                  <p className="text-gray-500 text-sm">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section id="pricing" className="py-32 bg-gray-900/30 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, transparent pricing</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Start for free, upgrade when you need AI power.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl bg-gray-800/30 border border-gray-700 flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Free Plan</h3>
              <p className="text-gray-400 mb-6">Perfect for individual teachers.</p>
              <div className="text-5xl font-bold text-white mb-8">$0<span className="text-xl text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Smart Question Bank', 'Manual Exam Generation', 'Basic PDF Export', 'Email Support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-gray-500" /> {feature}
                  </li>
                ))}
              </ul>
              <button onClick={handleAuth} className="w-full py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors">
                Get Started Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-900/40 to-gray-900 border border-indigo-500/50 flex flex-col relative shadow-2xl shadow-indigo-900/20">
              <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">Most Popular</div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro Plan</h3>
              <p className="text-indigo-200 mb-6">For power users and institutions.</p>
              <div className="text-5xl font-bold text-white mb-8">$29<span className="text-xl text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {['AI Question Generation', 'Institution Branding', 'Unlimited Exams', 'Advanced Templates', 'Priority Support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-indigo-100">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" /> {feature}
                  </li>
                ))}
              </ul>
              <button onClick={handleAuth} className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-lg shadow-indigo-600/20">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-[#05080f] border-t border-gray-800 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 text-indigo-400 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="font-bold text-2xl tracking-tight text-white">ExamFlow</span>
              </Link>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                The intelligent AI assessment platform built specifically for modern educators and institutions.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 text-sm">PRODUCT</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Home</a></li>
                <li><a href="#features" className="hover:text-indigo-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 text-sm">LEGAL</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} ExamFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;