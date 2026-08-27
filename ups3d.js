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
    const geometry = new THREE.TubeGeometry(curve, 48, width || 0.1, 8, false);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.9
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
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 10), material);
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

  function createCabinet(options) {
    const group = new THREE.Group();
    const w = options.w || 1.7;
    const h = options.h || 2.5;
    const d = options.d || 1.05;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: COLORS.steel,
      metalness: 0.72,
      roughness: 0.32
    });
    const darkMetal = new THREE.MeshStandardMaterial({
      color: COLORS.steelDark,
      metalness: 0.62,
      roughness: 0.52
    });
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x101a24,
      metalness: 0.5,
      roughness: 0.58
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const capMat = new THREE.MeshStandardMaterial({
      color: 0x243747,
      metalness: 0.6,
      roughness: 0.42
    });
    const capW = 0.08;
    [-w / 2 + capW / 2, w / 2 - capW / 2].forEach(x => {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(capW, h, d), capMat);
      cap.position.x = x;
      group.add(cap);
    });

    const doorH = h * 0.72;
    const doorW = w * 0.43;
    const doorZ = d / 2 + 0.035;
    [-1, 1].forEach(side => {
      const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.05), panelMat);
      door.position.set(side * w * 0.23, -h * 0.05, doorZ);
      group.add(door);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.05), darkMetal);
      handle.position.set(side * w * 0.42, -h * 0.02, doorZ + 0.04);
      group.add(handle);
    });

    const ventMat = new THREE.MeshStandardMaterial({
      color: 0x0b1118,
      metalness: 0.3,
      roughness: 0.85
    });
    for (let i = 0; i < 5; i += 1) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 0.045, 0.02), ventMat);
      vent.position.set(0, -h * 0.3 + i * 0.11, doorZ + 0.04);
      group.add(vent);
    }

    const screen = createHmiScreen(group, {
      w,
      h,
      d,
      label: options.label || 'UPS'
    });
    const screenMat = screen.material;

    const ledMat = new THREE.MeshStandardMaterial({
      color: COLORS.ok,
      emissive: COLORS.ok,
      emissiveIntensity: 1.1
    });
    [-1, 0, 1].forEach(offset => {
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), ledMat);
      led.position.set(offset * 0.17, h * 0.4, d / 2 + 0.11);
      group.add(led);
    });

    const stripMat = new THREE.MeshStandardMaterial({
      color: 0x2b3f52,
      emissive: 0x2b3f52,
      emissiveIntensity: 0.3
    });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.04, 0.3), stripMat);
    strip.position.set(0, h / 2 + 0.08, 0);
    group.add(strip);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.06, d + 0.08), darkMetal);
    roof.position.y = h / 2 + 0.02;
    group.add(roof);

    const footGapX = w / 2 - 0.12;
    const footGapZ = d / 2 - 0.14;
    [[-footGapX, -footGapZ], [footGapX, -footGapZ], [-footGapX, footGapZ], [footGapX, footGapZ]].forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.16), darkMetal);
      foot.position.set(fx, -h / 2 - 0.05, fz);
      group.add(foot);
    });

    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x223445,
      emissive: 0x000000,
      emissiveIntensity: 0.2
    });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(w + 0.26, 0.08, d + 0.3), plateMat);
    plate.position.set(0, -h / 2 - 0.1, 0);
    plate.receiveShadow = true;
    group.add(plate);

    if (options.kind === 'ups') {
      const conduitMat = new THREE.MeshStandardMaterial({
        color: 0x31465a,
        metalness: 0.7,
        roughness: 0.35
      });
      [-0.42, 0.42].forEach((offset, index) => {
        const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.24, 12), conduitMat);
        conduit.position.set(offset, h / 2 + 0.14, index === 0 ? -0.45 : 0.45);
        group.add(conduit);
        const tip = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.08, 0.08, 10),
          new THREE.MeshStandardMaterial({
            color: index === 0 ? COLORS.info : COLORS.ok,
            emissive: index === 0 ? COLORS.info : COLORS.ok,
            emissiveIntensity: 0.9
          })
        );
        tip.position.set(offset, h / 2 + 0.3, index === 0 ? -0.45 : 0.45);
        group.add(tip);
      });
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
      bodyMat,
      ledMat,
      screenMat,
      plateMat,
      labelSprite: label
    };

    if (options.kind === 'ups') {
      createCoolingFan(group, 0, h / 2 + 0.18, -d * 0.32, 0.22, 2.2);
      createCoolingFan(group, 0, h / 2 + 0.18, d * 0.32, 0.22, 2.2);
    }
    group.traverse(object => {
      if (object.isMesh) object.userData.cabinet = group;
    });

    cabinets.push(group);
    scene.add(group);
    return group;
  }

  function buildScene() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 22),
      new THREE.MeshStandardMaterial({ color: 0x0a1119, roughness: 0.92, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(32, 32, 0x2b3d50, 0x182330);
    grid.position.y = 0.02;
    scene.add(grid);

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.28, 17.5),
      new THREE.MeshStandardMaterial({ color: 0x141f2b, roughness: 0.62, metalness: 0.35 })
    );
    platform.position.set(0, 0.14, 0);
    platform.receiveShadow = true;
    scene.add(platform);

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
        label: `${device.name} · ${device.model || 'UPS5000E'}`,
        deviceId: device.id,
        kind: 'ups'
      });
    });

    const busY = 8.1;
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0x1a2632,
      metalness: 0.65,
      roughness: 0.4
    });
    const supportMat = new THREE.MeshStandardMaterial({
      color: 0x243747,
      metalness: 0.6,
      roughness: 0.45
    });
    const chevronXs = [-9, -6, -3, 0, 3, 6, 9];

    for (let row = 0; row < FLEET_ROWS; row += 1) {
      const rowZ = -7.2 + row * 2.4;
      const inputBus = createPath([
        new THREE.Vector3(-8.6, busY, rowZ - 0.45),
        new THREE.Vector3(8.6, busY, rowZ - 0.45)
      ], 0.16, COLORS.info);
      scene.add(inputBus.mesh);
      addFlowArrows(inputBus.curve, 8, COLORS.info);

      const outputBus = createPath([
        new THREE.Vector3(-8.6, busY, rowZ + 0.45),
        new THREE.Vector3(8.6, busY, rowZ + 0.45)
      ], 0.16, COLORS.ok);
      scene.add(outputBus.mesh);
      addFlowArrows(outputBus.curve, 8, COLORS.ok);

      chevronXs.forEach(x => {
        const chevron = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.42, 10),
          new THREE.MeshStandardMaterial({ color: COLORS.info, emissive: COLORS.info, emissiveIntensity: 0.7 })
        );
        chevron.position.set(x, busY + 0.18, rowZ - 0.45);
        chevron.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
        scene.add(chevron);
        chevrons.push(chevron);
        const chevronOut = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.42, 10),
          new THREE.MeshStandardMaterial({ color: COLORS.ok, emissive: COLORS.ok, emissiveIntensity: 0.7 })
        );
        chevronOut.position.set(x, busY + 0.18, rowZ + 0.45);
        chevronOut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
        scene.add(chevronOut);
        chevrons.push(chevronOut);
      });

      const tray = new THREE.Mesh(new THREE.BoxGeometry(21, 0.14, 1.5), trayMat);
      tray.position.set(0, 8.4, rowZ);
      tray.castShadow = true;
      scene.add(tray);
      [-8, 0, 8].forEach(x => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 8.3, 0.14), supportMat);
        post.position.set(x, 4.15, rowZ);
        scene.add(post);
      });
    }

    DEVICES.forEach((device, index) => {
      const pos = devicePosition(index);
      const rowZ = -7.2 + Math.floor(index / FLEET_COLS) * 2.4;
      const inputFeeder = createPath([
        new THREE.Vector3(pos.x - 0.42, busY, rowZ - 0.45),
        new THREE.Vector3(pos.x - 0.42, 2.55, rowZ - 0.45)
      ], 0.09, COLORS.info);
      scene.add(inputFeeder.mesh);
      addFlowArrows(inputFeeder.curve, 2, COLORS.info);

      const outputFeeder = createPath([
        new THREE.Vector3(pos.x + 0.42, 2.55, rowZ + 0.45),
        new THREE.Vector3(pos.x + 0.42, busY, rowZ + 0.45)
      ], 0.09, COLORS.ok);
      scene.add(outputFeeder.mesh);
      addFlowArrows(outputFeeder.curve, 2, COLORS.ok);
    });

    const inLabel = makeLabel('进电输入', 2.2);
    inLabel.position.set(-13.8, 9.4, -7.65);
    scene.add(inLabel);
    const outLabel = makeLabel('输出负载', 2.2);
    outLabel.position.set(-13.8, 9.4, 7.65);
    scene.add(outLabel);

    const caption = makeLabel('全站 UPS 实物阵列 · 46 台', 5);
    caption.position.set(0, 6.4, 0);
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
      hud.title.textContent = `华为 ${device.name}（${device.model || 'UPS5000E'}）`;
      hud.meta.textContent = `${device.transformer} / ${device.model || 'UPS5000E'} / 输入 ${device.input} / 输出 ${device.output}`;
      updateStatusText(lastState);
    }
  }

  function updateStatusText(state) {
    if (!hud.status) return;
    const label = state.fault ? '故障旁路' : state.mainsOn ? '在线供电' : '电池供电';
    hud.status.textContent = `${label} · 电池 ${Math.round(state.battery)}%`;
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
      mat.emissiveIntensity = state.fault ? 0.9 : 0.5;
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
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute('aria-label', '全站 UPS 实物阵列 3D 展示');
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 20, 30);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2.5, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 14;
    controls.maxDistance = 90;
    controls.maxPolarAngle = 1.4;

    const hemi = new THREE.HemisphereLight(0x9ab8d6, 0x0a1119, 1.0);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(7, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);
    const green = new THREE.PointLight(COLORS.ok, 0.6, 24);
    green.position.set(5, 5, 4);
    scene.add(green);
    const blue = new THREE.PointLight(COLORS.info, 0.5, 22);
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
