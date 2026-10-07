import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

interface RemotePlayer {
  id: string;
  name: string;
  team: 'OPERATIVE' | 'SYNDICATE';
  position: { x: number; y: number; z: number };
  rotation: { yaw: number; pitch: number };
  health: number;
  maxHealth: number;
  weapon: string;
  isAiming: boolean;
  isFiring: boolean;
  outfit: { head: string; vest: string };
  lastActive: number;
}

// Active players stored on server (Server as Source of Truth)
const players = new Map<string, { ws: WebSocket; data: RemotePlayer }>();

wss.on('connection', (ws) => {
  let playerId: string | null = null;

  ws.on('message', (messageRaw) => {
    try {
      const msg = JSON.parse(messageRaw.toString());

      if (msg.type === 'join') {
        const assignedId: string = msg.player?.id || `odogwu-${Math.random().toString(36).substring(2, 7)}`;
        playerId = assignedId;
        const newPlayer: RemotePlayer = {
          id: assignedId,
          name: msg.player?.name || 'Lagos Fighter',
          team: msg.player?.team || 'OPERATIVE',
          position: msg.player?.position || { x: 0, y: 1.7, z: 10 },
          rotation: msg.player?.rotation || { yaw: 0, pitch: 0 },
          health: 100,
          maxHealth: 100,
          weapon: msg.player?.weapon || 'Lekki Sweeper AK-47',
          isAiming: false,
          isFiring: false,
          outfit: msg.player?.outfit || { head: 'Afro Bucket Hat', vest: 'Ankara Tactical Kevlar' },
          lastActive: Date.now(),
        };

        players.set(assignedId, { ws, data: newPlayer });

        // 1. Send initial state to the newly joined player
        const allExistingPlayers: RemotePlayer[] = [];
        players.forEach((p, id) => {
          if (id !== assignedId) allExistingPlayers.push(p.data);
        });

        ws.send(JSON.stringify({
          type: 'init',
          selfId: assignedId,
          players: allExistingPlayers,
        }));

        // 2. Broadcast new player to all others
        broadcast({
          type: 'player:joined',
          player: newPlayer,
        }, assignedId);
      }

      if (msg.type === 'sync' && playerId && players.has(playerId)) {
        const p = players.get(playerId)!;
        p.data.position = msg.position;
        p.data.rotation = msg.rotation;
        p.data.health = msg.health;
        p.data.weapon = msg.weapon;
        p.data.isAiming = msg.isAiming;
        p.data.isFiring = msg.isFiring;
        p.data.lastActive = Date.now();

        // Broadcast delta update to others
        broadcast({
          type: 'player:moved',
          id: playerId,
          position: msg.position,
          rotation: msg.rotation,
          health: msg.health,
          weapon: msg.weapon,
          isAiming: msg.isAiming,
          isFiring: msg.isFiring,
        }, playerId);
      }

      if (msg.type === 'shoot' && playerId) {
        broadcast({
          type: 'player:shot',
          id: playerId,
          origin: msg.origin,
          direction: msg.direction,
          hitPoint: msg.hitPoint,
          weapon: msg.weapon,
        }, playerId);
      }

      if (msg.type === 'damage' && msg.targetId && players.has(msg.targetId)) {
        const target = players.get(msg.targetId)!;
        target.data.health = Math.max(0, target.data.health - msg.damage);

        broadcast({
          type: 'player:damaged',
          targetId: msg.targetId,
          attackerId: playerId,
          damage: msg.damage,
          newHealth: target.data.health,
          isHeadshot: msg.isHeadshot,
        });
      }

      if (msg.type === 'chat' && playerId) {
        broadcast({
          type: 'player:chat',
          id: playerId,
          name: players.get(playerId)?.data.name || 'Player',
          text: msg.text,
        });
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (playerId && players.has(playerId)) {
      players.delete(playerId);
      broadcast({
        type: 'player:left',
        id: playerId,
      });
    }
  });
});

function broadcast(payload: object, excludeId?: string) {
  const json = JSON.stringify(payload);
  players.forEach((p, id) => {
    if (id !== excludeId && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(json);
    }
  });
}

// REST endpoints & Vite integration
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', playersOnline: players.size });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (dev: ${!isProd})`);
  });
}

startServer();
