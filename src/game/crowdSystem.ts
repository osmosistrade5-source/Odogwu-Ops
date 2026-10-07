/**
 * Dynamic Lagos Metropolis Crowd & Traffic Simulation System
 * Populates authentic Nigerian civilian life:
 * - Market women (Mama Puts) in vibrant Ankara wax prints
 * - Traffic street hawkers carrying balanced head-trays of gala, plantain chips & drinks
 * - Danfo bus conductors shouting routes and clapping hands
 * - High-status gentlemen in embroidered Agbada robes with traditional Fila caps
 * - Commuters and shoppers walking along sidewalks with animated arm/leg walk cycles
 * - Moving Danfo buses and Bajaj Keke Marwa tricycles with spinning wheels and horns
 * - Proximity Pidgin dialogue speech bubbles when player walks near civilians!
 */

import * as THREE from 'three';
import { textureCache } from './textures.ts';
import { soundEngine } from './audio.ts';

export type CivilianRole = 'HAWKER' | 'CONDUCTOR' | 'MARKET_MAMA' | 'SHOPPER' | 'AGBADA_CHIEF' | 'COMMUTER';

export interface CivilianAgent {
  id: string;
  name: string;
  role: CivilianRole;
  position: THREE.Vector3;
  targetPos: THREE.Vector3;
  homePos: THREE.Vector3;
  speed: number;
  dialogueList: string[];
  mesh: THREE.Group;
  legL?: THREE.Mesh;
  legR?: THREE.Mesh;
  armL?: THREE.Mesh;
  armR?: THREE.Mesh;
  walkCycle: number;
  isStationary: boolean;
  lastSpokenTime: number;
  speechSprite: THREE.Sprite | null;
}

export interface MovingVehicle {
  id: string;
  type: 'DANFO' | 'KEKE';
  mesh: THREE.Group;
  speed: number;
  progress: number;
  lane: 'NS' | 'EW' | 'ROUNDABOUT';
  wheels: THREE.Object3D[];
  lastHonkTime: number;
}

export class LagosCrowdSystem {
  private scene: THREE.Scene;
  public civilians: CivilianAgent[] = [];
  public vehicles: MovingVehicle[] = [];
  private onDialogueCallback?: (speakerName: string, text: string) => void;

  constructor(scene: THREE.Scene, onDialogue?: (speaker: string, text: string) => void) {
    this.scene = scene;
    this.onDialogueCallback = onDialogue;

    this.spawnLivelyPedestrians();
    this.spawnMovingCityTraffic();
  }

