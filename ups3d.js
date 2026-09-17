(function () {
  'use strict';

  const container = document.getElementById('ups3dContainer');
  if (!container) return;

  const hud = {
    title: document.getElementById('ups3dHudTitle'),
    meta: document.getElementById('ups3dHudMeta'),
    status: document.getElementById('ups3dHudStatus')
  };

  const DEVICES = Array.isArray(window.upsMonitorDevices) ? window.upsMonitorDevices : [];
  if (!DEVICES.length || !window.THREE) {
    container.innerHTML = '<div class="power3d-fallback">3D 场景加载失败</div>';
    return;
  }

  const COLORS = {
    ok: 0x49d17d,
    warn: 0xf2b84c,
    bad: 0xff6363,
    info: 0x63b3ff,
    steel: 0x1c2a38,
    steelDark: 0x0e1720
  };

  let scene;
  let camera;
  let renderer;
  let controls;
  let raycaster;
  let selectionRing;
  let selectionBeam;
  let selectionMarker;
  let selectedDeviceId = null;
  let hoveredDeviceId = null;
  let lastState = { mainsOn: true, fault: false, lowBattery: false, battery: 96 };
  const cabinets = [];
  const flowMats = [];
  const chevrons = [];
  const flowParticles = [];
  const fans = [];
  const hmiScreens = [];
  let lastHmiTick = -1;
  const FLEET_COLS = 7;
  const FLEET_ROWS = 7;

  function devicePosition(index) {
    const col = index % FLEET_COLS;
    const row = Math.floor(index / FLEET_COLS);
    return {
      x: -9 + col * 3.0,
      z: -7.2 + row * 2.4
    };
  }

  function createPath(points, width, color) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 48, width || 0.05, 8, false);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      envMapIntensity: 0.2,
      transparent: true,
      opacity: 0.86
    });
    const mesh = new THREE.Mesh(geometry, material);
    flowMats.push(material);
    return { mesh, curve, material };
  }

  function addFlowArrows(curve, count, color) {
    for (let i = 0; i < count; i += 1) {
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.5
      });
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 10), material);
      scene.add(arrow);
      flowParticles.push({
        mesh: arrow,
        curve,
        offset: i / count,
        speed: 0.055 + (i % 3) * 0.01
      });
    }
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
    const width = scale || Math.max(2.2, text.length * 0.34);
    sprite.scale.set(width, width * 0.25, 1);
    return sprite;
  }

  const KIT = window.UPS3DKit;

  /* ---------------------------------------------------------------
   * 共享材质：不随运行状态变化的细节零件，全部复用同一批实例
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
      screenDark: new THREE.MeshPhysicalMaterial({
        color: 0x0a1218, metalness: 0.1, roughness: 0.14,
        clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.9
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
   * 冷却风扇：叶片 + 轮毂合并为一个网格，整体绕中轴旋转
   * --------------------------------------------------------------- */
  function createCoolingFan(group, x, y, z, radius, speed) {
    const builder = new KIT.Builder();
    const blades = 7;
    for (let i = 0; i < blades; i += 1) {
      const angle = (i / blades) * Math.PI * 2;
      builder.box(
        'blade',
        Math.cos(angle) * radius * 0.55, 0, Math.sin(angle) * radius * 0.55,
        radius * 0.72, 0.016, radius * 0.34,
        [0, -angle, 0.38]
      );
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

  /* ---------------------------------------------------------------
   * 柜门触摸屏：带边框、玻璃反光与实时状态画面
   * --------------------------------------------------------------- */
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

    hmiScreens.push({
      canvas,
      ctx,
      texture,
      mat,
      label: options.label || 'UPS'
    });
    return screen;
  }

  /* ---------------------------------------------------------------
   * 机柜几何：一次性构建后按尺寸缓存，46 台共用同一批几何数据
   * --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
   * UPS 机柜实例：几何共享，仅油漆面 / 指示灯 / 屏幕 / 底板独立
   * --------------------------------------------------------------- */
  function createCabinet(options) {
    const w = options.w || 1.7;
    const h = options.h || 2.5;
    const d = options.d || 1.05;
    const group = new THREE.Group();
    const mats = materials();

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x46586a,
      metalness: 0.45,
      roughness: 0.74,
      roughnessMap: KIT.brushedRoughness(),
      clearcoat: 0.45,
      clearcoatRoughness: 0.28,
      envMapIntensity: 1.05,
      emissive: 0x000000,
      emissiveIntensity: 0
    });
    const ledMat = new THREE.MeshStandardMaterial({
      color: COLORS.ok, emissive: COLORS.ok, emissiveIntensity: 1.2, roughness: 0.3, metalness: 0.2
    });
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1b2836, emissive: 0x000000, emissiveIntensity: 0, metalness: 0.55, roughness: 0.5
    });

    const parts = KIT.cabinetGeometry(w, h, d, { hmi: true, fans: true, doorStyle: 'double' });
    const perInstance = { paint: bodyMat, led: ledMat, plate: plateMat };
    Object.keys(parts).forEach(function (key) {
      const material = perInstance[key] || mats[key];
      if (!material) return;
      const mesh = new THREE.Mesh(parts[key], material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    const screen = createHmiScreen(group, {
      w: w,
      label: options.label || 'UPS',
      screenY: h * 0.3,
      screenZ: d / 2 + 0.079
    });

    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.34, w * 0.34 * 0.44),
      plateMaterial(options.plateTitle || 'UPS5000E', options.plateSubtitle || '华为 三相 UPS', '#63b3ff')
    );
    plate.position.set(-w * 0.02, h * 0.12, d / 2 + 0.078);
    group.add(plate);

    addContactShadow(group, w + 1.0, d + 1.0, -h / 2 - 0.14);

    if (options.kind !== 'noscreen') {
      createCoolingFan(group, -w * 0.26, h / 2 + 0.16, 0, 0.23, 2.2);
      createCoolingFan(group, w * 0.26, h / 2 + 0.16, 0, 0.23, 2.2);
    }

    group.position.set(options.x, h / 2, options.z);
    const label = makeLabel(options.label || '');
    label.position.set(0, h / 2 + 0.62, 0);
    label.userData.cabinet = group;
    label.visible = false;
    group.add(label);

    group.userData = {
      deviceId: options.deviceId || null,
      kind: 'ups',
      label: options.label || '',
      bodyMat: bodyMat,
      ledMat: ledMat,
      screenMat: screen.material,
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

  function buildScene() {
    const floorMaps = KIT.floorMaps();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 26),
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
      new THREE.BoxGeometry(22, 0.3, 17.6),
      new THREE.MeshStandardMaterial({
        color: 0x24323f, roughness: 0.66, metalness: 0.32, envMapIntensity: 0.5
      })
    );
    platform.position.set(0, 0.15, 0);
    platform.receiveShadow = true;
    platform.castShadow = true;
    scene.add(platform);

    // 平台边缘的金属压条与黄色安全警示带
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x9fb0c0, metalness: 0.92, roughness: 0.3, envMapIntensity: 1.2
    });
    const stripMat = new THREE.MeshStandardMaterial({
      color: 0xe8c14a, emissive: 0x4a3a08, emissiveIntensity: 0.5, roughness: 0.6, metalness: 0.2
    });
    [[0, -8.72, 21.6, 0.12], [0, 8.72, 21.6, 0.12]].forEach(function (row) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(row[2], 0.05, row[3]), stripMat);
      strip.position.set(row[0], 0.31, row[1]);
      scene.add(strip);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(22.1, 0.06, 0.1), trimMat);
      trim.position.set(row[0], 0.3, row[1] + (row[1] > 0 ? 0.06 : -0.06));
      scene.add(trim);
    });

    // 顶部工业灯带：为机柜提供真实的高光条
    const lampHouseMat = new THREE.MeshStandardMaterial({
      color: 0x222d38, metalness: 0.6, roughness: 0.5, envMapIntensity: 0.5
    });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xdcefff, emissiveIntensity: 1.35, roughness: 0.2
    });
    for (let row = 0; row < FLEET_ROWS; row += 1) {
      const rowZ = -7.2 + row * 2.4;
      [-6.5, 0, 6.5].forEach(function (lx) {
        const house = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.34), lampHouseMat);
        house.position.set(lx, 11.6, rowZ);
        scene.add(house);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.035, 0.24), lampMat);
        panel.position.set(lx, 11.54, rowZ);
        scene.add(panel);
        const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04), lampHouseMat);
        hanger.position.set(lx, 11.9, rowZ);
        scene.add(hanger);
      });
    }

    const aisle = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 13.5),
      new THREE.MeshStandardMaterial({
        color: 0x0c1a26,
        emissive: 0x0c1a26,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.8
      })
    );
    aisle.rotation.x = -Math.PI / 2;
    aisle.position.set(0, 0.03, 0);
    scene.add(aisle);

    DEVICES.forEach((device, index) => {
      const pos = devicePosition(index);
      createCabinet({
        x: pos.x,
        z: pos.z,
        w: 2.0,
        h: 2.8,
        d: 1.1,
        label: `${device.name} · 三相UPS · ${device.model || 'UPS5000E'}`,
        deviceId: device.id,
        kind: 'ups'
      });
    });

    const busY = 4.9;
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0x141d26, metalness: 0.5, roughness: 0.66, envMapIntensity: 0.45
    });
    const supportMat = new THREE.MeshStandardMaterial({
      color: 0x1b2733, metalness: 0.55, roughness: 0.62, envMapIntensity: 0.5
    });
    const chevronXs = [-9, -6, -3, 0, 3, 6, 9];

    for (let row = 0; row < FLEET_ROWS; row += 1) {
      const rowZ = -7.2 + row * 2.4;
      const inputBus = createPath([
        new THREE.Vector3(-8.6, busY, rowZ - 0.45),
        new THREE.Vector3(8.6, busY, rowZ - 0.45)
      ], 0.055, COLORS.info);
      scene.add(inputBus.mesh);
      addFlowArrows(inputBus.curve, 8, COLORS.info);

      const outputBus = createPath([
        new THREE.Vector3(-8.6, busY, rowZ + 0.45),
        new THREE.Vector3(8.6, busY, rowZ + 0.45)
      ], 0.055, COLORS.ok);
      scene.add(outputBus.mesh);
      addFlowArrows(outputBus.curve, 8, COLORS.ok);

      chevronXs.forEach(x => {
        const chevron = new THREE.Mesh(
          new THREE.ConeGeometry(0.1, 0.25, 10),
          new THREE.MeshStandardMaterial({ color: COLORS.info, emissive: COLORS.info, emissiveIntensity: 0.7 })
        );
        chevron.position.set(x, busY + 0.18, rowZ - 0.45);
        chevron.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
        scene.add(chevron);
        chevrons.push(chevron);
        const chevronOut = new THREE.Mesh(
          new THREE.ConeGeometry(0.1, 0.25, 10),
          new THREE.MeshStandardMaterial({ color: COLORS.ok, emissive: COLORS.ok, emissiveIntensity: 0.7 })
        );
        chevronOut.position.set(x, busY + 0.18, rowZ + 0.45);
        chevronOut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
        scene.add(chevronOut);
        chevrons.push(chevronOut);
      });

      const trayBuilder = new KIT.Builder();
      [-0.74, 0.74].forEach(function (oz) {
        trayBuilder.box('tray', 0, 5.12, rowZ + oz, 21, 0.14, 0.07);
        trayBuilder.box('tray', 0, 5.19, rowZ + oz, 21, 0.05, 0.02);
      });
      for (let rx = -10.2; rx <= 10.21; rx += 0.62) {
        trayBuilder.box('tray', rx, 5.1, rowZ, 0.06, 0.045, 1.42);
      }
      [-8, 0, 8].forEach(function (x) {
        trayBuilder.box('support', x, 2.5, rowZ, 0.11, 5.0, 0.11);
        trayBuilder.box('support', x, 5.02, rowZ, 1.86, 0.07, 0.1);
      });
      const trayParts = trayBuilder.merge();
      Object.keys(trayParts).forEach(function (key) {
        const mesh = new THREE.Mesh(trayParts[key], key === 'tray' ? trayMat : supportMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
      });
    }

    DEVICES.forEach((device, index) => {
      const pos = devicePosition(index);
      const rowZ = -7.2 + Math.floor(index / FLEET_COLS) * 2.4;
      const inputFeeder = createPath([
        new THREE.Vector3(pos.x - 0.42, busY, rowZ - 0.45),
        new THREE.Vector3(pos.x - 0.42, 2.55, rowZ - 0.45)
      ], 0.03, COLORS.info);
      scene.add(inputFeeder.mesh);
      addFlowArrows(inputFeeder.curve, 2, COLORS.info);

      const outputFeeder = createPath([
        new THREE.Vector3(pos.x + 0.42, 2.55, rowZ + 0.45),
        new THREE.Vector3(pos.x + 0.42, busY, rowZ + 0.45)
      ], 0.03, COLORS.ok);
      scene.add(outputFeeder.mesh);
      addFlowArrows(outputFeeder.curve, 2, COLORS.ok);
    });

    const inLabel = makeLabel('进电输入', 2.2);
    inLabel.position.set(-12.6, 5.7, -7.65);
    scene.add(inLabel);
    const outLabel = makeLabel('输出负载', 2.2);
    outLabel.position.set(-12.6, 5.7, 7.65);
    scene.add(outLabel);

    const caption = makeLabel('全站 UPS 实物阵列 · 46 台', 5);
    caption.position.set(0, 6.9, 0);
    scene.add(caption);

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
      new THREE.CylinderGeometry(0.75, 0.95, 6.2, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: COLORS.info,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    selectionBeam.position.y = 3.1;
    selectionBeam.visible = false;
    scene.add(selectionBeam);

    selectionMarker = makeLabel('当前查看', 2.2);
    selectionMarker.position.y = 2.9;
    selectionMarker.visible = false;
    scene.add(selectionMarker);
  }

  function resize() {
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 460;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function findDeviceId(object) {
    let node = object;
    while (node) {
      if (node.userData && node.userData.deviceId) return node.userData.deviceId;
      node = node.parent;
    }
    return null;
  }

  function refreshLabels() {
    cabinets.forEach(cabinet => {
      const sprite = cabinet.userData.labelSprite;
      if (!sprite) return;
      const id = cabinet.userData.deviceId;
      const isHover = Boolean(hoveredDeviceId && id && id === hoveredDeviceId);
      const isSelected = Boolean(selectedDeviceId && id === selectedDeviceId);
      sprite.visible = isHover || isSelected;
    });
  }

  function selectDeviceById(id) {
    const device = DEVICES.find(item => item.id === String(id));
    if (!device) return;
    setDevice(device.id);
    if (typeof window.selectUpsDevice === 'function') window.selectUpsDevice(device);
  }

  function setDevice(id) {
    selectedDeviceId = String(id);
    cabinets.forEach(cabinet => {
      const active = cabinet.userData.deviceId === selectedDeviceId;
      if (cabinet.userData.plateMat) {
        cabinet.userData.plateMat.emissive.setHex(active ? COLORS.info : 0x000000);
        cabinet.userData.plateMat.emissiveIntensity = active ? 1.0 : 0.18;
      }
      if (cabinet.userData.bodyMat) {
        cabinet.userData.bodyMat.emissive.setHex(active ? COLORS.info : 0x000000);
        cabinet.userData.bodyMat.emissiveIntensity = active ? 0.38 : 0;
      }
    });

    const index = DEVICES.findIndex(item => item.id === selectedDeviceId);
    if (selectionRing && index >= 0) {
      const pos = devicePosition(index);
      selectionRing.position.x = pos.x;
      selectionRing.position.z = pos.z;
      selectionRing.visible = true;
      selectionBeam.position.x = pos.x;
      selectionBeam.position.z = pos.z;
      selectionBeam.visible = true;
      selectionMarker.position.x = pos.x;
      selectionMarker.position.z = pos.z;
      selectionMarker.visible = true;
    }
    refreshLabels();

    const device = DEVICES[index];
    if (device) {
      if (hud.title) hud.title.textContent = `华为 三相UPS · ${device.name}（${device.model || 'UPS5000E'}）`;
      if (hud.meta) hud.meta.textContent = `${device.transformer} / ${device.model || 'UPS5000E'} / 智航 ${device.stdModel ? device.stdModel.refId : '1.1.5.2'} / 输入 ${device.input} / 输出 ${device.output}`;
      updateStatusText(lastState);
    }
  }

  function updateStatusText(state) {
    if (!hud.status) return;
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

  function update(state) {
    lastState = state;
    const flow = state.fault ? 'bad' : state.mainsOn ? 'ok' : 'warn';
    const color = COLORS[flow];
    cabinets.forEach(cabinet => {
      const ledMat = cabinet.userData.ledMat;
      const screenMat = cabinet.userData.screenMat;
      if (!ledMat) return;
      ledMat.color.setHex(color);
      ledMat.emissive.setHex(color);
      ledMat.emissiveIntensity = state.fault ? 1.35 : 0.95;
      if (screenMat) {
        screenMat.emissive.setHex(color);
        screenMat.emissiveIntensity = 0.8;
      }
    });
    flowMats.forEach(mat => {
      mat.color.setHex(color);
      mat.emissive.setHex(color);
      mat.emissiveIntensity = state.fault ? 0.62 : 0.34;
    });
    chevrons.forEach(chevron => {
      chevron.material.color.setHex(color);
      chevron.material.emissive.setHex(color);
    });
    flowParticles.forEach(particle => {
      particle.mesh.material.color.setHex(color);
      particle.mesh.material.emissive.setHex(color);
    });
    updateStatusText(state);
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

  function getSelection() {
    return {
      id: selectedDeviceId,
      x: selectionRing ? selectionRing.position.x : null,
      visible: selectionRing ? selectionRing.visible : false
    };
  }

  function screenPoints() {
    const rect = renderer.domElement.getBoundingClientRect();
    return cabinets.map(cabinet => {
      const world = new THREE.Vector3();
      cabinet.getWorldPosition(world);
      const ndc = world.clone().project(camera);
      return {
        label: cabinet.userData.label,
        deviceId: cabinet.userData.deviceId,
        x: (ndc.x * 0.5 + 0.5) * rect.width,
        y: (-ndc.y * 0.5 + 0.5) * rect.height
      };
    });
  }

  function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1119, 46, 88);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    KIT.installEnvironment(renderer, scene);
    renderer.domElement.setAttribute('aria-label', '全站 UPS 实物阵列 3D 展示');
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 9.6, 19.5);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2.3, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 12;
    controls.maxDistance = 80;
    controls.maxPolarAngle = 1.4;

    const hemi = new THREE.HemisphereLight(0xa8c4dd, 0x0a1119, 1.0);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xf4f8ff, 1.2);
    sun.position.set(11, 20, 13);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 62;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9dc4ff, 0.45);
    fill.position.set(-14, 12, -10);
    scene.add(fill);
    // 顶部灯带的实际照明（数量受控，避免影响帧率）
    [-6.5, 0, 6.5].forEach(function (lx) {
      const lamp = new THREE.PointLight(0xdcefff, 0.6, 26, 2);
      lamp.position.set(lx, 11.0, 0);
      scene.add(lamp);
    });
    const green = new THREE.PointLight(COLORS.ok, 0.4, 24);
    green.position.set(5, 5, 4);
    scene.add(green);
    const blue = new THREE.PointLight(COLORS.info, 0.35, 22);
    blue.position.set(-5, 5, -4);
    scene.add(blue);

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
        const deviceId = findDeviceId(hits[i].object);
        if (deviceId) {
          selectDeviceById(deviceId);
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
      const hit = hits.find(item => findDeviceId(item.object));
      const nextHover = hit ? findDeviceId(hit.object) : null;
      if (nextHover !== hoveredDeviceId) {
        hoveredDeviceId = nextHover;
        refreshLabels();
      }
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    });
    renderer.domElement.addEventListener('pointerleave', () => {
      if (hoveredDeviceId) {
        hoveredDeviceId = null;
        refreshLabels();
      }
    });

    resize();
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(container);
    }
    window.addEventListener('resize', resize);
  }

  function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    controls.update();
    flowParticles.forEach(particle => moveArrow(particle, time));
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
    const progress = (time * particle.speed + particle.offset) % 1;
    particle.curve.getPointAt(progress, particle.mesh.position);
    const tangent = particle.curve.getTangentAt(progress);
    particle.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  }

  init();
  update(lastState);
  window.UPSFleet3D = { setDevice, update, getSelection, screenPoints };
  animate();
})();
