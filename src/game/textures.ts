/**
 * Procedural PBR Texture Generation Pipeline for Lagos Metropolis 3D
 * Generates razor-sharp, realistic, weathered textures using HTML5 Canvas.
 * Zero external download latency, guaranteed 100% uptime and high detail.
 */

import * as THREE from 'three';

class ProceduralTextureCache {
  private cache = new Map<string, THREE.CanvasTexture>();

  /**
   * Realistic dark asphalt road with aggregate grain, double yellow center line,
   * dashed lane lines, tire marks, and drainage grates.
   */
  public getAsphaltRoadTexture(): THREE.CanvasTexture {
    const key = 'asphalt_road';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base dark weathered asphalt
    ctx.fillStyle = '#1e1c1a';
    ctx.fillRect(0, 0, 1024, 1024);

    // Micro aggregate & gravel noise
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 32;
      data[i] = Math.max(18, Math.min(48, data[i] + noise));
      data[i + 1] = Math.max(16, Math.min(46, data[i + 1] + noise * 0.9));
      data[i + 2] = Math.max(14, Math.min(42, data[i + 2] + noise * 0.8));
    }
    ctx.putImageData(imgData, 0, 0);

    // Tar crack repairs & road seams
    ctx.strokeStyle = '#121110';
    ctx.lineWidth = 3;
    for (let c = 0; c < 8; c++) {
      ctx.beginPath();
      let cx = Math.random() * 1024;
      let cy = Math.random() * 1024;
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (Math.random() - 0.5) * 120;
        cy += (Math.random() - 0.5) * 120;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Tire wear / skid track bands
    const grad1 = ctx.createLinearGradient(0, 0, 1024, 0);
    grad1.addColorStop(0, 'rgba(0,0,0,0)');
    grad1.addColorStop(0.2, 'rgba(10,10,10,0.35)');
    grad1.addColorStop(0.35, 'rgba(0,0,0,0)');
    grad1.addColorStop(0.65, 'rgba(0,0,0,0)');
    grad1.addColorStop(0.8, 'rgba(10,10,10,0.35)');
    grad1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, 1024, 1024);

    // Center double yellow lines
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(498, 0);
    ctx.lineTo(498, 1024);
    ctx.moveTo(526, 0);
    ctx.lineTo(526, 1024);
    ctx.stroke();

