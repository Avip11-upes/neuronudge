import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { COPY } from '../lib/copy';
import { CORE_DISCLAIMER } from '../lib/constants';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Eye,
  BookOpen,
  Users,
  AlertTriangle,
  Clock,
  Heart,
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-stone-200/80 bg-linear-to-b from-amber-50/40 via-stone-50 to-stone-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* Subtle anti-slop non-pill kicker */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 mb-6 bg-white/80 border border-stone-200/80 px-4 py-1.5 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Screening Aid · Non-Clinical · 100% On-Device Analysis</span>
          </div>

          <h1 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-stone-900 tracking-tight leading-[1.15] max-w-3xl mx-auto mb-6 text-balance">
            {COPY.landing.heroTitle}
          </h1>

          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed mb-10 text-pretty">
            {COPY.landing.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/consent" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 gap-2 shadow-md">
                <span>{COPY.landing.startCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/history" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-6">
                <span>{COPY.nav.history}</span>
              </Button>
            </Link>
          </div>

          {/* Quick reassurance items */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-stone-400" /> ~12 minutes total
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" /> No video recorded or uploaded
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" /> Child-friendly & stress-free
            </span>
          </div>
        </div>
      </section>

      {/* Prominent Mandatory Disclaimer Banner */}
      <section className="max-w-5xl mx-auto px-6 -mt-6">
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-amber-950 mb-1">
              {COPY.landing.disclaimerTitle}
            </h3>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              {CORE_DISCLAIMER}
            </p>
          </div>
        </div>
      </section>

      {/* 3 Gentle Steps */}
      <section className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading font-bold text-3xl text-stone-900 mb-3">
            {COPY.landing.howItWorksTitle}
          </h2>
          <p className="text-stone-600 text-sm leading-relaxed">
            A playful, scientifically grounded sequence designed to keep users engaged and at ease.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COPY.landing.steps.map((step) => (
            <Card key={step.number} className="relative hover:border-stone-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-900 font-bold font-mono text-base flex items-center justify-center mb-4">
                0{step.number}
              </div>
              <h3 className="font-heading font-bold text-lg text-stone-900 mb-2">
                {step.title}
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* The 3 Stage Spotlights */}
      <section className="bg-stone-100/60 border-y border-stone-200/80 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading font-bold text-3xl text-stone-900 mb-3">
              Three Targeted Observational Stages
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              Each stage highlights distinct indicators through age-appropriate interactive activities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ADHD Stage */}
            <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Stage 1 · Attention
              </span>
              <h3 className="font-heading font-bold text-xl text-stone-900 mt-1 mb-2">
                ADHD Indicators
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Measures gaze stability, blink cadence, natural head movement, and reaction impulse during quick visual tasks.
              </p>
            </div>

            {/* Dyslexia Stage */}
            <div className="bg-white rounded-2xl border border-emerald-200/80 p-6 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Stage 2 · Reading
              </span>
              <h3 className="font-heading font-bold text-xl text-stone-900 mt-1 mb-2">
                Dyslexia Indicators
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Assesses letter orientation (b/d, p/q), rhyming sounds, and sequencing with optional spoken voiceover support.
              </p>
            </div>

            {/* Autism Stage */}
            <div className="bg-white rounded-2xl border border-indigo-200/80 p-6 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Stage 3 · Social
              </span>
              <h3 className="font-heading font-bold text-xl text-stone-900 mt-1 mb-2">
                Autism Indicators
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Explores social scenario comprehension, perspective taking, and eye engagement with an animated storyteller.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Start Callout */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="font-heading font-bold text-3xl text-stone-900 mb-4">
          Ready to begin?
        </h2>
        <p className="text-stone-600 text-base max-w-xl mx-auto mb-8">
          The screening takes about 12 minutes. You can pause or stop at any time.
        </p>
        <Link to="/consent">
          <Button size="lg" className="px-8 shadow-sm">
            {COPY.landing.startCta}
          </Button>
        </Link>
      </section>
    </div>
  );
}
