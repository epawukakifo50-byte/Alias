import { motion } from 'motion/react';
import { RoundWord } from '../types';
import { ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';

export function ReviewScreen({ 
  words, 
  onFinish,
  isActiveTeam,
  onToggleWord,
  onVoteWord,
  localPlayerId
}: { 
  words: RoundWord[], 
  onFinish: () => void,
  isActiveTeam: boolean,
  onToggleWord: (id: string) => void,
  onVoteWord: (id: string, vote: 'accept' | 'reject') => void,
  localPlayerId: string
}) {
  const pointsMade = words.reduce((acc, w) => {
    if (w.status === 'guessed') return acc + 1;
    if (w.status === 'penalty') return acc - 1;
    return acc;
  }, 0);

  const getVoteCounts = (word: RoundWord) => {
    let accept = 0;
    let reject = 0;
    if (word.votes) {
      Object.values(word.votes).forEach(v => {
        if (v === 'accept') accept++;
        if (v === 'reject') reject++;
      });
    }
    return { accept, reject };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full max-w-2xl mx-auto bg-[#0A0A0A] p-6 md:p-12 pb-8 pt-10">
      <div className="mb-10 text-center border-b border-[#222] pb-8">
        <h2 className="text-[10px] uppercase tracking-[0.5em] opacity-40 mb-2">Итоги раунда</h2>
        <div className="flex justify-center items-end gap-2 text-white mt-4">
          <span className="text-sm font-black uppercase tracking-widest opacity-30 mb-2">ЗАРАБОТАНО</span>
          <span className={`text-[80px] font-black leading-none tracking-tighter ${pointsMade > 0 ? 'text-[#CCFF00]' : pointsMade < 0 ? 'text-red-500' : 'text-white'}`}>
            {pointsMade > 0 ? `+${pointsMade}` : pointsMade}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-6">Список слов</h3>
        <div className="flex flex-col gap-2">
          {words.length === 0 ? (
            <div className="text-sm font-black uppercase tracking-widest opacity-30 mt-10 w-full text-center">СЛОВ НЕТ</div>
          ) : (
            words.map((w) => {
              const { accept, reject } = getVoteCounts(w);
              const myVote = w.votes?.[localPlayerId];
              return (
                <div key={w.id} className={`flex items-center justify-between p-4 border mb-2 transition-colors ${
                  w.status === 'guessed' 
                    ? 'border-[#CCFF00] bg-[#CCFF00]/10 text-white' 
                    : 'border-[#333] bg-[#111] text-white opacity-60'
                }`}>
                  <button 
                    onClick={() => onToggleWord(w.id)}
                    disabled={!isActiveTeam}
                    className={`flex-1 text-left text-lg md:text-xl font-black uppercase tracking-wider ${w.status !== 'guessed' ? 'line-through decoration-2 decoration-red-500' : ''} ${isActiveTeam ? 'hover:text-[#CCFF00] cursor-pointer' : 'cursor-default'}`}
                  >
                    {w.word}
                  </button>
                  
                  {/* Voting for Non-Active players */}
                  <div className="flex items-center gap-4 border-l border-[#333] pl-4">
                    <div className="flex flex-col items-center gap-1">
                      <button 
                         onClick={() => onVoteWord(w.id, 'accept')}
                         className={`p-2 rounded hover:bg-[#222] transition-colors ${myVote === 'accept' ? 'text-[#CCFF00]' : 'text-[#888]'}`}
                      >
                         <ThumbsUp size={16} />
                      </button>
                      <span className="text-[10px] font-bold text-[#888]">{accept || ''}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button 
                         onClick={() => onVoteWord(w.id, 'reject')}
                         className={`p-2 rounded hover:bg-[#222] transition-colors ${myVote === 'reject' ? 'text-red-500' : 'text-[#888]'}`}
                      >
                         <ThumbsDown size={16} />
                      </button>
                      <span className="text-[10px] font-bold text-[#888]">{reject || ''}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        {isActiveTeam ? (
          <p className="text-[10px] font-medium uppercase tracking-widest opacity-30 mt-8 text-center bg-[#111] p-2 inline-block mx-auto rounded">Нажмите на слово, чтобы изменить статус</p>
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#CCFF00] mt-8 text-center bg-[#CCFF00]/10 p-2 inline-block mx-auto rounded">Проголосуйте за слово, если оно было засчитано неверно</p>
        )}
      </div>

      <div className="pt-4 mt-8">
        <button 
          onClick={() => onFinish()}
          disabled={!isActiveTeam}
          className="w-full bg-[#CCFF00] text-black h-24 text-3xl font-black uppercase hover:bg-white transition-colors flex items-center justify-center gap-4 disabled:opacity-30 disabled:bg-[#333] disabled:text-white"
        >
          ДАЛЕЕ
          {isActiveTeam && <ArrowRight size={32} />}
        </button>
      </div>
    </motion.div>
  );
}
