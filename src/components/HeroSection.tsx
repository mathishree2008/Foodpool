import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  LayoutDashboard, 
  MapPin, 
  History, 
  Package, 
  Receipt, 
  PlusCircle, 
  AlertCircle,
  Building2,
  CheckCircle2
} from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onExploreDashboard: () => void;
  onNavigateTab?: (tab: 'surplus_map' | 'volunteer_tracking' | 'donor' | 'express_post' | 'clusters_routing') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onExploreDashboard, onNavigateTab }) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-black border border-[#d4af37]/40 shadow-2xl my-4">
      {/* Background Texture & Real Food Delivery Imagery */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Subtle gold radial ambient glows */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#d4af37]/10 rounded-full blur-3xl" />
        
        {/* Left Side: Real food delivery volunteer courier with thermal food bag */}
        <div className="absolute left-[-20px] sm:left-[-10px] md:left-0 top-6 bottom-6 w-[200px] sm:w-[280px] md:w-[360px] opacity-35 md:opacity-60 transition-opacity">
          <img
            src="https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1000&q=80"
            alt="Food delivery courier carrying warm packaged meals in transit"
            className="w-full h-full object-cover object-center mask-radial mix-blend-luminosity filter contrast-125 brightness-90"
            style={{
              maskImage: 'linear-gradient(to right, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 100%)'
            }}
          />
        </div>

        {/* Right Side: Volunteers packaging and distributing hot cooked meals */}
        <div className="absolute right-[-20px] sm:right-[-10px] md:right-0 top-6 bottom-6 w-[200px] sm:w-[280px] md:w-[380px] opacity-35 md:opacity-60 transition-opacity">
          <img
            src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=80"
            alt="Community volunteers packing hot meal containers for redistribution"
            className="w-full h-full object-cover object-center mask-radial mix-blend-luminosity filter contrast-125 brightness-90"
            style={{
              maskImage: 'linear-gradient(to left, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)'
            }}
          />
        </div>

        {/* Textured noise grain overlay */}
        <div 
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #d4af37 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 text-center">
        {/* Title Headlines */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white leading-[1.08] mb-3">
          <span>Keep track of your</span>
          <br />
          <span className="text-[#d4af37] font-serif italic">food donations</span>
        </h1>

        {/* Subtitle */}
        <p className="font-serif italic text-lg sm:text-2xl text-zinc-300 tracking-wide font-normal mb-8">
          Keep more by giving more.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14">
          <button
            onClick={onGetStarted}
            className="px-7 py-3 rounded-full bg-[#d4af37] hover:bg-[#b89528] text-black font-bold text-sm tracking-wide transition-all transform hover:scale-105 shadow-xl shadow-[#d4af37]/20 cursor-pointer"
          >
            Join the Waitlist
          </button>

          <button
            onClick={onExploreDashboard}
            className="px-7 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition-all transform hover:scale-105 shadow-lg shadow-black/60 cursor-pointer"
          >
            View Dashboard tour
          </button>
        </div>

        {/* Elevated Floating Dashboard Preview Card */}
        <div className="relative mx-auto max-w-4xl text-left bg-black text-white rounded-2xl shadow-2xl border border-[#d4af37]/50 overflow-hidden transform transition-transform hover:-translate-y-1 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
            {/* Left Sidebar */}
            <aside className="md:col-span-3 bg-zinc-950 p-5 border-r border-zinc-800 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Brand */}
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#d4af37] flex items-center justify-center font-bold text-xs text-black">
                    FP
                  </span>
                  <span className="font-bold text-sm tracking-tight text-white">FOODPOOL</span>
                </div>

                {/* Nav Links */}
                <div className="space-y-4 text-xs">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    OVERVIEW
                  </span>
                  <div className="space-y-1">
                    <button 
                      onClick={onExploreDashboard}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 text-[#d4af37] border border-[#d4af37]/30 font-semibold text-left cursor-pointer hover:bg-zinc-800"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Live Volunteer Tracking
                    </button>
                    <button 
                      onClick={() => onNavigateTab ? onNavigateTab('surplus_map') : onExploreDashboard()}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white text-left cursor-pointer hover:bg-zinc-900"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Surplus Food Map
                    </button>
                    <button 
                      onClick={() => onNavigateTab ? onNavigateTab('clusters_routing') : onExploreDashboard()}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white text-left cursor-pointer hover:bg-zinc-900"
                    >
                      <History className="w-3.5 h-3.5" />
                      Micro-Clusters
                    </button>
                    <button 
                      onClick={() => onNavigateTab ? onNavigateTab('donor') : onExploreDashboard()}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white text-left cursor-pointer hover:bg-zinc-900"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Donor Food Post
                    </button>
                  </div>

                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block pt-2">
                    TAX / ESG
                  </span>
                  <div className="space-y-1">
                    <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white text-left">
                      <Receipt className="w-3.5 h-3.5" />
                      Tax Overview
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom footer tag */}
              <div className="text-[10px] text-zinc-500 pt-4 border-t border-zinc-800">
                Tamil Nadu Verified Network
              </div>
            </aside>

            {/* Main Center & Right Content */}
            <div className="md:col-span-9 p-5 space-y-5 bg-black">
              {/* Top Banner: Your Impact & + Make Donation */}
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Your Impact</h3>
                  <button
                    onClick={onGetStarted}
                    className="flex items-center gap-1.5 bg-[#d4af37] hover:bg-[#b89528] text-black px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer shadow-sm transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + Make Donation
                  </button>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-black p-3 rounded-lg border border-zinc-800">
                    <span className="text-xl font-bold font-mono text-[#d4af37] block">26</span>
                    <span className="text-[11px] text-zinc-400 font-medium">Total Donations</span>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-zinc-800">
                    <span className="text-xl font-bold font-mono text-white block">₹2,85,100</span>
                    <span className="text-[11px] text-zinc-400 font-medium">Value Donated</span>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-zinc-800">
                    <span className="text-xl font-bold font-mono text-[#d4af37] block">18</span>
                    <span className="text-[11px] text-zinc-400 font-medium">Shelters Helped</span>
                  </div>
                </div>
              </div>

              {/* Lower Section: Recent Donations & Urgent Needs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Recent Donations Table */}
                <div className="lg:col-span-8 bg-zinc-950 rounded-xl p-4 border border-zinc-800 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-white">Recent Donations</h4>
                    <span className="text-[10px] text-[#d4af37] font-medium hover:underline cursor-pointer">
                      View All →
                    </span>
                  </div>

                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase font-semibold">
                          <th className="pb-1.5">Food Item</th>
                          <th className="pb-1.5">Shelter</th>
                          <th className="pb-1.5">Quantity</th>
                          <th className="pb-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 text-zinc-300">
                        <tr>
                          <td className="py-2 font-medium text-white">Sambar Rice & Poriyal</td>
                          <td className="py-2 text-zinc-400">Udhavum Karangal</td>
                          <td className="py-2 font-mono text-[#d4af37]">16 kg (45 meals)</td>
                          <td className="py-2 text-[#d4af37] font-semibold">✓ In Transit</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium text-white">Jeera Rice & Dal</td>
                          <td className="py-2 text-zinc-400">Akshaya Patra</td>
                          <td className="py-2 font-mono text-[#d4af37]">22 kg (65 meals)</td>
                          <td className="py-2 text-emerald-400 font-semibold">Available</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium text-white">Fresh Bakery Breads</td>
                          <td className="py-2 text-zinc-400">Anbalayam Shelter</td>
                          <td className="py-2 font-mono text-[#d4af37]">12 kg (50 meals)</td>
                          <td className="py-2 text-zinc-400 font-semibold">Delivered</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Demo Restaurant & Urgent Help Needed Card */}
                <div className="lg:col-span-4 space-y-3">
                  {/* Demo Restaurant Profile Card */}
                  <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 shadow-sm text-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Building2 className="w-4 h-4 text-[#d4af37]" />
                      <span className="font-bold text-white">Demo Restaurant</span>
                    </div>
                    <img
                      src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80"
                      alt="Restaurant exterior"
                      className="w-full h-16 object-cover rounded-md mb-1.5 border border-zinc-800"
                    />
                    <p className="text-[10px] text-zinc-400">T. Nagar, Chennai · FSSAI Certified</p>
                  </div>

                  {/* Urgent Help Needed Card */}
                  <div className="bg-black rounded-xl p-3 border border-[#d4af37]/40 shadow-sm text-xs space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wide block">
                        Urgent Help Needed
                      </span>
                      <p className="text-[11px] text-zinc-300 mt-0.5">
                        These shelters are critically low on supplies.
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-[11px] block">Harbor Haven Shelter</span>
                        <span className="text-[9px] text-rose-500 font-bold uppercase">Critical Demand</span>
                      </div>
                      <button
                        onClick={onGetStarted}
                        className="px-2.5 py-1 bg-[#d4af37] text-black font-bold rounded text-[10px] hover:bg-[#b89528]"
                      >
                        Donate Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
