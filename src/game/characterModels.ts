/**
 * AAA Hyper-Realistic Tactical Operative Model Generator for ODOGWU OPS
 * Constructs highly detailed, anatomically realistic special forces operatives:
 * - Sculpted human head anatomy (cranium, jawline, chin, neck with throat definition)
 * - 3D facial features: contoured nose with nostrils, realistic 3D eyes with glossy corneal speculars,
 *   sculpted lips, ears with auricle folds, and sharp African fade / cornrow hairstyles
 * - High-tier tactical headgear options:
 *   1. Elite Recon Commando Beret with metallic gold Nigerian eagle badge, polarized sunglasses & boom mic
 *   2. FAST High-Cut Ballistic Helmet with Wilcox NVG shroud, Peltor ComTac headset, flag patch & ARC rails
 *   3. Tactical Boonie Hat with foliage loops and Ankara camouflage
 *   4. Nomex Stealth Balaclava with eye aperture
 * - Realistic Crye Precision JPC ballistic plate carrier with MOLLE rows, STANAG magazine pouches,
 *   tactical PTT radio with antenna and coiled cable, IFAK trauma kit, and sidearm holster
 * - Articulated arms with rolled combat sleeves, muscular melanin forearms, GPS OLED watch,
 *   and carbon-fiber knuckle tactical combat shooting gloves
 * - Crye combat trousers with bellowed cargo pockets, hardcap knee pads, and lugged sole assault boots
 * - Soft ambient occlusion ground contact shadow disc
 * - Fully tagged limb hierarchy (legL, legR, armL, armR, head, torso) for smooth walk-cycle animations
 */

import * as THREE from 'three';
import { textureCache } from './textures.ts';

export type HeadgearType = 'helmet' | 'beret' | 'boonie' | 'balaclava' | 'fade';
export type OperativeGender = 'male' | 'female';

export interface OperativeVisualConfig {
  primaryColor?: number;
  armorColor?: number;
  skinTone?: number;
  hasPlumbob?: boolean;
  nameTag?: string;
  isHostile?: boolean;
  theme?: 'charcoal' | 'crimson' | 'navy' | 'ankara';
  headgear?: HeadgearType;
  gender?: OperativeGender;
}

