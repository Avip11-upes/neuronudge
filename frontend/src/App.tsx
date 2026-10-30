import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from './store/sessionStore';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

// Pages
import Landing from './pages/Landing';
import Consent from './pages/Consent';
import Profile from './pages/Profile';
import CameraCheck from './pages/CameraCheck';
import StageHub from './pages/StageHub';
import AdhdStage from './pages/AdhdStage';
import DyslexiaStage from './pages/DyslexiaStage';
import AutismStage from './pages/AutismStage';
import Processing from './pages/Processing';
import Report from './pages/Report';
import History from './pages/History';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-100 selection:text-amber-900 font-sans">
            <Header />
            <main className="flex-1 w-full">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/consent" element={<Consent />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/camera-check" element={<CameraCheck />} />
                <Route path="/hub" element={<StageHub />} />
                <Route path="/adhd" element={<AdhdStage />} />
                <Route path="/dyslexia" element={<DyslexiaStage />} />
                <Route path="/autism" element={<AutismStage />} />
                <Route path="/processing" element={<Processing />} />
                <Route path="/report" element={<Report />} />
                <Route path="/history" element={<History />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  );
}
