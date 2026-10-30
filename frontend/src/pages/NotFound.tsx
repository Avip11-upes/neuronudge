import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { COPY } from '../lib/copy';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 mb-4">
        <Compass className="w-8 h-8" />
      </div>

      <h1 className="font-heading font-bold text-3xl text-stone-900 mb-2">
        {COPY.notFound.title}
      </h1>

      <p className="text-stone-600 text-sm max-w-sm mb-6 leading-relaxed">
        {COPY.notFound.subtitle}
      </p>

      <Link to="/">
        <Button size="lg" className="gap-2">
          <Home className="w-4 h-4" />
          <span>{COPY.notFound.returnHome}</span>
        </Button>
      </Link>
    </div>
  );
}
