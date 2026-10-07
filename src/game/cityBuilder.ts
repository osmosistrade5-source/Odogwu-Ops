/**
 * Mature Lagos State Virtual Metropolis City Builder
 * Assembles a grounded, authentic, highly detailed 3D Lagos environment:
 * - PBR textured asphalt road grid with painted markings and storm drain gutters
 * - Overhead NEPA utility electrical poles with sagged power lines
 * - Realistic Toyota HiAce style weathered Danfo buses with authentic liveries
 * - Detailed Bajaj Keke Marwa auto-rickshaws
 * - Modern curtain-wall skyscrapers, Brazilian colonial multi-storey shops
 * - Elevated expressway flyover bridge with gantry signs
 * - Rooftop GP water tanks, satellite dishes, diesel generator banks, and palm trees.
 */

import * as THREE from 'three';
import { textureCache } from './textures.ts';

// High-resolution mature photographic assets
const MATURE_FACADE_PHOTO = '/src/assets/images/lagos_mature_facade_1791370822207.jpg';
const MATURE_BILLBOARD_PHOTO = '/src/assets/images/lagos_mature_billboard_1791370841243.jpg';
const MATURE_SKYLINE_PHOTO = '/src/assets/images/lagos_mature_skyline_1791370806876.jpg';

export class LagosCityBuilder {
  private scene: THREE.Scene;
  private textureLoader = new THREE.TextureLoader();
  public danfoBuses: THREE.Group[] = [];
  public groundMesh!: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public buildCompleteCity() {
    this.buildGroundAndLagoon();
    this.buildRoadNetwork();
    this.buildOverheadNEPACables();
    this.buildElevatedFlyover();
    this.buildCentralRoundabout();
    this.buildLekkiFinancialDistrict();
    this.buildBalogunMarketDistrict();
    this.buildOshodiTransitHub();
    this.buildComputerVillageDistrict();
    this.buildVegetationAndPalms();
    this.buildStreetlighting();
  }

