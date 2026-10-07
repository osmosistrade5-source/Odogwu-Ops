import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { LagosStreetEngine } from './game/engine.ts';
import {
  CameraViewMode,
  FoodItem,
  GameMode,
  KillfeedEntry,
  PlayerInventory,
  PlayerSimsProfile,
  Quest,
} from './game/types.ts';
import { FOOD_MENU, INITIAL_PROFILE, INITIAL_QUESTS, WEAPONS } from './game/constants.ts';
import { TacticalHUD } from './components/TacticalHUD.tsx';
import { SimsHubOverlay } from './components/SimsHubOverlay.tsx';
import { WardrobeModal } from './components/WardrobeModal.tsx';
import { QuestModal } from './components/QuestModal.tsx';
import { VRControlsGuide } from './components/VRControlsGuide.tsx';
import { MultiplayerModal } from './components/MultiplayerModal.tsx';
import { CityMapModal } from './components/CityMapModal.tsx';
import { ChatMessage, MultiplayerClient, RemotePlayerData } from './game/multiplayer.ts';
import { soundEngine } from './game/audio.ts';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<LagosStreetEngine | null>(null);
  const mpClientRef = useRef<MultiplayerClient | null>(null);

  // Profile & Stats (Sims + Tactical)
  const [profile, setProfile] = useState<PlayerSimsProfile>(INITIAL_PROFILE);
  const [health, setHealth] = useState(100);
  const [viewMode, setViewMode] = useState<CameraViewMode>('FPS');
  const [gameMode, setGameMode] = useState<GameMode>('COD_SKIRMISH');
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);

  // District & GPS Tracking in the Lagos Metropolis
  const [currentDistrict, setCurrentDistrict] = useState('Tinubu Heritage Roundabout');
  const [playerPositionCoords, setPlayerPositionCoords] = useState({ x: 0, z: 10 });

  // Weapon inventory
  const [inventory, setInventory] = useState<PlayerInventory>({
    weapons: {
      primary: WEAPONS.ar,
      secondary: WEAPONS.smg,
      melee: WEAPONS.melee,
      tactical: WEAPONS.tactical,
    },
    ammo: {
      ar: WEAPONS.ar.magSize,
      smg: WEAPONS.smg.magSize,
      melee: WEAPONS.melee.magSize,
      tactical: WEAPONS.tactical.magSize,
    },
    reserveAmmo: {
      ar: WEAPONS.ar.maxReserve,
      smg: WEAPONS.smg.maxReserve,
      melee: WEAPONS.melee.maxReserve,
      tactical: WEAPONS.tactical.maxReserve,
    },
    selectedSlot: 'primary',
  });

  // Tactical combat states
  const [isAiming, setIsAiming] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [hitMarker, setHitMarker] = useState<{ active: boolean; isHeadshot: boolean } | null>(null);
  const [killfeed, setKillfeed] = useState<KillfeedEntry[]>([]);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [radarEnemies, setRadarEnemies] = useState<{ x: number; z: number }[]>([]);
  const [radarCivilians, setRadarCivilians] = useState<{ x: number; z: number }[]>([]);

  // Multiplayer State
  const [onlinePlayers, setOnlinePlayers] = useState<RemotePlayerData[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selfMpId, setSelfMpId] = useState<string | null>(null);

  // Modals
  const [showSimsHub, setShowSimsHub] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Initialize 3D Lagos Metropolis & Multiplayer
  useEffect(() => {
    if (!containerRef.current) return;

    const currentWeapon = inventory.weapons[inventory.selectedSlot];

    // 1. Initialize 3D WebGL Metropolis Engine
    const engine = new LagosStreetEngine(containerRef.current, currentWeapon, {
      onHit: (isHeadshot, dmg) => {
        setHitMarker({ active: true, isHeadshot });
        setTimeout(() => setHitMarker(null), 180);
      },
      onKill: (victimName, weaponName, isHeadshot) => {
        const newEntry: KillfeedEntry = {
          id: `${Date.now()}-${Math.random()}`,
          killer: profile.name,
          victim: victimName,
          weapon: weaponName,
          headshot: isHeadshot,
          timestamp: Date.now(),
        };
        setKillfeed((prev) => [newEntry, ...prev.slice(0, 5)]);

        setQuests((prev) =>
          prev.map((q) => {
            if (q.id === 'q1' && !q.completed) {
              const count = q.currentCount + 1;
              const completed = count >= q.targetCount;
              if (completed) onQuestComplete(q);
              return { ...q, currentCount: count, completed };
            }
            if (q.id === 'q3' && isHeadshot && !q.completed) {
              const count = q.currentCount + 1;
              const completed = count >= q.targetCount;
              if (completed) onQuestComplete(q);
              return { ...q, currentCount: count, completed };
            }
            return q;
          })
        );

        setProfile((p) => ({
          ...p,
          streetCred: p.streetCred + 25,
          vibes: Math.min(100, p.vibes + 10),
        }));
      },
      onPlayerDamage: (newHealth) => {
        setHealth(newHealth);
        if (newHealth <= 0) {
          showAnnouncementBanner('Wetin be this! You fall for Lagos street! Respawning...');
          setTimeout(() => {
            setHealth(100);
            if (engineRef.current) {
              engineRef.current.playerHealth = 100;
              engineRef.current.playerPosition.set(0, 1.7, 10);
            }
          }, 3000);
        }
      },
      onBotDialogue: (botName, message) => {
        showAnnouncementBanner(`${botName}: "${message}"`);
      },
      onNairaPickup: (amount) => {
        setProfile((p) => ({ ...p, naira: p.naira + amount }));
      },
      onDistrictChange: (districtName) => {
        setCurrentDistrict(districtName);
        showAnnouncementBanner(`📍 ENTERING: ${districtName.toUpperCase()}`);
      },
      onRemoteHit: (targetId, damage, isHeadshot) => {
        mpClientRef.current?.sendDamage(targetId, damage, isHeadshot);
      },
      onPlayerShoot: (origin, dir, hitPoint, weapon) => {
        mpClientRef.current?.sendShoot(origin, dir, hitPoint, weapon);
      },
    });

    engineRef.current = engine;

    // 2. Initialize Multiplayer WebSocket Client
    const mpClient = new MultiplayerClient({
      onConnected: (selfId) => {
        setSelfMpId(selfId);
        showAnnouncementBanner(`⚡ CONNECTED TO MULTIPLAYER LAGOS SERVER!`);
      },
      onPlayersUpdated: (players) => {
        setOnlinePlayers(players);
        engineRef.current?.syncRemotePlayers(players, mpClientRef.current?.getSelfId() || null);
      },
      onPlayerShot: (shot) => {
        engineRef.current?.renderRemoteShot(shot.origin, shot.hitPoint, shot.weapon);
      },
      onPlayerDamaged: (event) => {
        if (event.targetId === mpClientRef.current?.getSelfId()) {
          setHealth(event.newHealth);
          if (engineRef.current) engineRef.current.playerHealth = event.newHealth;
          showAnnouncementBanner(`Hit by rival operative! -${event.damage} HP`);
        }
      },
      onChatMessage: (msg) => {
        setChatMessages((prev) => [...prev.slice(-30), msg]);
        showAnnouncementBanner(`${msg.name}: "${msg.text}"`);
      },
    });

    mpClient.connect({
      name: profile.name,
      outfit: { head: profile.outfit.head, vest: profile.outfit.vest },
      weapon: currentWeapon.name,
    });
    mpClientRef.current = mpClient;

    // 3. Periodic Position Sync to Multiplayer Server (~15 Hz)
    const syncTimer = setInterval(() => {
      if (engineRef.current && mpClientRef.current) {
        mpClientRef.current.sendSync({
          position: {
            x: engineRef.current.playerPosition.x,
            y: engineRef.current.playerPosition.y,
            z: engineRef.current.playerPosition.z,
          },
          rotation: {
            yaw: engineRef.current.playerRotation.yaw,
            pitch: engineRef.current.playerRotation.pitch,
          },
          health: engineRef.current.playerHealth,
          weapon: inventory.weapons[inventory.selectedSlot].name,
          isAiming: engineRef.current.isAiming,
          isFiring: false,
        });
      }
    }, 65);

    // 4. Periodic Radar & GPS Position update
    const radarTimer = setInterval(() => {
      if (engineRef.current) {
        const bots = engineRef.current.getBots();
        const coords = bots
          .filter((b) => b.team === 'ENEMY' && b.state !== 'DEAD')
          .map((b) => ({ x: b.position.x, z: b.position.z }));
        setRadarEnemies(coords);

        const civs = engineRef.current.getCivilians();
        setRadarCivilians(civs.map((c) => ({ x: c.x, z: c.z })));

        setPlayerPositionCoords({
          x: Math.round(engineRef.current.playerPosition.x),
          z: Math.round(engineRef.current.playerPosition.z),
        });
      }
    }, 350);

    return () => {
      clearInterval(syncTimer);
      clearInterval(radarTimer);
      mpClient.disconnect();
      mpClientRef.current = null;
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const showAnnouncementBanner = (text: string) => {
    setAnnouncement(text);
    setTimeout(() => {
      setAnnouncement(null);
    }, 3500);
  };

  const onQuestComplete = (q: Quest) => {
    soundEngine.playCashEarned();
    showAnnouncementBanner(`CONTRACT COMPLETE: ${q.title}! (+₦${q.rewardNaira.toLocaleString()})`);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    setProfile((p) => ({
      ...p,
      naira: p.naira + q.rewardNaira,
      streetCred: p.streetCred + q.rewardCred,
    }));
  };

  const handleJoystickMove = (input: { forward: number; right: number }) => {
    if (engineRef.current) {
      engineRef.current.setMoveInput(input.forward, input.right);
    }
  };

  const handleFastTravel = (x: number, z: number, districtName: string) => {
    if (engineRef.current) {
      engineRef.current.fastTravelTo(x, z);
      showAnnouncementBanner(`🚍 DANFO HOP: Arrived at ${districtName}!`);
      setCurrentDistrict(districtName);
    }
  };

  // Weapon Actions
  const handleFire = () => {
    if (!engineRef.current) return;
    const currentWeapon = inventory.weapons[inventory.selectedSlot];
    const currentAmmo = inventory.ammo[currentWeapon.id] ?? currentWeapon.magSize;

    if (currentAmmo <= 0) {
      handleReload();
      return;
    }

    const fired = engineRef.current.shoot();
    if (fired) {
      setInventory((prev) => ({
        ...prev,
        ammo: {
          ...prev.ammo,
          [currentWeapon.id]: Math.max(0, currentAmmo - 1),
        },
      }));
    }
  };

  const handleAimToggle = () => {
    if (!engineRef.current) return;
    const next = !isAiming;
    setIsAiming(next);
    engineRef.current.setAiming(next);
  };

  const handleReload = () => {
    if (!engineRef.current || isReloading) return;
    const currentWeapon = inventory.weapons[inventory.selectedSlot];
    const reserve = inventory.reserveAmmo[currentWeapon.id] ?? currentWeapon.maxReserve;
    if (reserve <= 0) return;

    setIsReloading(true);
    engineRef.current.reload();

    setTimeout(() => {
      const needed = currentWeapon.magSize - (inventory.ammo[currentWeapon.id] ?? 0);
      const toLoad = Math.min(needed, reserve);

      setInventory((prev) => ({
        ...prev,
        ammo: {
          ...prev.ammo,
          [currentWeapon.id]: (prev.ammo[currentWeapon.id] ?? 0) + toLoad,
        },
        reserveAmmo: {
          ...prev.reserveAmmo,
          [currentWeapon.id]: Math.max(0, (prev.reserveAmmo[currentWeapon.id] ?? 0) - toLoad),
        },
      }));
      setIsReloading(false);
    }, currentWeapon.reloadTime * 1000);
  };

  const handleSwitchWeapon = (slot: keyof PlayerInventory['weapons']) => {
    setInventory((prev) => ({ ...prev, selectedSlot: slot }));
    const newWeapon = inventory.weapons[slot];
    if (engineRef.current) {
      engineRef.current.setWeapon(newWeapon);
    }
  };

  const handleToggleViewMode = () => {
    if (!engineRef.current) return;
    engineRef.current.toggleViewMode();
    setViewMode(engineRef.current.getViewMode());
  };

  const handleTriggerVR = () => {
    if (engineRef.current) {
      engineRef.current.triggerVRMode();
    }
  };

  // Scorestreaks
  const handleCallDanfoStrike = () => {
    if (engineRef.current) {
      showAnnouncementBanner('🚍 DANFO EXPRESS RAM STRIKE INCOMING! CLEAR ROAD!');
      engineRef.current.callDanfoStrike();
    }
  };

  const handleCallNepaBlackout = () => {
    if (engineRef.current) {
      showAnnouncementBanner('⚡ NEPA BLACKOUT ACROSS LAGOS! ENEMY SQUADS DISORIENTED!');
      engineRef.current.callNepaBlackout();
    }
  };

  const handleCallSuyaAdrenaline = () => {
    if (engineRef.current) {
      showAnnouncementBanner('🌶️ SUYA SPICE OVERDRIVE! SPRINT SPEED & AGILITY MAXED!');
      engineRef.current.callSuyaAdrenaline();
      setProfile((p) => ({
        ...p,
        jollofEnergy: Math.min(100, p.jollofEnergy + 20),
        vibes: 100,
      }));
    }
  };

  // Sims Hub food & upgrades
  const handleBuyFood = (food: FoodItem) => {
    if (profile.naira < food.costNaira) return;

    setProfile((p) => ({
      ...p,
      naira: p.naira - food.costNaira,
      jollofEnergy: Math.min(100, p.jollofEnergy + food.energyBonus),
      vibes: Math.min(100, p.vibes + food.vibeBonus),
    }));
    setHealth((h) => Math.min(100, h + food.healthBonus));
    if (engineRef.current) {
      engineRef.current.playerHealth = Math.min(100, engineRef.current.playerHealth + food.healthBonus);
    }

    showAnnouncementBanner(`Ate ${food.name}! ${food.tagline}`);

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'q2' && !q.completed) {
          const count = q.currentCount + 1;
          const completed = count >= q.targetCount;
          if (completed) onQuestComplete(q);
          return { ...q, currentCount: count, completed };
        }
        return q;
      })
    );
  };

  const handleUpgradeWeapon = (upgradeKey: keyof PlayerSimsProfile['upgrades'], cost: number) => {
    if (profile.naira < cost) return;

    setProfile((p) => ({
      ...p,
      naira: p.naira - cost,
      upgrades: {
        ...p.upgrades,
        [upgradeKey]: true,
      },
    }));
    showAnnouncementBanner(`Installed ${upgradeKey} attachment from Computer Village!`);
  };

  const handleSelectOutfit = (category: keyof PlayerSimsProfile['outfit'], value: string) => {
    setProfile((p) => ({
      ...p,
      outfit: {
        ...p.outfit,
        [category]: value,
      },
    }));
    showAnnouncementBanner(`Equipped ${value}! Street Cred +10`);
  };

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    if (engineRef.current) {
      engineRef.current.setGameMode(mode);
    }
    setShowQuests(false);
    showAnnouncementBanner(`DEPLOYED TO: ${mode.replace('_', ' ')}`);
  };

  const handleSendMessage = (text: string) => {
    mpClientRef.current?.sendChat(text);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Nigerian Street Callout / Announcement Banner */}
      {announcement && (
        <div className="absolute top-20 inset-x-0 flex justify-center z-30 pointer-events-none animate-bounce">
          <div className="bg-stone-950/95 border-2 border-amber-500 px-5 py-2 rounded-xl text-amber-300 font-heading font-black text-xs md:text-sm shadow-2xl flex items-center gap-2">
            <span className="text-base">📢</span>
            <span>{announcement}</span>
          </div>
        </div>
      )}

      {/* Call of Duty Mobile Tactical HUD & On-Screen Controls */}
      <TacticalHUD
        profile={profile}
        health={health}
        inventory={inventory}
        viewMode={viewMode}
        killfeed={killfeed}
        hitMarker={hitMarker}
        currentDistrict={currentDistrict}
        onFire={handleFire}
        onAimToggle={handleAimToggle}
        isAiming={isAiming}
        onReload={handleReload}
        isReloading={isReloading}
        onSwitchWeapon={handleSwitchWeapon}
        onToggleViewMode={handleToggleViewMode}
        onTriggerVR={handleTriggerVR}
        onCallDanfoStrike={handleCallDanfoStrike}
        onCallNepaBlackout={handleCallNepaBlackout}
        onCallSuyaAdrenaline={handleCallSuyaAdrenaline}
        onOpenSimsHub={() => setShowSimsHub(true)}
        onOpenWardrobe={() => setShowWardrobe(true)}
        onOpenQuests={() => setShowQuests(true)}
        onOpenMultiplayer={() => setShowMultiplayer(true)}
        onOpenMap={() => setShowMap(true)}
        onJoystickMove={handleJoystickMove}
        onlinePlayerCount={onlinePlayers.length}
        radarEnemies={radarEnemies}
        radarCivilians={radarCivilians}
      />

      {/* Floating Controls Helper Hint */}
      <div className="absolute bottom-24 left-36 z-20 pointer-events-auto">
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1 bg-stone-900/80 hover:bg-stone-800 text-stone-300 text-[11px] rounded-lg border border-stone-800 shadow-md"
        >
          <span>🎮 VR & Key Controls</span>
        </button>
      </div>

      {/* Modals */}
      <SimsHubOverlay
        profile={profile}
        isOpen={showSimsHub}
        onClose={() => setShowSimsHub(false)}
        onBuyFood={handleBuyFood}
        onUpgradeWeapon={handleUpgradeWeapon}
      />

      <WardrobeModal
        profile={profile}
        isOpen={showWardrobe}
        onClose={() => setShowWardrobe(false)}
        onSelectOutfit={handleSelectOutfit}
      />

      <QuestModal
        quests={quests}
        currentMode={gameMode}
        isOpen={showQuests}
        onClose={() => setShowQuests(false)}
        onSelectMode={handleSelectMode}
      />

      <VRControlsGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <MultiplayerModal
        isOpen={showMultiplayer}
        onClose={() => setShowMultiplayer(false)}
        onlinePlayers={onlinePlayers}
        selfName={profile.name}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
      />

      <CityMapModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        playerPos={playerPositionCoords}
        onFastTravel={handleFastTravel}
      />
    </div>
  );
}
