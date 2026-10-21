import React from 'react';
import { AlertCircle, ArrowLeft, Home, Grid } from 'lucide-react';

interface NotFoundProps {
  onNavigate: (route: string) => void;
  message?: string;
}

export const NotFound: React.FC<NotFoundProps> = ({
  onNavigate,
  message = 'The requested puzzle or route could not be found in the PlyQuest catalogue.',
}) => {
  return (
    <div className="max-w-md mx-auto my-16 px-4 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center border border-rose-200 dark:border-rose-800">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-slate-950 dark:text-white">
        Position Not Found (404)
      </h1>
      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-2 mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#4658C9] text-white text-xs font-bold hover:bg-[#3548C5] transition-colors cursor-pointer shadow-xs"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/puzzles')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1A2032] text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
        >
          <Grid className="w-4 h-4 text-[#4658C9] dark:text-[#818CF8]" />
          <span>Browse Puzzles</span>
        </button>
      </div>
    </div>
  );
};
