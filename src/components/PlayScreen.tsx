import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';
import { RoundWord } from '../types';

export function PlayScreen({ 
  currentWord, 
  timeLimit, 
  turnEndTime,
  onGuessed, 
  onSkipped, 
  onTimeUp,
  isExplainer,
  explainerName,
  currentRoundWords
}: { 
  currentWord: string, 
  timeLimit: number, 
  turnEndTime?: number,
  onGuessed: () => void, 
  onSkipped: () => void, 
  onTimeUp: () => void,
  isExplainer: boolean,
  explainerName?: string,
  currentRoundWords: RoundWord[]
}) {
  const [timeLeft, setTimeLeft] = useState(
    turnEndTime ? Math.max(0, Math.ceil((turnEndTime - Date.now()) / 1000)) : timeLimit
  );
  // Optional visually tracking the last action for animation direction
  const [animationKey, setAnimationKey] = useState(0);
  const [exitDir, setExitDir] = useState<number>(0);

  useEffect(() => {
    if (!turnEndTime) return;
    
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((turnEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (isExplainer) onTimeUp();
        clearInterval(interval);
      }
    };
    
    tick(); // initial sync
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [turnEndTime, onTimeUp, isExplainer]);

  const handleGuess = () => {
    setExitDir(100);
    setAnimationKey(prev => prev + 1);
    onGuessed();
  };

  const handleSkip = () => {
    setExitDir(-100);
    setAnimationKey(prev => prev + 1);
    onSkipped();
  };

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-[#0A0A0A]">
      <div className="h-1/4 flex flex-col items-center justify-center border-b border-[#222] bg-gradient-to-br from-[#111] to-[#0A0A0A] relative overflow-hidden">
        <span className={`text-[120px] font-black tabular-nums tracking-tighter leading-none z-10 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-[#CCFF00]'}`}>
          {timeLeft}
        </span>
        <span className="text-xs uppercase tracking-[0.5em] opacity-40 mt-2 z-10">Осталось сек</span>
        <motion.div 
            className={`absolute bottom-0 left-0 h-1 z-20 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-[#CCFF00]'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
            transition={{ ease: "linear", duration: 1 }}
        />
      </div>

      <div className="flex-1 flex flex-col relative p-8 h-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[140px] font-black opacity-[0.03] leading-none pointer-events-none select-none whitespace-nowrap z-0">
          {isExplainer ? 'WORD' : 'HIDDEN'}
        </div>
        
        {/* Previous Words Stream */}
        <div className="flex-1 flex flex-col justify-end items-center space-y-2 mb-8 overflow-hidden z-0 mask-image-top text-center w-full max-w-lg mx-auto" style={{ WebkitMaskImage: 'linear-gradient(transparent, black 80%)' }}>
          <AnimatePresence initial={false}>
            {currentRoundWords.slice(-5).map((w, idx) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, height: 0, y: 20 }}
                animate={{ opacity: 0.5 + (idx / 5) * 0.5, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`text-xl md:text-3xl font-black uppercase tracking-widest break-words ${w.status === 'guessed' ? 'text-[#888]' : 'text-red-400 opacity-60'}`}
              >
                {w.word}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Current Active Word */}
        <div className="relative h-32 w-full flex items-center justify-center z-10 shrink-0 mb-4">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={animationKey}
              initial={{ opacity: 0, y: -exitDir, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: exitDir, filter: 'blur(10px)', transition: { duration: 0.15 } }}
              className="absolute flex flex-col items-center justify-center z-10 w-full px-8"
            >
              <h1 className="text-[50px] sm:text-[70px] md:text-[90px] text-center font-black leading-[0.9] tracking-tighter uppercase break-words text-white drop-shadow-2xl">
                {isExplainer ? currentWord : <span className="tracking-[0.2em] opacity-30 select-none">••••••••</span>}
              </h1>
              {!isExplainer && (
                 <div className="mt-8 text-[#888] font-bold text-sm uppercase tracking-widest text-center">
                   ОБЪЯСНЯЕТ: <span className="text-white">{explainerName || 'ИГРОК'}</span>
                 </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex gap-4 p-6 h-40">
        {isExplainer ? (
          <>
            <button 
              onClick={handleSkip}
              className="flex-1 bg-white text-black text-2xl font-black uppercase hover:bg-red-500 hover:text-white transition-colors leading-none flex flex-col items-center justify-center shadow-lg focus:ring-4 focus:ring-red-500/50 outline-none"
            >
              <span>Пропуск</span>
              <span className="text-sm opacity-50 mt-2 font-bold tracking-widest">-1 ОЧкО</span>
            </button>
            <button 
              onClick={handleGuess}
              className="flex-1 bg-[#CCFF00] text-black text-2xl font-black uppercase hover:bg-white transition-colors leading-none flex flex-col items-center justify-center shadow-lg focus:ring-4 focus:ring-[#CCFF00]/50 outline-none"
            >
              <span>Угадал</span>
              <span className="text-sm opacity-50 mt-2 font-bold tracking-widest">+1 ОЧкО</span>
            </button>
          </>
        ) : (
           <div className="flex-1 flex items-center justify-center border-t border-[#222]">
             <span className="text-[#666] font-black uppercase tracking-widest text-sm">Команда играет...</span>
           </div>
        )}
      </div>
    </div>
  );
}
