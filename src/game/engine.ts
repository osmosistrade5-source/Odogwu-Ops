/**
 * ODOGWU OPS: Lagos State Virtual Metropolis 3D Engine
 * An expansive 260m x 260m multi-district virtual city modeling Lagos State, Nigeria:
 * - Central Roundabout & Idejo Heritage Monument (Tinubu Square)
 * - Lekki Phase 1 & Marina (Glass Skyscrapers, Palm Boulevards, Cable-Stayed Link Bridge)
 * - Balogun Island Market (Dense Labyrinth, Zinc Awnings, Suya BBQ Stalls)
 * - Oshodi Transport Interchange (Yellow Danfo Bus Terminals, Pedestrian Bridges, Keke NAPEPs)
 * - Computer Village Ikeja (Tech Towers, Giant Billboards, Generator Alley)
 * - Elevated Highway Flyover Bridge with Walkable Sniper Decks
 * Styled with vibrant comic pop-art aesthetics inspired by monkeypost.xyz.
 */

import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { BotAgent, CameraViewMode, GameMode, WeaponDef } from './types.ts';
import { soundEngine } from './audio.ts';
import { PIDGIN_CALLOUTS, LAGOS_DISTRICTS } from './constants.ts';
import { RemotePlayerData } from './multiplayer.ts';

// Generated authentic visual textures
const BILLBOARD_TEXTURE = '/src/assets/images/lagos_street_billboard_1791368641525.jpg';
const MAMA_PUT_TEXTURE = '/src/assets/images/mama_put_buka_sign_1791368662651.jpg';
const DANFO_ART_TEXTURE = '/src/assets/images/danfo_bus_texture_art_1791368671757.jpg';
const SKYLINE_TEXTURE = '/src/assets/images/lagos_skyline_panorama_1791369991695.jpg';
const COMP_VILLAGE_TEXTURE = '/src/assets/images/computer_village_billboard_1791370002297.jpg';

export interface EngineCallbacks {
  onHit: (isHeadshot: boolean, damage: number) => void;
  onKill: (victimName: string, weaponName: string, isHeadshot: boolean) => void;
  onPlayerDamage: (newHealth: number) => void;
  onBotDialogue: (botName: string, message: string) => void;
  onNairaPickup: (amount: number) => void;
  onDistrictChange?: (districtName: string) => void;
  onRemoteHit?: (targetId: string, damage: number, isHeadshot: boolean) => void;
  onPlayerShoot?: (origin: { x: number; y: number; z: number }, dir: { x: number; y: number; z: number }, hitPoint: { x: number; y: number; z: number }, weapon: string) => void;
}

export class LagosStreetEngine {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private callbacks: EngineCallbacks;

  // View & Game mode
  private viewMode: CameraViewMode = 'FPS';
  private gameMode: GameMode = 'COD_SKIRMISH';

  // Player tactical state
  public playerPosition = new THREE.Vector3(0, 1.7, 10);
  public playerVelocity = new THREE.Vector3();
  public playerRotation = { yaw: 0, pitch: 0 };
  public playerHealth = 100;
  public isAiming = false;
  public isReloading = false;
  public isSprinting = false;
  public isCrouched = false;
  private isPointerLocked = false;
  private lastReportedDistrict = '';

  // Input states & Sims Click-to-Move
  public moveInput = { forward: 0, right: 0 };
  private keys: Record<string, boolean> = {};
  public navTarget: THREE.Vector3 | null = null;
  private navMarkerMesh: THREE.Mesh | null = null;
  private groundMesh!: THREE.Mesh;

  // Touch drag-look state
  private isDraggingLook = false;
  private lastDragPos = { x: 0, y: 0 };

  // 3D Scene Objects
  private weaponMeshGroup!: THREE.Group;
  private muzzleFlashLight!: THREE.PointLight;
  private muzzleFlashMesh!: THREE.Mesh;
  private playerCharacterMesh!: THREE.Group;
  private plumbobMesh!: THREE.Mesh;
  private bots: BotAgent[] = [];
  private botMeshes: Map<string, THREE.Group> = new Map();
  private bulletTracers: { mesh: THREE.Line; age: number }[] = [];
  private particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
  private danfoBuses: THREE.Group[] = [];
  private activeEscortDanfo: THREE.Group | null = null;
  private escortProgress = 0;

  // Moving City Traffic (Circulating Danfos)
  private trafficDanfos: { mesh: THREE.Group; progress: number; speed: number; radius: number }[] = [];

  // Multiplayer Remote Players
  private remotePlayerMeshes: Map<string, THREE.Group> = new Map();

  // Weapon visual offset
  private defaultWeaponPos = new THREE.Vector3(0.26, -0.25, -0.48);
  private adsWeaponPos = new THREE.Vector3(0, -0.19, -0.32);
  private currentWeaponPos = new THREE.Vector3(0.26, -0.25, -0.48);
  private recoilOffset = new THREE.Vector3();
  private currentWeaponDef: WeaponDef;

  // Animation & Clock
  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private textureLoader = new THREE.TextureLoader();
  private vrButtonElement: HTMLElement | null = null;

  constructor(container: HTMLElement, currentWeapon: WeaponDef, callbacks: EngineCallbacks) {
    this.container = container;
    this.currentWeaponDef = currentWeapon;
    this.callbacks = callbacks;

    this.initThree();
    this.buildLagosMetropolis();
    this.buildPlayerWeapons();
    this.buildPlayerCharacterForSims();
    this.setupCityBots();
    this.setupNavMarker();
    this.setupInputListeners();
    this.setupWebXR();

    this.animate();
  }

