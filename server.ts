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

const games: Record<string, GameState> = {};

function getGameState(roomId: string, initiatorId?: string): GameState {
  if (!games[roomId]) {
    games[roomId] = {
      hostId: initiatorId || '',
      phase: 'setup',
      teams: [],
      spectators: [],
      settings: {
        turnDurationSeconds: 60,
        scoreToWin: 50,
        penaltyForSkip: false,
        packIds: ['standard'],
      },
      activeTeamIndex: 0,
      currentRoundWords: [],
      currentWordIndex: 0,
      timeRemaining: 60,
      history: [],
      usedWords: [],
    };
  }
  return games[roomId];
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGame', (player: Player, roomId: string) => {
    if (!roomId) return;
    
    // Leave previous active room
    if (socket.data.roomId && socket.data.roomId !== roomId) {
      socket.leave(socket.data.roomId);
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = player.id;
    
    const gameState = getGameState(roomId, player.id);

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
    
    io.to(roomId).emit('gameState', gameState);
  });

  socket.on('movePlayer', ({ playerId, targetTeamId }: { playerId: string, targetTeamId: string | 'spectator' }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const gameState = getGameState(roomId);
    
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
    io.to(roomId).emit('gameState', gameState);
  });

  socket.on('updateSettings', (settings: GameSettings) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const gameState = getGameState(roomId);
    gameState.settings = settings;
    io.to(roomId).emit('gameState', gameState);
  });

  socket.on('setTeams', (teams: Team[]) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const gameState = getGameState(roomId);
    gameState.teams = teams;
    io.to(roomId).emit('gameState', gameState);
  });

  socket.on('setPhase', (phase: GameState['phase']) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const gameState = getGameState(roomId);
    gameState.phase = phase;
    io.to(roomId).emit('gameState', gameState);
  });
  
  socket.on('updateState', (partialState: Partial<GameState>) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const gameState = getGameState(roomId);
    games[roomId] = { ...gameState, ...partialState };
    io.to(roomId).emit('gameState', games[roomId]);
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