export function buildTacticalOperativeMesh(config: OperativeVisualConfig): THREE.Group {
  const root = new THREE.Group();
  root.name = 'operative_root';

  const skinColor = config.skinTone ?? 0x3d2314; // Rich natural deep melanin tone
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.68,
    metalness: 0.05,
  });

  const lipMat = new THREE.MeshStandardMaterial({
    color: 0x5a2d1d, // Natural lip pigment
    roughness: 0.6,
  });

  const scleraMat = new THREE.MeshStandardMaterial({
    color: 0xf4eee7,
    roughness: 0.1,
  });

  const irisMat = new THREE.MeshStandardMaterial({
    color: config.isHostile ? 0x854d0e : 0x271406,
    roughness: 0.2,
  });

  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0502 });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x120c08,
    roughness: 0.9,
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
    roughness: 0.58,
    metalness: 0.2,
  });

  const gearMat = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Matte tactical hardware
    roughness: 0.5,
    metalness: 0.45,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.3,
    metalness: 0.85,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.25,
    metalness: 0.9,
  });

  const sunglassLensMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.05,
    metalness: 0.95,
  });

  const clearOpticMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.08,
    metalness: 0.9,
    transparent: true,
    opacity: 0.6,
  });

  // --- 0. AMBIENT OCCLUSION GROUND CONTACT SHADOW DISC ---
  const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: textureCache.getContactShadowTexture(),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.y = 0.02;
  root.add(groundShadow);

  // --- 1. TORSO & BALLISTIC ARMOR ---
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.15;
  torsoGroup.name = 'torso';

  // Inner Combat Shirt (Anatomical V-taper)
  const innerTorso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.74, 0.3), uniformMat);
  innerTorso.castShadow = true;
  torsoGroup.add(innerTorso);

  // Front Heavy Ballistic Strike Plate
  const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.11), armorMat);
  frontPlate.position.set(0, 0.04, 0.13);
  frontPlate.castShadow = true;
  torsoGroup.add(frontPlate);

  // Back Ballistic Plate
  const backPlate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.11), armorMat);
  backPlate.position.set(0, 0.04, -0.13);
  backPlate.castShadow = true;
  torsoGroup.add(backPlate);

  // Shoulder Strap Pads with Velcro
  for (let s = -1; s <= 1; s += 2) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.32), armorMat);
    pad.position.set(s * 0.17, 0.36, 0);
    torsoGroup.add(pad);
  }

  // Triple STANAG 5.56mm Magazine Pouches
  for (let m = -1; m <= 1; m++) {
    const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.07), gearMat);
    magPouch.position.set(m * 0.12, -0.06, 0.2);
    magPouch.castShadow = true;
    torsoGroup.add(magPouch);

    // Magazine feed lips & pull tab
    const pullTab = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), gearMat);
    pullTab.position.set(m * 0.12, 0.07, 0.2);
    torsoGroup.add(pullTab);
  }

  // Tactical PTT Radio Unit on Left Shoulder Strap
  const radio = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.05), gearMat);
  radio.position.set(-0.18, 0.24, 0.14);
  torsoGroup.add(radio);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.28, 6),
    gearMat
  );
  antenna.position.set(-0.18, 0.4, 0.14);
  torsoGroup.add(antenna);

  // Coiled radio cord
  const radioCord = new THREE.Mesh(
    new THREE.TorusGeometry(0.04, 0.008, 6, 12),
    gearMat
  );
  radioCord.position.set(-0.16, 0.28, 0.12);
  torsoGroup.add(radioCord);

  // Tactical Sheathed Combat Knife on Chest
  const knifeSheath = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.03), gearMat);
  knifeSheath.position.set(0.16, 0.14, 0.19);
  knifeSheath.rotation.z = -0.3;
  torsoGroup.add(knifeSheath);

  const knifeHandle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.025), metalMat);
  knifeHandle.position.set(0.19, 0.27, 0.19);
  knifeHandle.rotation.z = -0.3;
  torsoGroup.add(knifeHandle);

  // Nigerian Green-White-Green Flag Morale Patch on Right Chest/Arm
  const flagPatch = new THREE.Mesh(
    new THREE.PlaneGeometry(0.07, 0.045),
    new THREE.MeshBasicMaterial({ color: 0x15803d })
  );
  flagPatch.position.set(0.12, 0.22, 0.195);
  torsoGroup.add(flagPatch);

  const flagWhite = new THREE.Mesh(
    new THREE.PlaneGeometry(0.023, 0.045),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  flagWhite.position.set(0.12, 0.22, 0.197);
  torsoGroup.add(flagWhite);

  root.add(torsoGroup);

  // --- 2. ANATOMICALLY SCULPTED HEAD & REALISTIC FACIAL FEATURES ---
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.76;
  headGroup.name = 'head';

  // Muscular Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.18, 12), skinMat);
  neck.position.y = -0.11;
  headGroup.add(neck);

  // Anatomical Cranium Base
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.185, 20, 16), skinMat);
  skull.scale.set(0.96, 1.05, 1.02);
  headGroup.add(skull);

  // Sculpted Jawline & Chin
  const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.10, 0.14, 12), skinMat);
  jaw.position.set(0, -0.06, 0.05);
  headGroup.add(jaw);

  const chin = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.06), skinMat);
  chin.position.set(0, -0.11, 0.13);
  headGroup.add(chin);

  // 3D Sculpted Nose (Bridge + Nostril Wings)
  const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.08, 0.055), skinMat);
  noseBridge.position.set(0, 0.01, 0.19);
  headGroup.add(noseBridge);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), skinMat);
  noseTip.position.set(0, -0.02, 0.215);
  headGroup.add(noseTip);

  for (let n = -1; n <= 1; n += 2) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), skinMat);
    nostril.position.set(n * 0.028, -0.024, 0.195);
    headGroup.add(nostril);
  }

  // 3D Sculpted Lips (Cupid's bow upper lip + full lower lip)
  const lipUpper = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.02, 0.03), lipMat);
  lipUpper.position.set(0, -0.058, 0.175);
  headGroup.add(lipUpper);

  const lipLower = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.022, 0.032), lipMat);
  lipLower.position.set(0, -0.078, 0.17);
  headGroup.add(lipLower);

  // 3D Expressive Eyes (Sclera + Amber Iris + Pupil + Specular Reflection)
  [-0.062, 0.062].forEach((eyeX) => {
    // Eye Socket Inset
    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(eyeX, 0.035, 0.14);

    // Sclera (White of eye)
    const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), scleraMat);
    eyeball.position.z = 0.03;
    eyeSocket.add(eyeball);

    // Iris
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.013, 12), irisMat);
    iris.position.set(0, 0, 0.053);
    eyeSocket.add(iris);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.007, 10), pupilMat);
    pupil.position.set(0, 0, 0.054);
    eyeSocket.add(pupil);

    // Specular Corneal Highlight
    const glint = new THREE.Mesh(
      new THREE.CircleGeometry(0.0028, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    glint.position.set(-0.004, 0.004, 0.055);
    eyeSocket.add(glint);

    // Eyelid / Brow Shadow Rim
    const eyelid = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.014, 0.03), skinMat);
    eyelid.position.set(0, 0.024, 0.035);
    eyeSocket.add(eyelid);

    // Dark Brow Hair
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.016, 0.025), hairMat);
    brow.position.set(0, 0.042, 0.04);
    brow.rotation.z = (eyeX < 0 ? -1 : 1) * 0.12;
    eyeSocket.add(brow);

    headGroup.add(eyeSocket);
  });

  // 3D Anatomical Ears
  [-0.185, 0.185].forEach((earX) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.07, 0.04), skinMat);
    ear.position.set(earX, 0.01, -0.01);
    headGroup.add(ear);
  });

  // Styled Haircut (Crisp African Fade / Line-Up)
  const hairBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 18, 14, 0, Math.PI * 2, 0, Math.PI / 1.7),
    hairMat
  );
  hairBase.position.y = 0.025;
  headGroup.add(hairBase);

  // Sharp Forehead Line-Up / Edge-Up
  const edgeUp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.04), hairMat);
  edgeUp.position.set(0, 0.11, 0.155);
  headGroup.add(edgeUp);

  // Female Operative: Add sleek tactical braided bun / cornrows
  if (config.gender === 'female') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), hairMat);
    bun.position.set(0, 0.08, -0.17);
    headGroup.add(bun);
  }

  // --- HEADGEAR OPTIONS (BERET, HELMET, BOONIE, BALACLAVA) ---
  const headgear = config.headgear ?? (config.isHostile ? 'balaclava' : 'beret');

  if (headgear === 'beret') {
    // Elite Recon Commando Wool Beret angled sharply to right side
    const beretGrp = new THREE.Group();
    beretGrp.position.set(0.03, 0.14, 0.01);
    beretGrp.rotation.z = -0.26;
    beretGrp.rotation.x = -0.08;

    const beretCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.20, 0.09, 16),
      new THREE.MeshStandardMaterial({
        color: config.isHostile ? 0x991b1b : 0x166534, // Commando Green or Syndicate Crimson
        roughness: 0.85,
      })
    );
    beretGrp.add(beretCap);

    // Metallic Gold Nigerian Armed Forces Eagle Badge on front-left
    const badge = new THREE.Mesh(
      new THREE.CircleGeometry(0.032, 12),
      new THREE.MeshStandardMaterial({
        map: textureCache.getBeretBadgeTexture(),
        roughness: 0.3,
        metalness: 0.8,
      })
    );
    badge.position.set(-0.11, 0.02, 0.185);
    badge.rotation.y = -0.5;
    beretGrp.add(badge);

    headGroup.add(beretGrp);

    // Ballistic Sunglasses with Dark Polarized Sheen
    const sunglassFrame = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.042, 0.07), gearMat);
    sunglassFrame.position.set(0, 0.035, 0.175);
    headGroup.add(sunglassFrame);

    for (let g = -1; g <= 1; g += 2) {
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.036, 0.02), sunglassLensMat);
      lens.position.set(g * 0.055, 0.035, 0.205);
      headGroup.add(lens);
    }

    // Throat Comms Mic & Coil
    const throatMic = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8), gearMat);
    throatMic.position.set(0, -0.09, 0.13);
    headGroup.add(throatMic);
  } else if (headgear === 'helmet') {
    // Modern FAST High-Cut Ballistic Helmet
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 18, 14, 0, Math.PI * 2, 0, Math.PI / 1.7),
      new THREE.MeshStandardMaterial({
        color: config.isHostile ? 0x27272a : 0x334155,
        roughness: 0.6,
      })
    );
    helmet.position.set(0, 0.05, 0.01);
    helmet.scale.set(1.05, 1.05, 1.15);
    helmet.castShadow = true;
    headGroup.add(helmet);

    // NVG Wilcox Mount Shroud
    const nvgMount = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.035), gearMat);
    nvgMount.position.set(0, 0.13, 0.215);
    headGroup.add(nvgMount);

    // Side ARC Rails
    for (let r = -1; r <= 1; r += 2) {
      const arcRail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.14), gearMat);
      arcRail.position.set(r * 0.21, 0.08, 0.02);
      headGroup.add(arcRail);
    }

    // Comms Headset Earcaps & Boom Mic
    const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 8), gearMat);
    earL.rotation.z = Math.PI / 2;
    earL.position.set(-0.21, 0.03, 0);
    headGroup.add(earL);

    const earR = earL.clone();
    earR.position.x = 0.21;
    headGroup.add(earR);

    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.15, 6), gearMat);
    mic.rotation.x = Math.PI / 3;
    mic.position.set(-0.16, -0.03, 0.12);
    headGroup.add(mic);

    // Tactical Clear Ballistic Eye Protection
    const eyePro = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.06), clearOpticMat);
    eyePro.position.set(0, 0.035, 0.185);
    headGroup.add(eyePro);
  } else if (headgear === 'boonie') {
    // Tactical Boonie Bush Hat with Ankara Camo Band
    const boonieCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.21, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.85 })
    );
    boonieCrown.position.y = 0.14;
    headGroup.add(boonieCrown);

    const boonieBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.015, 16),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85 })
    );
    boonieBrim.position.y = 0.09;
    headGroup.add(boonieBrim);

    // Ankara fabric band around crown
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.205, 0.215, 0.035, 16),
      new THREE.MeshStandardMaterial({
        map: textureCache.getAnkaraWaxTexture('gold_teal'),
        roughness: 0.8,
      })
    );
    band.position.y = 0.11;
    headGroup.add(band);
  } else if (headgear === 'balaclava') {
    // Nomex Stealth Balaclava Face Shroud
    const balaclava = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 })
    );
    balaclava.position.y = 0.01;
    headGroup.add(balaclava);

    // Polarized Combat Goggles over Balaclava
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.08), sunglassLensMat);
    goggles.position.set(0, 0.035, 0.19);
    headGroup.add(goggles);
  }

  root.add(headGroup);

  // --- 3. ARTICULATED ARMS & TACTICAL GLOVED HANDS ---
  // Left Arm (with GPS Wristwatch & Foregrip Anchor)
  const armL = new THREE.Group();
  armL.position.set(-0.32, 1.45, 0);
  armL.name = 'armL';

  const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.34, 10), uniformMat);
  upperArmL.position.y = -0.16;
  upperArmL.castShadow = true;
  armL.add(upperArmL);

  const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.32, 10), skinMat);
  forearmL.position.set(0, -0.42, 0.08);
  forearmL.rotation.x = 0.35;
  armL.add(forearmL);

  // Tactical GPS OLED Watch on Left Wrist
  const watchTex = textureCache.getTacticalWatchTexture();
  const watch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.024, 16),
    new THREE.MeshStandardMaterial({ map: watchTex, roughness: 0.3, metalness: 0.6 })
  );
  watch.position.set(0, -0.52, 0.12);
  watch.rotation.x = Math.PI / 2;
  armL.add(watch);

  // Left Tactical Combat Glove
  const gloveL = buildDetailedGloveMesh(gearMat);
  gloveL.position.set(0, -0.6, 0.16);
  armL.add(gloveL);
  root.add(armL);

  // Right Arm (Holding Assault Rifle)
  const armR = new THREE.Group();
  armR.position.set(0.32, 1.45, 0);
  armR.name = 'armR';

  const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.34, 10), uniformMat);
  upperArmR.position.y = -0.16;
  upperArmR.castShadow = true;
  armR.add(upperArmR);

  const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.32, 10), skinMat);
  forearmR.position.set(0, -0.42, 0.1);
  forearmR.rotation.x = 0.45;
  armR.add(forearmR);

  // Right Tactical Glove
  const gloveR = buildDetailedGloveMesh(gearMat);
  gloveR.position.set(0, -0.6, 0.18);
  armR.add(gloveR);
  root.add(armR);

  // Realistic Slung Assault Rifle in Operative's Hands
  const weapon = buildSlungAssaultRifle(gearMat, metalMat);
  weapon.position.set(0.1, 0.96, 0.3);
  weapon.rotation.y = -0.22;
  root.add(weapon);

  // --- 4. TACTICAL BELT, HOLSTER, IFAK & ACCESSORIES ---
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.32), gearMat);
  belt.position.y = 0.77;
  root.add(belt);

  // Cobra Metal Buckle
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.03), metalMat);
  buckle.position.set(0, 0.77, 0.17);
  root.add(buckle);

  // Kydex Drop-Leg Holster with Molded Sidearm on Right Thigh
  const holsterGroup = new THREE.Group();
  holsterGroup.position.set(0.24, 0.62, 0.02);

  const holsterBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.12), gearMat);
  holsterGroup.add(holsterBody);

  // Molded Pistol Grip
  const pistolGrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 0.06), metalMat);
  pistolGrip.position.set(0, 0.11, -0.02);
  pistolGrip.rotation.x = -0.25;
  holsterGroup.add(pistolGrip);
  root.add(holsterGroup);

  // IFAK Medical Trauma Blowout Pouch on Back of Belt
  const ifak = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.12, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 })
  );
  ifak.position.set(0, 0.77, -0.18);
  root.add(ifak);

  // --- 5. ARTICULATED LEGS, KNEE PADS & LUGGED BOOTS ---
  const legL = new THREE.Group();
  legL.position.set(-0.14, 0.72, 0);
  legL.name = 'legL';

  const legR = new THREE.Group();
  legR.position.set(0.14, 0.72, 0);
  legR.name = 'legR';

  [legL, legR].forEach((leg, idx) => {
    const isLeft = idx === 0;

    // Muscular Cargo Thigh
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.095, 0.42, 10), uniformMat);
    thigh.position.y = -0.2;
    thigh.castShadow = true;
    leg.add(thigh);

    // Bellowed Cargo Pocket on Outer Thigh
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.13), uniformMat);
    pocket.position.set(isLeft ? -0.1 : 0.1, -0.2, 0);
    leg.add(pocket);

    // Hardcap Crye Knee Pad
    const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.15, 0.08), gearMat);
    kneePad.position.set(0, -0.38, 0.08);
    kneePad.castShadow = true;
    leg.add(kneePad);

    // Shin
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.078, 0.38, 10), uniformMat);
    shin.position.y = -0.48;
    shin.castShadow = true;
    leg.add(shin);

    // Tactical Assault Combat Boot with Lugged Rubber Sole
    const bootGroup = new THREE.Group();
    bootGroup.position.set(0, -0.66, 0.04);

    const bootUpper = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.22), gearMat);
    bootUpper.position.y = 0.03;
    bootUpper.castShadow = true;
    bootGroup.add(bootUpper);

    // Thick Rubber Lugged Sole
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.04, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 })
    );
    sole.position.y = -0.05;
    bootGroup.add(sole);

    leg.add(bootGroup);
    root.add(leg);
  });

  // Plumbob for Sims Mode
  if (config.hasPlumbob) {
    const plumbobGeo = new THREE.OctahedronGeometry(0.14, 0);
    const plumbobMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e, // Iconic Emerald Green
      wireframe: false,
    });
    const plumbob = new THREE.Mesh(plumbobGeo, plumbobMat);
    plumbob.position.y = 2.3;
    plumbob.scale.set(1, 1.9, 1);
    plumbob.name = 'plumbob';
    root.add(plumbob);
  }

  return root;
}