  // --- 1. POPULATE 35+ ANIMATED PEDESTRIANS & CIVILIANS ---
  private spawnLivelyPedestrians() {
    const civilianConfigs: {
      name: string;
      role: CivilianRole;
      x: number;
      z: number;
      isStationary?: boolean;
      dialogues: string[];
    }[] = [
      // Balogun Market Traders & Shoppers
      {
        name: 'Mama Nkechi (Suya Master)',
        role: 'MARKET_MAMA',
        x: -63,
        z: -61,
        isStationary: true,
        dialogues: [
          'Hot spicy Suya and Pepper Soup dey ready! Come chop, Odogwu!',
          'Abeg no shoot for market o, pepper stew never finish!',
          'Jollof rice deluxe, fresh from firewood!',
        ],
      },
      {
        name: 'Alhaja Kudirat (Fabric Merchant)',
        role: 'MARKET_MAMA',
        x: -55,
        z: -70,
        isStationary: true,
        dialogues: [
          'Original Swiss lace and Hollandaise Ankara dey here!',
          'My customer! Enter shop, make I give you discount!',
          'Lagos business sweet when street dey calm!',
        ],
      },
      {
        name: 'Emeka (Shoe & Drip Trader)',
        role: 'SHOPPER',
        x: -72,
        z: -56,
        dialogues: [
          'Original Italian leather combat shoes, brother!',
          'How far boss! Street credibility high today!',
        ],
      },
      {
        name: 'Blessing (Boutique Shopper)',
        role: 'COMMUTER',
        x: -50,
        z: -65,
        dialogues: [
          'Balogun market crowd too plenty today!',
          'Ah! You be special forces soldier?',
        ],
      },
      {
        name: 'Tunde (Street Plantain Hawker)',
        role: 'HAWKER',
        x: -12,
        z: -26,
        dialogues: [
          'Gala! Chilled Malt! Sweet plantain chips!',
          'Oga officer, buy Gala before Danfo move!',
          'Cold mineral water, ₦100 only!',
        ],
      },
      {
        name: 'Ibrahim (Cold Drinks Hawker)',
        role: 'HAWKER',
        x: 12,
        z: 24,
        dialogues: [
          'Pure water! Chilled malt drink! Zobo dey!',
          'Traffic soft drinks ready for express!',
        ],
      },

      // Oshodi Bus Interchange Commuters & Conductors
      {
        name: 'Baba Segun (Danfo Conductor)',
        role: 'CONDUCTOR',
        x: -60,
        z: 55,
        isStationary: true,
        dialogues: [
          'CMS! CMS! Ojota straight! Enter with your change!',
          'No ₦1000 note o! Holding change na crime for Oshodi!',
          'Driver, hold am! One passenger dey run come!',
        ],
      },
      {
        name: 'Kazeem (Bus Conductor)',
        role: 'CONDUCTOR',
        x: -68,
        z: 68,
        isStationary: true,
        dialogues: [
          'Ikeja along! Maryland flyover! Enter fast!',
          'Odogwu soldier, salute sir! Free ride for uniform!',
        ],
      },
      {
        name: 'Bayo (Civil Servant Commuter)',
        role: 'COMMUTER',
        x: -52,
        z: 62,
        dialogues: [
          'Third Mainland Bridge traffic heavy this evening!',
          'Na only God dey save person for Lagos rush hour!',
        ],
      },
      {
        name: 'Folake (Nurse Commuter)',
        role: 'COMMUTER',
        x: -75,
        z: 58,
        dialogues: [
          'I dey rush enter Danfo go mainland hospital!',
          'Lagos energy no get duplicate anywhere in the world!',
        ],
      },

      // Victoria Island & Lekki Phase 1 Executives & Tech People
      {
        name: 'Chief Adeleke (Eko Tycoon)',
        role: 'AGBADA_CHIEF',
        x: 58,
        z: -58,
        isStationary: true,
        dialogues: [
          'Lagos is the economic powerhouse of Africa, young man!',
          'Maintain tactical security across this corridor.',
          'Money speaks, but street credibility whispers respect.',
        ],
      },
      {
        name: 'Dr. Obinna (Marina Banker)',
        role: 'COMMUTER',
        x: 72,
        z: -68,
        dialogues: [
          'Stock exchange closed bullish on the Marina floor!',
          'Fintech revolution happening right here in Lagos.',
        ],
      },
      {
        name: 'Zainab (Creative Director)',
        role: 'SHOPPER',
        x: 64,
        z: -48,
        dialogues: [
          'Lagos golden hour aesthetic is pure cinematic gold!',
          'Love your tactical drip, looks like Fashion Week x COD!',
        ],
      },

      // Computer Village Ikeja Techies & Technicians
      {
        name: 'Engineer Chidi (Laptop Surgeon)',
        role: 'SHOPPER',
        x: 58,
        z: 64,
        isStationary: true,
        dialogues: [
          'Motherboard repair, screen replacement in 15 minutes!',
          'Computer Village: We fix wetin Silicon Valley throway!',
          'Generator power keep our soldering irons blazing!',
        ],
      },
      {
        name: 'DJ Spinall (Afrobeats Enthusiast)',
        role: 'COMMUTER',
        x: 68,
        z: 55,
        dialogues: [
          'New Afrobeats banger dropping tonight!',
          'Vibes in Lagos never die down, 24/7 heartbeat!',
        ],
      },

      // Central Tinubu Square Heritage Roundabout Pedestrians
      {
        name: 'Uncle Sunday (Heritage Historian)',
        role: 'AGBADA_CHIEF',
        x: 10,
        z: -10,
        isStationary: true,
        dialogues: [
          'Tinubu Square monument stands as our cultural bedrock.',
          'Three White Cap Chiefs watching over our great metropolis.',
        ],
      },
      {
        name: 'Amaka (Street Foodie)',
        role: 'COMMUTER',
        x: -10,
        z: 10,
        dialogues: [
          'Lagos puff-puff and suya is life!',
          'Watch out for the yellow Danfo drift on the expressway!',
        ],
      },
    ];

    // Add extra strolling pedestrians along sidewalks
    for (let i = 0; i < 18; i++) {
      const isEastWest = i % 2 === 0;
      const coord = (i - 9) * 12;
      civilianConfigs.push({
        name: `Lagosian #${i + 1}`,
        role: i % 4 === 0 ? 'HAWKER' : i % 3 === 0 ? 'SHOPPER' : 'COMMUTER',
        x: isEastWest ? coord : (i % 2 === 0 ? 11.5 : -11.5),
        z: isEastWest ? (i % 2 === 0 ? 11.5 : -11.5) : coord,
        dialogues: [
          'How far!',
          'Odogwu dey street!',
          'No shaking!',
          'Lagos hustle continues!',
        ],
      });
    }

    civilianConfigs.forEach((cfg, idx) => {
      const mesh = this.createCivilianMesh(cfg.role, idx);
      mesh.position.set(cfg.x, 0, cfg.z);
      this.scene.add(mesh);

      const agent: CivilianAgent = {
        id: `civ-${idx}`,
        name: cfg.name,
        role: cfg.role,
        position: new THREE.Vector3(cfg.x, 0, cfg.z),
        targetPos: new THREE.Vector3(
          cfg.x + (cfg.isStationary ? 0 : (Math.random() - 0.5) * 25),
          0,
          cfg.z + (cfg.isStationary ? 0 : (Math.random() - 0.5) * 25)
        ),
        homePos: new THREE.Vector3(cfg.x, 0, cfg.z),
        speed: cfg.isStationary ? 0 : 1.2 + Math.random() * 0.8,
        dialogueList: cfg.dialogues,
        mesh,
        legL: mesh.getObjectByName('legL') as THREE.Mesh,
        legR: mesh.getObjectByName('legR') as THREE.Mesh,
        armL: mesh.getObjectByName('armL') as THREE.Mesh,
        armR: mesh.getObjectByName('armR') as THREE.Mesh,
        walkCycle: Math.random() * Math.PI * 2,
        isStationary: cfg.isStationary ?? false,
        lastSpokenTime: 0,
        speechSprite: null,
      };

      this.civilians.push(agent);
    });
  }

