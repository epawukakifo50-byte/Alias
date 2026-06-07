import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { GameState, Team, Player, GameSettings } from './src/types'; // We will define these

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 3000;

// Internal Game State on the Server
let gameState: GameState = {
  phase: 'menu',
  teams: [],
  spectators: [],
  settings: {
    turnDurationSeconds: 60,
    scoreToWin: 50,
    penaltyForSkip: false,
  },
  activeTeamIndex: 0,
  currentRoundWords: [],
  currentWordIndex: 0,
  timeRemaining: 60,
  history: [],
  usedWords: [],
};

// Rooms / Channels can be done if needed, but for now just one global game room.

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.emit('gameState', gameState);

  socket.on('joinGame', (player: Player) => {
    // Check if player exists, if not add to spectators
    const existingSpectator = gameState.spectators.find(p => p.id === player.id);
    let foundInTeam = false;
    for (const team of gameState.teams) {
      if (team.players.find(p => p.id === player.id)) {
        foundInTeam = true;
        // Update name if changed
        const p = team.players.find(p => p.id === player.id);
        if (p) p.name = player.name;
        break;
      }
    }

    if (!existingSpectator && !foundInTeam) {
       gameState.spectators.push(player);
    } else if (existingSpectator) {
       existingSpectator.name = player.name;
    }
    
    io.emit('gameState', gameState);
  });

  socket.on('movePlayer', ({ playerId, targetTeamId }: { playerId: string, targetTeamId: string | 'spectator' }) => {
    let playerObj: Player | undefined = undefined;

    // Remove player from current location
    const specIndex = gameState.spectators.findIndex(p => p.id === playerId);
    if (specIndex !== -1) {
      playerObj = gameState.spectators.splice(specIndex, 1)[0];
    } else {
      for (const team of gameState.teams) {
        const teamPlayerIndex = team.players.findIndex(p => p.id === playerId);
        if (teamPlayerIndex !== -1) {
          playerObj = team.players.splice(teamPlayerIndex, 1)[0];
          break;
        }
      }
    }

    if (playerObj) {
      if (targetTeamId === 'spectator') {
        gameState.spectators.push(playerObj);
      } else {
        const team = gameState.teams.find(t => t.id === targetTeamId);
        if (team) {
          team.players.push(playerObj);
        } else {
          // Team not found, fallback to spectator
           gameState.spectators.push(playerObj);
        }
      }
    }
    io.emit('gameState', gameState);
  });

  socket.on('updateSettings', (settings: GameSettings) => {
    gameState.settings = settings;
    io.emit('gameState', gameState);
  });

  socket.on('setTeams', (teams: Team[]) => {
    gameState.teams = teams;
    io.emit('gameState', gameState);
  });

  socket.on('setPhase', (phase: GameState['phase']) => {
    gameState.phase = phase;
    if (phase === 'playing') {
       // initialize playing state maybe? or it's handled via custom events
    }
    io.emit('gameState', gameState);
  });
  
  socket.on('updateState', (partialState: Partial<GameState>) => {
    gameState = { ...gameState, ...partialState };
    io.emit('gameState', gameState);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

async function startServer() {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
