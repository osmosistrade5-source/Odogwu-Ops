/**
 * Hyper-Realistic Tactical Operative Model Generator for ODOGWU OPS
 * Constructs highly detailed, anatomically grounded military operatives:
 * - Realistic textured faces with expressive eyes, irises, brows, shaded nose, lips & stubble
 * - Textured ripstop camouflage combat uniforms and MOLLE ballistic plate carriers
 * - Articulated tactical combat gloves and lace-up boots
 * - Realistic First-Person (FPS) tactical arms and hands gripping the weapon with glowing GPS watch!
 */

import * as THREE from 'three';
import { textureCache } from './textures.ts';

export interface OperativeVisualConfig {
  primaryColor: number;
  armorColor: number;
  skinTone?: number;
  hasPlumbob?: boolean;
  nameTag?: string;
  isHostile?: boolean;
  theme?: 'charcoal' | 'crimson' | 'navy' | 'ankara';
}

export function buildTacticalOperativeMesh(config: OperativeVisualConfig): THREE.Group {
  const root = new THREE.Group();

  const faceTex = textureCache.getTacticalFaceTexture(config.isHostile);
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.65,
    metalness: 0.1,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: config.skinTone ?? 0x3d2314, // Rich natural melanin tone
    roughness: 0.72,
  });

  const camoTheme = config.isHostile ? 'crimson' : config.theme ?? 'charcoal';
  const camoTex = textureCache.getTacticalCamoTexture(camoTheme);
  const uniformMat = new THREE.MeshStandardMaterial({
    map: camoTex,
    roughness: 0.78,
  });

  const vestTheme = config.isHostile ? 'syndicate' : 'operator';
  const vestTex = textureCache.getTacticalVestTexture(vestTheme);
  const armorMat = new THREE.MeshStandardMaterial({
    map: vestTex,
    roughness: 0.6,
    metalness: 0.2,
  });

  const gearMat = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Matte tactical hardware
    roughness: 0.55,
    metalness: 0.45,
  });

  const goggleMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Polarized polycarbonate
    roughness: 0.08,
    metalness: 0.95,
  });

  // 1. Torso & Heavy Ballistic Plate Carrier
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.15;

  // Inner Combat Shirt
  const innerTorso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.76, 0.32), uniformMat);
  innerTorso.castShadow = true;
  torsoGroup.add(innerTorso);

  // Heavy Plate Carrier with MOLLE Webbing Front Plate
  const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.6, 0.12), armorMat);
  frontPlate.position.set(0, 0.05, 0.14);
  frontPlate.castShadow = true;
  torsoGroup.add(frontPlate);

  // Back Plate Carrier
  const backPlate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.6, 0.12), armorMat);
  backPlate.position.set(0, 0.05, -0.14);
  backPlate.castShadow = true;
  torsoGroup.add(backPlate);

  // Triple STANAG 5.56mm Magazine Pouches
  for (let m = -1; m <= 1; m++) {
    const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 0.08), gearMat);
    magPouch.position.set(m * 0.13, -0.06, 0.22);
    magPouch.castShadow = true;
    torsoGroup.add(magPouch);

    // Magazine feed lips & pull tab
    const pullTab = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), gearMat);
    pullTab.position.set(m * 0.13, 0.07, 0.22);
    torsoGroup.add(pullTab);
  }

  // Tactical PTT Radio Unit on Left Shoulder Strap
  const radio = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.06), gearMat);
  radio.position.set(-0.2, 0.24, 0.14);
  torsoGroup.add(radio);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6),
    gearMat
  );
  antenna.position.set(-0.2, 0.4, 0.14);
  torsoGroup.add(antenna);

  // Hydration Pack Hose over Right Shoulder
  const hydroHose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6),
    new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.8 })
  );
  hydroHose.position.set(0.18, 0.22, 0.12);
  hydroHose.rotation.z = -0.3;
  torsoGroup.add(hydroHose);

  // Nigerian Green-White-Green Flag Morale Patch on Right Arm
  const flagPatch = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.05),
    new THREE.MeshBasicMaterial({ color: 0x15803d })
  );
  flagPatch.position.set(0.27, 0.2, 0);
  flagPatch.rotation.y = Math.PI / 2;
  torsoGroup.add(flagPatch);

  const flagWhite = new THREE.Mesh(
    new THREE.PlaneGeometry(0.026, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  flagWhite.position.set(0.272, 0.2, 0);
  flagWhite.rotation.y = Math.PI / 2;
  torsoGroup.add(flagWhite);

  root.add(torsoGroup);

  // 2. Head with High-Detail Realistic Face Texture & Facial Features
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.76;
  headGroup.name = 'head';

  // Head Mesh with Detailed Photographic Canvas Face Texture
  const headGeo = new THREE.SphereGeometry(0.2, 24, 20);
  const head = new THREE.Mesh(headGeo, faceMat);
  head.rotation.y = -Math.PI / 2; // Face points forward along Z+
  head.name = 'head';
  headGroup.add(head);

  // Balaclava / Neck Gaiter
  const gaiter = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.18, 14), gearMat);
  gaiter.position.y = -0.08;
  headGroup.add(gaiter);

  // FAST Ballistic Combat Helmet
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: config.isHostile ? 0x27272a : 0x1e293b, roughness: 0.55 })
  );
  helmet.position.y = 0.04;
  helmet.scale.set(1.05, 1.05, 1.15);
  helmet.castShadow = true;
  headGroup.add(helmet);

  // NVG Shroud Bracket on Front of Helmet
  const nvgBracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.04), gearMat);
  nvgBracket.position.set(0, 0.12, 0.22);
  headGroup.add(nvgBracket);

  // Polarized Ballistic Goggles with Specular Lens Glint
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.08), goggleMat);
  goggles.position.set(0, 0.04, 0.19);
  headGroup.add(goggles);

  // Elastic Goggle Strap around Helmet
  const goggleStrap = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.015, 6, 24),
    gearMat
  );
  goggleStrap.position.set(0, 0.04, 0);
  headGroup.add(goggleStrap);

  // Comms Headset Earcaps & Articulated Boom Mic
  const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8), gearMat);
  earL.rotation.z = Math.PI / 2;
  earL.position.set(-0.21, 0.04, 0);
  headGroup.add(earL);

  const earR = earL.clone();
  earR.position.x = 0.21;
  headGroup.add(earR);

  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), gearMat);
  mic.rotation.x = Math.PI / 3;
  mic.position.set(-0.16, -0.03, 0.1);
  headGroup.add(mic);

  root.add(headGroup);

  // 3. Articulated Arms & Detailed Tactical Shooting Gloves
  const armL = new THREE.Group();
  armL.position.set(-0.34, 1.45, 0);

  const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.35, 10), uniformMat);
  upperArmL.position.y = -0.16;
  armL.add(upperArmL);

  const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.32, 10), skinMat);
  forearmL.position.set(0, -0.42, 0.08);
  forearmL.rotation.x = 0.35;
  armL.add(forearmL);

  // Left Tactical Combat Glove with Carbon Knuckle Guard
  const gloveL = buildTacticalGloveMesh(gearMat);
  gloveL.position.set(0, -0.6, 0.16);
  armL.add(gloveL);
  root.add(armL);

  // Right Arm Holding Tactical Weapon
  const armR = new THREE.Group();
  armR.position.set(0.34, 1.45, 0);

  const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.35, 10), uniformMat);
  upperArmR.position.y = -0.16;
  armR.add(upperArmR);

  const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.32, 10), skinMat);
  forearmR.position.set(0, -0.42, 0.1);
  forearmR.rotation.x = 0.45;
  armR.add(forearmR);

  // Right Tactical Glove
  const gloveR = buildTacticalGloveMesh(gearMat);
  gloveR.position.set(0, -0.6, 0.18);
  armR.add(gloveR);
  root.add(armR);

  // Slung Tactical Rifle in Hands
  const slungWeapon = new THREE.Group();
  slungWeapon.position.set(0.12, 0.95, 0.32);
  slungWeapon.rotation.y = -0.25;

  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.58), gearMat);
  slungWeapon.add(gunBody);

  const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38, 8), gearMat);
  gunBarrel.rotation.x = Math.PI / 2;
  gunBarrel.position.set(0, 0.02, 0.42);
  slungWeapon.add(gunBarrel);

  const gunMag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.11), gearMat);
  gunMag.position.set(0, -0.14, 0.05);
  slungWeapon.add(gunMag);
  root.add(slungWeapon);

  // 4. Tactical Belt, Dump Pouch & Kydex Sidearm Holster
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.34), gearMat);
  belt.position.y = 0.76;
  root.add(belt);

  // Kydex Pistol Holster on Right Thigh
  const holster = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.12), gearMat);
  holster.position.set(0.24, 0.62, 0.02);
  root.add(holster);

  // IFAK Medical Blowout Pouch on Belt Back
  const ifakPouch = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.12, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 })
  );
  ifakPouch.position.set(0, 0.76, -0.18);
  root.add(ifakPouch);

  // 5. Contoured Cargo Legs with Crye Protective Knee Pads & Combat Boots
  const legPositions = [-0.14, 0.14];
  legPositions.forEach((lx) => {
    const legGrp = new THREE.Group();
    legGrp.position.set(lx, 0.72, 0);

    // Muscular Cargo Thigh
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.42, 10), uniformMat);
    thigh.position.y = -0.2;
    thigh.castShadow = true;
    legGrp.add(thigh);

    // Cargo Pocket on Outboard Thigh
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.14), uniformMat);
    pocket.position.set(lx < 0 ? -0.1 : 0.1, -0.2, 0);
    legGrp.add(pocket);

    // Hardcap Crye Knee Pad
    const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.08), gearMat);
    kneePad.position.set(0, -0.38, 0.08);
    legGrp.add(kneePad);

    // Shin
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.38, 10), uniformMat);
    shin.position.y = -0.48;
    shin.castShadow = true;
    legGrp.add(shin);

    // Rugged Combat Boot with Lugs
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.26), gearMat);
    boot.position.set(0, -0.68, 0.04);
    boot.castShadow = true;
    legGrp.add(boot);

    root.add(legGrp);
  });

  // 6. Optional Sims Plumbob
  if (config.hasPlumbob) {
    const plumbobGeo = new THREE.OctahedronGeometry(0.16, 0);
    plumbobGeo.scale(1, 2.2, 1);
    const plumbobMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.4,
    });
    const plumbob = new THREE.Mesh(plumbobGeo, plumbobMat);
    plumbob.position.y = 2.45;
    plumbob.name = 'plumbob';
    root.add(plumbob);
  }

  // 7. Optional Floating Tactical Callsign Tag (Multiplayer)
  if (config.nameTag) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = config.isHostile ? 'rgba(69,10,10,0.85)' : 'rgba(15,23,42,0.85)';
    ctx.roundRect(10, 10, 236, 44, 8);
    ctx.fill();

    ctx.strokeStyle = config.isHostile ? 'rgba(239,68,68,0.7)' : 'rgba(56,189,248,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(config.nameTag, 128, 38);

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
    sprite.scale.set(1.8, 0.45, 1);
    sprite.position.y = 2.45;
    root.add(sprite);
  }

  return root;
}

