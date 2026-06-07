import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { MenuScreen, SetupScreen, HistoryScreen, LandingScreen } from './components/SetupScreens';
import { PreTurnScreen, GameOverScreen } from './components/GameScreens';
import { PlayScreen } from './components/PlayScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

export default function App() {
  const game = useMultiplayerGame();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  
  const [themeMode, setThemeMode] = useState<'solid' | 'gradient' | 'holographic'>(() => localStorage.getItem('alias_theme_mode') as 'solid' | 'gradient' | 'holographic' || 'solid');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('alias_accent_color') || '#CCFF00');
  const [accentColor2, setAccentColor2] = useState(() => localStorage.getItem('alias_accent_color_2') || '#00FFCC');

  useEffect(() => {
    localStorage.setItem('alias_theme_mode', themeMode);
    localStorage.setItem('alias_accent_color', accentColor);
    localStorage.setItem('alias_accent_color_2', accentColor2);
    document.documentElement.style.setProperty('--accent', accentColor);
    document.documentElement.style.setProperty('--accent-secondary', (themeMode === 'gradient' || themeMode === 'holographic') ? accentColor2 : accentColor);
  }, [themeMode, accentColor, accentColor2]);

  // Apply theme class to a wrapper or body
  useEffect(() => {
    document.body.className = '';
    if (themeMode === 'gradient') document.body.classList.add('theme-gradient');
    if (themeMode === 'holographic') document.body.classList.add('theme-holographic');
  }, [themeMode]);

  if (!game.roomId) {
    return (
      <div className="h-screen w-screen bg-[#0A0A0A] font-sans text-[#F5F5F5] overflow-hidden select-none flex flex-col pt-16">
        <LandingScreen 
            localPlayer={game.localPlayer}
            onCreate={game.createRoom}
            onJoin={game.joinRoom}
            onUpdateName={game.updatePlayerName}
        />
      </div>
    );
  }

  if (!game.gameState) {
    return (
      <div className="h-screen w-screen bg-[#0A0A0A] font-sans text-[var(--accent)] flex items-center justify-center text-xl font-black uppercase tracking-widest">
        Загрузка...
      </div>
    );
  }

  const renderPhase = () => {
    switch (game.gameState?.phase) {
      case 'menu':
        return (
          <MenuScreen 
            onPlay={() => game.setPhase('setup')}
            onHistory={() => game.setPhase('history')}
            localPlayer={game.localPlayer!}
            onUpdatePlayerName={game.updatePlayerName}
          />
        );
      case 'history':
        return (
          <HistoryScreen 
            history={game.gameState.history}
            onBack={() => game.setPhase('menu')}
          />
        );
      case 'setup':
        return (
          <SetupScreen 
            teams={game.gameState.teams}
            spectators={game.gameState.spectators}
            setTeams={game.setTeams}
            settings={game.gameState.settings}
            setSettings={game.setSettings}
            onStart={game.startGame}
            onBack={() => game.setPhase('menu')}
            localPlayerId={game.localPlayer?.id || ''}
            onMovePlayer={game.movePlayer}
            isHost={game.gameState.hostId === game.localPlayer?.id}
          />
        );
      case 'pre-turn':
        return (
          <PreTurnScreen 
            teams={game.gameState.teams}
            activeTeamIndex={game.gameState.activeTeamIndex}
            onReady={game.startTurn}
            localPlayerId={game.localPlayer?.id || ''}
          />
        );
      case 'playing': {
        const activeTeam = game.gameState.teams[game.gameState.activeTeamIndex];
        const explainerIndex = activeTeam.currentExplainerIndex % activeTeam.players.length || 0;
        const explainer = activeTeam.players[explainerIndex];
        const isExplainer = explainer?.id === game.localPlayer?.id;
        return (
          <PlayScreen 
            currentWord={game.gameState.currentWord || ''}
            timeLimit={game.gameState.timeRemaining}
            turnEndTime={game.gameState.turnEndTime}
            onGuessed={game.handleWordGuessed}
            onSkipped={game.handleWordSkipped}
            onTimeUp={game.endTurn}
            isExplainer={isExplainer}
            explainerName={explainer?.name}
            currentRoundWords={game.gameState.currentRoundWords}
          />
        );
      }
      case 'review': {
        const activeTeam = game.gameState.teams[game.gameState.activeTeamIndex];
        const explainerIndex = activeTeam.currentExplainerIndex % activeTeam.players.length || 0;
        const explainer = activeTeam.players[explainerIndex];
        const isExplainer = explainer?.id === game.localPlayer?.id;
        return (
          <ReviewScreen 
            words={game.gameState.currentRoundWords}
            onFinish={game.finishReview}
            isActiveTeam={isExplainer}
            onToggleWord={game.toggleWordStatus}
            onVoteWord={game.voteWord}
            localPlayerId={game.localPlayer?.id || ''}
          />
        );
      }
      case 'game-over':
        return (
          <GameOverScreen 
            teams={game.gameState.teams}
            onToMenu={game.resetToMenu}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0A0A0A] font-sans text-[#F5F5F5] overflow-hidden select-none flex flex-col pt-16">
      
      {/* GLOBAL HEADER */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
        {/* Left: Home Button with Confirm if playing */}
        <div className="pointer-events-auto flex gap-2">
          {game.roomId && (
            <button 
              onClick={() => {
                if (['playing', 'review', 'pre-turn'].includes(game.gameState?.phase || '')) {
                  if (confirm('Уверены что хотите покинуть комнату? Текущая игра будет продолжена без вас.')) {
                    game.leaveRoom();
                  }
                } else {
                  game.leaveRoom();
                }
              }}
              className="bg-[#111] hover:bg-[#222] text-xs px-3 py-1.5 rounded text-[#888] font-bold uppercase tracking-widest border border-[#333] transition-colors shadow-lg"
            >
              ← ПОКИНУТЬ
            </button>
          )}
          {game.gameState?.hostId === game.localPlayer?.id && ['playing', 'review', 'pre-turn', 'game-over', 'history'].includes(game.gameState?.phase || '') && (
            <button 
              onClick={() => {
                if (confirm('Остановить текущую игру и вернуть всех в лобби?')) {
                  game.setPhase('setup');
                }
              }}
              className="bg-[#331111] hover:bg-[#551111] text-xs px-3 py-1.5 rounded text-[#FF4444] font-bold uppercase tracking-widest border border-[#FF4444]/50 transition-colors shadow-lg"
            >
              СБРОС ИГРЫ
            </button>
          )}
        </div>

        {/* Right: Room & Player */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {game.roomId && (
            <div className="bg-[#111] border border-[var(--accent)]/30 rounded px-3 py-1 flex items-center gap-2 shadow-lg">
              <span className="text-[10px] text-[#888] font-black uppercase tracking-widest">КОД:</span>
              <span className="text-sm text-[var(--accent)] font-mono font-bold tracking-widest select-all">{game.roomId}</span>
            </div>
          )}
          
          {game.localPlayer && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsThemeModalOpen(true)}
                className="bg-[#111] hover:bg-[#222] border border-[#333] rounded px-2 py-1 transition-colors shadow-lg"
                title="Настройки темы"
              >
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
              </button>
              {isEditingName ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editNameValue.trim().length > 0) {
                      game.updatePlayerName(editNameValue.trim());
                    }
                    setIsEditingName(false);
                  }}
                  className="bg-[#111] border border-[var(--accent)] rounded px-2 py-1 flex items-center gap-2 shadow-lg"
                >
                  <input 
                    autoFocus
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    className="bg-transparent text-sm text-white font-bold outline-none w-24"
                  />
                </form>
              ) : (
                <button 
                  onClick={() => {
                    setEditNameValue(game.localPlayer?.name || '');
                    setIsEditingName(true);
                  }}
                  className="group bg-[#111] hover:bg-[#222] border border-[#333] rounded px-3 py-1 flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
                >
                  <span className="text-[10px] text-[#666] group-hover:text-[#888] font-black uppercase tracking-widest transition-colors">ВЫ:</span>
                  <span className="text-sm text-white font-bold">{game.localPlayer.name}</span>
                  <svg className="w-3 h-3 text-[#555] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isThemeModalOpen && (
        <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase text-white tracking-widest">Тема и Цвет</h2>
              <button onClick={() => setIsThemeModalOpen(false)} className="text-[#666] hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-[#888] mb-3 tracking-widest">Цветовая Схема</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setThemeMode('solid')} className={`py-2 text-xs font-bold uppercase rounded border ${themeMode === 'solid' ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-[#222] text-[#888] border-[#333]'}`}>Солид</button>
                <button onClick={() => setThemeMode('gradient')} className={`py-2 text-xs font-bold uppercase rounded border ${themeMode === 'gradient' ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-[#222] text-[#888] border-[#333]'}`}>Градиент</button>
                <button onClick={() => setThemeMode('holographic')} className={`py-2 text-xs font-bold uppercase rounded border ${themeMode === 'holographic' ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-[#222] text-[#888] border-[#333]'}`}>Голография</button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-[#888] mb-3 tracking-widest">
                {themeMode === 'gradient' ? 'Цвета Градиента' : themeMode === 'holographic' ? 'Цвет Перелива' : 'Акцентный Цвет'}
              </label>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={accentColor} 
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-12 h-12 bg-transparent border-none rounded cursor-pointer shrink-0"
                  />
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    {['#CCFF00', '#FF0055', '#00FFFF', '#FF9900', '#BF00FF'].map(c => (
                      <button 
                        key={c}
                        onClick={() => setAccentColor(c)}
                        className="w-full aspect-square rounded-full border-2 border-[#333]"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                
                {(themeMode === 'gradient' || themeMode === 'holographic') && (
                  <div className="flex gap-4 items-center">
                    <input 
                      type="color" 
                      value={accentColor2} 
                      onChange={(e) => setAccentColor2(e.target.value)}
                      className="w-12 h-12 bg-transparent border-none rounded cursor-pointer shrink-0"
                    />
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      {['#00FFCC', '#FF00AA', '#0077FF', '#FF3300', '#7700FF'].map(c => (
                        <button 
                          key={c}
                          onClick={() => setAccentColor2(c)}
                          className="w-full aspect-square rounded-full border-2 border-[#333]"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setIsThemeModalOpen(false)}
              className="w-full bg-[var(--accent)] text-black py-3 rounded-lg font-black uppercase tracking-widest"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div 
          key={game.gameState?.phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 w-full h-full relative"
        >
          {renderPhase()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
