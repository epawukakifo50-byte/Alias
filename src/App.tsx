import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { MenuScreen, SetupScreen, HistoryScreen, LandingScreen } from './components/SetupScreens';
import { PreTurnScreen, GameOverScreen } from './components/GameScreens';
import { PlayScreen } from './components/PlayScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const game = useMultiplayerGame();

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
      <div className="h-screen w-screen bg-[#0A0A0A] font-sans text-[#CCFF00] flex items-center justify-center text-xl font-black uppercase tracking-widest">
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
            <div className="bg-[#111] border border-[#CCFF00]/30 rounded px-3 py-1 flex items-center gap-2 shadow-lg">
              <span className="text-[10px] text-[#888] font-black uppercase tracking-widest">КОД:</span>
              <span className="text-sm text-[#CCFF00] font-mono font-bold tracking-widest select-all">{game.roomId}</span>
            </div>
          )}
          
          {game.localPlayer && (
            <button 
              onClick={() => {
                const newName = prompt('Введите новый ник:', game.localPlayer?.name);
                if (newName && newName.trim().length > 0) {
                  game.updatePlayerName(newName.trim());
                }
              }}
              className="group bg-[#111] hover:bg-[#222] border border-[#333] rounded px-3 py-1 flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
            >
              <span className="text-[10px] text-[#666] group-hover:text-[#888] font-black uppercase tracking-widest transition-colors">ВЫ:</span>
              <span className="text-sm text-white font-bold">{game.localPlayer.name}</span>
              <svg className="w-3 h-3 text-[#555] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          )}
        </div>
      </div>

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
