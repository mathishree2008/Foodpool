/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { api, AuthUser, getStoredUser } from './services/api';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { LeafletMap } from './components/LeafletMap';
import { DonorPortal } from './components/DonorPortal';
import { TransporterPortal } from './components/TransporterPortal';
import { NgoPortal } from './components/NgoPortal';
import { ProblemsSolutionMatrix } from './components/ProblemsSolutionMatrix';
import { PrivacySecurityModal } from './components/PrivacySecurityModal';
import { AuthModal } from './components/AuthModal';
import { 
  Shield, 
  MapPin, 
  Sparkles, 
  LogOut, 
  UserCheck, 
  RefreshCw,
  Utensils,
  Car,
  HeartHandshake
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('overview');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Live state fetched from Express backend & MongoDB persistence layer
  const [donations, setDonations] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Refresh data from real API
  const refreshData = async () => {
    try {
      setLoading(true);
      const [donationsRes, ngosRes, tripsRes] = await Promise.all([
        api.donations.getAll(),
        api.ngos.getAll(),
        api.trips.getAll()
      ]);
      setDonations(donationsRes.donations || []);
      setNgos(ngosRes.ngos || []);
      setTrips(tripsRes.trips || []);
    } catch (err: any) {
      console.error('API fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // Refresh periodically every 25 seconds
    const interval = setInterval(refreshData, 25000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
    showToast('Signed out successfully.');
  };

  const handleResetDemoData = async () => {
    try {
      await api.auth.resetDemo();
      await refreshData();
      showToast('Database reset to fresh Tamil Nadu seed.');
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#07170e] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner Bar for User Status */}
      <div className="bg-[#0b2416] border-b border-emerald-950 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-ping" />
          <span className="text-emerald-300 font-medium">
            Tamil Nadu Live Redistribution Network Active (Chennai · Coimbatore · Madurai · Trichy)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-300 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#a3e635]" />
                <b>{currentUser.name}</b> ({currentUser.role.toUpperCase()})
              </span>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-[#a3e635] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sign In / Register Role
            </button>
          )}

          <button
            onClick={handleResetDemoData}
            title="Reset database to seed state"
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer border-l border-emerald-900 pl-3"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Data
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        onResetData={handleResetDemoData}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-16 right-5 z-50 bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold animate-bounce">
          {notification}
        </div>
      )}

      {/* Main Application Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Hero Section (Modeled directly after uploaded design screenshot) */}
        {currentRole === 'overview' && (
          <>
            <HeroSection
              onGetStarted={() => setIsAuthModalOpen(true)}
              onExploreDashboard={() => setCurrentRole('transporter')}
            />

            {/* Real Leaflet & OpenStreetMap Road Routing Integration */}
            <div className="space-y-3">
              <LeafletMap
                donations={donations}
                ngos={ngos}
                trips={trips}
                onAcceptMatch={async (tripId, donationId, ngoId, detourKm) => {
                  try {
                    await api.trips.acceptAssignment(tripId, { donationId, ngoId, detourKm });
                    await refreshData();
                    showToast('Route accepted and assigned! Proceed with pickup.');
                  } catch (err: any) {
                    alert('Error accepting assignment: ' + err.message);
                  }
                }}
              />
            </div>
          </>
        )}

        {/* Distinct Donor Dashboard Layout */}
        {currentRole === 'donor' && (
          <DonorPortal
            donations={donations}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          />
        )}

        {/* Distinct Transporter Dashboard Layout */}
        {currentRole === 'transporter' && (
          <TransporterPortal
            trips={trips}
            donations={donations}
            ngos={ngos}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          />
        )}

        {/* Distinct NGO Dashboard Layout */}
        {currentRole === 'ngo' && (
          <NgoPortal
            ngos={ngos}
            donations={donations}
            trips={trips}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          />
        )}

        {/* 10 Problems and Solutions Technical Verification Matrix */}
        {currentRole === 'problems_matrix' && (
          <ProblemsSolutionMatrix
            onNavigateTab={(tab) => setCurrentRole(tab)}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.name}!`);
          refreshData();
        }}
      />

      {/* Privacy and Ephemeral Retention Modal */}
      <PrivacySecurityModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Footer & Compliance Bar */}
      <footer className="border-t border-emerald-950/80 bg-[#06140c] py-6 px-4 md:px-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white tracking-wider">FOODPOOL</span>
            <span>·</span>
            <span>Tamil Nadu Surplus Food Redistribution & Route Pooling</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-[#a3e635] font-mono">
              <Shield className="w-3.5 h-3.5" />
              FSSAI & NGO Darpan Verified
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-teal-400 font-mono">
              <MapPin className="w-3.5 h-3.5" />
              OpenStreetMap Road Corridors
            </span>
            <span>·</span>
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-slate-300 hover:text-white underline cursor-pointer"
            >
              48h Retention & Geo-Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
