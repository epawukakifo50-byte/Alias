import { motion, AnimatePresence } from 'motion/react';
import { GameSettings, MatchHistory, Team, Player } from '../types';
import { Play, Settings, History, Plus, Trash2, ChevronLeft, Trophy, Users, UserPlus } from 'lucide-react';
import { useState } from 'react';

export function MenuScreen({ 
  onPlay, 
  onHistory, 
  localPlayer, 
  onUpdatePlayerName 
}: { 
  onPlay: () => void, 
  onHistory: () => void,
  localPlayer: Player,
  onUpdatePlayerName: (name: string) => void
}) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(localPlayer.name);

  const saveName = () => {
    if (tempName.trim()) {
      onUpdatePlayerName(tempName.trim());
    } else {
      setTempName(localPlayer.name);
    }
    setEditingName(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-6 space-y-8">
      <div className="absolute top-6 right-6">
        {editingName ? (
          <div className="flex bg-[#222] items-center p-2 rounded">
            <input 
              autoFocus
              className="bg-transparent text-white outline-none w-32 border-b border-dashed border-[#555] text-sm"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              onBlur={saveName}
            />
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="flex items-center gap-2 text-xs font-black uppercase text-[#888] hover:text-white transition-colors">
            <span>{localPlayer.name}</span>
            <div className="w-2 h-2 rounded-full bg-[#CCFF00]" />
          </button>
        )}
      </div>

      <div className="text-center">
        <span className="bg-[#CCFF00] text-black font-black px-8 py-3 text-7xl md:text-8xl skew-x-[-10deg] uppercase tracking-tighter inline-block shadow-2xl">
          ЭЛИАС
        </span>
        <p className="text-sm uppercase tracking-[0.6em] text-[#CCFF00] font-bold mt-8">Multiplayer Edition</p>
      </div>

      <div className="w-full md:w-2/3 space-y-4 mt-16 flex flex-col md:flex-row md:space-y-0 md:space-x-4">
        <button onClick={onPlay} className="flex-1 bg-[#CCFF00] text-black h-24 text-3xl font-black uppercase hover:bg-white transition-all delay-75 shadow-lg flex items-center justify-center gap-4">
          <Play fill="currentColor" size={32} />
          Играть
        </button>
        <button onClick={onHistory} className="md:w-32 bg-[#111] text-white border border-[#333] h-24 text-sm font-black uppercase hover:bg-[#222] transition-colors shadow-lg flex items-center justify-center">
          <History size={24} />
        </button>
      </div>
    </motion.div>
  );
}