/**
 * Builds an articulated tactical shooting glove with knuckle guard and finger joints
 */
function buildDetailedGloveMesh(material: THREE.Material): THREE.Group {
  const grp = new THREE.Group();

  // Palm
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.065), material);
  grp.add(palm);

  // Carbon Knuckle Protector
  const knuckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.082, 0.026, 0.035),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.25, metalness: 0.85 })
  );
  knuckle.position.set(0, 0.02, 0.04);
  grp.add(knuckle);

  // 4 Finger segments
  for (let f = -1.5; f <= 1.5; f += 1.0) {
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, 0.06, 6), material);
    finger.position.set(f * 0.018, -0.06, 0.02);
    grp.add(finger);
  }

  // Thumb
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.009, 0.055, 6), material);
  thumb.rotation.z = Math.PI / 3;
  thumb.position.set(-0.04, -0.02, 0.03);
  grp.add(thumb);

  return grp;
}

/**
 * Builds a realistic slung M4A1 tactical carbine carried by the operative
 */
function buildSlungAssaultRifle(gearMat: THREE.Material, metalMat: THREE.Material): THREE.Group {
  const weapon = new THREE.Group();

  // Receiver & Upper Rail
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.44), metalMat);
  weapon.add(receiver);

  // Handguard with Picatinny Rail
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.26), gearMat);
  handguard.position.set(0, 0.01, 0.32);
  weapon.add(handguard);

  // Fluted Barrel & Compensator
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8), metalMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.015, 0.52);
  weapon.add(barrel);

  const compensator = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 8), metalMat);
  compensator.rotation.x = Math.PI / 2;
  compensator.position.set(0, 0.015, 0.64);
  weapon.add(compensator);

  // Curved 30-round 5.56mm Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.09), gearMat);
  mag.position.set(0, -0.13, 0.06);
  mag.rotation.x = 0.15;
  weapon.add(mag);

  // Holographic Optic Sight on Top Rail
  const optic = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.10), metalMat);
  optic.position.set(0, 0.08, 0.08);
  weapon.add(optic);

  // Collapsible Crane Stock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.10, 0.18), gearMat);
  stock.position.set(0, -0.01, -0.28);
  weapon.add(stock);

  return weapon;
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
