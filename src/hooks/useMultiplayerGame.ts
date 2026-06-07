import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Team, GameSettings, RoundWord, MatchHistory, Player, GamePhase, WordStatus } from '../types';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

export function useMultiplayerGame() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [wordsList, setWordsList] = useState<string[]>([]);
  
  useEffect(() => {
    // Generate or retrieve player ID
    let storedId = localStorage.getItem('alias_player_id');
    let storedName = localStorage.getItem('alias_player_name');
    
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('alias_player_id', storedId);
    }
    
    if (!storedName) {
      const names = ['Орел', 'Барсук', 'Кот', 'Собакен', 'Енот', 'Хомяк'];
      const adjectives = ['Хитрый', 'Быстрый', 'Умный', 'Дикий', 'Бешеный', 'Меткий'];
      storedName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
      localStorage.setItem('alias_player_name', storedName);
    }

    const player = { id: storedId, name: storedName };
    setLocalPlayer(player);

    const backendUrl = window.location.origin;
    const newSocket = io(backendUrl);

    newSocket.on('connect', () => {
      newSocket.emit('joinGame', player);
    });

    newSocket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    setSocket(newSocket);

    import('../data/words').then(module => {
      setWordsList(module.WORDS);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updatePlayerName = (name: string) => {
    if (!localPlayer || !socket) return;
    const updated = { ...localPlayer, name };
    setLocalPlayer(updated);
    localStorage.setItem('alias_player_name', name);
    socket.emit('joinGame', updated); // rejoin to update name
  };

  const movePlayer = (targetTeamId: string | 'spectator') => {
    if (!localPlayer || !socket) return;
    socket.emit('movePlayer', { playerId: localPlayer.id, targetTeamId });
  };

  const setSettings = (settings: GameSettings) => {
    socket?.emit('updateSettings', settings);
  };

  const setTeams = (teams: Team[]) => {
    socket?.emit('setTeams', teams);
  };

  const setPhase = (phase: GamePhase) => {
    socket?.emit('setPhase', phase);
  };

  const startGame = () => {
    if (!gameState || !socket) return;
    const updatedTeams = gameState.teams.map(t => ({ ...t, score: 0 }));
    socket.emit('updateState', { 
      phase: 'pre-turn',
      teams: updatedTeams,
      activeTeamIndex: 0,
    });
  };

  const pickRandomWord = (used: string[]) => {
    let availableWords = wordsList.filter(w => !used.includes(w));
    if (availableWords.length === 0) {
      // Loop around if all words are used
      availableWords = wordsList;
      socket?.emit('updateState', { usedWords: [] });
    }
    return availableWords[Math.floor(Math.random() * availableWords.length)];
  };

  const startTurn = () => {
    if (!socket || wordsList.length === 0 || !gameState) return;
    const randomWord = pickRandomWord(gameState.usedWords);
    socket.emit('updateState', { 
      phase: 'playing',
      currentRoundWords: [],
      currentWord: randomWord,
      turnWordActive: true,
      timeRemaining: gameState?.settings.turnDurationSeconds || 60,
      usedWords: [...gameState.usedWords, randomWord]
    });
  };

  const popWordAction = (status: WordStatus) => {
    if (!gameState || !socket) return;
    
    // Optimistic update for swift UX
    const randomWord = pickRandomWord(gameState.usedWords);
    
    const newWordEntry: RoundWord = {
      id: uuidv4(),
      word: gameState.currentWord || '',
      status
    };

    socket.emit('updateState', {
      currentRoundWords: [...gameState.currentRoundWords, newWordEntry],
      currentWord: randomWord,
      usedWords: [...gameState.usedWords, randomWord]
    });
  };

  const handleWordGuessed = () => popWordAction('guessed');
  
  const handleWordSkipped = () => popWordAction(gameState?.settings.penaltyForSkip ? 'penalty' : 'skipped');

  const endTurn = () => {
    socket?.emit('updateState', { phase: 'review', currentWord: undefined, turnWordActive: false });
  };

  const finishReview = () => {
    if (!gameState || !socket) return;
    const finalWords = gameState.currentRoundWords;
    let pointsMade = 0;
    finalWords.forEach(w => {
      if (w.status === 'guessed') pointsMade++;
      else if (w.status === 'penalty') pointsMade--;
    });

    const updatedTeams = [...gameState.teams];
    updatedTeams[gameState.activeTeamIndex].score += pointsMade;

    let nextPhase = 'pre-turn';
    let nextHistory = gameState.history;
    let nextTeamIndex = (gameState.activeTeamIndex + 1) % updatedTeams.length;

    // Check if round is over (everyone played)
    if (gameState.activeTeamIndex === updatedTeams.length - 1) {
      const winners = updatedTeams.filter(t => t.score >= gameState.settings.scoreToWin);
      if (winners.length > 0) {
        const winner = updatedTeams.reduce((a, b) => a.score > b.score ? a : b);
        nextPhase = 'game-over';
        nextHistory = [
          {
            id: uuidv4(),
            date: Date.now(),
            teams: updatedTeams,
            winnerId: winner.id
          },
          ...gameState.history
        ];
      }
    }

    socket.emit('updateState', {
      teams: updatedTeams,
      activeTeamIndex: nextPhase === 'game-over' ? gameState.activeTeamIndex : nextTeamIndex,
      phase: nextPhase,
      history: nextHistory,
      currentRoundWords: [], // clear for next round
    });
  };

  const toggleWordStatus = (wordId: string) => {
    if (!gameState || !socket) return;
    const updatedWords = gameState.currentRoundWords.map(w => {
      if (w.id === wordId) {
        const newStatus = w.status === 'guessed' ? (gameState.settings.penaltyForSkip ? 'penalty' : 'skipped') : 'guessed';
        return { ...w, status: newStatus as WordStatus };
      }
      return w;
    });
    socket.emit('updateState', { currentRoundWords: updatedWords });
  };

  const voteWord = (wordId: string, vote: 'accept' | 'reject') => {
    if (!gameState || !socket || !localPlayer) return;
    const updatedWords = gameState.currentRoundWords.map(w => {
      if (w.id === wordId) {
        const votes = { ...(w.votes || {}) };
        if (votes[localPlayer.id] === vote) {
          delete votes[localPlayer.id];
        } else {
          votes[localPlayer.id] = vote;
        }
        return { ...w, votes };
      }
      return w;
    });
    socket.emit('updateState', { currentRoundWords: updatedWords });
  };

  const resetToMenu = () => {
    socket?.emit('setPhase', 'menu');
  };
  
  const updatePartialState = (partial: Partial<GameState>) => {
    socket?.emit('updateState', partial);
  };

  return {
    gameState,
    localPlayer,
    updatePlayerName,
    movePlayer,
    setSettings,
    setTeams,
    setPhase,
    startGame,
    startTurn,
    handleWordGuessed,
    handleWordSkipped,
    endTurn,
    finishReview,
    resetToMenu,
    updatePartialState,
    toggleWordStatus,
    voteWord
  };
}
