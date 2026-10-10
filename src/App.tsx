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
import { RoleLoginGateway } from './components/RoleLoginGateway';
import { ExpressZeroLoginPost } from './components/ExpressZeroLoginPost';
import { ClusterRouteView } from './components/ClusterRouteView';
import { SurplusMapRadar } from './components/SurplusMapRadar';
import { VolunteerLiveTracking } from './components/VolunteerLiveTracking';
import { DonorPortal } from './components/DonorPortal';
import { TransporterPortal } from './components/TransporterPortal';
import { NgoPortal } from './components/NgoPortal';
import { ProblemsSolutionMatrix } from './components/ProblemsSolutionMatrix';
import { PrivacySecurityModal } from './components/PrivacySecurityModal';
import { AuthModal } from './components/AuthModal';
import { QrCodeModal } from './components/QrCodeModal';
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
  const stored = getStoredUser();
  // Initially show login gateway if user not logged in, otherwise default to overview
  const [currentRole, setCurrentRole] = useState<UserRole>(stored ? 'overview' : 'login_gateway');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(stored);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

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
    setCurrentRole('login_gateway');
    showToast('Signed out successfully. Role identification reset.');
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

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}! Switched to ${user.role.toUpperCase()} portal.`);
    // Route directly to their role-specific dashboard
    if (user.role === 'donor') setCurrentRole('donor');
    else if (user.role === 'ngo') setCurrentRole('ngo');
    else if (user.role === 'transporter') setCurrentRole('transporter');
    else setCurrentRole('overview');
    refreshData();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner Bar for User Status */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
          <span className="text-[#d4af37] font-medium tracking-wide">
            Tamil Nadu Live Redistribution Network Active (Chennai · Coimbatore · Madurai · Trichy)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <b>{currentUser.name}</b> ({currentUser.role.toUpperCase()})
              </span>
              <button
                onClick={handleLogout}
                className="text-zinc-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                Sign Out / Switch Role
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentRole('login_gateway')}
              className="text-[#d4af37] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Role Gateway / Login
            </button>
          )}

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="text-white hover:text-[#d4af37] flex items-center gap-1 cursor-pointer border-l border-zinc-800 pl-3 font-medium"
            title="Generate kitchen fridge QR sticker or pickup pass"
          >
            <Sparkles className="w-3 h-3 text-[#d4af37]" />
            QR Generator
          </button>

          <button
            onClick={handleResetDemoData}
            title="Reset database to seed state"
            className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer border-l border-zinc-800 pl-3"
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
        onOpenQrModal={() => setIsQrModalOpen(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-16 right-5 z-50 bg-black/95 border border-[#d4af37] text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold animate-bounce flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
          {notification}
        </div>
      )}

      {/* Main Application Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* 1. INITIAL ROLE IDENTIFICATION & LOGIN GATEWAY PAGE */}
        {currentRole === 'login_gateway' && (
          <RoleLoginGateway
            onSuccess={handleLoginSuccess}
            onExploreGuest={() => setCurrentRole('overview')}
          />
        )}

        {/* 2. ZERO-INSTALL 30-SECOND EXPRESS POST (QR / SMS NO LOGIN) */}
        {currentRole === 'express_post' && (
          <ExpressZeroLoginPost
            onSuccess={() => {
              refreshData();
              showToast('Micro-surplus uploaded to local cluster!');
            }}
            onViewClusters={() => setCurrentRole('clusters_routing')}
          />
        )}

        {/* 3. MULTI-CONTRIBUTOR MICRO-CLUSTERING & VIABILITY ROUTE ENGINE */}
        {currentRole === 'clusters_routing' && (
          <ClusterRouteView
            donations={donations}
            ngos={ngos}
            trips={trips}
            onRefresh={refreshData}
            onOpenExpressPost={() => setCurrentRole('express_post')}
          />
        )}

        {/* 4. DEDICATED SURPLUS FOOD MAP (GREEN: AVAILABLE vs RED: OCCUPIED) */}
        {currentRole === 'surplus_map' && (
          <SurplusMapRadar
            donations={donations}
            ngos={ngos}
            trips={trips}
            onReserveDonation={async (donationId) => {
              try {
                const targetNgo = ngos[0]?.id;
                await api.ngos.acceptDonation(donationId, targetNgo);
                await refreshData();
                showToast('Surplus reserved! Marker status changed to RED (Occupied).');
              } catch (err: any) {
                alert('Reservation error: ' + err.message);
              }
            }}
          />
        )}

        {/* 3. DEDICATED LIVE VOLUNTEER ORDER TRACKING PAGE */}
        {currentRole === 'volunteer_tracking' && (
          <VolunteerLiveTracking
            trips={trips}
            donations={donations}
            ngos={ngos}
            onRefresh={refreshData}
          />
        )}

        {/* 4. OVERVIEW / HERO & LEAFLET ROAD ROUTING VIEW */}
        {currentRole === 'overview' && (
          <>
            <HeroSection
              onGetStarted={() => setCurrentRole('login_gateway')}
              onExploreDashboard={() => setCurrentRole('volunteer_tracking')}
              onNavigateTab={(tab) => setCurrentRole(tab)}
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

        {/* 5. DISTINCT DONOR DASHBOARD LAYOUT (RESTAURANTS, HOSTEL MESSES, BAKERIES) */}
        {currentRole === 'donor' && (
          <DonorPortal
            donations={donations}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          />
        )}

        {/* 6. DISTINCT VOLUNTEER / TRANSPORTER DASHBOARD LAYOUT */}
        {currentRole === 'transporter' && (
          <TransporterPortal
            trips={trips}
            donations={donations}
            ngos={ngos}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          />
        )}

        {/* 7. DISTINCT RECEIVER NGO DASHBOARD LAYOUT */}
        {currentRole === 'ngo' && (
          <NgoPortal
            ngos={ngos}
            donations={donations}
            trips={trips}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          />
        )}

        {/* 8. 10 PROBLEMS & SOLUTIONS TECHNICAL VERIFICATION MATRIX */}
        {currentRole === 'problems_matrix' && (
          <ProblemsSolutionMatrix
            onNavigateTab={(tab) => setCurrentRole(tab)}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          />
        )}
      </main>

      {/* Global Auth Modal for instant access */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Privacy and Ephemeral Retention Modal */}
      <PrivacySecurityModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* QR Code Generator & Scanner Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        initialMode="sticker"
      />

      {/* Footer & Compliance Bar */}
      <footer className="border-t border-zinc-800 bg-black py-6 px-4 md:px-8 mt-12 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#d4af37] tracking-wider">FOODPOOL</span>
            <span>·</span>
            <span className="text-zinc-300">Tamil Nadu Surplus Food Redistribution & Route Pooling</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 text-[#d4af37] font-mono">
              <Shield className="w-3.5 h-3.5" />
              FSSAI & NGO Darpan Verified
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-white font-mono">
              <MapPin className="w-3.5 h-3.5" />
              OpenStreetMap Road Corridors
            </span>
            <span>·</span>
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-zinc-400 hover:text-[#d4af37] underline cursor-pointer"
            >
              48h Retention & Geo-Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