    // White dashed lane markers on sides
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 10;
    ctx.setLineDash([80, 70]);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 1024);
    ctx.moveTo(768, 0);
    ctx.lineTo(768, 1024);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outer solid white road shoulder lines
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(32, 1024);
    ctx.moveTo(992, 0);
    ctx.lineTo(992, 1024);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Realistic concrete sidewalk pavers with curb edging
   */
  public getSidewalkTexture(): THREE.CanvasTexture {
    const key = 'sidewalk_pavers';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Concrete base
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, 0, 512, 512);

    // Paver slabs grid
    const slabSize = 64;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 4;
    for (let x = 0; x <= 512; x += slabSize) {
      for (let y = 0; y <= 512; y += slabSize) {
        ctx.fillStyle = (x / slabSize + y / slabSize) % 2 === 0 ? '#4b5563' : '#475569';
        ctx.fillRect(x + 2, y + 2, slabSize - 4, slabSize - 4);
      }
    }

    // Roadside kerb hazard chevron band on bottom edge
    const curbHeight = 48;
    for (let k = 0; k < 512; k += 48) {
      ctx.fillStyle = (k / 48) % 2 === 0 ? '#ca8a04' : '#18181b';
      ctx.fillRect(k, 512 - curbHeight, 48, curbHeight);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Modern High-Rise Glass & Metal Architectural Curtain Wall
   */
  public getGlassTowerTexture(): THREE.CanvasTexture {
    const key = 'glass_tower';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Dark sleek architectural glass base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 1024);

    const cols = 16;
    const rows = 24;
    const w = 1024 / cols;
    const h = 1024 / rows;

    for (let r = 0; r < rows; r++) {
      // Horizontal concrete floor spandrel
      if (r % 4 === 0) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, r * h, 1024, 8);
      }

      for (let c = 0; c < cols; c++) {
        const x = c * w;
        const y = r * h;

        // Window pane gradient
        const isLit = Math.random() < 0.28;
        const pGrad = ctx.createLinearGradient(x, y, x + w, y + h);

        if (isLit) {
          // Warm interior corporate office glow
          pGrad.addColorStop(0, '#fef08a');
          pGrad.addColorStop(0.5, '#e0e7ff');
          pGrad.addColorStop(1, '#38bdf8');
        } else {
          // Reflective evening dusk sky reflection
          pGrad.addColorStop(0, '#1e293b');
          pGrad.addColorStop(0.6, '#0f172a');
          pGrad.addColorStop(1, '#0284c7');
        }

        ctx.fillStyle = pGrad;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        // Mullion frames
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Weathered Lagos Commercial Multi-Storey Building Facade
   * Features concrete plaster, louvre windows, rusted AC compressors, and shop shutters.
   */
  public getCommercialFacadeTexture(): THREE.CanvasTexture {
    const key = 'commercial_facade';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Aged tropical plaster / sand-cement wall
    ctx.fillStyle = '#57534e';
    ctx.fillRect(0, 0, 1024, 1024);

    // Weathered water streaks from rainy seasons
    for (let s = 0; s < 40; s++) {
      const sx = Math.random() * 1024;
      const sLen = 120 + Math.random() * 400;
      const sGrad = ctx.createLinearGradient(sx, 0, sx, sLen);
      sGrad.addColorStop(0, 'rgba(28,25,23,0.7)');
      sGrad.addColorStop(1, 'rgba(28,25,23,0)');
      ctx.fillStyle = sGrad;
      ctx.fillRect(sx, 50, 4 + Math.random() * 8, sLen);
    }

    // Upper floor windows with glass louvres & iron grilles
    const winW = 84;
    const winH = 110;
    for (let floor = 0; floor < 4; floor++) {
      const fy = 80 + floor * 180;
      for (let col = 0; col < 6; col++) {
        const fx = 60 + col * 155;

        // Window recess
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(fx, fy, winW, winH);

        // Glass panes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fx + 6, fy + 6, winW - 12, winH - 12);

        // Aluminium louvre horizontal slats
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        for (let l = fy + 15; l < fy + winH - 10; l += 14) {
          ctx.beginPath();
          ctx.moveTo(fx + 6, l);
          ctx.lineTo(fx + winW - 6, l);
          ctx.stroke();
        }

        // AC outdoor compressor unit below random windows
        if (Math.random() < 0.6) {
          ctx.fillStyle = '#d4d4d8';
          ctx.fillRect(fx + 12, fy + winH + 8, 60, 40);
          ctx.strokeStyle = '#71717a';
          ctx.strokeRect(fx + 12, fy + winH + 8, 60, 40);
          // Fan grill
          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.arc(fx + 42, fy + winH + 28, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Ground Floor: Commercial Metal Roll-Up Security Shutters & Stores
    const groundY = 800;
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, groundY, 1024, 224);

    for (let s = 0; s < 4; s++) {
      const sx = 20 + s * 250;
      // Metal corrugated shutter
      ctx.fillStyle = s % 2 === 0 ? '#3f3f46' : '#1e293b';
      ctx.fillRect(sx, groundY + 30, 230, 185);

      // Horizontal corrugation ridges
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 3;
      for (let r = groundY + 40; r < 1010; r += 12) {
        ctx.beginPath();
        ctx.moveTo(sx, r);
        ctx.lineTo(sx + 230, r);
        ctx.stroke();
      }

      // Storefront Signboard
      const signs = [
        'CHUKWU BROS IMPORT & EXPORT',
        'ALAFIA PHARMACY & CLINIC',
        'ELECTRONICS & SOLAR INVERTERS',
        'MAMA BOSE TASTY FOOD POINT',
      ];
      ctx.fillStyle = ['#dc2626', '#2563eb', '#16a34a', '#d97706'][s];
      ctx.fillRect(sx, groundY + 4, 230, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(signs[s], sx + 115, groundY + 20);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Authentic Weathered Danfo Livery Texture
   * High-contrast Lagos yellow, double black hazard stripes, route lettering, license plate, rust.
   */
  public getDanfoLiveryTexture(): THREE.CanvasTexture {
    const key = 'danfo_livery';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Commercial Danfo Highway Yellow
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, 1024, 512);

    // Weathered metal grain & road grime at bottom
    const dirtGrad = ctx.createLinearGradient(0, 340, 0, 512);
    dirtGrad.addColorStop(0, 'rgba(41,37,36,0)');
    dirtGrad.addColorStop(1, 'rgba(28,25,23,0.85)');
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, 340, 1024, 172);

    // Double Black Hazard Stripes (Iconic Lagos Commercial Transport Mandate)
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 240, 1024, 38);
    ctx.fillRect(0, 298, 1024, 38);

    // Tinted Passenger Windows with Rubber Trim
    ctx.fillStyle = '#0f172a';
    for (let w = 0; w < 4; w++) {
      ctx.fillRect(60 + w * 220, 40, 190, 160);
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 6;
      ctx.strokeRect(60 + w * 220, 40, 190, 160);
    }

    // Authentic Route Inscription Typography (Painted on side body)
    ctx.fillStyle = '#18181b';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CMS • OJOTA • MARYLAND EXPRESS', 512, 230);

    // Traditional Motor Park Slogan
    ctx.font = 'italic bold 20px sans-serif';
    ctx.fillStyle = '#78350f';
    ctx.fillText('“NO CONDITION IS PERMANENT”', 512, 380);

    // Official Lagos State Commercial Registration Plate
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 360, 140, 50);
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 360, 140, 50);

    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LAGOS - CENTRE OF EXCELLENCE', 110, 372);
    ctx.fillStyle = '#18181b';
    ctx.font = '900 18px monospace';
    ctx.fillText('KJA 482 XY', 110, 396);

    // Federal Tax / LASAA clearance windscreen decal
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(920, 120, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('LASAA 2026', 920, 123);

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Authentic Bajaj Keke Marwa (Tricycle) Body Livery Texture
   */
  public getKekeLiveryTexture(): THREE.CanvasTexture {
    const key = 'keke_livery';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Forest green & bright yellow commercial styling
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 200, 512, 100);

    ctx.fillStyle = '#18181b';
    ctx.font = '900 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MARWA DIRECT', 256, 260);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('“GOD FIRST”', 256, 360);

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Overhead Expressway Directional Signage
   */
  public getExpresswaySignTexture(): THREE.CanvasTexture {
    const key = 'expressway_signs';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // High-visibility green highway sign
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('◀ VICTORIA ISLAND / MARINA', 40, 110);
    ctx.fillText('  LEKKI-IKOYI TOLLGATE ▶', 40, 180);

    // National crest / state motto
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'right';
    ctx.fillText('EKO EXPRESSWAY (A1)', 980, 70);
    ctx.fillText('CENTRE OF EXCELLENCE', 980, 140);

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Realistic Face Texture for 3D Tactical Operatives
   * Features expressive eyes with irises, eyelashes, defined brows, shaded nose bridge,
   * contoured lips, realistic skin pores, and tactical facial hair / war-paint.
   */
  public getTacticalFaceTexture(isHostile: boolean = false): THREE.CanvasTexture {
    const key = `tactical_face_${isHostile ? 'hostile' : 'ally'}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich natural deep melanin skin base
    ctx.fillStyle = '#3a2012';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle skin tone shading and highlights (forehead, cheekbones, nose)
    const skinGrad = ctx.createRadialGradient(256, 256, 50, 256, 256, 250);
    skinGrad.addColorStop(0, 'rgba(82, 45, 26, 0.4)');
    skinGrad.addColorStop(0.7, 'rgba(58, 32, 18, 0)');
    skinGrad.addColorStop(1, 'rgba(30, 16, 9, 0.6)');
    ctx.fillStyle = skinGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Skin pores and micro-texture
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 16;
      data[i] = Math.max(30, Math.min(80, data[i] + n));
      data[i + 1] = Math.max(16, Math.min(50, data[i + 1] + n * 0.7));
      data[i + 2] = Math.max(8, Math.min(35, data[i + 2] + n * 0.5));
    }
    ctx.putImageData(imgData, 0, 0);

    // Eyes (Y = 210, Left at X = 180, Right at X = 332)
    const eyePositions = [180, 332];
    eyePositions.forEach((ex) => {
      // Eye socket shadow
      ctx.fillStyle = 'rgba(20, 10, 5, 0.5)';
      ctx.beginPath();
      ctx.ellipse(ex, 208, 42, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sclera (Eye White with slight warm tint)
      ctx.fillStyle = '#f1ebe5';
      ctx.beginPath();
      ctx.ellipse(ex, 208, 32, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Iris (Rich warm dark amber / deep brown)
      ctx.fillStyle = isHostile ? '#78350f' : '#451a03';
      ctx.beginPath();
      ctx.arc(ex, 208, 14, 0, Math.PI * 2);
      ctx.fill();

      // Outer Iris Ring
      ctx.strokeStyle = '#180a02';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pupil
      ctx.fillStyle = '#050201';
      ctx.beginPath();
      ctx.arc(ex, 208, 7, 0, Math.PI * 2);
      ctx.fill();

      // Specular Light Glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 3, 205, 3, 0, Math.PI * 2);
      ctx.fill();

      // Upper Eyelash & Crease Line
      ctx.strokeStyle = '#1a0d05';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(ex, 204, 34, 18, 0, Math.PI, 0);
      ctx.stroke();
    });

    // Defined Masculine Eyebrows (Strong Tactical Brow)
    ctx.strokeStyle = '#140a04';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    // Left Brow
    ctx.beginPath();
    ctx.moveTo(136, 178);
    ctx.quadraticCurveTo(180, 164, 224, 174);
    ctx.stroke();
    // Right Brow
    ctx.beginPath();
    ctx.moveTo(288, 174);
    ctx.quadraticCurveTo(332, 164, 376, 178);
    ctx.stroke();

    // Nose Bridge and Nostril Shading
    ctx.fillStyle = 'rgba(24, 12, 6, 0.6)';
    // Left nostril
    ctx.beginPath();
    ctx.ellipse(238, 282, 12, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Right nostril
    ctx.beginPath();
    ctx.ellipse(274, 282, 12, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Nose tip highlight
    ctx.fillStyle = 'rgba(100, 58, 36, 0.35)';
    ctx.beginPath();
    ctx.arc(256, 272, 16, 0, Math.PI * 2);
    ctx.fill();

    // Contoured Lips with Natural Warm Pigment
    ctx.fillStyle = '#4c2617';
    ctx.beginPath();
    ctx.ellipse(256, 334, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5c2d1b';
    ctx.beginPath();
    ctx.ellipse(256, 340, 34, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Mouth seam
    ctx.strokeStyle = '#1f0d06';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(222, 336);
    ctx.quadraticCurveTo(256, 340, 290, 336);
    ctx.stroke();

    // Tactical 5 O'Clock Stubble & Beard Texture along Jaw & Chin
    ctx.fillStyle = 'rgba(15, 8, 4, 0.38)';
    ctx.beginPath();
    ctx.ellipse(256, 380, 110, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tactical War Paint or Battle Marks
    if (isHostile) {
      // Crimson tactical Syndicate war-stripes across cheekbones
      ctx.strokeStyle = 'rgba(185, 28, 28, 0.75)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(100, 230);
      ctx.lineTo(210, 260);
      ctx.moveTo(412, 230);
      ctx.lineTo(302, 260);
      ctx.stroke();
    } else {
      // Subtle tactical black smudge on left temple
      ctx.fillStyle = 'rgba(20, 20, 20, 0.4)';
      ctx.beginPath();
      ctx.arc(130, 190, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * High-Resolution Camouflage & Tactical Ripstop Fabric Texture
   */
  public getTacticalCamoTexture(theme: 'charcoal' | 'crimson' | 'navy' | 'ankara' = 'charcoal'): THREE.CanvasTexture {
    const key = `tactical_camo_${theme}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const baseColors = {
      charcoal: '#27272a',
      crimson: '#450a0a',
      navy: '#0f172a',
      ankara: '#1e293b',
    };

    const blotchColors = {
      charcoal: ['#18181b', '#3f3f46', '#52525b'],
      crimson: ['#7f1d1d', '#991b1b', '#18181b'],
      navy: ['#1e293b', '#0284c7', '#1e3a8a'],
      ankara: ['#d97706', '#15803d', '#9a3412'],
    };

    ctx.fillStyle = baseColors[theme];
    ctx.fillRect(0, 0, 512, 512);

    // Organic tactical camouflage / Ankara blotches
    const colors = blotchColors[theme];
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const bx = Math.random() * 512;
      const by = Math.random() * 512;
      const bw = 30 + Math.random() * 80;
      const bh = 20 + Math.random() * 60;
      ctx.beginPath();
      ctx.ellipse(bx, by, bw, bh, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Micro ripstop grid pattern (tactical military fabric standard)
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < 512; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y < 512; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Tactical Ballistic Vest Texture with MOLLE Webbing & Velcro Patch
   */
  public getTacticalVestTexture(theme: 'operator' | 'syndicate' | 'friendly' = 'operator'): THREE.CanvasTexture {
    const key = `tactical_vest_${theme}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const baseColor = theme === 'syndicate' ? '#7f1d1d' : theme === 'friendly' ? '#1e293b' : '#334155';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Cordura ballistic fabric grain
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 24;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    // MOLLE Webbing Horizontal Ladder Bands
    ctx.fillStyle = '#18181b';
    for (let row = 60; row < 460; row += 64) {
      ctx.fillRect(20, row, 472, 24);

      // Vertical bar-tack reinforcement stitches
      ctx.strokeStyle = '#71717a';
      ctx.lineWidth = 3;
      for (let col = 50; col < 470; col += 60) {
        ctx.beginPath();
        ctx.moveTo(col, row);
        ctx.lineTo(col, row + 24);
        ctx.stroke();
      }
    }

    // Velcro Morale Patch Strip on Upper Chest
    ctx.fillStyle = '#27272a';
    ctx.fillRect(116, 20, 280, 36);
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.strokeRect(116, 20, 280, 36);

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Tactical Wristwatch Texture with Glowing Coordinates & Time
   */
  public getTacticalWatchTexture(): THREE.CanvasTexture {
    const key = 'tactical_watch';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Matte black casing
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 256, 256);

    // Bezel
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(128, 128, 110, 0, Math.PI * 2);
    ctx.stroke();

    // LCD display screen
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(128, 128, 96, 0, Math.PI * 2);
    ctx.fill();

    // Glowing green tactical telemetry text
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('14:35:08', 128, 110);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('LAGOS GPS: N 06°', 128, 142);
    ctx.fillText('E 03°24′ ALT:12M', 128, 168);

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Vibrant Nigerian Ankara Wax-Print Fabric Texture
   */
  public getAnkaraWaxTexture(variant: 'gold_teal' | 'red_orange' | 'blue_yellow' = 'gold_teal'): THREE.CanvasTexture {
    const key = `ankara_wax_${variant}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const palettes = {
      gold_teal: { base: '#d97706', accent1: '#0d9488', accent2: '#1e1b4b' },
      red_orange: { base: '#dc2626', accent1: '#ea580c', accent2: '#fef08a' },
      blue_yellow: { base: '#1d4ed8', accent1: '#eab308', accent2: '#166534' },
    };
    const p = palettes[variant];

    ctx.fillStyle = p.base;
    ctx.fillRect(0, 0, 512, 512);

    // Traditional circular eye & fan motifs
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      for (let y = 0; y <= 512; y += step) {
        ctx.fillStyle = p.accent1;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.accent2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Lagos Casual Streetwear Graphic Tee
   */
  public getStreetwearTeeTexture(label: string = 'LAGOS', baseColor: string = '#18181b'): THREE.CanvasTexture {
    const key = `tee_${label}_${baseColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Graphic print on chest
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 128, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('CENTRE OF EXCELLENCE', 128, 140);

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Traditional Nigerian Agbada Embroidered Neckline
   */
  public getAgbadaEmbroideryTexture(): THREE.CanvasTexture {
    const key = 'agbada_embroidery';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich cream brocade fabric base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // Intricate gold geometric embroidery around chest & neckline
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 6;
    ctx.strokeRect(128, 60, 256, 320);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(144, 76, 224, 288);

    // Traditional filigree diamond knot in center
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(256, 120);
    ctx.lineTo(320, 220);
    ctx.lineTo(256, 320);
    ctx.lineTo(192, 220);
    ctx.closePath();
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }
}

export const textureCache = new ProceduralTextureCache();