  // 1. Ground Asphalt & Atlantic Lagoon Perimeter
  private buildGroundAndLagoon() {
    const roadTex = textureCache.getAsphaltRoadTexture();
    roadTex.repeat.set(12, 12);

    const groundGeo = new THREE.PlaneGeometry(280, 280);
    const groundMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.85,
      metalness: 0.15,
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.groundMesh.name = 'city_ground';
    this.scene.add(this.groundMesh);

    // Atlantic Lagoon Water Surface
    const waterGeo = new THREE.PlaneGeometry(450, 450);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x082f49,
      roughness: 0.18,
      metalness: 0.85,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.75;
    this.scene.add(water);

    // Panoramic Skyline Billboard on Horizon
    const skylineGeo = new THREE.CylinderGeometry(200, 200, 45, 32, 1, true, -Math.PI / 3, Math.PI / 1.5);
    this.textureLoader.load(MATURE_SKYLINE_PHOTO, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const skyMat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.BackSide,
        depthWrite: false,
        transparent: true,
        opacity: 0.88,
      });
      const skylineMesh = new THREE.Mesh(skylineGeo, skyMat);
      skylineMesh.position.set(0, 18, -120);
      this.scene.add(skylineMesh);
    });
  }

  // 2. High-Detail Road Network, Curbs, and Storm Drainage Gutters
  private buildRoadNetwork() {
    const sidewalkTex = textureCache.getSidewalkTexture();
    sidewalkTex.repeat.set(1, 24);

    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      roughness: 0.9,
    });

    const gutterMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.95,
    });

    // North-South and East-West Main Sidewalks
    [-11.5, 11.5].forEach((pos) => {
      // NS Sidewalk slabs
      const nsWalk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.28, 260), sidewalkMat);
      nsWalk.position.set(pos < 0 ? pos - 1.5 : pos + 1.5, 0.14, 0);
      nsWalk.receiveShadow = true;
      this.scene.add(nsWalk);

      // EW Sidewalk slabs
      const ewWalk = new THREE.Mesh(new THREE.BoxGeometry(260, 0.28, 3.5), sidewalkMat);
      ewWalk.position.set(0, 0.14, pos < 0 ? pos - 1.5 : pos + 1.5);
      ewWalk.receiveShadow = true;
      this.scene.add(ewWalk);

      // Concrete storm drainage gutter canal running alongside curb
      const nsGutter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 260), gutterMat);
      nsGutter.position.set(pos < 0 ? pos + 0.5 : pos - 0.5, 0.05, 0);
      this.scene.add(nsGutter);

      // Removable concrete crossing slabs over gutter every 18m
      for (let z = -110; z <= 110; z += 18) {
        if (Math.abs(z) < 16) continue;
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.24, 2.2),
          new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.9 })
        );
        slab.position.set(pos < 0 ? pos + 0.5 : pos - 0.5, 0.12, z);
        slab.castShadow = true;
        this.scene.add(slab);
      }
    });

    // Zebra Crossings with realistic painted weathered strips
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xe4e4e7 });
    [
      { x: 0, z: -22, rot: 0 },
      { x: 0, z: 22, rot: 0 },
      { x: -22, z: 0, rot: Math.PI / 2 },
      { x: 22, z: 0, rot: Math.PI / 2 },
    ].forEach((cross) => {
      for (let i = -7; i <= 7; i += 1.8) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 6.0), whiteMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.rotation.z = cross.rot;
        stripe.position.set(
          cross.rot === 0 ? cross.x + i : cross.x,
          0.025,
          cross.rot === 0 ? cross.z : cross.z + i
        );
        this.scene.add(stripe);
      }
    });
  }

  // 3. NEPA Overhead Utility Poles & Suspended Power Cables
  private buildOverheadNEPACables() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 }); // Creosote wooden utility pole
    const wireMat = new THREE.LineBasicMaterial({ color: 0x18181b, linewidth: 2 });
    const polePositions: THREE.Vector3[] = [];

    // Place utility poles along North-South avenue
    for (let z = -100; z <= 100; z += 35) {
      if (Math.abs(z) < 18) continue;
      const polePos = new THREE.Vector3(13.5, 0, z);
      polePositions.push(polePos);

      const poleGrp = new THREE.Group();
      poleGrp.position.copy(polePos);

      // Wooden / concrete pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 10, 8), poleMat);
      pole.position.y = 5;
      pole.castShadow = true;
      poleGrp.add(pole);

      // Crossarm beam
      const crossarm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 2.6), poleMat);
      crossarm.position.set(0, 9.2, 0);
      poleGrp.add(crossarm);

      // Ceramic insulators
      [-1.1, 0, 1.1].forEach((iz) => {
        const ins = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.18, 6),
          new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.3 })
        );
        ins.position.set(0, 9.35, iz);
        poleGrp.add(ins);
      });

      // Pole-mounted cylindrical distribution transformer on every other pole
      if (Math.abs(z) % 70 === 0) {
        const xformer = new THREE.Mesh(
          new THREE.CylinderGeometry(0.38, 0.38, 1.2, 12),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 })
        );
        xformer.position.set(-0.4, 7.5, 0);
        xformer.castShadow = true;
        poleGrp.add(xformer);
      }

      this.scene.add(poleGrp);
    }

    // Connect suspended sagging power lines between consecutive poles
    for (let i = 0; i < polePositions.length - 1; i++) {
      const p1 = polePositions[i];
      const p2 = polePositions[i + 1];

      [-1.1, 0, 1.1].forEach((offsetZ) => {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(p1.x, 9.35, p1.z + offsetZ),
          new THREE.Vector3((p1.x + p2.x) / 2, 8.2, (p1.z + p2.z) / 2 + offsetZ), // sagged midpoint
          new THREE.Vector3(p2.x, 9.35, p2.z + offsetZ)
        );

        const points = curve.getPoints(16);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const cable = new THREE.Line(lineGeo, wireMat);
        this.scene.add(cable);
      });
    }
  }

  // 4. Elevated Flyover Bridge (Third Mainland Bridge style)
  private buildElevatedFlyover() {
    const bridge = new THREE.Group();
    const bridgeY = 6.4;
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.85 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.5, metalness: 0.3 });

    // Highway Road Deck with road texture
    const roadTex = textureCache.getAsphaltRoadTexture();
    const deckMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85 });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(120, 0.7, 9.5), deckMat);
    deck.position.set(0, bridgeY, 28);
    deck.receiveShadow = true;
    deck.castShadow = true;
    bridge.add(deck);

    // Concrete safety barriers with reflective yellow markers
    for (let side of [-4.8, 4.8]) {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(120, 1.1, 0.35), barrierMat);
      barrier.position.set(0, bridgeY + 0.75, 28 + side);
      barrier.castShadow = true;
      bridge.add(barrier);

      // Yellow reflective chevron markers
      for (let rx = -55; rx <= 55; rx += 10) {
        const reflector = new THREE.Mesh(
          new THREE.PlaneGeometry(0.6, 0.4),
          new THREE.MeshBasicMaterial({ color: 0xeab308 })
        );
        reflector.position.set(rx, bridgeY + 0.75, 28 + side + (side < 0 ? 0.19 : -0.19));
        reflector.rotation.y = side < 0 ? 0 : Math.PI;
        bridge.add(reflector);
      }
    }

    // Heavy concrete piers & crosshead support beams
    for (let x of [-48, -24, 0, 24, 48]) {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, bridgeY, 16), concreteMat);
      pier.position.set(x, bridgeY / 2, 28);
      pier.castShadow = true;
      bridge.add(pier);

      const crosshead = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.9, 9.2), concreteMat);
      crosshead.position.set(x, bridgeY - 0.5, 28);
      crosshead.castShadow = true;
      bridge.add(crosshead);
    }

    // Ascending & Descending Expressway Ramps
    const rampLength = 36;
    const rampGeo = new THREE.BoxGeometry(rampLength, 0.6, 9.5);

    const rampWest = new THREE.Mesh(rampGeo, deckMat);
    rampWest.position.set(-78, bridgeY / 2, 28);
    rampWest.rotation.z = Math.atan2(bridgeY, rampLength);
    rampWest.castShadow = true;
    bridge.add(rampWest);

    const rampEast = new THREE.Mesh(rampGeo, deckMat);
    rampEast.position.set(78, bridgeY / 2, 28);
    rampEast.rotation.z = -Math.atan2(bridgeY, rampLength);
    rampEast.castShadow = true;
    bridge.add(rampEast);

    // Overhead Expressway Sign Gantry
    const gantry = new THREE.Group();
    gantry.position.set(0, bridgeY, 28);

    const gantrySteel = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 4.8, 8), gantrySteel);
    postL.position.set(0, 2.4, -4.6);
    gantry.add(postL);

    const postR = postL.clone();
    postR.position.z = 4.6;
    gantry.add(postR);

    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 9.6), gantrySteel);
    truss.position.set(0, 4.6, 0);
    gantry.add(truss);

    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(8.5, 2.2),
      new THREE.MeshBasicMaterial({ map: textureCache.getExpresswaySignTexture() })
    );
    signBoard.position.set(-0.25, 4.2, 0);
    signBoard.rotation.y = -Math.PI / 2;
    gantry.add(signBoard);

    bridge.add(gantry);
    this.scene.add(bridge);
  }

  // 5. Central Heritage Monument & Tinubu Square Roundabout
  private buildCentralRoundabout() {
    const roundabout = new THREE.Group();
    roundabout.position.set(0, 0, 0);

    // Lush manicured green island
    const lawn = new THREE.Mesh(
      new THREE.CylinderGeometry(15.5, 16.0, 0.45, 36),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 })
    );
    lawn.position.y = 0.22;
    lawn.receiveShadow = true;
    roundabout.add(lawn);

    // Curb with yellow/black hazard perimeter
    const curb = new THREE.Mesh(
      new THREE.TorusGeometry(15.8, 0.32, 8, 36),
      new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.7 })
    );
    curb.rotation.x = Math.PI / 2;
    curb.position.y = 0.26;
    roundabout.add(curb);

    // Weathered Granite Monument Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(4.8, 5.4, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
    );
    pedestal.position.y = 0.9;
    pedestal.castShadow = true;
    roundabout.add(pedestal);

    // 3 Historic Bronze Statues of the Lagos White Cap Chiefs (Idejo Chiefs)
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x6e492b, metalness: 0.8, roughness: 0.35 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }); // White traditional Cap

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const statueGrp = new THREE.Group();
      statueGrp.position.set(Math.cos(angle) * 2.4, 1.6, Math.sin(angle) * 2.4);
      statueGrp.rotation.y = angle + Math.PI / 2;

      // Traditional Agbada draped body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.78, 3.8, 12), bronzeMat);
      body.position.y = 1.9;
      body.castShadow = true;
      statueGrp.add(body);

      // Head & White Cap
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), bronzeMat);
      head.position.y = 4.0;
      statueGrp.add(head);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.42, 0.36, 14), capMat);
      cap.position.y = 4.28;
      statueGrp.add(cap);

      // Ceremonial Staff of Office (Opa Ase)
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 4.6, 8), bronzeMat);
      staff.position.set(0.48, 2.3, 0.35);
      statueGrp.add(staff);

      roundabout.add(statueGrp);
    }

    this.scene.add(roundabout);
  }

  // 6. District 1: Lekki Phase 1 & Marina Financial Towers
  private buildLekkiFinancialDistrict() {
    const lekki = new THREE.Group();
    lekki.position.set(65, 0, -65);

    const glassTex = textureCache.getGlassTowerTexture();
    glassTex.repeat.set(1, 2);

    const glassMat = new THREE.MeshStandardMaterial({
      map: glassTex,
      metalness: 0.85,
      roughness: 0.15,
    });

    const towerConfigs = [
      { x: -16, z: -16, w: 16, d: 16, h: 46 },
      { x: 18, z: -16, w: 14, d: 16, h: 36 },
      { x: -16, z: 20, w: 18, d: 14, h: 40 },
      { x: 20, z: 20, w: 15, d: 15, h: 32 },
      { x: 38, z: 0, w: 14, d: 14, h: 28 },
    ];

    towerConfigs.forEach((cfg) => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), glassMat);
      tower.position.set(cfg.x, cfg.h / 2, cfg.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      lekki.add(tower);

      // Rooftop Black GP Water Storage Reservoir (Every high-rise has these in Nigeria)
      const gpTankMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.45 });
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.6, 14), gpTankMat);
      tank.position.set(cfg.x - 2, cfg.h + 1.3, cfg.z - 2);
      tank.castShadow = true;
      lekki.add(tank);

      // Rooftop Satellite Communication Dish
      const dish = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 0.1, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
      );
      dish.position.set(cfg.x + 2, cfg.h + 0.8, cfg.z + 2);
      dish.rotation.x = -0.5;
      lekki.add(dish);

      // Red Aviation Warning Beacon
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beacon.position.set(cfg.x, cfg.h + 0.4, cfg.z);
      lekki.add(beacon);
    });

    // Massive Digital LED Billboard Gantry
    const billboardGrp = new THREE.Group();
    billboardGrp.position.set(-6, 0, -38);

    const latticeSteel = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
    const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 14, 8), latticeSteel);
    colL.position.set(-8, 7, 0);
    billboardGrp.add(colL);

    const colR = colL.clone();
    colR.position.x = 8;
    billboardGrp.add(colR);

    this.textureLoader.load(MATURE_BILLBOARD_PHOTO, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const screenMat = new THREE.MeshBasicMaterial({ map: tex });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), screenMat);
      screen.position.set(0, 11, 0);
      billboardGrp.add(screen);
    });

    lekki.add(billboardGrp);
    this.scene.add(lekki);
  }

  // 7. District 2: Balogun Island Commercial Market & Mama Put Buka
  private buildBalogunMarketDistrict() {
    const balogun = new THREE.Group();
    balogun.position.set(-65, 0, -65);

    const facadeMat = new THREE.MeshStandardMaterial({
      map: textureCache.getCommercialFacadeTexture(),
      roughness: 0.85,
    });

    // High-resolution real texture override on key commercial building
    this.textureLoader.load(MATURE_FACADE_PHOTO, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const matureMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });

      // Landmark Brazilian colonial shopfront
      const landmark = new THREE.Mesh(new THREE.BoxGeometry(18, 16, 14), matureMat);
      landmark.position.set(0, 8, -14);
      landmark.castShadow = true;
      balogun.add(landmark);
    });

    // Commercial Multi-Storey Market Shophouses
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue; // Open courtyard for street market
        const h = 10 + (r + c) * 2.5;
        const b = new THREE.Mesh(new THREE.BoxGeometry(12, h, 12), facadeMat);
        b.position.set((c - 1) * 18, h / 2, (r - 1) * 18);
        b.castShadow = true;
        balogun.add(b);

        // Weathered Corrugated Zinc Roof Overhang
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(13, 0.4, 13),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.65, roughness: 0.5 })
        );
        roof.position.set((c - 1) * 18, h + 0.2, (r - 1) * 18);
        balogun.add(roof);
      }
    }

    // Market Umbrellas & Stalls (MTN Yellow, Airtel Red, Fabric Canopies)
    const umbrellaColors = [0xeab308, 0xdc2626, 0x16a34a, 0x2563eb, 0x9a3412];
    for (let u = 0; u < 12; u++) {
      const color = umbrellaColors[u % umbrellaColors.length];
      const umbrella = new THREE.Mesh(
        new THREE.ConeGeometry(2.0, 0.75, 14),
        new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
      );
      const ux = (Math.random() - 0.5) * 36;
      const uz = (Math.random() - 0.5) * 36;
      umbrella.position.set(ux, 2.6, uz);
      umbrella.castShadow = true;
      balogun.add(umbrella);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6),
        new THREE.MeshStandardMaterial({ color: 0x18181b })
      );
      pole.position.set(ux, 1.3, uz);
      balogun.add(pole);

      // Wooden market crate table under umbrella
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.8, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      crate.position.set(ux, 0.4, uz);
      crate.castShadow = true;
      balogun.add(crate);
    }

    // Authentic Mama Put Buka Suya Spot with glowing charcoal embers
    const buka = new THREE.Group();
    buka.position.set(0, 0, 4);

    // Half-drum barbecue grill
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 2.0, 16),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.4 })
    );
    drum.rotation.z = Math.PI / 2;
    drum.position.set(0, 1.1, 0);
    drum.castShadow = true;
    buka.add(drum);

    // Glowing charcoal bed
    const coals = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.9),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    coals.rotation.x = -Math.PI / 2;
    coals.position.set(0, 1.35, 0);
    buka.add(coals);

    // Warm ember lighting
    const emberLight = new THREE.PointLight(0xf97316, 2.2, 8);
    emberLight.position.set(0, 1.6, 0);
    buka.add(emberLight);

    balogun.add(buka);

    // Parked Keke Marwa near the market
    const keke = this.createRealisticKeke(new THREE.Vector3(6, 0, 8), 0.3);
    balogun.add(keke);

    this.scene.add(balogun);
  }

  // 8. District 3: Oshodi Transport Interchange & Commercial Terminal
  private buildOshodiTransitHub() {
    const oshodi = new THREE.Group();
    oshodi.position.set(-65, 0, 65);

    // Weathered Bus Terminal Tarmac
    const tarmac = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.12, 50),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 })
    );
    tarmac.position.y = 0.06;
    tarmac.receiveShadow = true;
    oshodi.add(tarmac);

    // Deploy 6 Highly Detailed Weathered Danfo Commercial Buses
    for (let i = 0; i < 6; i++) {
      const bx = (i % 3) * 9 - 9;
      const bz = Math.floor(i / 3) * 14 - 10;
      const rot = (Math.PI / 2) * (i % 2 === 0 ? 1 : -1);

      const danfo = this.createRealisticDanfo(new THREE.Vector3(bx, 0, bz), rot);
      this.danfoBuses.push(danfo);
      oshodi.add(danfo);
    }

    // Overhead Pedestrian Footbridge with Steel Truss Cage
    const footbridge = new THREE.Group();
    footbridge.position.set(0, 0, -24);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.35 });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(36, 0.35, 2.8), steelMat);
    deck.position.y = 5.4;
    footbridge.add(deck);

    // Staircases on both ends
    [-18, 18].forEach((sx) => {
      const stair = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 2.8), steelMat);
      stair.position.set(sx < 0 ? sx + 3 : sx - 3, 2.7, 0);
      stair.rotation.z = (sx < 0 ? 1 : -1) * Math.atan2(5.4, 6);
      footbridge.add(stair);

      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5.4, 8), steelMat);
      column.position.set(sx, 2.7, 0);
      footbridge.add(column);
    });

    oshodi.add(footbridge);

    // Parked Keke Tricycles
    const keke1 = this.createRealisticKeke(new THREE.Vector3(-14, 0, 16), Math.PI / 4);
    const keke2 = this.createRealisticKeke(new THREE.Vector3(14, 0, 16), -Math.PI / 4);
    oshodi.add(keke1);
    oshodi.add(keke2);

    this.scene.add(oshodi);
  }

  // 9. District 4: Computer Village Ikeja & Backup Power Generator Farm
  private buildComputerVillageDistrict() {
    const compVillage = new THREE.Group();
    compVillage.position.set(65, 0, 65);

    const techPlazaMat = new THREE.MeshStandardMaterial({
      map: textureCache.getCommercialFacadeTexture(),
      roughness: 0.8,
    });

    const plazas = [
      { x: -14, z: -14, w: 14, d: 14, h: 22 },
      { x: 14, z: -14, w: 14, d: 14, h: 26 },
      { x: -14, z: 14, w: 14, d: 14, h: 20 },
      { x: 14, z: 14, w: 14, d: 14, h: 24 },
    ];

    plazas.forEach((p) => {
      const building = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), techPlazaMat);
      building.position.set(p.x, p.h / 2, p.z);
      building.castShadow = true;
      compVillage.add(building);

      // Rooftop GP Water Reservoir Tank
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 2.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.5 })
      );
      tank.position.set(p.x + 3, p.h + 1.2, p.z + 3);
      compVillage.add(tank);
    });

    // Heavy Industrial Diesel Generator Bank (Essential for Computer Village operation)
    const genShed = new THREE.Group();
    genShed.position.set(0, 0, 0);

    const genColors = [0xb91c1c, 0xd97706, 0x15803d]; // Perkins, CAT, Mikano industrial generators
    for (let g = -2; g <= 2; g++) {
      const genColor = genColors[Math.abs(g) % genColors.length];
      const genBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.5, 2.2),
        new THREE.MeshStandardMaterial({ color: genColor, metalness: 0.75, roughness: 0.35 })
      );
      genBox.position.set(g * 3.2, 0.75, 0);
      genBox.castShadow = true;
      genShed.add(genBox);

      // Industrial Exhaust Stack with black soot ring
      const exhaust = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 })
      );
      exhaust.position.set(g * 3.2, 1.8, 0.5);
      genShed.add(exhaust);
    }

    compVillage.add(genShed);
    this.scene.add(compVillage);
  }

  // 10. Tropical Royal Palm Trees along Avenues and Medians
  private buildVegetationAndPalms() {
    const palmPositions = [
      { x: -9, z: -40 }, { x: 9, z: -40 },
      { x: -9, z: -70 }, { x: 9, z: -70 },
      { x: -9, z: 40 }, { x: 9, z: 40 },
      { x: -9, z: 70 }, { x: 9, z: 70 },
      { x: -40, z: -9 }, { x: -40, z: 9 },
      { x: 40, z: -9 }, { x: 40, z: 9 },
      { x: 7, z: 7 }, { x: -7, z: -7 }, { x: 7, z: -7 }, { x: -7, z: 7 },
    ];

    palmPositions.forEach((pos) => {
      const palm = this.createRoyalPalmTree();
      palm.position.set(pos.x, 0, pos.z);
      this.scene.add(palm);
    });
  }

  private createRoyalPalmTree(): THREE.Group {
    const palm = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6, side: THREE.DoubleSide });

    // Segmented ringed trunk with gentle natural curve
    const trunkHeight = 7.5;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.38, trunkHeight, 10),
      trunkMat
    );
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    palm.add(trunk);

    // Crown of Radiating Palm Fronds
    const frondCount = 14;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2;
      const frondGeo = new THREE.PlaneGeometry(1.1, 4.2);
      const frondMesh = new THREE.Mesh(frondGeo, frondMat);

      frondMesh.position.set(0, trunkHeight + 0.2, 0);
      frondMesh.rotation.y = angle;
      frondMesh.rotation.x = Math.PI / 3.2; // drooping arch
      frondMesh.castShadow = true;
      palm.add(frondMesh);
    }

    return palm;
  }

  // 11. Streetlighting with Warm Pools of Night Lighting
  private buildStreetlighting() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.35 });

    const coords = [
      { x: -12, z: -35 }, { x: 12, z: -35 },
      { x: -12, z: 35 }, { x: 12, z: 35 },
      { x: -45, z: -12 }, { x: 45, z: -12 },
      { x: -45, z: 12 }, { x: 45, z: 12 },
    ];

    coords.forEach((coord) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 9, 8), poleMat);
      pole.position.set(coord.x, 4.5, coord.z);
      pole.castShadow = true;
      this.scene.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 0.14), poleMat);
      arm.position.set(coord.x + (coord.x < 0 ? 1 : -1), 9, coord.z);
      this.scene.add(arm);

      // Warm amber street luminaire
      const spot = new THREE.SpotLight(0xfef08a, 1.8, 28, Math.PI / 3.8, 0.45, 1);
      spot.position.set(coord.x + (coord.x < 0 ? 2 : -2), 8.8, coord.z);
      spot.target.position.set(coord.x, 0, coord.z);
      this.scene.add(spot);
      this.scene.add(spot.target);
    });
  }

  // --- VEHICLE BUILDER 1: AUTHENTIC WEATHERED DANFO COMMERCIAL BUS ---
  public createRealisticDanfo(position: THREE.Vector3, rotationY: number): THREE.Group {
    const bus = new THREE.Group();
    bus.position.copy(position);
    bus.rotation.y = rotationY;

    // Body with authentic textured livery
    const bodyMat = new THREE.MeshStandardMaterial({
      map: textureCache.getDanfoLiveryTexture(),
      roughness: 0.65,
      metalness: 0.25,
    });

    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 5.8), bodyMat);
    bodyMesh.position.y = 1.5;
    bodyMesh.castShadow = true;
    bus.add(bodyMesh);

    // Front Windshield Glass with Tint & Rubber Bezel
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.95 });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.85, 0.1), glassMat);
    windshield.position.set(0, 1.82, -2.91);
    bus.add(windshield);

    // Dual Headlights with Chrome Bezels
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.2, metalness: 0.8 });

    [-0.9, 0.9].forEach((hx) => {
      const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), chromeMat);
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(hx, 1.1, -2.92);
      bus.add(bezel);

      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 12), headMat);
      head.rotation.x = Math.PI / 2;
      head.position.set(hx, 1.1, -2.93);
      bus.add(head);
    });

    // Heavy Metal Roof Luggage Rack with Strapped Cargo
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.4 });
    const rack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 3.8), rackMat);
    rack.position.set(0, 2.7, 0.2);
    bus.add(rack);

    // Strapped Luggage Parcels & Bags on Roof Rack
    const luggageColors = [0x78350f, 0x1e3a8a, 0x166534, 0x991b1b];
    for (let l = 0; l < 4; l++) {
      const lug = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.9),
        new THREE.MeshStandardMaterial({ color: luggageColors[l], roughness: 0.8 })
      );
      lug.position.set((l % 2 === 0 ? -0.5 : 0.5), 3.05, Math.floor(l / 2) * 1.2 - 0.5);
      lug.castShadow = true;
      bus.add(lug);
    }

    // Heavy Duty Commercial Wheels & Steel Rims
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.85, roughness: 0.3 });

    [[-1.3, 0.46, -1.8], [1.3, 0.46, -1.8], [-1.3, 0.46, 1.8], [1.3, 0.46, 1.8]].forEach(([x, y, z]) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.36, 16), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, y, z);
      tire.castShadow = true;
      bus.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.37, 12), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(x, y, z);
      bus.add(rim);
    });

    return bus;
  }

  // --- VEHICLE BUILDER 2: AUTHENTIC BAJAJ KEKE MARWA (TRICYCLE) ---
  public createRealisticKeke(position: THREE.Vector3, rotationY: number): THREE.Group {
    const keke = new THREE.Group();
    keke.position.copy(position);
    keke.rotation.y = rotationY;

    // Curved front cowl with authentic livery
    const kekeMat = new THREE.MeshStandardMaterial({
      map: textureCache.getKekeLiveryTexture(),
      roughness: 0.6,
      metalness: 0.2,
    });

    // Lower chassis & passenger tub
    const tub = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 2.4), kekeMat);
    tub.position.y = 0.55;
    tub.castShadow = true;
    keke.add(tub);

    // Black roll cage tubing & vinyl canopy roof
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.4 });
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.08, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 })
    );
    roof.position.y = 1.65;
    roof.castShadow = true;
    keke.add(roof);

    // Front Single Wheel & Rear Dual Wheels (3 wheels total)
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
    const wheelFront = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 12), tireMat);
    wheelFront.rotation.z = Math.PI / 2;
    wheelFront.position.set(0, 0.28, -1.1);
    wheelFront.castShadow = true;
    keke.add(wheelFront);

    [-0.72, 0.72].forEach((wx) => {
      const wheelRear = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 12), tireMat);
      wheelRear.rotation.z = Math.PI / 2;
      wheelRear.position.set(wx, 0.28, 0.7);
      wheelRear.castShadow = true;
      keke.add(wheelRear);
    });

    // Front Headlamp & Windscreen
    const headlamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.06, 10),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.2, metalness: 0.8 })
    );
    headlamp.rotation.x = Math.PI / 2;
    headlamp.position.set(0, 0.82, -1.22);
    keke.add(headlamp);

    return keke;
  }
}
