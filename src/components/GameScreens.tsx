import { motion } from 'motion/react';
import { Team } from '../types';
import { Trophy, Home, Play, ArrowRight } from 'lucide-react';

export function PreTurnScreen({ 
  teams, 
  activeTeamIndex, 
  onReady,
  localPlayerId
}: { 
  teams: Team[], 
  activeTeamIndex: number, 
  onReady: () => void,
  localPlayerId: string
}) {
  const activeTeam = teams[activeTeamIndex];
  const explainerIndex = activeTeam.currentExplainerIndex % activeTeam.players.length || 0;
  const explainer = activeTeam.players[explainerIndex];
  const isExplainer = explainer?.id === localPlayerId;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full max-w-5xl mx-auto p-6 md:p-12">
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
        
        {/* Left Side: Active Team Info */}
        <div className="flex-1 text-center md:text-left flex flex-col justify-center">
          <h3 className="text-sm font-black uppercase tracking-[0.5em] text-[#888] mb-6">ХОД КОМАНДЫ</h3>
          <h2 className="text-[80px] lg:text-[120px] leading-[0.9] font-black tracking-tighter uppercase mb-6 text-[var(--accent)] drop-shadow-2xl">
            {activeTeam.name}
          </h2>
          
          {explainer && (
            <div className="mb-12 bg-[#222] inline-block self-center md:self-start px-6 py-3 rounded-xl border border-[#444]">
              <span className="text-xs uppercase tracking-widest text-[#888] block mb-1">СЕЙЧАС ОБЪЯСНЯЕТ</span>
              <span className="text-xl font-black text-white">{explainer.name} {isExplainer && '(ВЫ)'}</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start mb-8">
            {activeTeam.players.map(p => {
              const isPExplainer = p.id === explainer?.id;
              return (
                <span key={p.id} className={`px-4 py-2 border rounded border-[#444] text-sm font-black uppercase tracking-widest ${isPExplainer ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'text-white'}`}>
                  <span className={isPExplainer ? 'text-[var(--accent)]' : ''}>
                    {p.name} {p.id === localPlayerId && !isPExplainer && '(ВЫ)'}
                  </span>
                </span>
              );
            })}
            {activeTeam.players.length === 0 && (
              <span className="text-xs font-bold uppercase opacity-30 tracking-widest">Нет игроков</span>
            )}
          </div>
          
          <div className="mt-8">
            <button 
              onClick={onReady} 
              disabled={!isExplainer && activeTeam.players.length > 0} 
              className="w-full md:w-auto px-12 bg-white text-black h-24 text-3xl font-black uppercase hover:bg-[var(--accent)] focus:outline-none transition-all focus:ring-4 focus:ring-[var(--accent)]/50 shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 disabled:bg-[#333] disabled:text-[#666] disabled:cursor-not-allowed group"
            >
              СТАРТ МАТЧА
              <ArrowRight className="group-hover:translate-x-2 transition-transform" size={32} />
            </button>
            {!isExplainer && activeTeam.players.length > 0 && (
              <p className="text-[#888] font-bold text-xs uppercase tracking-widest mt-4">Ждем пока начнет ведущий: {explainer?.name}</p>
            )}
          </div>
        </div>

        {/* Right Side: Scoreboard */}
        <div className="w-full md:w-1/3 bg-[#111] border border-[#222] p-8 self-center shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#666] mb-8 pb-4 border-b border-[#222]">Счет игры</h3>
          <div className="space-y-6">
            {teams.map((team, idx) => (
              <div key={team.id} className={`flex justify-between items-end border-b border-[#222] pb-6 ${idx === activeTeamIndex ? 'opacity-100' : 'opacity-40'}`}>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#444] mb-2 tracking-widest">0{idx + 1}</span>
                  <span className="text-2xl font-black uppercase tracking-tighter">{team.name}</span>
                </div>
                <span className={`text-5xl font-black ${idx === activeTeamIndex ? 'text-[var(--accent)]' : 'text-white'}`}>{team.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function GameOverScreen({ 
  teams, 
  onToMenu 
}: { 
  teams: Team[], 
  onToMenu: () => void 
}) {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full max-w-5xl mx-auto p-6 md:p-12 items-center justify-center">
      <div className="text-center w-full mb-16">
        <Trophy size={64} className="text-[var(--accent)] mx-auto mb-8 drop-shadow-lg" />
        <h2 className="text-sm font-black uppercase tracking-[0.5em] text-[#888] mb-4">Команда-чемпион</h2>
        <h1 className="text-[80px] md:text-[140px] font-black leading-none tracking-tighter uppercase text-[var(--accent)] mb-4 break-words drop-shadow-2xl">
          {winner.name}
        </h1>
        <div className="text-6xl md:text-[100px] font-black tracking-tighter mt-4 flex items-center justify-center gap-6">
          <span className="text-white drop-shadow-md">{winner.score}</span>
          <span className="text-2xl font-black text-[#888] tracking-widest uppercase mb-4">Очков</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-[#111] p-8 border border-[#222] shadow-2xl space-y-6 mb-16">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#666] border-b border-[#222] pb-4 mb-4">Остальные результаты</h3>
        {sortedTeams.slice(1).map((team, idx) => (
          <div key={team.id} className="flex justify-between items-center border-b border-[#222] pb-4 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-[#444] w-6">0{idx + 2}</span>
              <span className="text-xl font-black uppercase tracking-tighter">{team.name}</span>
            </div>
            <span className="text-3xl font-black text-white">{team.score}</span>
          </div>
        ))}
      </div>

      <button onClick={onToMenu} className="px-16 bg-white text-black h-20 text-2xl font-black uppercase hover:bg-[var(--accent)] transition-colors shadow-xl flex items-center gap-4 focus:ring-4 focus:ring-[var(--accent)]/50 outline-none">
        <Home size={28} />
        В главное меню
      </button>
    </motion.div>
  );
}
