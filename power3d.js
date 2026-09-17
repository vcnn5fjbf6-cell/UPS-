(function () {
  'use strict';

  const container = document.getElementById('power3dContainer');
  if (!container) return;

  const hud = {
    title: document.getElementById('power3dHudTitle'),
    meta: document.getElementById('power3dHudMeta'),
    status: document.getElementById('power3dHudStatus')
  };

  const ROUTES = Array.isArray(window.upsMonitorRoutes) ? window.upsMonitorRoutes : [];
  if (!ROUTES.length || !window.THREE) {
    container.innerHTML = '<div class="power3d-fallback">3D 场景加载失败</div>';
    return;
  }

  const COLORS = {
    ok: 0x49d17d,
    warn: 0xf2b84c,
    bad: 0xff6363,
    info: 0x63b3ff,
    steel: 0x1c2a38,
    steelDark: 0x0e1720,
    white: 0xe8eef7
  };

  let scene;
  let camera;
  let renderer;
  let controls;
  let raycaster;
  let selectedRouteId = '1';
  let mainBusMat;
  let mainBusCurve;
  const mainBusParticles = [];
  const busChevrons = [];
  const cabinets = [];
  const routePaths = [];
  const fans = [];
  const hmiScreens = [];
  let lastHmiTick = -1;
  let selectionRing;
  let selectionBeam;
  let selectionMarker;
  let hoveredId = null;
  let lastState = { mainsOn: true, fault: false, lowBattery: false, battery: 96, load: 32 };

  function transformerX(index) {
    return -11 + index * 2.8;
  }

  function makeLabel(text, scale) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = 'rgba(7, 13, 20, 0.88)';
    ctx.beginPath();
    ctx.moveTo(24, 10);
    ctx.lineTo(488, 10);
    ctx.quadraticCurveTo(502, 10, 502, 24);
    ctx.lineTo(502, 104);
    ctx.quadraticCurveTo(502, 118, 488, 118);
    ctx.lineTo(24, 118);
    ctx.quadraticCurveTo(10, 118, 10, 104);
    ctx.lineTo(10, 24);
    ctx.quadraticCurveTo(10, 10, 24, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 179, 255, 0.42)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#e8eef7';
    ctx.font = '600 44px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 66);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    const width = scale || Math.max(2.2, text.length * 0.36);
    sprite.scale.set(width, width * 0.25, 1);
    return sprite;
  }

  function createCoolingFan(group, x, y, z, radius, speed) {
    const fan = new THREE.Group();
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x243747,
      metalness: 0.65,
      roughness: 0.4
    });
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x101a24,
      metalness: 0.7,
      roughness: 0.3
    });
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0x31465a,
      metalness: 0.6,
      roughness: 0.45
    });
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.05, 20), ringMat);
    ring.position.y = 0.015;
    fan.add(ring);
    for (let i = 0; i < 4; i += 1) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.35, 0.04, radius * 0.24), bladeMat);
      blade.rotation.y = i * Math.PI / 2;
      blade.position.x = radius * 0.42;
      fan.add(blade);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, 0.1, 12), hubMat);
    hub.position.y = 0.035;
    fan.add(hub);
    fan.position.set(x, y, z);
    fan.userData.speed = speed;
    group.add(fan);
    fans.push(fan);
    return fan;
  }

  function createHmiScreen(group, options) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0x0b2431,
      emissiveIntensity: 0.7,
      roughness: 0.35,
      metalness: 0.2
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(options.w * 0.5, 0.2), mat);
    screen.position.set(0, options.h * 0.24, options.d / 2 + 0.09);
    group.add(screen);
    hmiScreens.push({
      canvas,
      ctx,
      texture,
      mat,
      label: options.label || 'UPS'
    });
    return screen;
  }

  const KIT = window.UPS3DKit;

  /* ---------------------------------------------------------------
   * 共享材质
   * --------------------------------------------------------------- */
  let sharedMaterials = null;
  function materials() {
    if (sharedMaterials) return sharedMaterials;
    const brushed = KIT.brushedRoughness();
    sharedMaterials = {
      dark: new THREE.MeshStandardMaterial({
        color: 0x0c1218, metalness: 0.55, roughness: 0.62, envMapIntensity: 0.9
      }),
      metal: new THREE.MeshStandardMaterial({
        color: 0x8895a3, metalness: 0.92, roughness: 0.38, roughnessMap: brushed, envMapIntensity: 0.95
      }),
      grille: new THREE.MeshStandardMaterial({
        color: 0x05080b, metalness: 0.35, roughness: 0.9, envMapIntensity: 0.6
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x2f76a8, metalness: 0.5, roughness: 0.35, envMapIntensity: 1
      }),
      emergency: new THREE.MeshStandardMaterial({
        color: 0xc0392b, metalness: 0.25, roughness: 0.45, emissive: 0x3a0d08, emissiveIntensity: 0.6
      }),
      rubber: new THREE.MeshStandardMaterial({
        color: 0x080a0d, metalness: 0.15, roughness: 0.95
      }),
      insulator: new THREE.MeshPhysicalMaterial({
        color: 0x7c7568, metalness: 0.05, roughness: 0.42,
        clearcoat: 0.7, clearcoatRoughness: 0.3, envMapIntensity: 0.55
      }),
      copper: new THREE.MeshStandardMaterial({
        color: 0xb87333, metalness: 0.98, roughness: 0.28, envMapIntensity: 1.2
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x9fd8ff, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.35,
        clearcoat: 1, clearcoatRoughness: 0.05
      }),
      screenDark: new THREE.MeshPhysicalMaterial({
        color: 0x0a1218, metalness: 0.1, roughness: 0.14,
        clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.9
      }),
      cell: new THREE.MeshStandardMaterial({
        color: 0x33465a, metalness: 0.35, roughness: 0.55, envMapIntensity: 0.8
      }),
      warning: new THREE.MeshStandardMaterial({
        map: KIT.warningTexture('高压危险  请勿开启'),
        roughness: 0.55, metalness: 0.1
      })
    };
    return sharedMaterials;
  }

  const plateMats = new Map();
  function plateMaterial(title, subtitle, accent) {
    const key = title + '|' + subtitle;
    if (!plateMats.has(key)) {
      plateMats.set(key, new THREE.MeshStandardMaterial({
        map: KIT.nameplateTexture(title, subtitle, accent),
        roughness: 0.4, metalness: 0.35, envMapIntensity: 0.8
      }));
    }
    return plateMats.get(key);
  }

  const shadowCache = new Map();
  function addContactShadow(group, w, d, y) {
    const key = w.toFixed(2) + '|' + d.toFixed(2);
    if (!shadowCache.has(key)) {
      const proto = KIT.contactShadow(w, d, 0.55);
      shadowCache.set(key, { geometry: proto.geometry, material: proto.material });
    }
    const entry = shadowCache.get(key);
    const mesh = new THREE.Mesh(entry.geometry, entry.material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    mesh.renderOrder = 1;
    group.add(mesh);
  }

  /* ---------------------------------------------------------------
   * 冷却风扇
   * --------------------------------------------------------------- */
  function createCoolingFan(group, x, y, z, radius, speed) {
    const builder = new KIT.Builder();
    const blades = 7;
    for (let i = 0; i < blades; i += 1) {
      const angle = (i / blades) * Math.PI * 2;
      builder.box('blade',
        Math.cos(angle) * radius * 0.55, 0, Math.sin(angle) * radius * 0.55,
        radius * 0.72, 0.016, radius * 0.34,
        [0, -angle, 0.38]);
    }
    builder.cyl('blade', 0, 0, 0, radius * 0.24, 0.075, null, 24);
    builder.sphere('blade', 0, 0.045, 0, radius * 0.2, [1, 0.5, 1]);
    const parts = builder.merge();
    const material = new THREE.MeshStandardMaterial({
      color: 0x151d26, metalness: 0.72, roughness: 0.34, envMapIntensity: 1.1
    });
    const fan = new THREE.Group();
    Object.keys(parts).forEach(function (key) {
      const mesh = new THREE.Mesh(parts[key], material);
      mesh.castShadow = true;
      fan.add(mesh);
    });
    fan.position.set(x, y, z);
    fan.userData.speed = speed;
    group.add(fan);
    fans.push(fan);
    return fan;
  }

  function createHmiScreen(group, options) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshPhysicalMaterial({
      map: texture,
      emissive: 0x0b2431,
      emissiveIntensity: 0.8,
      roughness: 0.16,
      metalness: 0.05,
      clearcoat: 0.9,
      clearcoatRoughness: 0.06
    });
    const screenW = options.w * 0.44;
    const screenH = screenW * 0.375;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), mat);
    screen.position.set(0, options.screenY, options.screenZ);
    group.add(screen);
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(screenW, screenH),
      new THREE.MeshPhysicalMaterial({
        color: 0xbfe4ff, transparent: true, opacity: 0.07,
        roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02
      })
    );
    glass.position.set(0, options.screenY, options.screenZ + 0.005);
    group.add(glass);
    hmiScreens.push({ canvas, ctx, texture, mat, label: options.label || 'UPS' });
    return screen;
  }

  /* ---------------------------------------------------------------
   * 机柜（UPS / 输出柜 / ATS）：复用共用几何
   * --------------------------------------------------------------- */
  function cabinetOptionsFor(kind) {
    if (kind === 'output') {
      return { doorStyle: 'single', meters: true, fans: true, breakers: true, breakerRows: 2 };
    }
    if (kind === 'ats') {
      return { doorStyle: 'single', meters: true, fans: false, breakers: true, breakerRows: 1 };
    }
    return { doorStyle: 'double', hmi: true, fans: true, breakers: true, breakerRows: 1 };
  }

  function createCabinet(options) {
    const w = options.w || 1.7;
    const h = options.h || 2.5;
    const d = options.d || 1.05;
    const kind = options.kind || 'unit';
    const group = new THREE.Group();
    const mats = materials();

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x46586a, metalness: 0.45, roughness: 0.74,
      roughnessMap: KIT.brushedRoughness(),
      clearcoat: 0.45, clearcoatRoughness: 0.28, envMapIntensity: 1.05,
      emissive: 0x000000, emissiveIntensity: 0
    });
    const ledMat = new THREE.MeshStandardMaterial({
      color: COLORS.ok, emissive: COLORS.ok, emissiveIntensity: 1.2, roughness: 0.3, metalness: 0.2
    });
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1b2836, emissive: 0x000000, emissiveIntensity: 0, metalness: 0.55, roughness: 0.5
    });

    const parts = KIT.cabinetGeometry(w, h, d, cabinetOptionsFor(kind));
    const perInstance = { paint: bodyMat, led: ledMat, plate: plateMat };
    Object.keys(parts).forEach(function (key) {
      const material = perInstance[key] || mats[key];
      if (!material) return;
      const mesh = new THREE.Mesh(parts[key], material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    let screenMat = null;
    if (kind === 'ups') {
      const screen = createHmiScreen(group, {
        w: w, label: options.label || 'UPS',
        screenY: h * 0.3, screenZ: d / 2 + 0.079
      });
      screenMat = screen.material;
      const ledRow = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.34, 0.05, 0.02),
        ledMat
      );
      ledRow.position.set(0, h * 0.3 - 0.32, d / 2 + 0.076);
      group.add(ledRow);
      createCoolingFan(group, -w * 0.26, h / 2 + 0.16, 0, 0.23, 2.2);
      createCoolingFan(group, w * 0.26, h / 2 + 0.16, 0, 0.23, 2.2);
    }

    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.34, w * 0.34 * 0.44),
      plateMaterial(options.plateTitle || (kind === 'ats' ? 'ATS/STS' : '配电柜'), options.plateSubtitle || '380V 三相', kind === 'ats' ? '#f2b84c' : '#63b3ff')
    );
    plate.position.set(-w * 0.02, h * 0.12, d / 2 + 0.079);
    group.add(plate);

    addContactShadow(group, w + 1.0, d + 1.0, -h / 2 - 0.14);

    group.position.set(options.x, options.y || h / 2, options.z);
    if (options.rotY) group.rotation.y = options.rotY;

    const label = makeLabel(options.label || '');
    label.position.set(0, h / 2 + 0.62, 0);
    label.userData.cabinet = group;
    label.visible = false;
    group.add(label);

    group.userData = {
      routeId: options.routeId || null,
      kind: kind,
      label: options.label || '',
      bodyMat: bodyMat,
      ledMat: ledMat,
      screenMat: screenMat,
      plateMat: plateMat,
      labelSprite: label
    };
    group.traverse(function (object) {
      if (object.isMesh) object.userData.cabinet = group;
    });

    cabinets.push(group);
    scene.add(group);
    return group;
  }

  /* ---------------------------------------------------------------
   * 油浸式变压器：油箱、散热片、储油柜、瓦斯继电器、套管、冷却风机
   * --------------------------------------------------------------- */
  const transformerCache = new Map();

  function transformerGeometry(w, h, d) {
    const key = w.toFixed(3) + '|' + h.toFixed(3) + '|' + d.toFixed(3);
    if (transformerCache.has(key)) return transformerCache.get(key);
    const b = new KIT.Builder();

    const tankW = w * 0.74;
    const tankH = h * 0.56;
    const tankD = d * 0.78;
    const tankY = 0.34 + tankH / 2;

    // 底座轨道与滚轮
    [-1, 1].forEach(function (side) {
      b.box('dark', side * w * 0.3, 0.2, 0, 0.18, 0.14, d + 0.6);
      [-0.52, 0.52].forEach(function (z) {
        b.cyl('rubber', side * w * 0.3, 0.14, z * d, 0.13, 0.07, [0, 0, Math.PI / 2], 12);
        b.box('metal', side * w * 0.3, 0.24, z * d, 0.22, 0.16, 0.1);
      });
    });

    // 油箱本体 + 加强筋
    b.box('tank', 0, tankY, 0, tankW, tankH, tankD);
    for (let i = 0; i < 3; i += 1) {
      b.box('tank', 0, 0.5 + i * (tankH * 0.42), 0, tankW + 0.03, 0.05, tankD + 0.03);
    }
    // 箱盖、螺栓与吊环
    b.box('dark', 0, tankY + tankH / 2 + 0.035, 0, tankW + 0.09, 0.07, tankD + 0.09);
    for (let i = 0; i < 5; i += 1) {
      [-1, 1].forEach(function (side) {
        b.cyl('metal', side * (tankW / 2 + 0.02), tankY + tankH / 2 + 0.08, -tankD / 2 + 0.14 + i * (tankD - 0.28) / 4, 0.028, 0.05, null, 12);
      });
    }
    [-0.34, 0.34].forEach(function (x) {
      [-0.3, 0.3].forEach(function (z) {
        b.cyl('metal', x * w, tankY + tankH / 2 + 0.13, z * d, 0.055, 0.05, [0, 0, Math.PI / 2], 12);
      });
    });

    // 两侧散热片组：薄片沿 z 排列，形成波纹散热面
    [-1, 1].forEach(function (side) {
      const bx = side * (tankW / 2 + 0.14);
      const panels = 13;
      for (let i = 0; i < panels; i += 1) {
        const pz = -tankD * 0.44 + (i / (panels - 1)) * tankD * 0.88;
        b.box('tank', bx, tankY, pz, 0.26, tankH * 0.92, 0.028);
      }
      // 上下集油管
      b.cyl('tank', bx, tankY + tankH * 0.46, 0, 0.07, tankD * 0.92, [Math.PI / 2, 0, 0], 12);
      b.cyl('tank', bx, tankY - tankH * 0.46, 0, 0.07, tankD * 0.92, [Math.PI / 2, 0, 0], 12);
      // 片间支撑
      b.box('metal', bx, tankY, 0, 0.3, 0.04, tankD * 0.94);
      // 冷却风机护罩
      [-0.28, 0.28].forEach(function (oz) {
        b.cyl('grille', side * (tankW / 2 + 0.32), tankY + 0.02, oz * d, 0.24, 0.02, [0, 0, 0], 24);
        for (let k = 0; k < 4; k += 1) {
          b.box('grille', side * (tankW / 2 + 0.33), tankY + 0.02, oz * d, 0.02, 0.46, 0.02, [0, 0, (k * Math.PI) / 4]);
        }
      });
    });

    // 储油柜（顶部横置圆筒）
    b.cyl('tank', 0, tankY + tankH / 2 + 0.42, 0, 0.17, tankW * 0.92, [0, 0, Math.PI / 2], 24);
    [-0.5, 0.5].forEach(function (side) {
      b.cyl('metal', side * tankW * 0.46, tankY + tankH / 2 + 0.42, 0, 0.075, 0.08, [0, 0, Math.PI / 2], 12);
    });
    // 储油柜与主箱之间的连管 + 瓦斯继电器
    b.cyl('metal', 0, tankY + tankH / 2 + 0.2, 0, 0.055, 0.42, null, 12);
    b.cyl('dark', 0, tankY + tankH / 2 + 0.2, 0, 0.085, 0.24, [Math.PI / 2, 0, 0], 12);
    // 油位计
    b.cyl('metal', tankW * 0.3, tankY + tankH / 2 + 0.42, d * 0.16, 0.05, 0.1, [Math.PI / 2, 0, 0], 12);
    b.cyl('glass', tankW * 0.3, tankY + tankH / 2 + 0.42, d * 0.2, 0.038, 0.16, [Math.PI / 2, 0, 0], 12);
    // 呼吸器（硅胶罐）
    b.cyl('glass', -tankW * 0.42, tankY + tankH / 2 + 0.2, d * 0.2, 0.075, 0.3, null, 12);
    b.cyl('metal', -tankW * 0.42, tankY + tankH / 2 + 0.38, d * 0.2, 0.06, 0.06, null, 12);
    b.cyl('accent', -tankW * 0.42, tankY + tankH / 2 + 0.2, d * 0.2, 0.06, 0.16, null, 12);
    // 防爆管
    b.cyl('metal', tankW * 0.36, tankY + tankH / 2 + 0.24, -d * 0.2, 0.075, 0.5, null, 12);
    b.cyl('emergency', tankW * 0.36, tankY + tankH / 2 + 0.5, -d * 0.2, 0.09, 0.08, null, 12);

    // 高压套管（带裙边）
    [-0.5, 0, 0.5].forEach(function (ox) {
      const bx = ox * tankW * 0.62;
      const by = tankY + tankH / 2 + 0.07;
      const bz = tankD * 0.22;
      let y = by;
      for (let i = 0; i < 6; i += 1) {
        const r = 0.085 - i * 0.008;
        b.cyl('insulator', bx, y + 0.035, bz, r, 0.04, null, 12);
        y += 0.062;
      }
      b.cyl('metal', bx, y + 0.03, bz, 0.022, 0.12, null, 12);
      b.sphere('metal', bx, y + 0.1, bz, 0.035, [1, 0.7, 1]);
    });
    // 低压套管
    [-0.62, -0.22, 0.22, 0.62].forEach(function (ox) {
      const bx = ox * tankW * 0.6;
      const by = tankY + tankH / 2 + 0.06;
      const bz = -tankD * 0.26;
      b.cyl('insulator', bx, by + 0.12, bz, 0.062, 0.24, null, 12);
      b.cyl('metal', bx, by + 0.27, bz, 0.05, 0.05, null, 12);
      b.cyl('copper', bx, by + 0.34, bz, 0.026, 0.12, null, 12);
    });

    // 前后面板：铭牌底座、放油阀、接地端子、警告牌
    b.box('metal', -tankW * 0.22, tankY + 0.02, tankD / 2 + 0.012, 0.42, 0.28, 0.02);
    b.cyl('copper', tankW * 0.34, 0.42, tankD / 2 + 0.03, 0.045, 0.16, [Math.PI / 2, 0, 0], 12);
    b.cyl('copper', -tankW * 0.42, 0.5, tankD / 2, 0.035, 0.09, [Math.PI / 2, 0, 0], 12);
    b.geo('warning', new THREE.PlaneGeometry(0.3, 0.094), [tankW * 0.3, tankY + 0.06, tankD / 2 + 0.014]);
    b.box('dark', 0, 0.34, tankD / 2 - 0.02, tankW * 0.9, 0.05, 0.06);

    const parts = b.merge();
    transformerCache.set(key, parts);
    return parts;
  }

  function createTransformer(options) {
    const w = options.w || 1.9;
    const h = options.h || 2.4;
    const d = options.d || 1.3;
    const group = new THREE.Group();
    const mats = materials();

    const tankMat = new THREE.MeshPhysicalMaterial({
      color: 0x5a6a78, metalness: 0.5, roughness: 0.6,
      roughnessMap: KIT.brushedRoughness(),
      clearcoat: 0.3, clearcoatRoughness: 0.35, envMapIntensity: 0.95,
      emissive: 0x000000, emissiveIntensity: 0
    });
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1b2836, emissive: 0x000000, emissiveIntensity: 0, metalness: 0.55, roughness: 0.5
    });

    const parts = transformerGeometry(w, h, d);
    const perInstance = { tank: tankMat, plate: plateMat };
    Object.keys(parts).forEach(function (key) {
      const material = perInstance[key] || mats[key];
      if (!material) return;
      const mesh = new THREE.Mesh(parts[key], material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    // 冷却风机（侧吹）
    [-1, 1].forEach(function (side) {
      [-0.34, 0.34].forEach(function (oz) {
        const holder = new THREE.Group();
        holder.position.set(side * (w * 0.37 + 0.34), 0.34 + h * 0.28, oz * d);
        holder.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        group.add(holder);
        createCoolingFan(holder, 0, 0, 0, 0.21, 1.9);
      });
    });

    // 铭牌
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.24, w * 0.24 * 0.44),
      plateMaterial(options.name || '干式变压器', options.model || 'SCB13 · 10kV/0.4kV', '#63b3ff')
    );
    plate.position.set(-w * 0.22, 0.34 + h * 0.28 + 0.02, d * 0.39 + 0.026);
    group.add(plate);

    addContactShadow(group, w + 1.4, d + 1.4, 0.02);

    const label = makeLabel(options.label || '');
    label.position.set(0, h + 0.55, 0);
    label.visible = false;
    label.userData.cabinet = group;
    group.add(label);

    group.position.set(options.x, 0, options.z);
    group.userData = {
      routeId: options.routeId || null,
      kind: 'transformer',
      label: options.label || '',
      bodyMat: tankMat,
      ledMat: null,
      screenMat: null,
      plateMat: plateMat,
      labelSprite: label
    };
    group.traverse(function (object) {
      if (object.isMesh) object.userData.cabinet = group;
    });

    cabinets.push(group);
    scene.add(group);
    return group;
  }

  /* ---------------------------------------------------------------
   * 蓄电池组：机架 + 单体电池 + 铜排连接 + 状态灯
   * --------------------------------------------------------------- */
  const batteryCache = new Map();

  function batteryGeometry() {
    if (batteryCache.has('v2')) return batteryCache.get('v2');
    const b = new KIT.Builder();
    const postX = [-0.62, 0, 0.62];
    const rowY = [0.42, 1.12, 1.82];

    // 绝缘垫与机架
    b.box('rubber', 0, 0.03, 0, 1.8, 0.06, 1.34);
    [-1, 1].forEach(function (sx) {
      [-1, 1].forEach(function (sz) {
        b.box('metal', sx * 0.86, 1.1, sz * 0.6, 0.07, 2.2, 0.07);
      });
    });
    rowY.forEach(function (y, index) {
      b.box('metal', 0, y - 0.34, 0, 1.78, 0.06, 1.24);
      if (index < 2) {
        b.box('metal', 0, (y + rowY[index + 1]) / 2 - 0.34, 0, 1.78, 0.05, 0.08);
      }
    });
    b.box('metal', 0, 2.26, 0, 1.78, 0.07, 1.24);

    // 单体电池
    rowY.forEach(function (y, rowIndex) {
      postX.forEach(function (x, colIndex) {
        b.box('cell', x, y, 0, 0.52, 0.62, 0.86);
        b.box('dark', x, y + 0.33, 0, 0.46, 0.06, 0.78);
        [-0.16, 0.16].forEach(function (tz) {
          b.cyl('copper', x + 0.16, y + 0.38, tz * 0.5, 0.4 ? 0.032 : 0.032, 0.05, null, 12);
        });
        b.box('accent', x - 0.14, y + 0.36, 0, 0.12, 0.02, 0.4);
        // 同排电池之间的连接铜排
        if (colIndex < 2) {
          b.box('copper', x + 0.31, y + 0.36, 0, 0.12, 0.03, 0.09);
        }
        // 层间竖向铜排
        if (colIndex === 2 && rowIndex < 2) {
          b.box('copper', x + 0.26, y + 0.37, 0, 0.05, 0.72, 0.06);
        }
      });
    });

    // 顶部引出端子
    b.cyl('emergency', -0.66, 2.4, -0.3, 0.06, 0.14, null, 12);
    b.cyl('metal', 0.66, 2.4, -0.3, 0.06, 0.14, null, 12);

    const parts = b.merge();
    batteryCache.set('v2', parts);
    return parts;
  }

  function createBatteryBank(options) {
    const group = new THREE.Group();
    const mats = materials();
    const ledMat = new THREE.MeshStandardMaterial({
      color: COLORS.ok, emissive: COLORS.ok, emissiveIntensity: 1.1, roughness: 0.3, metalness: 0.2
    });

    const parts = batteryGeometry();
    const perInstance = { led: ledMat };
    Object.keys(parts).forEach(function (key) {
      const material = perInstance[key] || mats[key];
      if (!material) return;
      const mesh = new THREE.Mesh(parts[key], material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    const led = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.03), ledMat);
    led.position.set(0, 2.0, 0.63);
    group.add(led);

    addContactShadow(group, 2.6, 2.1, 0.04);

    const label = makeLabel(options.label || '');
    label.position.set(0, 3.0, 0);
    label.visible = false;
    label.userData.cabinet = group;
    group.add(label);

    group.position.set(options.x, 0, options.z);
    group.userData = {
      kind: 'battery',
      label: options.label || '',
      ledMat: ledMat,
      screenMat: null,
      plateMat: null,
      labelSprite: label
    };
    group.traverse(function (object) {
      if (object.isMesh) object.userData.cabinet = group;
    });
    cabinets.push(group);
    scene.add(group);
    return group;
  }

  /* ---------------------------------------------------------------
   * 电池间：砖墙 + 观察窗 + 顶部母线 + 出入标识
   * --------------------------------------------------------------- */
  function createBatteryRoom(centerX, centerZ, title) {
    const cx = centerX === undefined ? 22.0 : centerX;
    const cz = centerZ === undefined ? 5.0 : centerZ;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3a4a5a, metalness: 0.25, roughness: 0.78, envMapIntensity: 0.6
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x3a4b5c, metalness: 0.65, roughness: 0.42, envMapIntensity: 0.9
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x142c3d, transparent: true, opacity: 0.34,
      metalness: 0.1, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05,
      emissive: COLORS.info, emissiveIntensity: 0.08
    });

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.14, 4.8),
      new THREE.MeshStandardMaterial({ color: 0x1a2530, roughness: 0.6, metalness: 0.3, envMapIntensity: 0.7 })
    );
    floor.position.set(cx, 0.07, cz);
    floor.receiveShadow = true;
    scene.add(floor);

    const back = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.0, 0.12), wallMat);
    back.position.set(cx, 1.5, cz - 2.3);
    back.castShadow = true;
    back.receiveShadow = true;
    scene.add(back);

    [-2.9, 2.9].forEach(function (offset) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.0, 4.8), wallMat);
      side.position.set(cx + offset, 1.5, cz);
      side.castShadow = true;
      side.receiveShadow = true;
      scene.add(side);
    });

    const roof = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.06, 5.0), glassMat);
    roof.position.set(cx, 3.1, cz);
    scene.add(roof);
    [-2.95, 2.95].forEach(function (oz) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(6.05, 0.1, 0.1), trimMat);
      beam.position.set(cx, 3.13, cz + oz);
      scene.add(beam);
    });
    [-2.85, 0, 2.85].forEach(function (ox) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 5.05), trimMat);
      beam.position.set(cx + ox, 3.13, cz);
      scene.add(beam);
    });

    // 前墙分三段，中间留出观察窗
    [1.9, -1.9].forEach(function (offset) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.0, 0.12), wallMat);
      pier.position.set(cx + offset, 1.5, cz + 2.3);
      pier.castShadow = true;
      pier.receiveShadow = true;
      scene.add(pier);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 0.12), wallMat);
    lintel.position.set(cx, 2.55, cz + 2.3);
    lintel.castShadow = true;
    scene.add(lintel);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 0.12), wallMat);
    sill.position.set(cx, 0.35, cz + 2.3);
    sill.castShadow = true;
    scene.add(sill);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.7, 0.06), glassMat);
    glass.position.set(cx, 1.75, cz + 2.3);
    scene.add(glass);
    // 窗框
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 0.16), trimMat);
    frame.position.set(cx, 1.75, cz + 2.32);
    scene.add(frame);
    const frameHole = new THREE.Mesh(new THREE.BoxGeometry(1.78, 1.58, 0.2), new THREE.MeshBasicMaterial({ colorWrite: false }));
    frameHole.position.set(cx, 1.75, cz + 2.33);
    scene.add(frameHole);

    const label = makeLabel(title || '电池间', 2.8);
    label.position.set(cx, 3.6, cz + 2.3);
    scene.add(label);

    const sign = makeLabel('蓄电池组 · 闲人免进', 2.2);
    sign.position.set(cx, 0.5, cz + 2.4);
    scene.add(sign);

    const warning = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.04, 0.2),
      new THREE.MeshStandardMaterial({ color: COLORS.warn, emissive: COLORS.warn, emissiveIntensity: 0.9 })
    );
    warning.position.set(cx, 0.72, cz + 2.32);
    scene.add(warning);

    // 室内顶部灯带：让电池组在暗色场景里也看得清
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xdcefff, emissiveIntensity: 1.2, roughness: 0.25
    });
    [-1.2, 1.2].forEach(function (offset) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.24), lampMat);
      lamp.position.set(cx + offset, 2.92, cz + 0.6);
      scene.add(lamp);
    });
    const roomLight = new THREE.PointLight(0xdcefff, 0.55, 9, 2);
    roomLight.position.set(cx, 2.5, cz + 0.4);
    scene.add(roomLight);

    const busbarMat = new THREE.MeshStandardMaterial({
      color: COLORS.warn, emissive: COLORS.warn, emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.35
    });
    const roomBus = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 0.24), busbarMat);
    roomBus.position.set(cx, 2.86, cz);
    scene.add(roomBus);
    // 母线绝缘支撑
    [cx - 1.4, cx, cx + 1.4].forEach(function (x) {
      const support = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12),
        new THREE.MeshPhysicalMaterial({ color: 0x6d7a86, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.2 })
      );
      support.position.set(x, 3.0, cz);
      scene.add(support);
    });

    [cx - 1.4, cx, cx + 1.4].forEach(function (x) {
      const riser = createPath([
        new THREE.Vector3(x, 2.5, cz),
        new THREE.Vector3(x, 2.84, cz)
      ], COLORS.warn, 0.035);
      scene.add(riser.mesh);
    });
  }

  /* ---------------------------------------------------------------
   * 末端负载柜（PDU）
   * --------------------------------------------------------------- */
  function createLoadBlock(options) {
    const group = new THREE.Group();
    const mats = materials();
    const w = 1.6;
    const h = 1.95;
    const d = 1.25;

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x36485a, metalness: 0.45, roughness: 0.7,
      roughnessMap: KIT.brushedRoughness(),
      clearcoat: 0.4, clearcoatRoughness: 0.3, envMapIntensity: 1
    });
    const loadMat = new THREE.MeshStandardMaterial({
      color: COLORS.ok, emissive: COLORS.ok, emissiveIntensity: 0.6, roughness: 0.35, metalness: 0.2
    });
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1b2836, emissive: 0x000000, emissiveIntensity: 0, metalness: 0.55, roughness: 0.5
    });

    const parts = KIT.cabinetGeometry(w, h, d, {
      doorStyle: 'single', meters: true, fans: false, breakers: true, breakerRows: 2
    });
    const perInstance = { paint: bodyMat, plate: plateMat };
    Object.keys(parts).forEach(function (key) {
      const material = perInstance[key] || mats[key];
      if (!material) return;
      const mesh = new THREE.Mesh(parts[key], material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.06, 0.06), loadMat);
    strip.position.set(0, h / 2 - 0.1, d / 2 + 0.05);
    group.add(strip);

    addContactShadow(group, w + 1.0, d + 1.0, -h / 2 - 0.14);

    group.position.set(options.x, h / 2, options.z);
    const label = makeLabel(options.label || '');
    label.position.set(0, h / 2 + 0.62, 0);
    label.userData.cabinet = group;
    label.visible = false;
    group.add(label);

    group.userData = {
      routeId: options.routeId || null,
      kind: 'load',
      label: options.label || '',
      loadMat: loadMat,
      ledMat: loadMat,
      screenMat: null,
      plateMat: plateMat,
      labelSprite: label
    };
    group.traverse(function (object) {
      if (object.isMesh) object.userData.cabinet = group;
    });
    cabinets.push(group);
    scene.add(group);
    return group;
  }

  function createPath(points, color, width) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 80, width || 0.07, 8, false);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.26,
      envMapIntensity: 0.2,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.curve = curve;
    return { mesh, curve, material };
  }

  class AngledCurve extends THREE.Curve {
    constructor(points) {
      super();
      this.points = points;
      this.segments = [];
      this.totalLength = 0;
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i];
        const b = points[i + 1];
        const length = a.distanceTo(b);
        this.segments.push({ a, b, length, start: this.totalLength });
        this.totalLength += length;
      }
    }

    getPoint(t, optionalTarget) {
      const target = optionalTarget || new THREE.Vector3();
      const distance = Math.min(this.totalLength, Math.max(0, t * this.totalLength));
      let segment = this.segments[this.segments.length - 1];
      for (let i = 0; i < this.segments.length; i += 1) {
        const candidate = this.segments[i];
        if (distance <= candidate.start + candidate.length) {
          segment = candidate;
          break;
        }
      }
      const local = segment.length
        ? Math.min(1, Math.max(0, (distance - segment.start) / segment.length))
        : 0;
      return target.copy(segment.a).lerp(segment.b, local);
    }

    getTangent(t) {
      const distance = Math.min(this.totalLength, Math.max(0, t * this.totalLength));
      let segment = this.segments[this.segments.length - 1];
      for (let i = 0; i < this.segments.length; i += 1) {
        const candidate = this.segments[i];
        if (distance <= candidate.start + candidate.length) {
          segment = candidate;
          break;
        }
      }
      if (!segment.length) return new THREE.Vector3(0, 1, 0);
      return new THREE.Vector3().subVectors(segment.b, segment.a).normalize();
    }
  }

  function createAngledPath(points, color, width) {
    const curve = new AngledCurve(points);
    const geometry = new THREE.TubeGeometry(curve, Math.max(40, points.length * 18), width || 0.07, 8, false);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.26,
      envMapIntensity: 0.2,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.curve = curve;
    return { mesh, curve, material };
  }

  function buildRoutePaths() {
    ROUTES.forEach((route, index) => {
      const tx = transformerX(index);
      const upsX = tx + 0.55;
      const outX = tx - 0.55;
      const main = createAngledPath([
        new THREE.Vector3(tx, 2.4, -4.4),
        new THREE.Vector3(tx, 5.7, -4.4),
        new THREE.Vector3(tx, 5.7, -2.2),
        new THREE.Vector3(upsX, 5.7, -0.2),
        new THREE.Vector3(upsX, 2.5, -0.2),
        new THREE.Vector3(upsX, 5.7, -0.2),
        new THREE.Vector3(outX, 5.7, 2.0),
        new THREE.Vector3(outX, 2.5, 2.0),
        new THREE.Vector3(outX, 5.7, 2.0),
        new THREE.Vector3(tx, 5.7, 4.2),
        new THREE.Vector3(tx, 1.95, 4.2)
      ], COLORS.info, 0.07);

      // 就近接入电池间：西侧区域走西电池间，东侧区域走东电池间
      const roomX = upsX <= 0 ? -22.0 : 22.0;
      const battery = createAngledPath([
        new THREE.Vector3(roomX, 2.8, 5.0),
        new THREE.Vector3(roomX, 5.7, 5.0),
        new THREE.Vector3(roomX, 5.7, -0.2),
        new THREE.Vector3(upsX, 5.7, -0.2),
        new THREE.Vector3(upsX, 2.5, -0.2)
      ], COLORS.warn, 0.055);

      const group = new THREE.Group();
      group.add(main.mesh, battery.mesh);
      group.visible = false;

      const particles = [];
      for (let i = 0; i < 8; i += 1) {
        const material = new THREE.MeshStandardMaterial({
          color: 0xbfefff,
          emissive: COLORS.info,
          emissiveIntensity: 1.6
        });
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 10), material);
        arrow.visible = false;
        group.add(arrow);
        particles.push({
          mesh: arrow,
          curve: main.curve,
          offset: i / 8,
          speed: 0.05 + (i % 3) * 0.01
        });
      }

      const batteryParticles = [];
      for (let i = 0; i < 4; i += 1) {
        const material = new THREE.MeshStandardMaterial({
          color: 0xffe3a3,
          emissive: COLORS.warn,
          emissiveIntensity: 1.5
        });
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 10), material);
        arrow.visible = false;
        group.add(arrow);
        batteryParticles.push({
          mesh: arrow,
          curve: battery.curve,
          offset: i / 4,
          speed: 0.06 + i * 0.012,
          reversed: false
        });
      }

      routePaths.push({
        id: route.id,
        group,
        battery,
        mainMat: main.material,
        batteryMat: battery.material,
        particles,
        batteryParticles
      });
      scene.add(group);
    });
  }

  function buildBusParticles() {
    const points = [
      new THREE.Vector3(-11.4, 5.6, -2.2),
      new THREE.Vector3(14.2, 5.6, -2.2)
    ];
    mainBusCurve = new THREE.CatmullRomCurve3(points);
    for (let i = 0; i < 12; i += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: COLORS.ok,
        emissive: COLORS.ok,
        emissiveIntensity: 1.6
      });
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 10), material);
      scene.add(arrow);
      mainBusParticles.push({
        mesh: arrow,
        curve: mainBusCurve,
        offset: i / 12,
        speed: 0.04 + (i % 4) * 0.006
      });
    }
  }

  function addCableTray(z, fromX, toX) {
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0x1a2632,
      metalness: 0.65,
      roughness: 0.4
    });
    const length = toX - fromX;
    const tray = new THREE.Mesh(new THREE.BoxGeometry(length, 0.16, 0.36), trayMat);
    tray.position.set((fromX + toX) / 2, 5.85, z);
    tray.castShadow = true;
    scene.add(tray);

    const postMat = new THREE.MeshStandardMaterial({
      color: 0x243747,
      metalness: 0.6,
      roughness: 0.45
    });
    for (let x = fromX + 1.6; x <= toX - 1.2; x += 3) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5.5, 0.1), postMat);
      post.position.set(x, 2.75, z);
      scene.add(post);
    }
  }

  function addTopJunctionBox(x, y, z, color) {
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x223445,
      metalness: 0.6,
      roughness: 0.5
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.56), boxMat);
    box.position.set(x, y, z);
    box.castShadow = true;
    scene.add(box);
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.06, 0.28),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9 })
    );
    glow.position.set(x, y + 0.1, z);
    scene.add(glow);
  }

  function addCableDrop(fromX, fromY, fromZ, toX, toY, toZ, color) {
    const cable = createPath([
      new THREE.Vector3(fromX, fromY, fromZ),
      new THREE.Vector3(toX, toY, toZ)
    ], color, 0.035);
    scene.add(cable.mesh);
    return cable;
  }

  function buildScene() {
    const floorMaps = KIT.floorMaps();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(64, 30),
      new THREE.MeshStandardMaterial({
        map: floorMaps.map,
        roughnessMap: floorMaps.roughnessMap,
        color: 0xd8e4f0,
        roughness: 0.52,
        metalness: 0.34,
        envMapIntensity: 0.9
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.005;
    floor.receiveShadow = true;
    scene.add(floor);

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(52, 0.3, 20),
      new THREE.MeshStandardMaterial({
        color: 0x24323f, roughness: 0.72, metalness: 0.22, envMapIntensity: 0.32
      })
    );
    platform.position.set(0, 0.15, -0.1);
    platform.receiveShadow = true;
    scene.add(platform);

    const stripMat = new THREE.MeshStandardMaterial({
      color: 0xe8c14a, emissive: 0x4a3a08, emissiveIntensity: 0.5, roughness: 0.6, metalness: 0.2
    });
    [9.9, -10.1].forEach(function (pz) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(51.6, 0.05, 0.12), stripMat);
      strip.position.set(0, 0.31, pz);
      scene.add(strip);
    });

    const backdrop = new THREE.Mesh(
      new THREE.BoxGeometry(36, 7, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0c151f, metalness: 0.3, roughness: 0.82 })
    );
    backdrop.position.set(0, 3.4, -7.1);
    backdrop.receiveShadow = true;
    scene.add(backdrop);

    const wallGlow = new THREE.Mesh(
      new THREE.BoxGeometry(32, 0.12, 0.1),
      new THREE.MeshStandardMaterial({
        color: COLORS.info,
        emissive: COLORS.info,
        emissiveIntensity: 0.32
      })
    );
    wallGlow.position.set(0, 5.8, -6.9);
    scene.add(wallGlow);

    [-4.4, -0.2, 2.0, 4.2].forEach(z => {
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(21.5, 0.55),
        new THREE.MeshStandardMaterial({
          color: 0x0c1a26,
          emissive: 0x0c1a26,
          emissiveIntensity: 0.7,
          transparent: true,
          opacity: 0.7
        })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(-0.2, 0.03, z);
      scene.add(glow);
    });

    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x1b2c3c,
      emissive: COLORS.info,
      emissiveIntensity: 0.28,
      metalness: 0.6,
      roughness: 0.4
    });
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x26394b,
      metalness: 0.6,
      roughness: 0.45
    });
    const mainsFeeders = [
      { z: -5.4, label: '市电 1', busX: -11.0 },
      { z: -2.9, label: '市电 2', busX: -8.2 }
    ];
    mainsFeeders.forEach((feeder, index) => {
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 4.6, 20), pylonMat);
      pylon.position.set(-15.5, 2.3, feeder.z);
      pylon.castShadow = true;
      scene.add(pylon);
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.72, 0.16, 24),
        new THREE.MeshStandardMaterial({ color: COLORS.info, emissive: COLORS.info, emissiveIntensity: 1.2 })
      );
      ring.position.set(-15.5, 3.4, feeder.z);
      scene.add(ring);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.12), armMat);
      arm.position.set(-15.5, 3.7, feeder.z);
      scene.add(arm);
      const insulator = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x8fa2b8, roughness: 0.5 })
      );
      insulator.position.set(-15.5, 3.86, feeder.z);
      scene.add(insulator);
      const cable = createPath([
        new THREE.Vector3(-15.5, 3.2, feeder.z),
        new THREE.Vector3(-14.9, 3.0, feeder.z + (index === 0 ? 0.35 : -0.35)),
        new THREE.Vector3(-14.4, 5.7, feeder.z),
        new THREE.Vector3(feeder.busX, 5.7, -2.2)
      ], 0x2b3f52, 0.03);
      scene.add(cable.mesh);
      const label = makeLabel(feeder.label, 2.2);
      label.position.set(-15.5, 5.4, feeder.z);
      scene.add(label);
    });

    const busBody = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.28, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x223445, metalness: 0.5, roughness: 0.5 })
    );
    busBody.position.set(1.6, 5.6, -2.2);
    busBody.castShadow = true;
    busBody.receiveShadow = true;
    scene.add(busBody);

    mainBusMat = new THREE.MeshStandardMaterial({
      color: COLORS.ok,
      emissive: COLORS.ok,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.85
    });
    const busGlow = new THREE.Mesh(new THREE.BoxGeometry(27, 0.08, 0.22), mainBusMat);
    busGlow.position.set(1.6, 5.67, -2.2);
    scene.add(busGlow);

    const postMat = new THREE.MeshStandardMaterial({
      color: 0x243747,
      metalness: 0.6,
      roughness: 0.45
    });
    for (let x = -11; x <= 14.2; x += 2.8) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.4, 0.12), postMat);
      post.position.set(x, 2.7, -2.2);
      scene.add(post);
    }

    const chevronMat = new THREE.MeshStandardMaterial({
      color: COLORS.ok,
      emissive: COLORS.ok,
      emissiveIntensity: 0.7
    });
    for (let x = -11; x <= 14.2; x += 2.8) {
      const chevron = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 10), chevronMat);
      chevron.position.set(x, 5.77, -2.2);
      chevron.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
      scene.add(chevron);
      busChevrons.push(chevron);
    }

    const busLabel = makeLabel('ATS 双路切换母线', 3.2);
    busLabel.position.set(1.6, 6.3, -2.2);
    scene.add(busLabel);

    createCabinet({
      x: -11.4,
      y: 0.8,
      z: -2.2,
      w: 1.8,
      h: 1.6,
      d: 1.0,
      label: '三相ATS/STS',
      kind: 'ats'
    });

    ROUTES.forEach((route, index) => {
      const tx = transformerX(index);
      createTransformer({
        x: tx,
        z: -4.4,
        label: `${route.code} · 变压器`,
        routeId: route.id,
        name: `${index + 1}# 油浸式变压器`,
        model: `${route.code} · 10kV/0.4kV`
      });
      createCabinet({
        x: tx + 0.55,
        z: -0.2,
        label: `${index + 1}#UPS · 三相UPS`,
        routeId: route.id,
        kind: 'ups'
      });
      createCabinet({
        x: tx - 0.55,
        z: 2.0,
        label: `低压配电柜 ${index + 1}`,
        routeId: route.id,
        kind: 'output'
      });
      createLoadBlock({
        x: tx,
        z: 4.2,
        label: `交流PDU ${index + 1}`,
        routeId: route.id
      });
    });

    // 东、西两个电池间，各布置 3 组铅酸阀控蓄电池组
    const BATTERY_ROOMS = [
      { x: 22.0, z: 5.0, title: '东电池间', caption: '东侧电池组区' },
      { x: -22.0, z: 5.0, title: '西电池间', caption: '西侧电池组区' }
    ];
    BATTERY_ROOMS.forEach((room, roomIndex) => {
      [-1.4, 0, 1.4].forEach((offset, index) => {
        createBatteryBank({
          x: room.x + offset,
          z: room.z,
          label: `铅酸阀控蓄电池组 ${roomIndex * 3 + index + 1}（${room.title}）`
        });
      });
    });

    [-4.4, -0.2, 2.0, 4.2].forEach(z => {
      addCableTray(z, -12.2, 13.5);
    });
    addCableTray(5.0, 19.5, 24.5);
    addCableTray(5.0, -24.5, -19.5);

    ROUTES.forEach((route, index) => {
      const tx = transformerX(index);
      const upsX = tx + 0.55;
      const outX = tx - 0.55;
      addCableDrop(tx, 5.88, -4.4, tx, 2.25, -4.4, 0x2a4256);
      addCableDrop(upsX, 5.88, -0.2, upsX, 2.62, -0.2, 0x2a4256);
      addCableDrop(outX, 5.88, 2.0, outX, 2.62, 2.0, 0x2a4256);
      addCableDrop(tx, 5.88, 4.2, tx, 2.02, 4.2, 0x2a4256);
      addTopJunctionBox(upsX, 2.68, -0.2, COLORS.info);
      addTopJunctionBox(outX, 2.68, 2.0, COLORS.ok);
    });

    BATTERY_ROOMS.forEach(room => {
      [-1.4, 0, 1.4].forEach(offset => {
        const x = room.x + offset;
        addCableDrop(x, 5.88, room.z, x, 2.52, room.z, 0x2a4256);
      });
    });

    BATTERY_ROOMS.forEach(room => {
      const batteryCaption = makeLabel(room.caption, 2.8);
      batteryCaption.position.set(room.x, 3.5, room.z);
      scene.add(batteryCaption);
      createBatteryRoom(room.x, room.z, room.title);
    });

    const caption = makeLabel('1#-10# 变压器阵列', 3.2);
    caption.position.set(-10.3, 3.5, -4.4);
    scene.add(caption);
    const caption2 = makeLabel('UPS 主机 / 输出柜 / 末端负载', 4.6);
    caption2.position.set(-2.2, 3.5, 1.6);
    scene.add(caption2);

    selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.18, 48),
      new THREE.MeshBasicMaterial({
        color: COLORS.info,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
    );
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.position.y = 0.12;
    selectionRing.visible = false;
    scene.add(selectionRing);

    selectionBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.95, 6.4, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: COLORS.info,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    selectionBeam.position.y = 3.2;
    selectionBeam.visible = false;
    scene.add(selectionBeam);

    selectionMarker = makeLabel('当前选中', 2.2);
    selectionMarker.position.y = 2.9;
    selectionMarker.visible = false;
    scene.add(selectionMarker);

    buildRoutePaths();
    buildBusParticles();
  }

  function resize() {
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 560;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1119, 34, 72);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    KIT.installEnvironment(renderer, scene);
    renderer.domElement.setAttribute('aria-label', '配电架构 3D 模拟实物展示');
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(44, 1, 0.1, 120);
    camera.position.set(4, 16.5, 32);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(1.5, 2.0, 0.3);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 9;
    controls.maxDistance = 100;
    controls.maxPolarAngle = 1.42;

    const hemi = new THREE.HemisphereLight(0xa8c4dd, 0x0a1119, 1.05);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xf4f8ff, 1.15);
    sun.position.set(14, 20, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 22;
    sun.shadow.camera.bottom = -22;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 80;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9dc4ff, 0.46);
    fill.position.set(-18, 14, -12);
    scene.add(fill);
    const blue = new THREE.PointLight(COLORS.info, 0.65, 34);
    blue.position.set(-10, 6, -4);
    scene.add(blue);
    const green = new THREE.PointLight(COLORS.ok, 0.55, 34);
    green.position.set(10, 6, 5);
    scene.add(green);
    const warm = new THREE.PointLight(COLORS.warn, 0.4, 26);
    warm.position.set(11, 5, 2);
    scene.add(warm);
    const rim = new THREE.PointLight(0x88b7ff, 0.38, 30);
    rim.position.set(-12, 5, 5);
    scene.add(rim);

    buildScene();

    raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let dragStart = null;
    renderer.domElement.addEventListener('pointerdown', event => {
      dragStart = [event.clientX, event.clientY];
    });
    renderer.domElement.addEventListener('pointerup', event => {
      if (!dragStart) return;
      const moved = Math.abs(event.clientX - dragStart[0]) + Math.abs(event.clientY - dragStart[1]) > 6;
      dragStart = null;
      if (moved) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (let i = 0; i < hits.length; i += 1) {
        const routeId = findRouteId(hits[i].object);
        if (routeId) {
          selectRouteById(routeId);
          break;
        }
      }
    });
    renderer.domElement.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      const hit = hits.find(item => findRouteId(item.object));
      const nextHover = hit ? findRouteId(hit.object) : null;
      if (nextHover !== hoveredId) {
        hoveredId = nextHover;
        refreshLabels();
      }
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    });
    renderer.domElement.addEventListener('pointerleave', () => {
      if (hoveredId) {
        hoveredId = null;
        refreshLabels();
      }
    });

    resize();
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(container);
    }
    window.addEventListener('resize', resize);
  }

  function findRouteId(object) {
    let node = object;
    while (node) {
      if (node.userData && node.userData.routeId) return node.userData.routeId;
      node = node.parent;
    }
    return null;
  }

  function refreshLabels() {
    cabinets.forEach(cabinet => {
      const sprite = cabinet.userData.labelSprite;
      if (!sprite) return;
      const id = cabinet.userData.routeId;
      const isHover = Boolean(hoveredId && id && id === hoveredId);
      const isSelected = Boolean(selectedRouteId && id === selectedRouteId && cabinet.userData.kind === 'transformer');
      sprite.visible = isHover || isSelected;
    });
  }

  function selectRouteById(id) {
    const route = ROUTES.find(item => item.id === String(id));
    if (!route) return;
    setRoute(route.id);
    if (typeof window.selectUpsRoute === 'function') window.selectUpsRoute(route);
  }

  function setRoute(id) {
    selectedRouteId = String(id);
    routePaths.forEach(item => {
      const active = item.id === selectedRouteId;
      item.group.visible = active;
      item.particles.forEach(particle => {
        particle.mesh.visible = active;
      });
    });
    cabinets.forEach(cabinet => {
      const active = cabinet.userData.routeId === selectedRouteId;
      if (cabinet.userData.plateMat) {
        cabinet.userData.plateMat.emissive.setHex(active ? COLORS.info : 0x000000);
        cabinet.userData.plateMat.emissiveIntensity = active ? 1.0 : 0.18;
      }
      if (cabinet.userData.bodyMat && cabinet.userData.kind === 'transformer') {
        cabinet.userData.bodyMat.emissive.setHex(active ? COLORS.info : 0x000000);
        cabinet.userData.bodyMat.emissiveIntensity = active ? 0.38 : 0;
      }
    });
    const routeIndex = ROUTES.findIndex(item => item.id === selectedRouteId);
    if (selectionRing && routeIndex >= 0) {
      const x = transformerX(routeIndex);
      selectionRing.position.x = x;
      selectionRing.position.z = -4.4;
      selectionRing.visible = true;
      selectionBeam.position.x = x;
      selectionBeam.position.z = -4.4;
      selectionBeam.visible = true;
      selectionMarker.position.x = x;
      selectionMarker.position.z = -4.4;
      selectionMarker.visible = true;
    }
    refreshLabels();
    const route = ROUTES.find(item => item.id === selectedRouteId) || ROUTES[0];
    if (hud.title) hud.title.textContent = route.title;
    if (hud.meta) hud.meta.textContent = route.path;
  }

  function update(state) {
    lastState = state;
    const flow = state.fault ? 'bad' : state.mainsOn ? 'ok' : 'warn';
    const color = COLORS[flow];

    if (mainBusMat) {
      mainBusMat.color.setHex(color);
      mainBusMat.emissive.setHex(color);
      mainBusMat.emissiveIntensity = state.fault ? 0.95 : 0.55;
    }
    mainBusParticles.forEach(particle => {
      particle.mesh.material.color.setHex(color);
      particle.mesh.material.emissive.setHex(color);
    });
    busChevrons.forEach(chevron => {
      chevron.material.color.setHex(color);
      chevron.material.emissive.setHex(color);
    });

    cabinets.forEach(cabinet => {
      const kind = cabinet.userData.kind;
      const ledMat = cabinet.userData.ledMat;
      const screenMat = cabinet.userData.screenMat;
      const loadMat = cabinet.userData.loadMat;
      if (!ledMat) return;

      let statusColor = color;
      if (kind === 'battery') {
        statusColor = state.lowBattery || !state.mainsOn ? COLORS.warn : COLORS.ok;
      }
      if (kind === 'ups' || kind === 'output' || kind === 'battery' || kind === 'load') {
        ledMat.color.setHex(statusColor);
        ledMat.emissive.setHex(statusColor);
        ledMat.emissiveIntensity = state.fault ? 1.35 : 0.95;
        if (screenMat) {
          screenMat.emissive.setHex(statusColor);
          screenMat.emissiveIntensity = 0.8;
        }
      }
      if (loadMat) {
        loadMat.color.setHex(statusColor);
        loadMat.emissive.setHex(statusColor);
        loadMat.emissiveIntensity = state.fault ? 1.0 : 0.6;
      }
    });

    routePaths.forEach(item => {
      const active = item.id === selectedRouteId;
      item.mainMat.color.setHex(color);
      item.mainMat.emissive.setHex(color);
      item.mainMat.emissiveIntensity = active ? 1.0 : 0.5;
      const batteryDischarge = !state.mainsOn || state.fault;
      const batteryColor = state.fault ? COLORS.bad : batteryDischarge ? COLORS.warn : COLORS.info;
      item.battery.mesh.visible = active;
      if (active) {
        item.batteryMat.color.setHex(batteryColor);
        item.batteryMat.emissive.setHex(batteryColor);
        item.batteryMat.emissiveIntensity = batteryDischarge ? 0.85 : 0.45;
      }
      item.batteryParticles.forEach(particle => {
        particle.mesh.visible = active;
        particle.reversed = !batteryDischarge;
        if (active) {
          particle.mesh.material.color.setHex(batteryColor);
          particle.mesh.material.emissive.setHex(batteryColor);
        }
      });
      item.particles.forEach(particle => {
        if (particle.mesh.visible) {
          particle.mesh.material.color.setHex(color);
          particle.mesh.material.emissive.setHex(color);
        }
      });
    });

    if (hud.status) {
      const label = state.fault ? '故障旁路' : state.mainsOn ? '在线供电' : '电池供电';
      hud.status.textContent = `${label} · 电池 ${Math.round(state.battery)}%${state.dataSource ? ' · ' + state.dataSource : ''}`;
      hud.status.style.borderColor = state.fault
        ? 'rgba(255, 99, 99, 0.4)'
        : state.mainsOn
          ? 'rgba(73, 209, 125, 0.4)'
          : 'rgba(242, 184, 76, 0.4)';
      hud.status.style.color = state.fault ? '#fecaca' : state.mainsOn ? '#bbf7d0' : '#fde68a';
      hud.status.style.background = state.fault
        ? 'rgba(255, 99, 99, 0.14)'
        : state.mainsOn
          ? 'rgba(73, 209, 125, 0.12)'
          : 'rgba(242, 184, 76, 0.12)';
    }
  }

  function screenPoints() {
    const rect = renderer.domElement.getBoundingClientRect();
    const points = [];
    cabinets.forEach(cabinet => {
      const world = new THREE.Vector3();
      cabinet.getWorldPosition(world);
      const ndc = world.clone().project(camera);
      points.push({
        label: cabinet.userData.label,
        routeId: cabinet.userData.routeId,
        x: (ndc.x * 0.5 + 0.5) * rect.width,
        y: (-ndc.y * 0.5 + 0.5) * rect.height
      });
    });
    return points;
  }

  function getSelection() {
    return {
      id: selectedRouteId,
      x: selectionRing ? selectionRing.position.x : null,
      visible: selectionRing ? selectionRing.visible : false
    };
  }

  function drawHmiScreens() {
    const state = lastState;
    const statusText = state.fault ? 'FAULT' : state.mainsOn ? 'ONLINE' : 'BATTERY';
    const statusColor = state.fault ? '#ff6363' : state.mainsOn ? '#49d17d' : '#f2b84c';
    hmiScreens.forEach(item => {
      const ctx = item.ctx;
      ctx.clearRect(0, 0, 256, 96);
      ctx.fillStyle = '#071019';
      ctx.fillRect(0, 0, 256, 96);
      ctx.strokeStyle = 'rgba(99, 179, 255, 0.45)';
      ctx.lineWidth = 3;
      ctx.strokeRect(3, 3, 250, 90);
      ctx.fillStyle = '#e8eef7';
      ctx.font = '700 23px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label.slice(0, 14), 14, 30);
      ctx.fillStyle = statusColor;
      ctx.font = '700 17px Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(statusText, 244, 30);
      ctx.fillStyle = '#8fa2b8';
      ctx.font = '15px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`BAT ${Math.round(state.battery)}%`, 14, 58);
      ctx.fillText(`LOAD ${Math.round(state.load || 32)}%`, 14, 80);
      ctx.fillStyle = '#14212d';
      ctx.fillRect(150, 47, 92, 9);
      ctx.fillStyle = statusColor;
      ctx.fillRect(150, 47, Math.max(8, 92 * Math.min(1, state.battery / 100)), 9);
      ctx.fillStyle = '#14212d';
      ctx.fillRect(150, 68, 92, 9);
      ctx.fillStyle = '#63b3ff';
      ctx.fillRect(150, 68, Math.max(8, 92 * Math.min(1, (state.load || 32) / 100)), 9);
      item.texture.needsUpdate = true;
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    controls.update();

    routePaths.forEach(item => {
      item.particles.forEach(particle => {
        if (!particle.mesh.visible) return;
        moveArrow(particle, time);
      });
      item.batteryParticles.forEach(particle => {
        if (!particle.mesh.visible) return;
        moveArrow(particle, time);
      });
    });
    mainBusParticles.forEach(particle => {
      moveArrow(particle, time);
    });
    fans.forEach(fan => {
      fan.rotation.y += fan.userData.speed * 0.016;
    });
    cabinets.forEach(cabinet => {
      if (cabinet.userData.ledMat) {
        const base = lastState.fault ? 1.35 : 0.95;
        cabinet.userData.ledMat.emissiveIntensity = base + Math.sin(time * 3.2 + (cabinet.userData.label || '').length) * 0.22;
      }
    });
    const tick = Math.floor(time * 4);
    if (tick !== lastHmiTick) {
      lastHmiTick = tick;
      drawHmiScreens();
    }
    if (selectionRing && selectionRing.visible) {
      const pulse = 1 + Math.sin(time * 2.4) * 0.07;
      selectionRing.scale.set(pulse, pulse, 1);
      selectionRing.material.opacity = 0.7 + Math.sin(time * 2.4) * 0.22;
      selectionBeam.material.opacity = 0.1 + Math.sin(time * 1.8) * 0.035;
    }

    renderer.render(scene, camera);
  }

  function moveArrow(particle, time) {
    const raw = (time * particle.speed + particle.offset) % 1;
    const progress = particle.reversed ? 1 - raw : raw;
    particle.curve.getPointAt(progress, particle.mesh.position);
    const tangent = particle.curve.getTangentAt(progress);
    if (particle.reversed) tangent.negate();
    particle.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  }

  init();
  setRoute('1');
  update({ mainsOn: true, fault: false, lowBattery: false, battery: 96 });
  window.UPS3D = { setRoute, update, screenPoints, getSelection };
  animate();
})();