export function HistoryScreen({ history, onBack }: { history: MatchHistory[], onBack: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full max-w-3xl mx-auto p-6 md:p-12">
      <div className="flex flex-col gap-6 py-8 border-b border-[#222] mb-8">
        <button onClick={onBack} className="self-start text-[#CCFF00] hover:text-white uppercase font-black text-sm tracking-[0.2em] transition-colors flex items-center gap-2">
          <ChevronLeft size={16} /> НАЗАД
        </button>
        <h2 className="text-5xl font-black uppercase tracking-tighter">История игр</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 mt-32 text-[#444]">
            <History size={64} className="opacity-20" />
            <div className="text-sm font-black uppercase tracking-widest opacity-30">Игр еще не было</div>
          </div>
        ) : (
          history.map(match => (
            <div key={match.id} className="bg-[#111] border border-[#222] p-8 mb-6 hover:border-[#333] transition-colors">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#666] mb-8 flex justify-between">
                <span>{new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[#CCFF00]">{match.teams.length} Команд</span>
              </div>
              <div className="space-y-6">
                {match.teams.sort((a, b) => b.score - a.score).map((team, idx) => (
                  <div key={team.id} className={`flex justify-between items-center ${team.id === match.winnerId ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-[#444] w-6">0{idx + 1}</span>
                      {team.id === match.winnerId && <Trophy size={20} className="text-[#CCFF00]" />}
                      <span className="text-2xl font-black uppercase tracking-tighter">{team.name}</span>
                    </div>
                    <span className={`text-5xl font-black ${team.id === match.winnerId ? 'text-[#CCFF00]' : 'text-white'}`}>{team.score}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

export function SetupScreen({ 
  teams, 
  spectators,
  setTeams, 
  settings, 
  setSettings, 
  onStart, 
  onBack,
  localPlayerId,
  onMovePlayer
}: { 
  teams: Team[],
  spectators: Player[],
  setTeams: (teams: Team[]) => void, 
  settings: GameSettings, 
  setSettings: (s: GameSettings) => void, 
  onStart: () => void, 
  onBack: () => void,
  localPlayerId: string,
  onMovePlayer: (teamId: string | 'spectator') => void
}) {
  const addTeam = () => {
    if (teams.length >= 6) return;
    setTeams([...teams, { id: Math.random().toString(), name: `Команда ${teams.length + 1}`, score: 0, players: [], currentExplainerIndex: 0 }]);
  };

  const removeTeam = (id: string) => {
    if (teams.length <= 2) return;
    setTeams(teams.filter(t => t.id !== id));
  };

  const updateTeamName = (id: string, name: string) => {
    setTeams(teams.map(t => t.id === id ? { ...t, name } : t));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full max-w-5xl mx-auto p-6 md:p-12">
      <div className="flex flex-col gap-6 py-6 border-b border-[#222]">
        <button onClick={onBack} className="self-start text-[#CCFF00] hover:text-white uppercase font-black text-sm tracking-[0.2em] transition-colors flex items-center gap-2">
          <ChevronLeft size={16} /> НАЗАД
        </button>
        <h2 className="text-5xl font-black uppercase tracking-tighter">Сбор лобби</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-8 flex flex-col xl:flex-row gap-12">
        
        {/* TEAMS AND PLAYERS COLUMN */}
        <div className="flex-[2] flex flex-col gap-8">
          
          {/* SPECTATORS */}
          <div className="bg-[#111] border border-[#222] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#666] flex items-center gap-2">
                <Users size={16} />
                Зрители / Ждут команду
              </h3>
              {spectators.some(p => p.id === localPlayerId) ? null : (
                <button onClick={() => onMovePlayer('spectator')} className="text-xs uppercase tracking-widest font-black text-[#CCFF00] hover:text-white transition-colors">
                  Выйти сюда
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {spectators.length === 0 ? (
                <span className="text-xs opacity-30 font-bold tracking-widest uppercase">Пусто</span>
              ) : (
                <AnimatePresence>
                  {spectators.map(p => (
                    <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} key={p.id} className={`px-4 py-2 border rounded-full text-xs font-black uppercase tracking-widest ${p.id === localPlayerId ? 'border-[#CCFF00] text-[#CCFF00] bg-[#CCFF00]/10' : 'border-[#444] text-[#888]'}`}>
                      {p.name} {p.id === localPlayerId && '(Вы)'}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#666] flex items-center gap-2">
              <Users size={16} /> Команды
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team, idx) => (
                <div key={team.id} className="bg-[#111] border border-[#222] p-6 hover:border-[#333] transition-colors relative flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-[#444] tracking-widest mb-2 block">КОМАНДА 0{idx+1}</span>
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => updateTeamName(team.id, e.target.value)}
                        className="w-full bg-transparent text-2xl font-black uppercase tracking-tighter text-white outline-none focus:text-[#CCFF00] transition-colors border-b border-transparent focus:border-[#CCFF00]"
                      />
                    </div>
                    {teams.length > 2 && (
                      <button onClick={() => removeTeam(team.id)} className="p-2 text-[#444] hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 mb-6">
                    <div className="space-y-2">
                      {team.players.map(p => (
                        <div key={p.id} className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${p.id === localPlayerId ? 'text-[#CCFF00]' : 'text-gray-300'}`}>
                          <div className={`w-2 h-2 rounded-full ${p.id === localPlayerId ? 'bg-[#CCFF00]' : 'bg-gray-600'}`}/>
                          {p.name}
                        </div>
                      ))}
                      {team.players.length === 0 && (
                        <div className="text-xs font-bold uppercase tracking-widest text-[#444]">Нет игроков</div>
                      )}
                    </div>
                  </div>

                  {!team.players.some(p => p.id === localPlayerId) ? (
                    <button onClick={() => onMovePlayer(team.id)} className="w-full h-12 bg-[#222] hover:bg-[#CCFF00] text-white hover:text-black font-black uppercase text-xs tracking-widest transition-colors flex flex-row items-center justify-center gap-2">
                      <UserPlus size={14} /> Присоединиться
                    </button>
                  ) : (
                    <div className="w-full h-12 flex items-center justify-center text-[#CCFF00] font-black uppercase text-xs tracking-widest border border-[#CCFF00]/30 bg-[#CCFF00]/5">
                      Ваша команда
                    </div>
                  )}
                </div>
              ))}
              
              {teams.length < 6 && (
                <button onClick={addTeam} className="bg-transparent border-2 border-dashed border-[#222] min-h-[200px] hover:border-[#CCFF00] text-[#444] hover:text-[#CCFF00] font-black uppercase tracking-widest text-sm transition-all flex flex-col items-center justify-center gap-4">
                  <Plus size={32} />
                  СОЗДАТЬ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SETTINGS COLUMN */}
        <div className="flex-1 bg-[#111] border border-[#222] p-8 h-fit">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#666] mb-8 flex items-center gap-2 border-b border-[#222] pb-4">
            <Settings size={16} /> Параметры
          </h3>
          
          <div className="space-y-8 mb-8">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest text-[#888] mb-4">Счет для победы</span>
              <div className="flex justify-between items-end mb-2">
                <span className="text-4xl font-black text-[#CCFF00] tracking-tighter">{settings.scoreToWin}</span>
              </div>
              <input 
                type="range" min="10" max="100" step="10" 
                value={settings.scoreToWin} 
                onChange={(e) => setSettings({...settings, scoreToWin: parseInt(e.target.value)})}
                className="w-full accent-[#CCFF00]"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest text-[#888] mb-4">Время хода (сек)</span>
              <div className="flex justify-between items-end mb-2">
                <span className="text-4xl font-black text-white tracking-tighter">{settings.turnDurationSeconds}</span>
              </div>
              <input 
                type="range" min="30" max="120" step="15" 
                value={settings.turnDurationSeconds} 
                onChange={(e) => setSettings({...settings, turnDurationSeconds: parseInt(e.target.value)})}
                className="w-full accent-[#CCFF00]"
              />
            </div>

            <div className="flex justify-between items-center bg-[#1A1A1A] p-4 border border-[#222]">
              <span className="text-xs font-black uppercase tracking-widest text-[#888]">Штраф пропуска</span>
              <button 
                onClick={() => setSettings({...settings, penaltyForSkip: !settings.penaltyForSkip})}
                className={`w-14 h-8 transition-colors ${settings.penaltyForSkip ? 'bg-[#CCFF00]' : 'bg-[#333]'}`}
              >
                <div className={`w-6 h-6 m-1 bg-black transition-transform ${settings.penaltyForSkip ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="pt-8 bg-[#0A0A0A] mt-auto">
        <button 
          onClick={onStart} 
          disabled={teams.some(t => t.players.length === 0)}
          className="w-full bg-[#CCFF00] text-black h-24 text-3xl font-black uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:bg-[#333] disabled:text-[#666] disabled:cursor-not-allowed"
        >
          {teams.some(t => t.players.length === 0) ? 'В командах пусто' : 'НАЧАТЬ ИГРУ'}
        </button>
      </div>
    </motion.div>
  );
}
