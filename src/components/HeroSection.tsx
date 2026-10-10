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
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onExploreDashboard }) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0c2918] border border-emerald-900/60 shadow-2xl my-4">
      {/* Background Texture & Organic Food Imagery (Kraft Paper Bags with Produce) */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Subtle radial ambient glows */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
        
        {/* Left Side: Grocery bag with fresh greens, lettuce, celery, cauliflower */}
        <div className="absolute left-[-20px] sm:left-[-10px] md:left-0 top-12 bottom-12 w-[180px] sm:w-[260px] md:w-[320px] opacity-40 md:opacity-75 transition-opacity">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
            alt="Fresh produce and groceries in kraft paper bag"
            className="w-full h-full object-cover object-left mask-radial mix-blend-luminosity filter contrast-125 brightness-95"
            style={{
              maskImage: 'linear-gradient(to right, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 100%)'
            }}
          />
        </div>

        {/* Right Side: Grocery bag overflowing with vibrant bell peppers, tomatoes, eggplants */}
        <div className="absolute right-[-20px] sm:right-[-10px] md:right-0 top-12 bottom-12 w-[180px] sm:w-[260px] md:w-[340px] opacity-40 md:opacity-75 transition-opacity">
          <img
            src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80"
            alt="Assorted fresh red tomatoes, peppers, and vegetables"
            className="w-full h-full object-cover object-right mask-radial mix-blend-luminosity filter contrast-125 brightness-95"
            style={{
              maskImage: 'linear-gradient(to left, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)'
            }}
          />
        </div>

        {/* Textured noise grain overlay */}
        <div 
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 text-center">
        {/* Title Headlines */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-slate-50 leading-[1.08] mb-3">
          <span>Keep track of your</span>
          <br />
          <span className="text-[#a3e635] font-serif italic">food donations</span>
        </h1>

        {/* Subtitle */}
        <p className="font-serif italic text-lg sm:text-2xl text-emerald-100/90 tracking-wide font-normal mb-8">
          Keep more by giving more.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14">
          <button
            onClick={onGetStarted}
            className="px-7 py-3 rounded-full bg-[#a3e635] hover:bg-[#91d12d] text-slate-950 font-bold text-sm tracking-wide transition-all transform hover:scale-105 shadow-xl shadow-lime-500/20 cursor-pointer"
          >
            Join the Waitlist
          </button>

          <button
            onClick={onExploreDashboard}
            className="px-7 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all transform hover:scale-105 shadow-lg shadow-black/30 cursor-pointer"
          >
            View Dashboard tour
          </button>
        </div>

        {/* Elevated Floating Dashboard Preview Card (Inspired directly by the uploaded screenshot) */}
        <div className="relative mx-auto max-w-4xl text-left bg-[#f4f7f4] text-slate-900 rounded-2xl shadow-2xl border border-emerald-800/40 overflow-hidden transform transition-transform hover:-translate-y-1 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
            {/* Left Sidebar */}
            <aside className="md:col-span-3 bg-white p-5 border-r border-slate-200/80 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Brand */}
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#a3e635] flex items-center justify-center font-bold text-xs text-slate-900">
                    FP
                  </span>
                  <span className="font-bold text-sm tracking-tight text-slate-900">FOODPOOL</span>
                </div>

                {/* Nav Links */}
                <div className="space-y-4 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    OVERVIEW
                  </span>
                  <div className="space-y-1">
                    <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#e8f5e9] text-[#166534] font-semibold text-left">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Dashboard
                    </button>
                    <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-left">
                      <MapPin className="w-3.5 h-3.5" />
                      Shelter Map
                    </button>
                    <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-left">
                      <History className="w-3.5 h-3.5" />
                      Donation History
                    </button>
                    <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-left">
                      <Package className="w-3.5 h-3.5" />
                      Items
                    </button>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">
                    TAX / ESG
                  </span>
                  <div className="space-y-1">
                    <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-left">
                      <Receipt className="w-3.5 h-3.5" />
                      Tax Overview
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom footer tag */}
              <div className="text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                Tamil Nadu Verified Network
              </div>
            </aside>

            {/* Main Center & Right Content */}
            <div className="md:col-span-9 p-5 space-y-5 bg-[#f4f7f4]">
              {/* Top Banner: Your Impact & + Make Donation */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Your Impact</h3>
                  <button
                    onClick={onGetStarted}
                    className="flex items-center gap-1.5 bg-[#a3e635] hover:bg-[#8fd029] text-slate-950 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer shadow-sm transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + Make Donation
                  </button>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#f9faf9] p-3 rounded-lg border border-slate-200/60">
                    <span className="text-xl font-bold font-mono text-slate-900 block">26</span>
                    <span className="text-[11px] text-slate-500 font-medium">Total Donations</span>
                  </div>
                  <div className="bg-[#f9faf9] p-3 rounded-lg border border-slate-200/60">
                    <span className="text-xl font-bold font-mono text-slate-900 block">₹2,85,100</span>
                    <span className="text-[11px] text-slate-500 font-medium">Value Donated</span>
                  </div>
                  <div className="bg-[#f9faf9] p-3 rounded-lg border border-slate-200/60">
                    <span className="text-xl font-bold font-mono text-slate-900 block">18</span>
                    <span className="text-[11px] text-slate-500 font-medium">Shelters Helped</span>
                  </div>
                </div>
              </div>

              {/* Lower Section: Recent Donations & Urgent Needs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Recent Donations Table */}
                <div className="lg:col-span-8 bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-slate-900">Recent Donations</h4>
                    <span className="text-[10px] text-emerald-700 font-medium hover:underline cursor-pointer">
                      View All →
                    </span>
                  </div>

                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-semibold">
                          <th className="pb-1.5">Food Item</th>
                          <th className="pb-1.5">Shelter</th>
                          <th className="pb-1.5">Quantity</th>
                          <th className="pb-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="py-2 font-medium text-slate-900">Sambar Rice & Poriyal</td>
                          <td className="py-2 text-slate-600">Udhavum Karangal</td>
                          <td className="py-2 font-mono">16 kg (45 meals)</td>
                          <td className="py-2 text-emerald-700 font-semibold">✓ In Transit</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium text-slate-900">Jeera Rice & Dal</td>
                          <td className="py-2 text-slate-600">Akshaya Patra</td>
                          <td className="py-2 font-mono">22 kg (65 meals)</td>
                          <td className="py-2 text-amber-700 font-semibold">Available</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium text-slate-900">Fresh Bakery Breads</td>
                          <td className="py-2 text-slate-600">Anbalayam Shelter</td>
                          <td className="py-2 font-mono">12 kg (50 meals)</td>
                          <td className="py-2 text-blue-700 font-semibold">Delivered</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Demo Restaurant & Urgent Help Needed Card */}
                <div className="lg:col-span-4 space-y-3">
                  {/* Demo Restaurant Profile Card */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-sm text-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-slate-900">Demo Restaurant</span>
                    </div>
                    <img
                      src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80"
                      alt="Restaurant exterior"
                      className="w-full h-16 object-cover rounded-md mb-1.5"
                    />
                    <p className="text-[10px] text-slate-500">T. Nagar, Chennai · FSSAI Certified</p>
                  </div>

                  {/* Urgent Help Needed Card */}
                  <div className="bg-[#f0fdf4] rounded-xl p-3 border border-emerald-200 shadow-sm text-xs space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide block">
                        Urgent Help Needed
                      </span>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        These shelters are critically low on supplies.
                      </p>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-emerald-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-[11px] block">Harbor Haven Shelter</span>
                        <span className="text-[9px] text-rose-600 font-bold uppercase">Critical Demand</span>
                      </div>
                      <button
                        onClick={onGetStarted}
                        className="px-2.5 py-1 bg-[#a3e635] text-slate-950 font-bold rounded text-[10px] hover:bg-[#8ed028]"
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
