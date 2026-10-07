/**
 * ODOGWU OPS: Lagos State Virtual Metropolis 3D Engine (Mature Tactical Realism Edition)
 * Features AAA photorealistic atmosphere, cinematic golden hour lighting, authentic Nigerian urban infrastructure,
 * textured concrete facades, realistic weathered Danfo commercial vehicles, and Call of Duty tactical styling.
 */

import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { BotAgent, CameraViewMode, GameMode, WeaponDef } from './types.ts';
import { soundEngine } from './audio.ts';
import { PIDGIN_CALLOUTS } from './constants.ts';
import { RemotePlayerData } from './multiplayer.ts';
import { LagosCityBuilder } from './cityBuilder.ts';
import { buildTacticalOperativeMesh, buildFirstPersonTacticalArms } from './characterModels.ts';
import { LagosCrowdSystem } from './crowdSystem.ts';

// High-fidelity mature visual textures
const SKYBOX_TEXTURE = '/src/assets/images/lagos_mature_skyline_1791370806876.jpg';

export interface EngineCallbacks {
  onHit: (isHeadshot: boolean, damage: number) => void;
  onKill: (victimName: string, weaponName: string, isHeadshot: boolean) => void;
  onPlayerDamage: (newHealth: number) => void;
  onBotDialogue: (botName: string, message: string) => void;
  onNairaPickup: (amount: number) => void;
  onDistrictChange?: (districtName: string) => void;
  onRemoteHit?: (targetId: string, damage: number, isHeadshot: boolean) => void;
  onPlayerShoot?: (
    origin: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
    hitPoint: { x: number; y: number; z: number },
    weapon: string
  ) => void;
}

export class LagosStreetEngine {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private callbacks: EngineCallbacks;
  private cityBuilder!: LagosCityBuilder;

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
  private plumbobMesh: THREE.Mesh | null = null;
  private bots: BotAgent[] = [];
  private botMeshes: Map<string, THREE.Group> = new Map();
  private bulletTracers: { mesh: THREE.Line; age: number }[] = [];
  private particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
  private shellCasings: { mesh: THREE.Mesh; vel: THREE.Vector3; rotVel: THREE.Vector3; life: number }[] = [];
  private atmosphericDust: THREE.Points | null = null;
  public crowdSystem!: LagosCrowdSystem;

  // Multiplayer Remote Players
  private remotePlayerMeshes: Map<string, THREE.Group> = new Map();

  // Weapon visual offset
  private defaultWeaponPos = new THREE.Vector3(0.24, -0.24, -0.46);
  private adsWeaponPos = new THREE.Vector3(0, -0.185, -0.32);
  private currentWeaponPos = new THREE.Vector3(0.24, -0.24, -0.46);
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
    this.buildMatureEnvironment();
    this.buildMatureTacticalWeapons();
    this.buildMaturePlayerCharacter();
    this.setupCityBots();
    this.setupNavMarker();
    this.setupAtmosphericParticles();
    this.crowdSystem = new LagosCrowdSystem(this.scene, (speaker, text) => {
      this.callbacks.onBotDialogue(speaker, text);
    });
    this.setupInputListeners();
    this.setupWebXR();