/**
 * Builds a realistic tactical shooting glove with defined knuckles and fingers
 */
function buildTacticalGloveMesh(material: THREE.Material): THREE.Group {
  const grp = new THREE.Group();

  // Palm & Hand Base
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), material);
  grp.add(palm);

  // Carbon Fiber Knuckle Plate
  const knuckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.03, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.3, metalness: 0.8 })
  );
  knuckle.position.set(0, 0.02, 0.045);
  grp.add(knuckle);

  // 4 Finger segments
  for (let f = -1.5; f <= 1.5; f += 1.0) {
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.06, 6), material);
    finger.position.set(f * 0.02, -0.06, 0.02);
    grp.add(finger);
  }

  return grp;
}

/**
 * Builds realistic first-person (FPS) tactical arms and hands gripping the weapon.
 * Features rolled-up camo combat sleeves, muscular forearms with natural skin tones,
 * tactical wristwatch with glowing GPS/time telemetry, and gloved hands in modern C-clamp grip!
 */
export function buildFirstPersonTacticalArms(): THREE.Group {
  const armsGroup = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x3d2314, // Rich natural melanin tone
    roughness: 0.68,
  });

  const sleeveTex = textureCache.getTacticalCamoTexture('charcoal');
  const sleeveMat = new THREE.MeshStandardMaterial({
    map: sleeveTex,
    roughness: 0.78,
  });

  const gloveMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.55,
    metalness: 0.35,
  });

  const watchTex = textureCache.getTacticalWatchTexture();
  const watchMat = new THREE.MeshStandardMaterial({
    map: watchTex,
    roughness: 0.3,
    metalness: 0.6,
  });

  // --- RIGHT ARM (Trigger Hand & Stock Anchor) ---
  const rightArm = new THREE.Group();
  rightArm.position.set(0.18, -0.15, 0.28);

  // Rolled-up Bicep Sleeve
  const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.26, 12), sleeveMat);
  sleeveR.rotation.x = -0.5;
  sleeveR.position.set(0.08, -0.08, 0.12);
  rightArm.add(sleeveR);

  // Muscular Forearm
  const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.28, 12), skinMat);
  forearmR.rotation.x = -0.4;
  forearmR.rotation.z = -0.2;
  forearmR.position.set(0.02, -0.02, -0.04);
  rightArm.add(forearmR);

  // Tactical Watch on Left Wrist
  // Right Hand & Fingers gripping the Pistol Grip
  const handR = new THREE.Group();
  handR.position.set(-0.06, 0.02, -0.16);

  const palmR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.07), gloveMat);
  handR.add(palmR);

  // Carbon Knuckle Protector
  const knuckleR = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.025, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.2, metalness: 0.85 })
  );
  knuckleR.position.set(0, 0.02, 0.035);
  handR.add(knuckleR);

  // Index Finger along Trigger Guard
  const triggerFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, 0.08, 6), gloveMat);
  triggerFinger.rotation.x = Math.PI / 2;
  triggerFinger.position.set(-0.02, 0.02, -0.05);
  handR.add(triggerFinger);

  rightArm.add(handR);
  armsGroup.add(rightArm);

  // --- LEFT ARM (Extended Forward C-Clamp Support Grip) ---
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.22, -0.16, 0.05);

  // Rolled-up Sleeve
  const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.28, 12), sleeveMat);
  sleeveL.rotation.x = -0.8;
  sleeveL.rotation.y = 0.3;
  sleeveL.position.set(-0.06, -0.06, 0.16);
  leftArm.add(sleeveL);

  // Left Forearm extending forward under barrel
  const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.044, 0.34, 12), skinMat);
  forearmL.rotation.x = -0.7;
  forearmL.rotation.y = 0.45;
  forearmL.position.set(0.04, 0.06, -0.14);
  leftArm.add(forearmL);

  // Tactical Wristwatch with Glowing Lagos GPS Display on Left Wrist
  const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 16), watchMat);
  watch.position.set(0.08, 0.15, -0.28);
  watch.rotation.x = Math.PI / 2;
  leftArm.add(watch);

  // Left Hand in Modern C-Clamp Grip wrapping Angled Foregrip
  const handL = new THREE.Group();
  handL.position.set(0.12, 0.16, -0.32);

  const palmL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.08), gloveMat);
  handL.add(palmL);

  // Thumb wrapping over the top rail
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.009, 0.07, 6), gloveMat);
  thumb.rotation.z = Math.PI / 2.5;
  thumb.position.set(0.03, 0.05, 0);
  handL.add(thumb);

  // Fingers wrapped underneath foregrip
  for (let i = 0; i < 3; i++) {
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, 0.06, 6), gloveMat);
    finger.rotation.z = -Math.PI / 3;
    finger.position.set(-0.03, -0.03, -0.03 + i * 0.025);
    handL.add(finger);
  }

  leftArm.add(handL);
  armsGroup.add(leftArm);

  return armsGroup;
}
