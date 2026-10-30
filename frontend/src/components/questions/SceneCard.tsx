import React from 'react';
import { CloudRain, Users, Gamepad2, FileX2, Smile } from 'lucide-react';

interface SceneCardProps {
  sceneId: string | null;
  category: string;
}

export function SceneCard({ sceneId, category }: SceneCardProps) {
  if (!sceneId) return null;

  const renderIllustration = () => {
    switch (sceneId) {
      case 'scene_dropped_paper':
        return (
          <div className="flex flex-col items-center justify-center p-6 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mb-2">
              <FileX2 className="w-8 h-8" />
            </div>
            <span className="text-xs font-medium text-amber-800">Dropped Drawing Scenario</span>
          </div>
        );
      case 'scene_rain':
        return (
          <div className="flex flex-col items-center justify-center p-6 bg-sky-50/70 border border-sky-200/60 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700 mb-2">
              <CloudRain className="w-8 h-8" />
            </div>
            <span className="text-xs font-medium text-sky-800">Idiom: Heavy Rain Storm</span>
          </div>
        );
      case 'scene_friends_chat':
        return (
          <div className="flex flex-col items-center justify-center p-6 bg-indigo-50/70 border border-indigo-200/60 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 mb-2">
              <Users className="w-8 h-8" />
            </div>
            <span className="text-xs font-medium text-indigo-800">Sharing Topics & Taking Turns</span>
          </div>
        );
      case 'scene_board_game':
        return (
          <div className="flex flex-col items-center justify-center p-6 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <span className="text-xs font-medium text-emerald-800">Joining a Game in Progress</span>
          </div>
        );
      case 'scene_trip':
      default:
        return (
          <div className="flex flex-col items-center justify-center p-6 bg-stone-100/80 border border-stone-200 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-stone-200 flex items-center justify-center text-stone-700 mb-2">
              <Smile className="w-8 h-8" />
            </div>
            <span className="text-xs font-medium text-stone-700">Gentle Stumble & Warm Smile</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2">
        {category}
      </div>
      {renderIllustration()}
    </div>
  );
}