  private initThree() {
    this.scene = new THREE.Scene();
    // Warm tropical Lagos golden sunset haze
    this.scene.background = new THREE.Color(0xd97706);
    this.scene.fog = new THREE.FogExp2(0xf59e0b, 0.009);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(72, aspect, 0.1, 400);
    this.camera.position.copy(this.playerPosition);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL Context Lost');
    });

    // Ambient light
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0xd97706, 0.75);
    this.scene.add(hemiLight);

    // Warm direct Nigerian sunshine
    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.45);
    dirLight.position.set(80, 110, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.camera.left = -130;
    dirLight.shadow.camera.right = 130;
    dirLight.shadow.camera.top = 130;
    dirLight.shadow.camera.bottom = -130;
    this.scene.add(dirLight);

    window.addEventListener('resize', this.onWindowResize);
  }

  private setupWebXR() {
    this.renderer.xr.enabled = true;
    try {
      this.vrButtonElement = VRButton.createButton(this.renderer);
      this.vrButtonElement.id = 'vr-button-mount';
      this.vrButtonElement.style.position = 'absolute';
      this.vrButtonElement.style.bottom = '20px';
      this.vrButtonElement.style.left = '50%';
      this.vrButtonElement.style.transform = 'translateX(-50%)';
      this.vrButtonElement.style.zIndex = '50';
      this.vrButtonElement.style.backgroundColor = '#ffd000';
      this.vrButtonElement.style.color = '#000000';
      this.vrButtonElement.style.fontWeight = 'bold';
      this.vrButtonElement.style.fontFamily = 'Chakra Petch, sans-serif';
      this.vrButtonElement.style.padding = '8px 18px';
      this.vrButtonElement.style.borderRadius = '8px';
      this.vrButtonElement.style.border = '2px solid #000000';
      this.vrButtonElement.style.display = 'none';
      this.container.appendChild(this.vrButtonElement);
    } catch {
      // WebXR fallback
    }
  }

  public triggerVRMode() {
    if (this.vrButtonElement) this.vrButtonElement.click();
  }

  public setMoveInput(forward: number, right: number) {
    this.moveInput.forward = forward;
    this.moveInput.right = right;
    if (forward !== 0 || right !== 0) {
      this.navTarget = null;
      if (this.navMarkerMesh) this.navMarkerMesh.visible = false;
    }
  }

  private setupNavMarker() {
    const ringGeo = new THREE.RingGeometry(0.4, 0.8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    this.navMarkerMesh = new THREE.Mesh(ringGeo, ringMat);
    this.navMarkerMesh.rotation.x = -Math.PI / 2;
    this.navMarkerMesh.position.y = 0.05;
    this.navMarkerMesh.visible = false;
    this.scene.add(this.navMarkerMesh);
  }

  // --- EXPANSIVE 260m x 260m LAGOS METROPOLIS BUILDER ---
  private buildLagosMetropolis() {
    // 1. Vast City Ground (280m x 280m Asphalt)
    const groundGeo = new THREE.PlaneGeometry(280, 280);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9, metalness: 0.1 });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.groundMesh.name = 'city_ground';
    this.scene.add(this.groundMesh);

    // Lagoon Water perimeter (Lagos Island Lagoon boundary)
    const waterGeo = new THREE.PlaneGeometry(360, 360);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.8 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.6;
    this.scene.add(water);

    // 2. Road Network Grid & Expressways
    this.buildCityExpressways();

    // 3. Central Roundabout & Idejo Heritage Monument (Tinubu Square)
    this.buildCentralRoundabout();

    // 4. Elevated Highway Flyover Bridge ("Lagos Overhead Bridge")
    this.buildElevatedFlyoverBridge();

    // 5. District 1: Lekki Phase 1 & Marina Financial Towers (North-East)
    this.buildLekkiDistrict();

    // 6. District 2: Balogun Island Market (North-West)
    this.buildBalogunDistrict();

    // 7. District 3: Oshodi Transport Interchange & Danfo Terminal (South-West)
    this.buildOshodiDistrict();

    // 8. District 4: Computer Village Ikeja & Tech Alley (South-East)
    this.buildComputerVillageDistrict();

    // 9. Utility Poles, Palms & Moving Traffic Loop
    this.buildCityInfrastructure();
  }

  // --- MAIN DUAL-CARRIAGEWAY BOULEVARDS ---
  private buildCityExpressways() {
    const roadMarkMat = new THREE.MeshBasicMaterial({ color: 0xffd000 });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xf4f4f5 });

    // North-South Expressway ("Broad St / Ikorodu Road")
    const nsLine = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 260), roadMarkMat);
    nsLine.rotation.x = -Math.PI / 2;
    nsLine.position.set(0, 0.02, 0);
    this.scene.add(nsLine);

    // East-West Expressway ("Ozumba Mbadiwe Ave / Marina")
    const ewLine = new THREE.Mesh(new THREE.PlaneGeometry(260, 0.6), roadMarkMat);
    ewLine.rotation.x = -Math.PI / 2;
    ewLine.position.set(0, 0.02, 0);
    this.scene.add(ewLine);

    // Concrete curbs & yellow-black hazard kerbstones along main avenues
    for (let pos = -110; pos <= 110; pos += 6) {
      if (Math.abs(pos) < 18) continue; // Leave central roundabout open

      // North-South sidewalk kerbs
      for (let side of [-10, 10]) {
        const curb = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.35, 5),
          new THREE.MeshStandardMaterial({ color: Math.floor(pos / 6) % 2 === 0 ? 0xffd000 : 0x18181b })
        );
        curb.position.set(side, 0.18, pos);
        curb.castShadow = true;
        this.scene.add(curb);
      }

      // East-West sidewalk kerbs
      for (let side of [-10, 10]) {
        const curb = new THREE.Mesh(
          new THREE.BoxGeometry(5, 0.35, 0.5),
          new THREE.MeshStandardMaterial({ color: Math.floor(pos / 6) % 2 === 0 ? 0xffd000 : 0x18181b })
        );
        curb.position.set(pos, 0.18, side);
        curb.castShadow = true;
        this.scene.add(curb);
      }
    }

    // Zebra Crossings at all 4 avenue approaches
    [
      { x: 0, z: -25, rot: 0 },
      { x: 0, z: 25, rot: 0 },
      { x: -25, z: 0, rot: Math.PI / 2 },
      { x: 25, z: 0, rot: Math.PI / 2 },
    ].forEach((cross) => {
      for (let i = -6; i <= 6; i += 1.6) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 5.5), whiteLineMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.rotation.z = cross.rot;
        stripe.position.set(
          cross.rot === 0 ? cross.x + i : cross.x,
          0.03,
          cross.rot === 0 ? cross.z : cross.z + i
        );
        this.scene.add(stripe);
      }
    });
  }

  // --- CENTRAL ROUNDABOUT & MONUMENT (TINUBU SQUARE / ALLEN) ---
  private buildCentralRoundabout() {
    const roundabout = new THREE.Group();
    roundabout.position.set(0, 0, 0);

    // Raised Circular Island (Radius 15m)
    const islandGeo = new THREE.CylinderGeometry(15, 15.5, 0.45, 32);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 }); // Green lawn
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = 0.22;
    island.receiveShadow = true;
    roundabout.add(island);

    // Decorative Roundabout Curb with yellow/black segments
    const curbGeo = new THREE.TorusGeometry(15.2, 0.3, 8, 32);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xffd000 });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.rotation.x = Math.PI / 2;
    curb.position.y = 0.25;
    roundabout.add(curb);

    // Monument Base Platform
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.6 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.2, 1.2, 16), baseMat);
    base.position.y = 0.8;
    base.castShadow = true;
    roundabout.add(base);

    // Central Bronze Monument: The 3 White Cap Chiefs of Lagos (Idejo Statues)
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.3 });
    const whiteCapMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.4 });

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const statueGrp = new THREE.Group();
      statueGrp.position.set(Math.cos(angle) * 2.2, 1.4, Math.sin(angle) * 2.2);
      statueGrp.rotation.y = angle + Math.PI / 2;

      // Body / Robe
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 3.8, 12), bronzeMat);
      body.position.y = 1.9;
      body.castShadow = true;
      statueGrp.add(body);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), bronzeMat);
      head.position.y = 4.0;
      statueGrp.add(head);

      // White Cap (Traditional Lagos Chief Cap)
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.4, 0.35, 12), whiteCapMat);
      cap.position.y = 4.25;
      statueGrp.add(cap);

      // Chief Staff of Authority
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 8), bronzeMat);
      staff.position.set(0.45, 2.2, 0.3);
      statueGrp.add(staff);

      roundabout.add(statueGrp);
    }

    // Roundabout Palm Trees
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const palm = this.createPalmTree(Math.cos(a) * 10, Math.sin(a) * 10);
      roundabout.add(palm);
    }

    this.scene.add(roundabout);
  }

  // --- ELEVATED HIGHWAY FLYOVER BRIDGE (LAGOS OVERHEAD BRIDGE) ---
  private buildElevatedFlyoverBridge() {
    const bridge = new THREE.Group();
    // Spans from X = -75 to X = 75 at Z = 28, height = 6.2m
    const bridgeY = 6.2;
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.8 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.7 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.6 }); // Cyan barrier

    // Bridge Deck (110m long, 9m wide)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(110, 0.6, 9), deckMat);
    deck.position.set(0, bridgeY, 28);
    deck.receiveShadow = true;
    deck.castShadow = true;
    bridge.add(deck);

    // Yellow road line on bridge
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffd000 });
    const bLine = new THREE.Mesh(new THREE.PlaneGeometry(110, 0.4), lineMat);
    bLine.rotation.x = -Math.PI / 2;
    bLine.position.set(0, bridgeY + 0.32, 28);
    bridge.add(bLine);

    // Side safety guardrails
    for (let side of [-4.5, 4.5]) {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(110, 1.1, 0.3), barrierMat);
      barrier.position.set(0, bridgeY + 0.7, 28 + side);
      barrier.castShadow = true;
      bridge.add(barrier);
    }

    // Heavy concrete support pillars every 22m
    for (let x of [-44, -22, 0, 22, 44]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, bridgeY, 12), pillarMat);
      pillar.position.set(x, bridgeY / 2, 28);
      pillar.castShadow = true;
      bridge.add(pillar);

      // Crosshead beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 8.5), pillarMat);
      beam.position.set(x, bridgeY - 0.5, 28);
      bridge.add(beam);
    }

    // Walkable access on-ramps at left & right ends
    // Left ramp (from ground Y=0 to Y=6.2m)
    const rampGeo = new THREE.BoxGeometry(32, 0.5, 9);
    const rampL = new THREE.Mesh(rampGeo, deckMat);
    rampL.position.set(-68, bridgeY / 2, 28);
    rampL.rotation.z = Math.atan2(bridgeY, 32);
    rampL.castShadow = true;
    bridge.add(rampL);

    // Right ramp
    const rampR = new THREE.Mesh(rampGeo, deckMat);
    rampR.position.set(68, bridgeY / 2, 28);
    rampR.rotation.z = -Math.atan2(bridgeY, 32);
    rampR.castShadow = true;
    bridge.add(rampR);

    this.scene.add(bridge);
  }

  // --- DISTRICT 1: LEKKI PHASE 1 & MARINA FINANCIAL TOWERS ---
  private buildLekkiDistrict() {
    const lekki = new THREE.Group();
    lekki.position.set(60, 0, -60);

    // 6 Modern Skyscrapers & Towers
    const towerConfigs = [
      { x: -16, z: -16, w: 14, d: 14, h: 36, color: 0x0284c7 }, // Blue glass tower
      { x: 16, z: -16, w: 12, d: 16, h: 28, color: 0x0f766e }, // Teal tower
      { x: -16, z: 16, w: 16, d: 12, h: 32, color: 0x1e293b }, // Obsidian slate tower
      { x: 18, z: 18, w: 14, d: 14, h: 24, color: 0xd97706 },  // Golden amber tower
      { x: 0, z: 32, w: 12, d: 12, h: 22, color: 0x475569 },
      { x: 34, z: 0, w: 12, d: 12, h: 26, color: 0x2563eb },
    ];

    towerConfigs.forEach((cfg) => {
      const bMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.25, metalness: 0.7 });
      const tower = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), bMat);
      tower.position.set(cfg.x, cfg.h / 2, cfg.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      lekki.add(tower);

      // Rooftop helipad / antenna mast
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.2, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xef4444 })
      );
      antenna.position.set(cfg.x, cfg.h + 4, cfg.z);
      lekki.add(antenna);

      // Lit windows grid effect
      for (let y = 4; y < cfg.h - 2; y += 4) {
        const winBand = new THREE.Mesh(
          new THREE.BoxGeometry(cfg.w + 0.1, 1.2, cfg.d + 0.1),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        winBand.position.set(cfg.x, y, cfg.z);
        lekki.add(winBand);
      }
    });

    // Iconic Lekki-Ikoyi Link Bridge Triangular Cable-Stayed Pylon on Lagoon Horizon
    const bridgePylon = new THREE.Group();
    bridgePylon.position.set(30, 0, -45);
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

    // Triangular A-frame pylon (height 45m)
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 46, 12), pylonMat);
    legL.position.set(-6, 23, 0);
    legL.rotation.z = -0.15;
    bridgePylon.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 46, 12), pylonMat);
    legR.position.set(6, 23, 0);
    legR.rotation.z = 0.15;
    bridgePylon.add(legR);

    // Stay Cables
    const cableMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    for (let c = 10; c <= 40; c += 6) {
      const points = [new THREE.Vector3(0, c, 0), new THREE.Vector3(-25 + c * 0.4, 2, 0)];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), cableMat);
      bridgePylon.add(line);

      const pointsR = [new THREE.Vector3(0, c, 0), new THREE.Vector3(25 - c * 0.4, 2, 0)];
      const lineR = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsR), cableMat);
      bridgePylon.add(lineR);
    }
    lekki.add(bridgePylon);

    // Giant Panoramic Lagos Skyline Billboard
    const skyBb = new THREE.Group();
    skyBb.position.set(-2, 0, -32);
    this.textureLoader.load(SKYLINE_TEXTURE, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ map: tex }));
      face.position.y = 10;
      skyBb.add(face);
    });
    lekki.add(skyBb);

    this.scene.add(lekki);
  }

  // --- DISTRICT 2: BALOGUN ISLAND MARKET & ALLEYWAYS ---
  private buildBalogunDistrict() {
    const balogun = new THREE.Group();
    balogun.position.set(-60, 0, -60);

    // Dense cluster of 8 market trade buildings with zinc corrugated roofs
    const buildingColors = [0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6, 0x8b5cf6, 0xd97706];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue; // Center market plaza for Mama Put
        const h = 7 + (r + c) * 2;
        const color = buildingColors[(r * 3 + c) % buildingColors.length];
        const bMesh = new THREE.Mesh(
          new THREE.BoxGeometry(11, h, 11),
          new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
        );
        bMesh.position.set((c - 1) * 16, h / 2, (r - 1) * 16);
        bMesh.castShadow = true;
        balogun.add(bMesh);

        // Corrugated zinc roof overhang
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(12, 0.4, 12),
          new THREE.MeshStandardMaterial({ color: 0x78716c })
        );
        roof.position.set((c - 1) * 16, h + 0.2, (r - 1) * 16);
        balogun.add(roof);
      }
    }

    // Colorful Fabric Market Umbrellas & Awnings
    const umbrellaColors = [0xffd000, 0xef4444, 0x10b981, 0x06b6d4, 0xf97316];
    for (let u = 0; u < 12; u++) {
      const uMat = new THREE.MeshStandardMaterial({ color: umbrellaColors[u % umbrellaColors.length] });
      const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.7, 12), uMat);
      umbrella.position.set((Math.random() - 0.5) * 32, 2.5, (Math.random() - 0.5) * 32);
      balogun.add(umbrella);

      // Pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x451a03 })
      );
      pole.position.set(umbrella.position.x, 1.25, umbrella.position.z);
      balogun.add(pole);
    }

    // Mama Put Buka Food Stall & Suya BBQ Station in center plaza
    const buka = new THREE.Group();
    buka.position.set(0, 0, 0);

    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    const bukaRoof = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 6), roofMat);
    bukaRoof.position.set(0, 4.1, 0);
    buka.add(bukaRoof);

    this.textureLoader.load(MAMA_PUT_TEXTURE, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.15), new THREE.MeshBasicMaterial({ map: tex }));
      sign.position.set(0, 3.2, 2.6);
      buka.add(sign);
    });

    // Suya BBQ Drum Grill
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 1.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 })
    );
    drum.rotation.z = Math.PI / 2;
    drum.position.set(-2, 1.1, 1.2);
    buka.add(drum);

    const smokeLight = new THREE.PointLight(0xf97316, 1.5, 5);
    smokeLight.position.set(-2, 1.5, 1.2);
    buka.add(smokeLight);

    balogun.add(buka);

    this.scene.add(balogun);
  }

  // --- DISTRICT 3: OSHODI TRANSPORT INTERCHANGE & DANFO MOTOR PARK ---
  private buildOshodiDistrict() {
    const oshodi = new THREE.Group();
    oshodi.position.set(-60, 0, 60);

    // Motor Park Tarmac Platform
    const tarmac = new THREE.Mesh(
      new THREE.BoxGeometry(45, 0.1, 45),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 })
    );
    tarmac.position.y = 0.05;
    tarmac.receiveShadow = true;
    oshodi.add(tarmac);

    // Loading bays with 6 Parked Yellow Danfo Minibuses
    for (let i = 0; i < 6; i++) {
      const danfo = this.createDanfoBus(
        new THREE.Vector3((i % 3) * 8 - 8, 0, Math.floor(i / 3) * 12 - 8),
        (Math.PI / 2) * (i % 2 === 0 ? 1 : -1)
      );
      this.danfoBuses.push(danfo);
      oshodi.add(danfo);
    }

    // 4 Parked Keke NAPEP tricycles
    for (let k = 0; k < 4; k++) {
      const keke = this.createKeke(new THREE.Vector3(-14 + k * 7, 0, 16), 0);
      oshodi.add(keke);
    }

    // Overhead Pedestrian Footbridge
    const footbridge = new THREE.Group();
    footbridge.position.set(0, 0, -22);
    const fMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7 });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(32, 0.3, 2.5), fMat);
    deck.position.y = 5.2;
    footbridge.add(deck);

    // Support pillars
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5.2, 8), fMat);
    p1.position.set(-14, 2.6, 0);
    footbridge.add(p1);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5.2, 8), fMat);
    p2.position.set(14, 2.6, 0);
    footbridge.add(p2);

    oshodi.add(footbridge);

    // Giant Danfo Street Poster Billboard
    const danfoBb = new THREE.Group();
    danfoBb.position.set(18, 0, 18);
    this.textureLoader.load(DANFO_ART_TEXTURE, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const art = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.75), new THREE.MeshBasicMaterial({ map: tex }));
      art.position.y = 8;
      danfoBb.add(art);
    });
    oshodi.add(danfoBb);

    this.scene.add(oshodi);
  }

  // --- DISTRICT 4: COMPUTER VILLAGE IKEJA & TECH ALLEY ---
  private buildComputerVillageDistrict() {
    const compVillage = new THREE.Group();
    compVillage.position.set(60, 0, 60);

    // 5 Multi-story Tech Plazas & Gadget Warehouses
    const plazas = [
      { x: -14, z: -14, w: 14, d: 14, h: 18, color: 0x10b981 }, // Emerald Green
      { x: 14, z: -14, w: 14, d: 14, h: 22, color: 0x6366f1 },  // Indigo Tech
      { x: -14, z: 14, w: 14, d: 14, h: 16, color: 0xec4899 },  // Neon Pink
      { x: 14, z: 14, w: 14, d: 14, h: 20, color: 0x06b6d4 },   // Cyan
    ];

    plazas.forEach((p) => {
      const bMat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.5 });
      const building = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), bMat);
      building.position.set(p.x, p.h / 2, p.z);
      building.castShadow = true;
      compVillage.add(building);
    });

    // Giant Computer Village Ikeja Billboard
    const bbTech = new THREE.Group();
    bbTech.position.set(0, 0, -22);
    this.textureLoader.load(COMP_VILLAGE_TEXTURE, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(14, 7.8), new THREE.MeshBasicMaterial({ map: tex }));
      face.position.y = 10;
      bbTech.add(face);
    });
    compVillage.add(bbTech);

    // Diesel Generator Bank ("I Better Pass My Neighbor")
    const genShed = new THREE.Group();
    genShed.position.set(0, 0, 0);

    for (let g = -2; g <= 2; g++) {
      const genMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 }); // Red generator frame
      const genBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.8), genMat);
      genBox.position.set(g * 2.8, 0.7, 0);
      genShed.add(genBox);

      // Exhaust pipe
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x18181b })
      );
      pipe.position.set(g * 2.8, 1.7, 0.4);
      genShed.add(pipe);
    }
    compVillage.add(genShed);

    this.scene.add(compVillage);
  }

  // --- CITY INFRASTRUCTURE & MOVING TRAFFIC LOOP ---
  private buildCityInfrastructure() {
    // Palm Trees along outer avenues
    for (let i = -100; i <= 100; i += 28) {
      if (Math.abs(i) < 20) continue;
      this.scene.add(this.createPalmTree(-18, i));
      this.scene.add(this.createPalmTree(18, i));
      this.scene.add(this.createPalmTree(i, -18));
      this.scene.add(this.createPalmTree(i, 18));
    }

    // Circulating Moving Traffic Danfos
    const traffic1 = this.createDanfoBus(new THREE.Vector3(5, 0, 40), 0);
    this.scene.add(traffic1);
    this.trafficDanfos.push({ mesh: traffic1, progress: 0, speed: 18, radius: 65 });

    const traffic2 = this.createDanfoBus(new THREE.Vector3(-5, 0, -40), Math.PI);
    this.scene.add(traffic2);
    this.trafficDanfos.push({ mesh: traffic2, progress: Math.PI, speed: 16, radius: 75 });
  }

  private createPalmTree(x: number, z: number): THREE.Group {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.4, 9, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
    );
    trunk.position.y = 4.5;
    tree.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const frond = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 4), leafMat);
      frond.position.set(Math.cos(angle) * 1.8, 9, Math.sin(angle) * 1.8);
      frond.rotation.y = angle;
      frond.rotation.x = 0.35;
      tree.add(frond);
    }
    return tree;
  }

  // --- DANFO BUS CREATOR ---
  private createDanfoBus(position: THREE.Vector3, rotationY: number): THREE.Group {
    const bus = new THREE.Group();
    bus.position.copy(position);
    bus.rotation.y = rotationY;

    // Body (Iconic Danfo Yellow)
    const bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.2, 5.8),
      new THREE.MeshStandardMaterial({ color: 0xffd000, roughness: 0.35, metalness: 0.2 })
    );
    bodyMesh.position.y = 1.5;
    bodyMesh.castShadow = true;
    bus.add(bodyMesh);

    // Dual black stripes
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.18, 5.82), stripeMat);
    stripe1.position.y = 1.35;
    bus.add(stripe1);

    const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.18, 5.82), stripeMat);
    stripe2.position.y = 1.65;
    bus.add(stripe2);

    // Windows
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1, metalness: 0.9 });
    const windScreen = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.1), glassMat);
    windScreen.position.set(0, 1.8, -2.91);
    bus.add(windScreen);

    // Headlights
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const headL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 12), lightMat);
    headL.rotation.x = Math.PI / 2;
    headL.position.set(-0.9, 1.1, -2.92);
    bus.add(headL);

    const headR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 12), lightMat);
    headR.rotation.x = Math.PI / 2;
    headR.position.set(0.9, 1.1, -2.92);
    bus.add(headR);

    // 4 Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    [[-1.3, 0.45, -1.8], [1.3, 0.45, -1.8], [-1.3, 0.45, 1.8], [1.3, 0.45, 1.8]].forEach(([x, y, z]) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16), wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, y, z);
      tire.castShadow = true;
      bus.add(tire);
    });

    return bus;
  }

  private createKeke(position: THREE.Vector3, rotY: number): THREE.Group {
    const keke = new THREE.Group();
    keke.position.copy(position);
    keke.rotation.y = rotY;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.4, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 })
    );
    body.position.y = 1.0;
    keke.add(body);

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.15, 2.7),
      new THREE.MeshStandardMaterial({ color: 0xfacc15 })
    );
    canopy.position.y = 1.9;
    keke.add(canopy);

    return keke;
  }

  // --- PLAYER WEAPONS & SIMS AVATAR ---
  private buildPlayerWeapons() {
    this.weaponMeshGroup = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9, roughness: 0.25 });
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.6), metalMat);
    this.weaponMeshGroup.add(receiver);

    const goldBand = new THREE.Mesh(new THREE.BoxGeometry(0.084, 0.04, 0.3), goldTrimMat);
    goldBand.position.set(0, 0.04, 0);
    this.weaponMeshGroup.add(goldBand);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 12), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, -0.45);
    this.weaponMeshGroup.add(barrel);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.35), woodMat);
    stock.position.set(0, -0.04, 0.4);
    this.weaponMeshGroup.add(stock);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.14), metalMat);
    mag.position.set(0, -0.2, -0.08);
    mag.rotation.x = 0.2;
    this.weaponMeshGroup.add(mag);

    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.1), metalMat);
    sightBase.position.set(0, 0.09, -0.15);
    this.weaponMeshGroup.add(sightBase);

    const dotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const reticleDot = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), dotMat);
    reticleDot.position.set(0, 0.12, -0.15);
    this.weaponMeshGroup.add(reticleDot);

    this.muzzleFlashLight = new THREE.PointLight(0xf59e0b, 0, 8);
    this.muzzleFlashLight.position.set(0, 0.03, -0.75);
    this.weaponMeshGroup.add(this.muzzleFlashLight);

    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0 });
    this.muzzleFlashMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09), flashMat);
    this.muzzleFlashMesh.position.set(0, 0.03, -0.75);
    this.weaponMeshGroup.add(this.muzzleFlashMesh);

    this.weaponMeshGroup.position.copy(this.defaultWeaponPos);
    this.camera.add(this.weaponMeshGroup);
    this.scene.add(this.camera);
  }

  private buildPlayerCharacterForSims() {
    this.playerCharacterMesh = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.6 });
    const ankaraVestMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), ankaraVestMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    this.playerCharacterMesh.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
    head.position.y = 1.8;
    this.playerCharacterMesh.add(head);

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.26, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.7 })
    );
    hat.position.y = 1.95;
    this.playerCharacterMesh.add(hat);

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.8, 0.3), jeansMat);
    legL.position.set(-0.2, 0.4, 0);
    this.playerCharacterMesh.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.8, 0.3), jeansMat);
    legR.position.set(0.2, 0.4, 0);
    this.playerCharacterMesh.add(legR);

    // Sims Green Emerald Plumbob
    const plumbobGeo = new THREE.OctahedronGeometry(0.22, 0);
    plumbobGeo.scale(1, 2.2, 1);
    this.plumbobMesh = new THREE.Mesh(
      plumbobGeo,
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.6, roughness: 0.1 })
    );
    this.plumbobMesh.position.y = 2.45;
    this.playerCharacterMesh.add(this.plumbobMesh);

    this.scene.add(this.playerCharacterMesh);
    this.playerCharacterMesh.visible = false;
  }

  // --- MULTI-DISTRICT CITY BOTS ---
  private setupCityBots() {
    const cityBotConfigs: { name: string; team: 'ENEMY' | 'FRIENDLY'; x: number; z: number }[] = [
      // Lekki Phase 1 bots
      { name: 'Lekki Toll Syndicate', team: 'ENEMY', x: 50, z: -55 },
      { name: 'Marina Sniper', team: 'ENEMY', x: 70, z: -70 },
      // Balogun Market bots
      { name: 'Balogun Enforcer Baddo', team: 'ENEMY', x: -55, z: -50 },
      { name: 'Idumota Market Scout', team: 'ENEMY', x: -70, z: -65 },
      // Oshodi Danfo Hub bots
      { name: 'Oshodi Motor Park Agbero', team: 'ENEMY', x: -55, z: 55 },
      { name: 'Flyover Gang Leader', team: 'ENEMY', x: -40, z: 30 },
      // Computer Village bots
      { name: 'Otigba Cyber Tech', team: 'ENEMY', x: 55, z: 65 },
      { name: 'Generator Syndicate', team: 'ENEMY', x: 70, z: 50 },
      // Friendly Militia Patrols
      { name: 'Sgt. Chidi Patrol', team: 'FRIENDLY', x: 5, z: 12 },
      { name: 'Militia Rasheed (Danfo Guard)', team: 'FRIENDLY', x: -10, z: 8 },
    ];

    cityBotConfigs.forEach((cfg, idx) => {
      const bot: BotAgent = {
        id: `bot-${idx}`,
        name: cfg.name,
        team: cfg.team,
        health: 100,
        maxHealth: 100,
        position: { x: cfg.x, y: 1.0, z: cfg.z },
        targetPosition: { x: cfg.x, y: 1.0, z: cfg.z },
        rotation: cfg.team === 'ENEMY' ? 0 : Math.PI,
        state: 'PATROL',
        currentWeapon: this.currentWeaponDef,
        lastShotTime: 0,
      };
      this.bots.push(bot);

      const mesh = this.createBotMesh(cfg.team);
      mesh.position.set(cfg.x, 0, cfg.z);
      this.botMeshes.set(bot.id, mesh);
      this.scene.add(mesh);
    });
  }

  private createBotMesh(team: 'ENEMY' | 'FRIENDLY'): THREE.Group {
    const grp = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.6 });
    const vestMat = new THREE.MeshStandardMaterial({ color: team === 'ENEMY' ? 0xdc2626 : 0x0284c7, roughness: 0.6 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), vestMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    grp.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), skinMat);
    head.position.y = 1.8;
    head.name = 'head';
    grp.add(head);

    const helm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: team === 'ENEMY' ? 0x991b1b : 0x0369a1 })
    );
    helm.position.y = 1.95;
    grp.add(helm);

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.8, 0.28), new THREE.MeshStandardMaterial({ color: 0x27272a }));
    legL.position.set(-0.2, 0.4, 0);
    grp.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.8, 0.28), new THREE.MeshStandardMaterial({ color: 0x27272a }));
    legR.position.set(0.2, 0.4, 0);
    grp.add(legR);

    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.6), new THREE.MeshStandardMaterial({ color: 0x18181b }));
    gun.position.set(0.3, 1.1, -0.4);
    grp.add(gun);

    return grp;
  }

  // --- MULTIPLAYER PLAYERS SYNC ---
  public syncRemotePlayers(remoteList: RemotePlayerData[], selfId: string | null) {
    const activeIds = new Set<string>();

    remoteList.forEach((remote) => {
      if (remote.id === selfId) return;
      activeIds.add(remote.id);

      let grp = this.remotePlayerMeshes.get(remote.id);
      if (!grp) {
        grp = this.createRemotePlayerMesh(remote);
        this.remotePlayerMeshes.set(remote.id, grp);
        this.scene.add(grp);
      }

      grp.position.lerp(new THREE.Vector3(remote.position.x, remote.position.y - 1.7, remote.position.z), 0.35);
      grp.rotation.y = remote.rotation.yaw;
    });

    this.remotePlayerMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.remotePlayerMeshes.delete(id);
      }
    });
  }

  private createRemotePlayerMesh(player: RemotePlayerData): THREE.Group {
    const grp = new THREE.Group();
    grp.name = `remote_${player.id}`;

    const skinMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.6 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), vestMat);
    torso.position.y = 1.15;
    grp.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), skinMat);
    head.position.y = 1.8;
    head.name = 'head';
    grp.add(head);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.roundRect(10, 10, 236, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#ffd000';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, 128, 40);

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
    sprite.scale.set(1.8, 0.45, 1);
    sprite.position.y = 2.45;
    grp.add(sprite);

    return grp;
  }

  public renderRemoteShot(origin: { x: number; y: number; z: number }, hitPoint: { x: number; y: number; z: number }, weapon: string) {
    soundEngine.playGunfire('AR');
    this.createBulletTracer(new THREE.Vector3(origin.x, origin.y, origin.z), new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z));
  }

  // --- FAST TRAVEL TELEPORT ---
  public fastTravelTo(x: number, z: number) {
    this.playerPosition.set(x, 1.7, z);
    this.camera.position.copy(this.playerPosition);
    this.navTarget = null;
    if (this.navMarkerMesh) this.navMarkerMesh.visible = false;
  }

  public getCurrentDistrict(): string {
    const x = this.playerPosition.x;
    const z = this.playerPosition.z;

    if (Math.abs(x) < 20 && Math.abs(z) < 20) return 'Tinubu Heritage Roundabout';
    if (x >= 0 && z < 0) return 'Lekki Phase 1 & Marina';
    if (x < 0 && z < 0) return 'Balogun Island Market';
    if (x < 0 && z >= 0) return 'Oshodi Transport Interchange';
    return 'Computer Village Ikeja';
  }

  // --- INPUT LISTENERS ---
  private setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.key) this.keys[e.key.toLowerCase()] = true;

      if ((e.code === 'KeyR' || e.key?.toLowerCase() === 'r') && !this.isReloading) this.reload();
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.isSprinting = true;
      if (e.code === 'KeyC' || e.key?.toLowerCase() === 'c') this.isCrouched = !this.isCrouched;
      if (e.code === 'KeyV' || e.key?.toLowerCase() === 'v') this.toggleViewMode();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.key) this.keys[e.key.toLowerCase()] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.isSprinting = false;
    });

    this.renderer.domElement.addEventListener('click', (e) => {
      if (this.viewMode === 'FPS') {
        if (!this.isPointerLocked) this.container.requestPointerLock?.();
      } else if (this.viewMode === 'SIMS_ISO') {
        this.handleSimsGroundClick(e.clientX, e.clientY);
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.container;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked && this.viewMode === 'FPS') {
        const sens = this.isAiming ? 0.0012 : 0.0022;
        this.playerRotation.yaw -= e.movementX * sens;
        this.playerRotation.pitch -= e.movementY * sens;
        this.playerRotation.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.playerRotation.pitch));
      } else if (this.isDraggingLook && this.viewMode === 'FPS') {
        const dx = e.clientX - this.lastDragPos.x;
        const dy = e.clientY - this.lastDragPos.y;
        this.lastDragPos = { x: e.clientX, y: e.clientY };

        const sens = 0.003;
        this.playerRotation.yaw -= dx * sens;
        this.playerRotation.pitch -= dy * sens;
        this.playerRotation.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.playerRotation.pitch));
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (this.isPointerLocked) {
        if (e.button === 0) this.shoot();
        else if (e.button === 2) this.setAiming(true);
      } else if (e.target === this.renderer.domElement && this.viewMode === 'FPS') {
        this.isDraggingLook = true;
        this.lastDragPos = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', (e) => {
      this.isDraggingLook = false;
      if (e.button === 2) this.setAiming(false);
    });

    this.renderer.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && this.viewMode === 'FPS') {
        this.isDraggingLook = true;
        this.lastDragPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 1 && this.viewMode === 'SIMS_ISO') {
        this.handleSimsGroundClick(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.renderer.domElement.addEventListener('touchmove', (e) => {
      if (this.isDraggingLook && e.touches.length === 1 && this.viewMode === 'FPS') {
        const dx = e.touches[0].clientX - this.lastDragPos.x;
        const dy = e.touches[0].clientY - this.lastDragPos.y;
        this.lastDragPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        const sens = 0.004;
        this.playerRotation.yaw -= dx * sens;
        this.playerRotation.pitch -= dy * sens;
        this.playerRotation.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.playerRotation.pitch));
      }
    }, { passive: true });

    this.renderer.domElement.addEventListener('touchend', () => {
      this.isDraggingLook = false;
    });

    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleSimsGroundClick(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObject(this.groundMesh);

    if (intersects.length > 0) {
      const pt = intersects[0].point;
      this.navTarget = new THREE.Vector3(pt.x, 0, pt.z);
      if (this.navMarkerMesh) {
        this.navMarkerMesh.position.set(pt.x, 0.05, pt.z);
        this.navMarkerMesh.visible = true;
      }
      soundEngine.playCashEarned();
    }
  }

  public setAiming(aiming: boolean) {
    this.isAiming = aiming;
    this.camera.fov = aiming ? 48 : 72;
    this.camera.updateProjectionMatrix();
  }

  public toggleViewMode() {
    this.setViewMode(this.viewMode === 'FPS' ? 'SIMS_ISO' : 'FPS');
  }

  public setViewMode(mode: CameraViewMode) {
    this.viewMode = mode;
    if (mode === 'SIMS_ISO') {
      this.playerCharacterMesh.visible = true;
      this.weaponMeshGroup.visible = false;
      if (document.pointerLockElement) document.exitPointerLock();
    } else {
      this.playerCharacterMesh.visible = false;
      this.weaponMeshGroup.visible = true;
      if (this.navMarkerMesh) this.navMarkerMesh.visible = false;
      this.navTarget = null;
    }
  }

  public getViewMode(): CameraViewMode {
    return this.viewMode;
  }

  public setGameMode(mode: GameMode) {
    this.gameMode = mode;
  }

  public setWeapon(weapon: WeaponDef) {
    this.currentWeaponDef = weapon;
  }

  // --- SHOOTING ---
  public shoot(): boolean {
    if (this.isReloading) return false;

    this.recoilOffset.z += this.currentWeaponDef.recoil * 0.4;
    this.recoilOffset.y += this.currentWeaponDef.recoil * 0.15;
    this.playerRotation.pitch += this.currentWeaponDef.recoil * (this.isAiming ? 0.015 : 0.035);

    this.muzzleFlashLight.intensity = 2.5;
    (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
    setTimeout(() => {
      this.muzzleFlashLight.intensity = 0;
      (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    }, 45);

    soundEngine.playGunfire(this.currentWeaponDef.category);

    const raycaster = new THREE.Raycaster();
    const shootOrigin = this.camera.position.clone();
    const shootDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    if (!this.isAiming) {
      const spread = 0.04 * (1.0 - this.currentWeaponDef.accuracy);
      shootDir.x += (Math.random() - 0.5) * spread;
      shootDir.y += (Math.random() - 0.5) * spread;
      shootDir.normalize();
    }

    raycaster.set(shootOrigin, shootDir);

    const botTargets: THREE.Object3D[] = [];
    this.botMeshes.forEach((mesh) => {
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) botTargets.push(child);
      });
    });

    const remoteTargets: THREE.Object3D[] = [];
    this.remotePlayerMeshes.forEach((mesh) => {
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) remoteTargets.push(child);
      });
    });

    const intersects = raycaster.intersectObjects([...botTargets, ...remoteTargets], false);
    let hitPoint = shootOrigin.clone().add(shootDir.clone().multiplyScalar(this.currentWeaponDef.range));

    if (intersects.length > 0) {
      const firstHit = intersects[0];
      hitPoint = firstHit.point;

      let hitRemoteId: string | null = null;
      let isRemoteHeadshot = false;

      this.remotePlayerMeshes.forEach((mesh, id) => {
        mesh.traverse((child) => {
          if (child === firstHit.object) {
            hitRemoteId = id;
            if (child.name === 'head' || firstHit.point.y > mesh.position.y + 1.6) isRemoteHeadshot = true;
          }
        });
      });

      if (hitRemoteId) {
        const dmg = Math.round(isRemoteHeadshot ? this.currentWeaponDef.damage * 2.2 : this.currentWeaponDef.damage);
        this.callbacks.onHit(isRemoteHeadshot, dmg);
        soundEngine.playHitMarker(isRemoteHeadshot);
        this.spawnHitParticles(firstHit.point, isRemoteHeadshot ? 0xf43f5e : 0xf59e0b);
        this.callbacks.onRemoteHit?.(hitRemoteId, dmg, isRemoteHeadshot);
      } else {
        let hitBotId: string | null = null;
        let isHeadshot = false;

        this.botMeshes.forEach((mesh, id) => {
          mesh.traverse((child) => {
            if (child === firstHit.object) {
              hitBotId = id;
              if (child.name === 'head' || firstHit.point.y > mesh.position.y + 1.6) isHeadshot = true;
            }
          });
        });

        if (hitBotId) {
          const bot = this.bots.find((b) => b.id === hitBotId);
          if (bot && bot.team === 'ENEMY' && bot.state !== 'DEAD') {
            const dmg = isHeadshot ? this.currentWeaponDef.damage * 2.2 : this.currentWeaponDef.damage;
            bot.health -= dmg;

            this.callbacks.onHit(isHeadshot, Math.round(dmg));
            soundEngine.playHitMarker(isHeadshot);
            this.spawnHitParticles(firstHit.point, isHeadshot ? 0xf43f5e : 0xf59e0b);

            if (bot.health <= 0) {
              bot.state = 'DEAD';
              this.callbacks.onKill(bot.name, this.currentWeaponDef.name, isHeadshot);
              const dropNaira = Math.floor(Math.random() * 3000) + 2000;
              this.callbacks.onNairaPickup(dropNaira);
              soundEngine.playCashEarned();

              const callout = PIDGIN_CALLOUTS[Math.floor(Math.random() * PIDGIN_CALLOUTS.length)];
              soundEngine.playVoiceCallout(callout);

              const bMesh = this.botMeshes.get(bot.id);
              if (bMesh) {
                bMesh.rotation.x = Math.PI / 2;
                bMesh.position.y = 0.2;
                setTimeout(() => {
                  bot.health = 100;
                  bot.state = 'PATROL';
                  bot.position = { x: (Math.random() - 0.5) * 120, y: 1, z: (Math.random() - 0.5) * 120 };
                  bMesh.rotation.x = 0;
                  bMesh.position.set(bot.position.x, 0, bot.position.z);
                }, 7000);
              }
            }
          }
        }
      }
    }

    this.createBulletTracer(this.muzzleFlashLight.getWorldPosition(new THREE.Vector3()), hitPoint);

    this.callbacks.onPlayerShoot?.(
      { x: shootOrigin.x, y: shootOrigin.y, z: shootOrigin.z },
      { x: shootDir.x, y: shootDir.y, z: shootDir.z },
      { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z },
      this.currentWeaponDef.name
    );

    return true;
  }

  public reload() {
    if (this.isReloading) return;
    this.isReloading = true;
    soundEngine.playReload();

    const startY = this.currentWeaponPos.y;
    this.currentWeaponPos.y = startY - 0.25;

    setTimeout(() => {
      this.currentWeaponPos.y = startY;
      this.isReloading = false;
    }, this.currentWeaponDef.reloadTime * 1000);
  }

  // --- SCORESTREAKS ---
  public callDanfoStrike() {
    soundEngine.playDanfoHorn();
    const strikeBus = this.createDanfoBus(new THREE.Vector3(0, 0, 90), 0);
    this.scene.add(strikeBus);

    let progress = 90;
    const interval = setInterval(() => {
      progress -= 3.5;
      strikeBus.position.z = progress;
      this.spawnHitParticles(new THREE.Vector3(strikeBus.position.x, 0.2, strikeBus.position.z + 3), 0xd97706);

      this.bots.forEach((bot) => {
        if (bot.team === 'ENEMY' && bot.state !== 'DEAD') {
          if (Math.abs(bot.position.z - strikeBus.position.z) < 4 && Math.abs(bot.position.x - strikeBus.position.x) < 3) {
            bot.health = 0;
            bot.state = 'DEAD';
            this.callbacks.onKill(bot.name, 'DANFO EXPRESS RAM 🚍', false);
            this.callbacks.onNairaPickup(4000);
            soundEngine.playCashEarned();
          }
        }
      });

      if (progress < -110) {
        clearInterval(interval);
        this.scene.remove(strikeBus);
      }
    }, 30);
  }

  public callNepaBlackout() {
    soundEngine.playNepaBlackout();
    this.bots.forEach((bot) => {
      if (bot.team === 'ENEMY') {
        bot.state = 'COVER';
        this.callbacks.onBotDialogue(bot.name, 'Ah! NEPA don take light for whole Lagos!');
      }
    });

    this.scene.fog!.color.setHex(0x18181b);
    setTimeout(() => {
      this.scene.fog!.color.setHex(0xf59e0b);
      this.bots.forEach((b) => {
        if (b.state === 'COVER') b.state = 'COMBAT';
      });
    }, 6000);
  }

  public callSuyaAdrenaline() {
    soundEngine.playCashEarned();
    soundEngine.playVoiceCallout('Suya spice active! E choke!');
    this.isSprinting = true;
    setTimeout(() => {
      this.isSprinting = false;
    }, 15000);
  }

  private createBulletTracer(from: THREE.Vector3, to: THREE.Vector3) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.9, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.bulletTracers.push({ mesh: line, age: 0 });
  }

  private spawnHitParticles(pos: THREE.Vector3, color: number) {
    for (let i = 0; i < 8; i++) {
      const pGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const pMesh = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color }));
      pMesh.position.copy(pos);
      this.scene.add(pMesh);

      const vel = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3 + 1, (Math.random() - 0.5) * 4);
      this.particles.push({ mesh: pMesh, vel, life: 0.4 });
    }
  }

  // --- ANIMATION LOOP ---
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePlayerMovement(delta);
    this.updateWeaponSway(delta);
    this.updateBots(delta);
    this.updateParticles(delta);
    this.updateMovingTraffic(delta);
    this.checkDistrictNotification();

    if (this.plumbobMesh) this.plumbobMesh.rotation.y += delta * 2.5;
    if (this.navMarkerMesh && this.navMarkerMesh.visible) {
      const scale = 1 + Math.sin(this.clock.getElapsedTime() * 6) * 0.15;
      this.navMarkerMesh.scale.set(scale, scale, 1);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private checkDistrictNotification() {
    const cur = this.getCurrentDistrict();
    if (cur !== this.lastReportedDistrict) {
      this.lastReportedDistrict = cur;
      this.callbacks.onDistrictChange?.(cur);
    }
  }

  private updateMovingTraffic(delta: number) {
    this.trafficDanfos.forEach((t) => {
      t.progress += (t.speed / t.radius) * delta;
      t.mesh.position.x = Math.cos(t.progress) * t.radius;
      t.mesh.position.z = Math.sin(t.progress) * t.radius;
      t.mesh.rotation.y = -t.progress;
    });
  }

  // --- VAST CITY MOVEMENT WITH ELEVATED FLYOVER HEIGHT HANDLING ---
  private updatePlayerMovement(delta: number) {
    let fwd = this.moveInput.forward;
    let right = this.moveInput.right;

    if (this.keys['KeyW'] || this.keys['w'] || this.keys['ArrowUp']) fwd += 1;
    if (this.keys['KeyS'] || this.keys['s'] || this.keys['ArrowDown']) fwd -= 1;
    if (this.keys['KeyD'] || this.keys['d'] || this.keys['ArrowRight']) right += 1;
    if (this.keys['KeyA'] || this.keys['a'] || this.keys['ArrowLeft']) right -= 1;

    const speed = (this.isSprinting ? 9.5 : 5.0) * (this.isCrouched ? 0.6 : 1.0);

    // Calculate vertical elevation: Is player on the elevated highway flyover bridge deck or ramps?
    // Bridge spans X: -70 to 70 at Z: 28 (width 9m). Ramps at X: -85 to -55 and 55 to 85.
    let baseElevation = 0;
    const zDistToBridge = Math.abs(this.playerPosition.z - 28);

    if (zDistToBridge < 4.5) {
      const absX = Math.abs(this.playerPosition.x);
      if (absX <= 55) {
        baseElevation = 6.2; // Fully up on elevated highway
      } else if (absX <= 85) {
        // On access ramp
        const rampProgress = (85 - absX) / 30;
        baseElevation = Math.max(0, Math.min(6.2, rampProgress * 6.2));
      }
    }

    if (this.viewMode === 'FPS') {
      const euler = new THREE.Euler(this.playerRotation.pitch, this.playerRotation.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);

      const moveVec = new THREE.Vector3(right, 0, -fwd);
      if (moveVec.lengthSq() > 0.0001) {
        moveVec.normalize().multiplyScalar(speed * delta);
        moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerRotation.yaw);
        this.playerPosition.add(moveVec);
      }

      // City boundaries: 260m x 260m!
      this.playerPosition.x = Math.max(-125, Math.min(125, this.playerPosition.x));
      this.playerPosition.z = Math.max(-125, Math.min(125, this.playerPosition.z));
      this.playerPosition.y = baseElevation + (this.isCrouched ? 1.1 : 1.7);

      this.camera.position.copy(this.playerPosition);
    } else {
      // SIMS MODE
      const moveVec = new THREE.Vector3(right, 0, -fwd);
      if (moveVec.lengthSq() > 0.0001) {
        moveVec.normalize().multiplyScalar(speed * delta);
        this.playerPosition.add(moveVec);
        this.playerCharacterMesh.rotation.y = Math.atan2(right, -fwd);
        this.navTarget = null;
        if (this.navMarkerMesh) this.navMarkerMesh.visible = false;
      } else if (this.navTarget) {
        const diff = new THREE.Vector3().subVectors(this.navTarget, this.playerPosition);
        diff.y = 0;
        const dist = diff.length();

        if (dist > 0.4) {
          diff.normalize().multiplyScalar(Math.min(dist, speed * delta));
          this.playerPosition.add(diff);
          this.playerCharacterMesh.rotation.y = Math.atan2(diff.x, diff.z);
        } else {
          this.navTarget = null;
          if (this.navMarkerMesh) this.navMarkerMesh.visible = false;
        }
      }

      this.playerPosition.x = Math.max(-125, Math.min(125, this.playerPosition.x));
      this.playerPosition.z = Math.max(-125, Math.min(125, this.playerPosition.z));
      this.playerPosition.y = baseElevation + 1.7;

      this.playerCharacterMesh.position.set(this.playerPosition.x, baseElevation, this.playerPosition.z);

      const targetCamPos = new THREE.Vector3(
        this.playerPosition.x + 12,
        baseElevation + 16,
        this.playerPosition.z + 16
      );
      this.camera.position.lerp(targetCamPos, 0.1);
      this.camera.lookAt(this.playerPosition.x, baseElevation + 1.2, this.playerPosition.z);
    }
  }

  private updateWeaponSway(delta: number) {
    if (this.viewMode !== 'FPS') return;

    const targetPos = this.isAiming ? this.adsWeaponPos : this.defaultWeaponPos;
    this.currentWeaponPos.lerp(targetPos, 0.22);
    this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), 0.15);

    const t = this.clock.getElapsedTime();
    const isMoving = this.moveInput.forward !== 0 || this.moveInput.right !== 0 || this.keys['KeyW'] || this.keys['KeyS'];
    const swayFreq = isMoving ? 9 : 2.5;
    const swayAmp = isMoving ? 0.006 : 0.002;

    const swayX = Math.sin(t * swayFreq) * swayAmp;
    const swayY = Math.cos(t * swayFreq * 2) * swayAmp;

    this.weaponMeshGroup.position.set(
      this.currentWeaponPos.x + swayX + this.recoilOffset.x,
      this.currentWeaponPos.y + swayY + this.recoilOffset.y,
      this.currentWeaponPos.z + this.recoilOffset.z
    );
  }

  private updateBots(delta: number) {
    const now = Date.now();

    this.bots.forEach((bot) => {
      if (bot.state === 'DEAD') return;
      const mesh = this.botMeshes.get(bot.id);
      if (!mesh) return;

      const distToPlayer = mesh.position.distanceTo(this.playerPosition);

      if (bot.team === 'ENEMY') {
        if (distToPlayer < 45) {
          bot.state = 'COMBAT';
          mesh.lookAt(this.playerPosition.x, 0, this.playerPosition.z);

          const dir = new THREE.Vector3().subVectors(this.playerPosition, mesh.position).normalize();
          if (distToPlayer > 14) {
            mesh.position.add(dir.multiplyScalar(delta * 2.2));
            bot.position.x = mesh.position.x;
            bot.position.z = mesh.position.z;
          }

          if (now - bot.lastShotTime > 1800 + Math.random() * 800) {
            bot.lastShotTime = now;
            soundEngine.playGunfire('AR');
            this.createBulletTracer(
              new THREE.Vector3(mesh.position.x, 1.2, mesh.position.z),
              this.playerPosition.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.5))
            );

            if (Math.random() < 0.45) {
              const dmg = Math.floor(Math.random() * 12) + 8;
              this.playerHealth = Math.max(0, this.playerHealth - dmg);
              this.callbacks.onPlayerDamage(this.playerHealth);
            }
          }
        }
      } else {
        if (distToPlayer > 20) {
          const dir = new THREE.Vector3().subVectors(this.playerPosition, mesh.position).normalize();
          mesh.position.add(dir.multiplyScalar(delta * 2.2));
          mesh.lookAt(this.playerPosition.x, 0, this.playerPosition.z);
        }
      }
    });
  }

  private updateParticles(delta: number) {
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const tracer = this.bulletTracers[i];
      tracer.age += delta;
      (tracer.mesh.material as THREE.LineBasicMaterial).opacity = Math.max(0, 1 - tracer.age * 8);
      if (tracer.age > 0.15) {
        this.scene.remove(tracer.mesh);
        this.bulletTracers.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      p.mesh.position.add(p.vel.clone().multiplyScalar(delta));
      p.vel.y -= 9.8 * delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  public getBots(): BotAgent[] {
    return this.bots;
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
