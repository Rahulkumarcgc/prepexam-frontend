import { SignedIn, SignedOut, SignIn, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const glassPanel = "bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]";
  const cardHover = "transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]";
  const textGradient = "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500";
  const navLink = "text-gray-500 hover:text-indigo-600 font-medium transition-colors cursor-pointer";

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fbfbfd]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/50 rounded-full blur-3xl pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/50 rounded-full blur-3xl pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }}></div>

      {/* HEADER */}
      <nav className={`fixed w-full z-50 ${glassPanel} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="h-6 w-6 text-white transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Prep<span className={textGradient}>Exam</span></h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <SignedOut>
              <a className={navLink}>Overview</a>
              <a className={navLink}>How it Works</a>
            </SignedOut>
            <SignedIn>
              <a onClick={() => navigate("/dashboard")} className={`${navLink} text-indigo-600 font-bold bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100`}>Dashboard →</a>
            </SignedIn>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex items-center gap-2 text-gray-500">
              <button className="p-2 hover:bg-gray-100 rounded-full transition"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">System Live</span>
            </div>

            <SignedOut>
              <button className="hidden sm:block px-5 py-2 text-sm font-semibold rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">Support</button>
            </SignedOut>
            <SignedIn><UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 border-2 border-indigo-50" } }} /></SignedIn>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white p-4 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
            <SignedOut>
              <a className={`${navLink} py-2`}>Overview</a>
              <a className={`${navLink} py-2`}>How it Works</a>
              <button className="w-full py-3 text-sm font-semibold rounded-xl text-indigo-600 bg-indigo-50">Contact Support</button>
            </SignedOut>
            <SignedIn>
              <button onClick={() => navigate("/dashboard")} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Enter Dashboard</button>
            </SignedIn>
          </div>
        )}
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 pt-32 pb-12">
        <SignedOut>
          {/* HERO */}
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto w-full mb-16 sm:mb-24">
            <div className="flex flex-col gap-6 text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-sm w-max mx-auto lg:mx-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                Version 2.0 is Live
              </div>
              <h2 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
                The Future of <br className="hidden lg:block"/>
                <span className={textGradient}>Online Validations.</span>
              </h2>
              <p className="text-lg lg:text-xl text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Experience a secure, ultra-fast, and completely seamless examination ecosystem designed for the modern generation.
              </p>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center w-full">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] blur-lg opacity-30 animate-pulse"></div>
                <div className={`relative rounded-[2rem] p-6 shadow-2xl ${glassPanel}`}>
                  <SignIn routing="hash" appearance={{ elements: { rootBox: "w-full", card: "shadow-none bg-transparent w-full", headerTitle: "text-2xl font-bold font-outfit text-gray-800", formButtonPrimary: "bg-indigo-600 text-white shadow-md", footer: "hidden"} }} />
                </div>
              </div>
            </div>
          </div>

          {/* QUICK STATS BANNER */}
          <div className="w-full max-w-7xl mx-auto mb-32 relative">
            <div className={`p-10 md:p-14 rounded-[2.5rem] flex flex-col md:flex-row justify-around items-center gap-8 ${glassPanel} border-indigo-100/50 bg-gradient-to-r from-white to-indigo-50/30 shadow-indigo-900/5`}>
              <div className="text-center">
                <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">15k<span className="text-indigo-600">+</span></h3>
                <p className="text-gray-500 font-medium tracking-wide border-t border-gray-200 pt-3">Exams Conducted</p>
              </div>
              <div className="hidden md:block w-px h-16 bg-gray-200"></div>
              <div className="text-center">
                <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">100<span className="text-emerald-500">%</span></h3>
                <p className="text-gray-500 font-medium tracking-wide border-t border-gray-200 pt-3">Tab Tracking Secure</p>
              </div>
              <div className="hidden md:block w-px h-16 bg-gray-200"></div>
              <div className="text-center">
                <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">Supabase</h3>
                <p className="text-gray-500 font-medium tracking-wide border-t border-gray-200 pt-3">Powered Infrastructure</p>
              </div>
            </div>
          </div>

          {/* HOW IT WORKS */}
          <section className="w-full max-w-7xl mx-auto py-20 border-t border-gray-200/60">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">A seamless 3-step pipeline designed to simplify examination creation, monitoring, and evaluation for everyone.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connector line (hidden on mobile) */}
              <div className="hidden md:block absolute top-[40%] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-600 to-indigo-200 z-0 opacity-40"></div>

              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-extrabold shadow-xl shadow-indigo-200 mb-6 border-4 border-white">1</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Admin Sets Exam</h3>
                <p className="text-gray-500 leading-relaxed px-4">Admin creates a dedicated portal, sets the duration, marking scheme, and assigns specific students.</p>
              </div>
              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl font-extrabold shadow-xl shadow-emerald-200 mb-6 border-4 border-white">2</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Questions Added</h3>
                <p className="text-gray-500 leading-relaxed px-4">Teachers use the isolated question bank to quickly add subject-wise MCQs to the upcoming tests.</p>
              </div>
              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center text-3xl font-extrabold shadow-xl shadow-orange-200 mb-6 border-4 border-white">3</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Secure Execution</h3>
                <p className="text-gray-500 leading-relaxed px-4">Students sit for the exam via the PrepExam Anti-Cheat UI. Their results are generated instantly upon submission.</p>
              </div>
            </div>
          </section>

          {/* ORIGINAL MODULE: CORE PLATFORM FEATURES */}
          <section className="features-section w-full max-w-7xl mx-auto py-20 mt-10 border-t border-gray-200/60">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Why choose PrepExam?</h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">We provide a state-of-the-art infrastructure designed to scale, secure, and streamline your entire examination workflow.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className={`p-8 rounded-3xl ${glassPanel} ${cardHover}`}>
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Anti-Cheat Mode 🛡️</h3>
                <p className="text-gray-500 leading-relaxed">Complete browser lockdown, tab-switch monitoring, and automated red-flagging to ensure 100% fair remote examinations.</p>
              </div>
              <div className={`p-8 rounded-3xl ${glassPanel} ${cardHover}`}>
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Auto-Grading Engine 🤖</h3>
                <p className="text-gray-500 leading-relaxed">Instant evaluation mechanism that calculates scores and negative markings the second a student submits the test.</p>
              </div>
              <div className={`p-8 rounded-3xl ${glassPanel} ${cardHover}`}>
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 text-orange-600">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Real-Time Leaderboards 🏆</h3>
                <p className="text-gray-500 leading-relaxed">Dynamic dashboards displaying top performers globally automatically sorting ties by time taken.</p>
              </div>
            </div>
          </section>
        </SignedOut>

        {/* LOGGED IN VIEW PREVIEW HERO */}
        <SignedIn>
          <div className="w-full max-w-4xl mx-auto min-h-[50vh] flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100/50">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Authentication Successful</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-lg">You are securely connected. Click the button below to enter your secure management tracking dashboard.</p>
            <button onClick={() => navigate("/dashboard")} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl text-white font-bold rounded-2xl flex items-center gap-3 transform hover:-translate-y-1">
              Enter Secure Dashboard <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </button>
          </div>
        </SignedIn>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-gray-200 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 tracking-tight">Prep<span className={textGradient}>Exam</span></h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">Revolutionizing digital examinations with unbreakable security, seamless user experience, and robust architectural scaling.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a className="hover:text-indigo-600 transition cursor-pointer">Features</a></li>
                <li><a className="hover:text-indigo-600 transition cursor-pointer">Integrations</a></li>
                <li><a className="hover:text-indigo-600 transition cursor-pointer">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a className="hover:text-indigo-600 transition cursor-pointer">Documentation</a></li>
                <li><a className="hover:text-indigo-600 transition cursor-pointer">Help Center</a></li>
                <li><a className="hover:text-indigo-600 transition cursor-pointer">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a className="hover:text-indigo-600 transition cursor-pointer">Privacy Policy</a></li>
                <li><a className="hover:text-indigo-600 transition cursor-pointer">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">© 2026 PrepExam platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