    this.animate();
  }

  private initThree() {
    this.scene = new THREE.Scene();

    // Cinematic Golden Hour / Dusk Atmosphere
    this.scene.background = new THREE.Color(0x1a1c23);
    this.scene.fog = new THREE.FogExp2(0x232733, 0.005); // Natural atmospheric depth mist

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 480);
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

    // Realistic Lighting System:
    // 1. Cool twilight ambient fill from sky
    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x27272a, 0.7);
    this.scene.add(hemiLight);

    // 2. Cinematic golden sun low on the Lagos lagoon horizon
    const dirLight = new THREE.DirectionalLight(0xffedd5, 2.4);
    dirLight.position.set(75, 48, -65);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 340;
    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -150;
    dirLight.shadow.bias = -0.0003;
    this.scene.add(dirLight);

    // 3. Subtle azure rim light from ocean
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    rimLight.position.set(-80, 25, 80);
    this.scene.add(rimLight);

    // Load Cinematic Sky Dome
    this.buildCinematicSkyDome();

    window.addEventListener('resize', this.onWindowResize);
  }

  private buildCinematicSkyDome() {
    this.textureLoader.load(SKYBOX_TEXTURE, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.mapping = THREE.EquirectangularReflectionMapping;

      const skyGeo = new THREE.SphereGeometry(400, 32, 24);
      const skyMat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.BackSide,
        depthWrite: false,
      });
      const skyDome = new THREE.Mesh(skyGeo, skyMat);
      this.scene.add(skyDome);
    });
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
      this.vrButtonElement.style.backgroundColor = '#d97706';
      this.vrButtonElement.style.color = '#ffffff';
      this.vrButtonElement.style.fontWeight = 'bold';
      this.vrButtonElement.style.fontFamily = 'Chakra Petch, sans-serif';
      this.vrButtonElement.style.padding = '8px 18px';
      this.vrButtonElement.style.borderRadius = '8px';
      this.vrButtonElement.style.border = '1px solid #78350f';
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
    const ringGeo = new THREE.RingGeometry(0.35, 0.7, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.navMarkerMesh = new THREE.Mesh(ringGeo, ringMat);
    this.navMarkerMesh.rotation.x = -Math.PI / 2;
    this.navMarkerMesh.position.y = 0.05;
    this.navMarkerMesh.visible = false;
    this.scene.add(this.navMarkerMesh);
  }

  private setupAtmosphericParticles() {
    // Subtle golden air dust motes for cinematic volumetric feel
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 160;
      positions[i + 1] = Math.random() * 18 + 0.5;
      positions[i + 2] = (Math.random() - 0.5) * 160;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.15,
      transparent: true,
      opacity: 0.35,
    });

    this.atmosphericDust = new THREE.Points(geo, mat);
    this.scene.add(this.atmosphericDust);
  }

  // --- MATURE LAGOS CITY ENVIRONMENT BUILDER ---
  private buildMatureEnvironment() {
    this.cityBuilder = new LagosCityBuilder(this.scene);
    this.cityBuilder.buildCompleteCity();
    this.groundMesh = this.cityBuilder.groundMesh;
  }

  // --- HIGH-FIDELITY TACTICAL WEAPON MODEL (AAA FPS LOOK) ---
  private buildMatureTacticalWeapons() {
    this.weaponMeshGroup = new THREE.Group();

    // Parkerized military matte black steel
    const gunMetalMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.95,
      roughness: 0.22,
    });
    // Dark textured tactical composite grip
    const compositeMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.75,
    });

    // Milled Upper & Lower Receiver
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.58), gunMetalMat);
    this.weaponMeshGroup.add(receiver);

    // Picatinny Top Accessory Rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.45), gunMetalMat);
    rail.position.set(0, 0.065, -0.05);
    this.weaponMeshGroup.add(rail);

    // Fluted Chrome-Moly Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.48, 12), gunMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.025, -0.48);
    this.weaponMeshGroup.add(barrel);

    // Tactical 3-Port Muzzle Brake / Compensator
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.09, 8), gunMetalMat);
    brake.rotation.x = Math.PI / 2;
    brake.position.set(0, 0.025, -0.73);
    this.weaponMeshGroup.add(brake);

    // Ergonomic Telescoping Tactical Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, 0.32), compositeMat);
    stock.position.set(0, -0.035, 0.4);
    this.weaponMeshGroup.add(stock);

    // Ergonomic Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.18, 0.08), compositeMat);
    grip.position.set(0, -0.12, 0.12);
    grip.rotation.x = -0.3;
    this.weaponMeshGroup.add(grip);

    // Curved STANAG High-Capacity Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.13), gunMetalMat);
    mag.position.set(0, -0.2, -0.07);
    mag.rotation.x = 0.22;
    this.weaponMeshGroup.add(mag);

    // Angled Foregrip on lower rail
    const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.08), compositeMat);
    foregrip.position.set(0, -0.09, -0.28);
    foregrip.rotation.x = 0.35;
    this.weaponMeshGroup.add(foregrip);

    // Tactical Holographic Reflex Red-Dot Sight
    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.12), gunMetalMat);
    sightBase.position.set(0, 0.09, -0.12);
    this.weaponMeshGroup.add(sightBase);

    // Protective hood & optical lens
    const sightHood = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.065, 0.09), gunMetalMat);
    sightHood.position.set(0, 0.13, -0.12);
    this.weaponMeshGroup.add(sightHood);

    const sightLens = new THREE.Mesh(
      new THREE.RingGeometry(0.022, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.95 })
    );
    sightLens.position.set(0, 0.13, -0.12);
    this.weaponMeshGroup.add(sightLens);

    // High-visibility illuminated center red aiming reticle
    const reticleDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.0035, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    reticleDot.position.set(0, 0.13, -0.12);
    this.weaponMeshGroup.add(reticleDot);

    // Muzzle Flash
    this.muzzleFlashLight = new THREE.PointLight(0xf59e0b, 0, 12);
    this.muzzleFlashLight.position.set(0, 0.025, -0.78);
    this.weaponMeshGroup.add(this.muzzleFlashLight);

    this.muzzleFlashMesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.085),
      new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0 })
    );
    this.muzzleFlashMesh.position.set(0, 0.025, -0.78);
    this.weaponMeshGroup.add(this.muzzleFlashMesh);

    // Realistic First-Person (FPS) Tactical Operative Arms, Watch & Hands
    const fpArms = buildFirstPersonTacticalArms();
    this.weaponMeshGroup.add(fpArms);

    this.weaponMeshGroup.position.copy(this.defaultWeaponPos);
    this.camera.add(this.weaponMeshGroup);
    this.scene.add(this.camera);
  }

  // --- MATURE TACTICAL OPERATOR MODEL FOR LOCAL PLAYER ---
  private buildMaturePlayerCharacter() {
    this.playerCharacterMesh = buildTacticalOperativeMesh({
      primaryColor: 0x27272a,
      armorColor: 0x3f3f46,
      hasPlumbob: true,
    });
    this.plumbobMesh = this.playerCharacterMesh.getObjectByName('plumbob') as THREE.Mesh;
    this.scene.add(this.playerCharacterMesh);
    this.playerCharacterMesh.visible = false;
  }

  // --- MATURE TACTICAL BOTS ---
  private setupCityBots() {
    const cityBotConfigs: { name: string; team: 'ENEMY' | 'FRIENDLY'; x: number; z: number }[] = [
      { name: 'Lekki Toll Syndicate', team: 'ENEMY', x: 50, z: -55 },
      { name: 'Marina Marksman', team: 'ENEMY', x: 70, z: -70 },
      { name: 'Balogun Sector Enforcer', team: 'ENEMY', x: -55, z: -50 },
      { name: 'Idumota Scout Unit', team: 'ENEMY', x: -70, z: -65 },
      { name: 'Oshodi Flyover Vanguard', team: 'ENEMY', x: -55, z: 55 },
      { name: 'Interchange Combatant', team: 'ENEMY', x: -40, z: 30 },
      { name: 'Ikeja Cyber Operative', team: 'ENEMY', x: 55, z: 65 },
      { name: 'Generator Sector Gunner', team: 'ENEMY', x: 70, z: 50 },
      { name: 'Tactical Escort Unit Alpha', team: 'FRIENDLY', x: 6, z: 12 },
      { name: 'Tactical Escort Unit Bravo', team: 'FRIENDLY', x: -8, z: 8 },
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

      const mesh = buildTacticalOperativeMesh({
        primaryColor: cfg.team === 'ENEMY' ? 0x18181b : 0x1e293b,
        armorColor: cfg.team === 'ENEMY' ? 0x7f1d1d : 0x0369a1,
        isHostile: cfg.team === 'ENEMY',
      });
      mesh.position.set(cfg.x, 0, cfg.z);
      this.botMeshes.set(bot.id, mesh);
      this.scene.add(mesh);
    });
  }

  // --- MULTIPLAYER PLAYERS SYNC ---
  public syncRemotePlayers(remoteList: RemotePlayerData[], selfId: string | null) {
    const activeIds = new Set<string>();

    remoteList.forEach((remote) => {
      if (remote.id === selfId) return;
      activeIds.add(remote.id);

      let grp = this.remotePlayerMeshes.get(remote.id);
      if (!grp) {
        grp = buildTacticalOperativeMesh({
          primaryColor: 0x064e3b,
          armorColor: 0x047857,
          nameTag: remote.name,
        });
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

  public renderRemoteShot(
    origin: { x: number; y: number; z: number },
    hitPoint: { x: number; y: number; z: number },
    _weapon: string
  ) {
    soundEngine.playGunfire('AR');
    this.createBulletTracer(new THREE.Vector3(origin.x, origin.y, origin.z), new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z));
  }

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

    this.renderer.domElement.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1 && this.viewMode === 'FPS') {
          this.isDraggingLook = true;
          this.lastDragPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 1 && this.viewMode === 'SIMS_ISO') {
          this.handleSimsGroundClick(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    this.renderer.domElement.addEventListener(
      'touchmove',
      (e) => {
        if (this.isDraggingLook && e.touches.length === 1 && this.viewMode === 'FPS') {
          const dx = e.touches[0].clientX - this.lastDragPos.x;
          const dy = e.touches[0].clientY - this.lastDragPos.y;
          this.lastDragPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };

          const sens = 0.004;
          this.playerRotation.yaw -= dx * sens;
          this.playerRotation.pitch -= dy * sens;
          this.playerRotation.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.playerRotation.pitch));
        }
      },
      { passive: true }
    );

    this.renderer.domElement.addEventListener('touchend', () => {
      this.isDraggingLook = false;
    });

    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleSimsGroundClick(clientX: number, clientY: number) {
    if (!this.groundMesh) return;
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
    this.camera.fov = aiming ? 46 : 70;
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

    this.muzzleFlashLight.intensity = 2.8;
    (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
    setTimeout(() => {
      this.muzzleFlashLight.intensity = 0;
      (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    }, 45);

    // Eject Brass Shell Casing
    this.ejectShellCasing();

    soundEngine.playGunfire(this.currentWeaponDef.category);

    const raycaster = new THREE.Raycaster();
    const shootOrigin = this.camera.position.clone();
    const shootDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    if (!this.isAiming) {
      const spread = 0.035 * (1.0 - this.currentWeaponDef.accuracy);
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

  private ejectShellCasing() {
    const casingGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.024, 6);
    const casingMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    const casingMesh = new THREE.Mesh(casingGeo, casingMat);

    const worldPos = this.weaponMeshGroup.localToWorld(new THREE.Vector3(0.06, 0.02, 0.05));
    casingMesh.position.copy(worldPos);
    this.scene.add(casingMesh);

    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const upDir = new THREE.Vector3(0, 1, 0);

    const vel = rightDir.multiplyScalar(1.8 + Math.random() * 0.8).add(upDir.multiplyScalar(1.2 + Math.random() * 0.6));
    const rotVel = new THREE.Vector3(Math.random() * 20, Math.random() * 20, Math.random() * 20);

    this.shellCasings.push({ mesh: casingMesh, vel, rotVel, life: 1.2 });
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
    const strikeBus = this.cityBuilder.createRealisticDanfo(new THREE.Vector3(0, 0, 95), 0);
    this.scene.add(strikeBus);

    let progress = 95;
    const interval = setInterval(() => {
      progress -= 3.8;
      strikeBus.position.z = progress;
      this.spawnHitParticles(new THREE.Vector3(strikeBus.position.x, 0.2, strikeBus.position.z + 3), 0x78350f);

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

      if (progress < -115) {
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
        this.callbacks.onBotDialogue(bot.name, 'Ah! NEPA blackout across the grid!');
      }
    });

    this.scene.fog!.color.setHex(0x0a0a0c);
    setTimeout(() => {
      this.scene.fog!.color.setHex(0x232733);
      this.bots.forEach((b) => {
        if (b.state === 'COVER') b.state = 'COMBAT';
      });
    }, 6000);
  }

  public callSuyaAdrenaline() {
    soundEngine.playCashEarned();
    soundEngine.playVoiceCallout('Tactical overdrive active!');
    this.isSprinting = true;
    setTimeout(() => {
      this.isSprinting = false;
    }, 15000);
  }

  private createBulletTracer(from: THREE.Vector3, to: THREE.Vector3) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.95, linewidth: 2 });
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
    if (this.crowdSystem) {
      this.crowdSystem.update(delta, this.playerPosition);
    }
    this.updateParticles(delta);
    this.updateShellCasings(delta);
    this.checkDistrictNotification();

    if (this.plumbobMesh) this.plumbobMesh.rotation.y += delta * 2.5;

    if (this.navMarkerMesh && this.navMarkerMesh.visible) {
      const scale = 1 + Math.sin(this.clock.getElapsedTime() * 6) * 0.15;
      this.navMarkerMesh.scale.set(scale, scale, 1);
    }

    if (this.atmosphericDust) {
      this.atmosphericDust.rotation.y += delta * 0.015;
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

  // --- MOVEMENT & ELEVATED FLYOVER HEIGHT HANDLING ---
  private updatePlayerMovement(delta: number) {
    let fwd = this.moveInput.forward;
    let right = this.moveInput.right;

    if (this.keys['KeyW'] || this.keys['w'] || this.keys['ArrowUp']) fwd += 1;
    if (this.keys['KeyS'] || this.keys['s'] || this.keys['ArrowDown']) fwd -= 1;
    if (this.keys['KeyD'] || this.keys['d'] || this.keys['ArrowRight']) right += 1;
    if (this.keys['KeyA'] || this.keys['a'] || this.keys['ArrowLeft']) right -= 1;

    const speed = (this.isSprinting ? 9.5 : 5.0) * (this.isCrouched ? 0.6 : 1.0);

    // Height elevation on bridge and ramps
    let baseElevation = 0;
    const zDistToBridge = Math.abs(this.playerPosition.z - 28);

    if (zDistToBridge < 4.8) {
      const absX = Math.abs(this.playerPosition.x);
      if (absX <= 60) {
        baseElevation = 6.4;
      } else if (absX <= 96) {
        const rampProgress = (96 - absX) / 36;
        baseElevation = Math.max(0, Math.min(6.4, rampProgress * 6.4));
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
    const swayAmp = isMoving ? 0.005 : 0.0018;

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
        if (distToPlayer < 48) {
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

  private updateShellCasings(delta: number) {
    for (let i = this.shellCasings.length - 1; i >= 0; i--) {
      const c = this.shellCasings[i];
      c.life -= delta;
      c.mesh.position.add(c.vel.clone().multiplyScalar(delta));
      c.vel.y -= 9.8 * delta;
      c.mesh.rotation.x += c.rotVel.x * delta;
      c.mesh.rotation.y += c.rotVel.y * delta;

      if (c.mesh.position.y < 0.05) {
        c.mesh.position.y = 0.05;
        c.vel.set(0, 0, 0);
      }

      if (c.life <= 0) {
        this.scene.remove(c.mesh);
        this.shellCasings.splice(i, 1);
      }
    }
  }

  public getBots(): BotAgent[] {
    return this.bots;
  }

  public getCivilians(): { name: string; role: string; x: number; z: number }[] {
    if (!this.crowdSystem) return [];
    return this.crowdSystem.civilians.map((c) => ({
      name: c.name,
      role: c.role,
      x: c.position.x,
      z: c.position.z,
    }));
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
