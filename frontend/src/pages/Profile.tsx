import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { COPY } from '../lib/copy';
import { api } from '../lib/api';
import { useSessionStore } from '../store/sessionStore';
import { User, Calendar, Languages, UserCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useSessionStore();

  const isMinorInit = (location.state as any)?.isMinor ?? false;

  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState<number | ''>(isMinorInit ? 8 : 24);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [taker, setTaker] = useState<'child' | 'adult'>(isMinorInit ? 'child' : 'adult');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please provide a first name or friendly nickname.');
      return;
    }
    const numericAge = Number(age);
    if (!numericAge || numericAge < 3 || numericAge > 120) {
      setError('Please enter a valid age between 3 and 120.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.createSession({
        nickname: nickname.trim(),
        age: numericAge,
        language,
        taker,
        consent: true,
      });

      setSession(res.session_id, {
        nickname: nickname.trim(),
        age: numericAge,
        language,
        taker,
      });

      navigate('/camera-check');
    } catch (err: any) {
      console.warn('Failed to create session on backend, falling back gracefully', err);
      // Even if backend fails, mock store provides seamless experience
      setError('Unable to initialize session. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 block">
          Step 2 of 3 · Profile Setup
        </span>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-stone-900 mb-2">
          {COPY.profile.title}
        </h1>
        <p className="text-stone-600 text-sm leading-relaxed">
          {COPY.profile.subtitle}
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nickname field */}
          <div>
            <label
              htmlFor="nickname-input"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
            >
              <User className="w-4 h-4 text-stone-500" />
              <span>{COPY.profile.nicknameLabel}</span>
            </label>
            <input
              id="nickname-input"
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={COPY.profile.nicknamePlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Age field */}
          <div>
            <label
              htmlFor="age-input"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
            >
              <Calendar className="w-4 h-4 text-stone-500" />
              <span>{COPY.profile.ageLabel}</span>
            </label>
            <input
              id="age-input"
              type="number"
              min="3"
              max="120"
              required
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all"
            />
            <span className="text-[11px] text-stone-500 mt-1 block">
              {COPY.profile.ageHelp}
            </span>
          </div>

          {/* Taker Type (Child / Adult) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              <UserCheck className="w-4 h-4 text-stone-500" />
              <span>{COPY.profile.takerLabel}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTaker('child')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  taker === 'child'
                    ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs'
                    : 'border-stone-200 bg-stone-50/60 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="text-sm font-semibold">{COPY.profile.takerChild}</div>
                <div className="text-[11px] opacity-80">Younger learner format</div>
              </button>

              <button
                type="button"
                onClick={() => setTaker('adult')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  taker === 'adult'
                    ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs'
                    : 'border-stone-200 bg-stone-50/60 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="text-sm font-semibold">{COPY.profile.takerAdult}</div>
                <div className="text-[11px] opacity-80">Standard self-guided</div>
              </button>
            </div>
          </div>

          {/* Language selection (English / Hindi) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              <Languages className="w-4 h-4 text-stone-500" />
              <span>{COPY.profile.languageLabel}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-3 px-4 rounded-xl border text-center text-sm font-medium transition-all ${
                  language === 'en'
                    ? 'border-stone-900 bg-stone-100 text-stone-950 font-semibold ring-1 ring-stone-900'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {COPY.profile.languageEn}
              </button>

              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`py-3 px-4 rounded-xl border text-center text-sm font-medium transition-all ${
                  language === 'hi'
                    ? 'border-stone-900 bg-stone-100 text-stone-950 font-semibold ring-1 ring-stone-900'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {COPY.profile.languageHi}
              </button>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-stone-100">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full gap-2 text-base shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Setting up session...</span>
                </>
              ) : (
                <>
                  <span>{COPY.profile.startCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
