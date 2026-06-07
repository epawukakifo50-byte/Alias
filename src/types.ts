export type Player = {
  id: string;
  name: string;
  isOnline?: boolean;
};

export type Team = {
  id: string;
  name: string;
  score: number;
  players: Player[];
};

export type GamePhase = 'menu' | 'setup' | 'pre-turn' | 'playing' | 'review' | 'game-over' | 'history';

export type WordStatus = 'guessed' | 'skipped' | 'penalty' | 'unseen';

export type WordVote = 'accept' | 'reject';

export type RoundWord = {
  id: string;
  word: string;
  status: WordStatus;
  votes?: Record<string, WordVote>;
};

export type GameSettings = {
  scoreToWin: number;
  turnDurationSeconds: number;
  penaltyForSkip: boolean;
};

export type MatchHistory = {
  id: string;
  date: number;
  teams: Team[];
  winnerId: string;
};

export type GameState = {
  phase: GamePhase;
  teams: Team[];
  spectators: Player[];
  settings: GameSettings;
  activeTeamIndex: number;
  currentRoundWords: RoundWord[];
  currentWordIndex: number;
  timeRemaining: number;
  history: MatchHistory[];
  currentWord?: string;
  turnWordActive?: boolean;
  usedWords: string[];
};
