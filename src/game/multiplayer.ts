/**
 * Real-time WebSocket Client for ODOGWU OPS Multiplayer
 * Connects to the Express/WS server to synchronize players in the Lagos street arena.
 */

export interface RemotePlayerData {
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
}

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  timestamp: number;
}

export interface MultiplayerCallbacks {
  onConnected: (selfId: string) => void;
  onPlayersUpdated: (players: RemotePlayerData[]) => void;
  onPlayerShot: (shot: { id: string; origin: { x: number; y: number; z: number }; hitPoint: { x: number; y: number; z: number }; weapon: string }) => void;
  onPlayerDamaged: (event: { targetId: string; attackerId: string; damage: number; newHealth: number; isHeadshot: boolean }) => void;
  onChatMessage: (msg: ChatMessage) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private selfId: string | null = null;
  private remotePlayers: Map<string, RemotePlayerData> = new Map();
  private callbacks: MultiplayerCallbacks;
  private syncInterval: number | null = null;
  private isConnecting: boolean = false;

  constructor(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
  }

  public connect(profile: { name: string; outfit: { head: string; vest: string }; weapon: string }) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        // Send join packet
        this.send({
          type: 'join',
          player: {
            name: profile.name,
            team: 'OPERATIVE',
            position: { x: 0, y: 1.7, z: 10 },
            rotation: { yaw: 0, pitch: 0 },
            weapon: profile.weapon,
            outfit: profile.outfit,
          },
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'init') {
            this.selfId = msg.selfId;
            this.callbacks.onConnected(msg.selfId);
            this.remotePlayers.clear();
            (msg.players as RemotePlayerData[]).forEach((p) => {
              this.remotePlayers.set(p.id, p);
            });
            this.notifyPlayersUpdate();
          }

          if (msg.type === 'player:joined') {
            if (msg.player.id !== this.selfId) {
              this.remotePlayers.set(msg.player.id, msg.player);
              this.notifyPlayersUpdate();
            }
          }

          if (msg.type === 'player:moved') {
            const p = this.remotePlayers.get(msg.id);
            if (p) {
              p.position = msg.position;
              p.rotation = msg.rotation;
              p.health = msg.health;
              p.weapon = msg.weapon;
              p.isAiming = msg.isAiming;
              p.isFiring = msg.isFiring;
            }
          }

          if (msg.type === 'player:shot') {
            this.callbacks.onPlayerShot(msg);
          }

          if (msg.type === 'player:damaged') {
            const target = this.remotePlayers.get(msg.targetId);
            if (target) {
              target.health = msg.newHealth;
            }
            this.callbacks.onPlayerDamaged(msg);
            this.notifyPlayersUpdate();
          }

          if (msg.type === 'player:left') {
            this.remotePlayers.delete(msg.id);
            this.notifyPlayersUpdate();
          }

          if (msg.type === 'player:chat') {
            this.callbacks.onChatMessage({
              id: `${Date.now()}-${Math.random()}`,
              name: msg.name,
              text: msg.text,
              timestamp: Date.now(),
            });
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        // Attempt reconnect after 3 seconds
        setTimeout(() => {
          if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
            this.connect(profile);
          }
        }, 3000);
      };

      this.ws.onerror = (err) => {
        console.warn('Multiplayer WS connection warning:', err);
      };
    } catch (err) {
      console.warn('Failed to initialize WebSocket client:', err);
    }
  }

  public sendSync(state: {
    position: { x: number; y: number; z: number };
    rotation: { yaw: number; pitch: number };
    health: number;
    weapon: string;
    isAiming: boolean;
    isFiring: boolean;
  }) {
    this.send({
      type: 'sync',
      ...state,
    });
  }

  public sendShoot(origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }, hitPoint: { x: number; y: number; z: number }, weapon: string) {
    this.send({
      type: 'shoot',
      origin,
      direction,
      hitPoint,
      weapon,
    });
  }

  public sendDamage(targetId: string, damage: number, isHeadshot: boolean) {
    this.send({
      type: 'damage',
      targetId,
      damage,
      isHeadshot,
    });
  }

  public sendChat(text: string) {
    this.send({
      type: 'chat',
      text,
    });
  }

  public getRemotePlayers(): RemotePlayerData[] {
    return Array.from(this.remotePlayers.values());
  }

  public getSelfId(): string | null {
    return this.selfId;
  }

  private notifyPlayersUpdate() {
    this.callbacks.onPlayersUpdated(this.getRemotePlayers());
  }

  private send(data: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
