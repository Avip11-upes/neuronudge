import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { COPY } from '../../lib/copy';
import { useSessionStore } from '../../store/sessionStore';
import { HeartHandshake } from 'lucide-react';

export function Header() {
  const location = useLocation();
  const { sessionId } = useSessionStore();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-50/90 backdrop-blur-md border-b border-stone-200/80 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 group-hover:bg-amber-500/25 transition-colors">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <span className="font-heading font-bold">{COPY.appName}</span>
        </Link>

        {/* Zone 2: 4 Clean Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          <Link
            to="/"
            className={`whitespace-nowrap transition-colors hover:text-stone-900 ${
              isActive('/') ? 'text-stone-950 font-semibold' : ''
            }`}
          >
            Home
          </Link>
          <Link
            to="/hub"
            className={`whitespace-nowrap transition-colors hover:text-stone-900 ${
              isActive('/hub') ? 'text-stone-950 font-semibold' : ''
            }`}
          >
            Stage Hub
          </Link>
          <Link
            to="/history"
            className={`whitespace-nowrap transition-colors hover:text-stone-900 ${
              isActive('/history') ? 'text-stone-950 font-semibold' : ''
            }`}
          >
            {COPY.nav.history}
          </Link>
          <Link
            to="/consent"
            className={`whitespace-nowrap transition-colors hover:text-stone-900 ${
              isActive('/consent') ? 'text-stone-950 font-semibold' : ''
            }`}
          >
            {COPY.nav.privacy}
          </Link>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to={sessionId ? '/hub' : '/consent'}>
            <Button size="sm" className="shadow-none">
              {sessionId ? 'Current Hub' : COPY.nav.start}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