  // --- 2. CREATE STYLIZED ARTICULATED NIGERIAN CIVILIAN 3D MESH ---
  private createCivilianMesh(role: CivilianRole, seed: number): THREE.Group {
    const grp = new THREE.Group();

    // Natural skin material with expressive facial features
    const faceTex = textureCache.getTacticalFaceTexture(false);
    const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.65 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.75 });

    // Clothing Material based on role
    let torsoMat: THREE.Material;
    let pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }); // Indigo denim

    if (role === 'MARKET_MAMA') {
      torsoMat = new THREE.MeshStandardMaterial({
        map: textureCache.getAnkaraWaxTexture(seed % 2 === 0 ? 'gold_teal' : 'red_orange'),
        roughness: 0.7,
      });
    } else if (role === 'AGBADA_CHIEF') {
      torsoMat = new THREE.MeshStandardMaterial({
        map: textureCache.getAgbadaEmbroideryTexture(),
        roughness: 0.6,
      });
    } else if (role === 'HAWKER' || role === 'CONDUCTOR') {
      torsoMat = new THREE.MeshStandardMaterial({
        map: textureCache.getStreetwearTeeTexture('DANFO #1', '#ca8a04'),
        roughness: 0.8,
      });
    } else {
      torsoMat = new THREE.MeshStandardMaterial({
        map: textureCache.getStreetwearTeeTexture('LAGOS 01', seed % 2 === 0 ? '#18181b' : '#0284c7'),
        roughness: 0.8,
      });
    }

    // Torso / Upper Body
    const torsoHeight = role === 'AGBADA_CHIEF' ? 1.0 : 0.72;
    const torsoGeo = role === 'AGBADA_CHIEF'
      ? new THREE.CylinderGeometry(0.48, 0.58, torsoHeight, 14) // Flowing Agbada drape
      : new THREE.BoxGeometry(0.46, torsoHeight, 0.28);

    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    grp.add(torso);

    // Head with Realistic Face Map
    const headGeo = new THREE.SphereGeometry(0.18, 18, 16);
    const head = new THREE.Mesh(headGeo, faceMat);
    head.position.y = 1.74;
    head.rotation.y = -Math.PI / 2;
    head.castShadow = true;
    grp.add(head);

    // Traditional Yoruba Fila Cap for Agbada Chief
    if (role === 'AGBADA_CHIEF') {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.19, 0.22, 12),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 }) // Velvet wine Fila
      );
      cap.position.set(0, 1.88, 0.02);
      cap.rotation.z = -0.2; // tilted fashionably
      grp.add(cap);
    } else if (role === 'MARKET_MAMA') {
      // Gele Head-Tie Crown
      const gele = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.08, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
      );
      gele.position.y = 1.86;
      gele.rotation.x = Math.PI / 2.3;
      grp.add(gele);
    } else if (role === 'HAWKER') {
      // Wide circular woven head-tray balanced on head
      const tray = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.38, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      tray.position.y = 1.96;
      grp.add(tray);

      // Snacks & Cold drinks inside tray (Gala & Malt bottles)
      const snackColors = [0xd97706, 0x15803d, 0xdc2626, 0x1d4ed8];
      for (let s = 0; s < 6; s++) {
        const item = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.16, 6),
          new THREE.MeshStandardMaterial({ color: snackColors[s % snackColors.length] })
        );
        const a = (s / 6) * Math.PI * 2;
        item.position.set(Math.cos(a) * 0.22, 2.06, Math.sin(a) * 0.22);
        grp.add(item);
      }
    } else if (role === 'CONDUCTOR') {
      // Yellow Conductor Cap
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.2, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 })
      );
      cap.position.y = 1.84;
      grp.add(cap);
    }

    // Articulated Left & Right Arms for walk cycles & gesturing
    const armGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.58, 8);

    const armL = new THREE.Mesh(armGeo, skinMat);
    armL.position.set(-0.29, 1.3, 0);
    armL.name = 'armL';
    grp.add(armL);

    const armR = new THREE.Mesh(armGeo, skinMat);
    armR.position.set(0.29, 1.3, 0);
    armR.name = 'armR';

    // Conductor waving arm up
    if (role === 'CONDUCTOR') {
      armR.rotation.x = -1.2;
      armR.rotation.z = 0.4;
    }
    grp.add(armR);

    // Left & Right Legs for walk cycles
    const legGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.72, 8);

    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.14, 0.38, 0);
    legL.name = 'legL';
    legL.castShadow = true;
    grp.add(legL);

    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.14, 0.38, 0);
    legR.name = 'legR';
    legR.castShadow = true;
    grp.add(legR);

    return grp;
  }

  // --- 3. MOVING CITY TRAFFIC (DANFOS & KEKES CRUSING HIGHWAYS) ---
  private spawnMovingCityTraffic() {
    // Danfo 1: Cruising North-South Expressway
    const bus1 = this.buildMiniDanfo();
    bus1.position.set(4, 0, -80);
    this.scene.add(bus1);
    this.vehicles.push({
      id: 'traffic-danfo-1',
      type: 'DANFO',
      mesh: bus1,
      speed: 12,
      progress: -80,
      lane: 'NS',
      wheels: this.extractWheels(bus1),
      lastHonkTime: 0,
    });

    // Danfo 2: Cruising South-North Expressway (Opposite lane)
    const bus2 = this.buildMiniDanfo();
    bus2.position.set(-4, 0, 80);
    bus2.rotation.y = Math.PI;
    this.scene.add(bus2);
    this.vehicles.push({
      id: 'traffic-danfo-2',
      type: 'DANFO',
      mesh: bus2,
      speed: -11,
      progress: 80,
      lane: 'NS',
      wheels: this.extractWheels(bus2),
      lastHonkTime: 0,
    });

    // Danfo 3: Cruising East-West Expressway
    const bus3 = this.buildMiniDanfo();
    bus3.position.set(-80, 0, 4);
    bus3.rotation.y = Math.PI / 2;
    this.scene.add(bus3);
    this.vehicles.push({
      id: 'traffic-danfo-3',
      type: 'DANFO',
      mesh: bus3,
      speed: 10.5,
      progress: -80,
      lane: 'EW',
      wheels: this.extractWheels(bus3),
      lastHonkTime: 0,
    });

    // Keke 1: Weaving down North-South Lane
    const keke1 = this.buildMiniKeke();
    keke1.position.set(5.5, 0, 40);
    this.scene.add(keke1);
    this.vehicles.push({
      id: 'traffic-keke-1',
      type: 'KEKE',
      mesh: keke1,
      speed: 9,
      progress: 40,
      lane: 'NS',
      wheels: this.extractWheels(keke1),
      lastHonkTime: 0,
    });

    // Keke 2: Roundabout loop
    const keke2 = this.buildMiniKeke();
    keke2.position.set(18, 0, 0);
    this.scene.add(keke2);
    this.vehicles.push({
      id: 'traffic-keke-2',
      type: 'KEKE',
      mesh: keke2,
      speed: 0.45, // angular speed
      progress: 0,
      lane: 'ROUNDABOUT',
      wheels: this.extractWheels(keke2),
      lastHonkTime: 0,
    });
  }

  private extractWheels(group: THREE.Group): THREE.Object3D[] {
    const list: THREE.Object3D[] = [];
    group.traverse((c) => {
      if (c.name.includes('wheel')) list.push(c);
    });
    return list;
  }

  private buildMiniDanfo(): THREE.Group {
    const bus = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      map: textureCache.getDanfoLiveryTexture(),
      roughness: 0.65,
      metalness: 0.25,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.1, 5.6), bodyMat);
    body.position.y = 1.45;
    body.castShadow = true;
    bus.add(body);

    // Windshield
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.95 })
    );
    glass.position.set(0, 1.78, -2.81);
    bus.add(glass);

    // Glowing Headlights
    [-0.85, 0.85].forEach((hx) => {
      const light = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      light.rotation.x = Math.PI / 2;
      light.position.set(hx, 1.05, -2.82);
      bus.add(light);
    });

    // 4 Wheels
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    [[-1.25, 0.45, -1.7], [1.25, 0.45, -1.7], [-1.25, 0.45, 1.7], [1.25, 0.45, 1.7]].forEach(([wx, wy, wz], idx) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.32, 12), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wx, wy, wz);
      tire.name = `wheel_${idx}`;
      bus.add(tire);
    });

    return bus;
  }

  private buildMiniKeke(): THREE.Group {
    const keke = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      map: textureCache.getKekeLiveryTexture(),
      roughness: 0.6,
    });

    const tub = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.65, 2.3), bodyMat);
    tub.position.y = 0.52;
    keke.add(tub);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.08, 2.1),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 })
    );
    roof.position.y = 1.6;
    keke.add(roof);

    // 3 Wheels
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 10), tireMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.26, -1.05);
    frontWheel.name = 'wheel_front';
    keke.add(frontWheel);

    [-0.68, 0.68].forEach((wx, idx) => {
      const rear = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 10), tireMat);
      rear.rotation.z = Math.PI / 2;
      rear.position.set(wx, 0.26, 0.68);
      rear.name = `wheel_rear_${idx}`;
      keke.add(rear);
    });

    return keke;
  }

  // --- 4. ANIMATION UPDATE LOOP (CALLED EVERY FRAME) ---
  public update(delta: number, playerPos: THREE.Vector3) {
    const now = Date.now();

    // 1. Update Pedestrians (Walking cycles & Proximity banter)
    this.civilians.forEach((civ) => {
      const distToPlayer = civ.position.distanceTo(playerPos);

      // Interactive Proximity Speech Callouts
      if (distToPlayer < 7.5 && now - civ.lastSpokenTime > 9000) {
        civ.lastSpokenTime = now;
        const line = civ.dialogueList[Math.floor(Math.random() * civ.dialogueList.length)];
        this.displaySpeechBubble(civ, line);
        this.onDialogueCallback?.(civ.name, line);
        soundEngine.playVoiceCallout(line);
      }

      // If walking, update position & swinging limb animation
      if (!civ.isStationary) {
        civ.walkCycle += delta * (civ.speed * 4);

        // Arm and Leg walking swings
        if (civ.legL) civ.legL.rotation.x = Math.sin(civ.walkCycle) * 0.45;
        if (civ.legR) civ.legR.rotation.x = -Math.sin(civ.walkCycle) * 0.45;
        if (civ.armL) civ.armL.rotation.x = -Math.sin(civ.walkCycle) * 0.45;
        if (civ.armR && civ.role !== 'CONDUCTOR') civ.armR.rotation.x = Math.sin(civ.walkCycle) * 0.45;

        // Move toward target position
        const toTarget = new THREE.Vector3().subVectors(civ.targetPos, civ.position);
        const dist = toTarget.length();

        if (dist > 0.8) {
          toTarget.normalize();
          civ.position.add(toTarget.multiplyScalar(civ.speed * delta));
          civ.mesh.position.copy(civ.position);
          civ.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        } else {
          // Pick new wandering waypoint near home base
          civ.targetPos.set(
            civ.homePos.x + (Math.random() - 0.5) * 32,
            0,
            civ.homePos.z + (Math.random() - 0.5) * 32
          );
        }
      } else {
        // Stationary idle animation (gentle breathing & looking around)
        const t = (now / 1000) + civ.walkCycle;
        if (civ.armL) civ.armL.rotation.z = Math.sin(t * 1.5) * 0.08;
        if (civ.armR && civ.role !== 'CONDUCTOR') civ.armR.rotation.z = -Math.sin(t * 1.5) * 0.08;

        // If player is close, face the player politely!
        if (distToPlayer < 10) {
          civ.mesh.lookAt(playerPos.x, 0, playerPos.z);
        }
      }
    });

    // 2. Update Moving Highway Traffic
    this.vehicles.forEach((veh) => {
      // Rotate wheels based on motion
      veh.wheels.forEach((w) => {
        w.rotation.x += delta * 12;
      });

      if (veh.lane === 'NS') {
        veh.progress += veh.speed * delta;
        veh.mesh.position.z = veh.progress;

        // Loop traffic when reaching road ends
        if (veh.speed > 0 && veh.progress > 120) veh.progress = -120;
        else if (veh.speed < 0 && veh.progress < -120) veh.progress = 120;
      } else if (veh.lane === 'EW') {
        veh.progress += veh.speed * delta;
        veh.mesh.position.x = veh.progress;

        if (veh.progress > 120) veh.progress = -120;
      } else if (veh.lane === 'ROUNDABOUT') {
        // Circular loop around Tinubu Square roundabout
        veh.progress += veh.speed * delta;
        const radius = 22;
        veh.mesh.position.set(
          Math.cos(veh.progress) * radius,
          0,
          Math.sin(veh.progress) * radius
        );
        veh.mesh.rotation.y = -veh.progress - Math.PI / 2;
      }

      // Occasional Danfo Horn honk when near player
      const distToPlayer = veh.mesh.position.distanceTo(playerPos);
      if (distToPlayer < 24 && now - veh.lastHonkTime > 16000) {
        veh.lastHonkTime = now;
        soundEngine.playDanfoHorn();
      }
    });
  }

  // --- 5. FLOATING 3D PIDGIN BANTER SPEECH BUBBLE ---
  private displaySpeechBubble(civ: CivilianAgent, text: string) {
    if (civ.speechSprite) {
      civ.mesh.remove(civ.speechSprite);
      civ.speechSprite = null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Speech bubble background pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.roundRect(10, 10, 364, 96, 16);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Speaker Name
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`“${civ.name}”`, 24, 38);

    // Dialogue Body Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 17px sans-serif';

    // Word wrap simple
    const words = text.split(' ');
    let line = '';
    let y = 66;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 340 && n > 0) {
        ctx.fillText(line, 24, y);
        line = words[n] + ' ';
        y += 24;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 24, y);

    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.4, 1.15, 1);
    sprite.position.set(0, 2.5, 0);

    civ.speechSprite = sprite;
    civ.mesh.add(sprite);

    // Auto dismiss bubble after 4.5 seconds
    setTimeout(() => {
      if (civ.speechSprite === sprite) {
        civ.mesh.remove(sprite);
        civ.speechSprite = null;
      }
    }, 4500);
  }
}
