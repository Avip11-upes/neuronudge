import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../lib/types';
import { Button } from '../ui/button';
import { AudioPrompt } from './AudioPrompt';
import { SceneCard } from './SceneCard';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface McqCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (optionId: string, responseMs: number, answerChanges: number) => void;
  accentColor?: 'emerald' | 'indigo' | 'amber';
  language?: 'en' | 'hi';
}

export function McqCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  accentColor = 'emerald',
  language = 'en',
}: McqCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerChanges, setAnswerChanges] = useState(0);

  const startTimeRef = useRef<number>(performance.now());
  const initialSelectionMadeRef = useRef<boolean>(false);

  // Reset metrics when question changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerChanges(0);
    initialSelectionMadeRef.current = false;
    startTimeRef.current = performance.now();
  }, [question.id]);

  const handleSelectOption = (optionId: string) => {
    if (initialSelectionMadeRef.current && selectedOption !== optionId) {
      setAnswerChanges((prev) => prev + 1);
    }
    initialSelectionMadeRef.current = true;
    setSelectedOption(optionId);
  };

  const handleConfirm = () => {
    if (!selectedOption) return;
    const responseMs = Math.round(performance.now() - startTimeRef.current);
    onAnswer(selectedOption, responseMs, answerChanges);
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8">
      {/* Question Header & Category */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Question {questionNumber} of {totalQuestions} · {question.category}
        </span>
        <AudioPrompt text={question.audio_text || question.prompt} language={language} />
      </div>

      {/* Optional Scene Illustration */}
      {question.image_url && (
        <SceneCard sceneId={question.image_url} category={question.category} />
      )}

      {/* Question Prompt */}
      <h3 className="font-heading font-bold text-xl sm:text-2xl text-stone-900 leading-snug mb-6">
        {question.prompt}
      </h3>

      {/* Options List */}
      <div className="space-y-3 mb-8">
        {question.options.map((option, idx) => {
          const isSelected = selectedOption === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelectOption(option.id)}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer min-h-[58px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900',
                isSelected
                  ? accentColor === 'emerald'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                    : accentColor === 'indigo'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                    : 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                  : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 hover:border-stone-300'
              )}
            >
              <div className="flex items-center gap-3.5 pr-3">
                <span
                  className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                    isSelected
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-200 text-stone-700'
                  )}
                >
                  {optionLetters[idx] || idx + 1}
                </span>
                <span className="text-base text-stone-800 font-medium leading-relaxed">
                  {option.text}
                </span>
              </div>

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-stone-100 pt-5">
        <span className="text-xs text-stone-500">
          Take your time — no countdown pressure
        </span>

        <Button
          onClick={handleConfirm}
          disabled={!selectedOption}
          size="md"
          className="px-6"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
