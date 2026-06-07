import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { MenuScreen, SetupScreen, HistoryScreen } from './components/SetupScreens';
import { PreTurnScreen, GameOverScreen } from './components/GameScreens';
import { PlayScreen } from './components/PlayScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const game = useMultiplayerGame();

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
    <div className="h-screen w-screen bg-[#0A0A0A] font-sans text-[#F5F5F5] overflow-hidden select-none">
      <AnimatePresence mode="wait">
        <motion.div 
          key={game.gameState?.phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full w-full"
        >
          {renderPhase()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
