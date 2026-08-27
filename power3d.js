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

    if (options.kind === 'ups' || options.kind === 'output') {
      const conduitMat = new THREE.MeshStandardMaterial({
        color: 0x31465a,
        metalness: 0.7,
        roughness: 0.35
      });
      [-0.42, 0.42].forEach((offset, index) => {
        const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.24, 12), conduitMat);
        conduit.position.set(offset, h / 2 + 0.14, 0);
        group.add(conduit);
        const tip = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.08, 0.08, 10),
          new THREE.MeshStandardMaterial({
            color: index === 0 ? COLORS.info : COLORS.ok,
            emissive: index === 0 ? COLORS.info : COLORS.ok,
            emissiveIntensity: 0.9
          })
        );
        tip.position.set(offset, h / 2 + 0.3, 0);
        group.add(tip);
      });
    }

    group.position.set(options.x, options.y || h / 2, options.z);
    if (options.rotY) group.rotation.y = options.rotY;

    const label = makeLabel(options.label || '');
    label.position.set(0, h / 2 + 0.62, 0);
    label.userData.cabinet = group;
    label.visible = false;
    group.add(label);

    group.userData = {
      routeId: options.routeId || null,
      kind: options.kind || 'unit',
      label: options.label || '',
      bodyMat,
      ledMat,
      screenMat,
      plateMat,
      labelSprite: label
    };

    group.traverse(object => {
      if (object.isMesh) object.userData.cabinet = group;
    });

    if (options.kind === 'ups' || options.kind === 'output') {
      createCoolingFan(group, 0, h / 2 + 0.18, -d * 0.32, 0.22, 2.2);
      createCoolingFan(group, 0, h / 2 + 0.18, d * 0.32, 0.22, 2.2);
    }

    cabinets.push(group);
    scene.add(group);
    return group;
  }

  function createTransformer(options) {
    const group = new THREE.Group();
    const w = options.w || 1.9;
    const h = options.h || 2.4;
    const d = options.d || 1.3;
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0x2a3b46,
      metalness: 0.6,
      roughness: 0.5
    });
    const finMat = new THREE.MeshStandardMaterial({
      color: 0x22313d,
      metalness: 0.5,
      roughness: 0.65
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x101a24,
      metalness: 0.6,
      roughness: 0.55
    });

    const tank = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, h * 0.72, d), tankMat);
    tank.position.y = h * 0.36;
    tank.castShadow = true;
    tank.receiveShadow = true;
    group.add(tank);

    for (let i = 0; i < 7; i += 1) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.05, h * 0.5, d * 0.78), finMat);
      fin.position.set(-w * 0.43, h * 0.33, -d * 0.28 + i * (d * 0.76 / 6));
      group.add(fin);
    }

    const bushingMat = new THREE.MeshStandardMaterial({
      color: 0x8fa2b8,
      roughness: 0.4
    });
    [-0.18, 0, 0.18].forEach(offset => {
      const bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.42, 12), bushingMat);
      bushing.position.set(offset * w * 0.52, h * 0.79, d * 0.18);
      group.add(bushing);
    });

    const conservator = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, w * 0.48, 14), finMat);
    conservator.rotation.z = Math.PI / 2;
    conservator.position.set(0, h * 0.9, d * 0.14);
    group.add(conservator);

    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x223445,
      emissive: 0x000000,
      emissiveIntensity: 0.2
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.1, d + 0.34), plateMat);
    base.position.y = 0.04;
    base.receiveShadow = true;
    group.add(base);

    const feetMat = darkMat;
    [[-w * 0.35, -d * 0.4], [w * 0.35, -d * 0.4], [-w * 0.35, d * 0.4], [w * 0.35, d * 0.4]].forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.2), feetMat);
      foot.position.set(fx, 0.1, fz);
      group.add(foot);
    });

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
      plateMat,
      labelSprite: label
    };
    group.traverse(object => {
      if (object.isMesh) object.userData.cabinet = group;
    });
    cabinets.push(group);
    scene.add(group);
    return group;
  }

  function createBatteryBank(options) {
    const group = new THREE.Group();
    const packMat = new THREE.MeshStandardMaterial({
      color: 0x1c2a38,
      metalness: 0.6,
      roughness: 0.45
    });
    const topMat = new THREE.MeshStandardMaterial({
      color: COLORS.ok,
      emissive: COLORS.ok,
      emissiveIntensity: 0.9
    });
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const pack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.9), packMat);
        pack.position.set(-0.55 + col * 0.55, 0.35 + row * 0.65, 0);
        pack.castShadow = true;
        group.add(pack);
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.6), topMat);
        top.position.set(-0.55 + col * 0.55, 0.65 + row * 0.65, 0);
        group.add(top);
      }
    }

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x22313d,
      metalness: 0.55,
      roughness: 0.55
    });
    [-0.95, 0.95].forEach(zSide => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 1.45), frameMat);
      side.position.set(0, 1.2, zSide);
      side.castShadow = true;
      group.add(side);
    });
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.14), frameMat);
    topBar.position.set(0, 2.4, -0.45);
    group.add(topBar);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 1.6), frameMat);
    base.position.y = 0.06;
    base.receiveShadow = true;
    group.add(base);

    const label = makeLabel(options.label || '');
    label.position.set(0, 3.0, 0);
    label.visible = false;
    label.userData.cabinet = group;
    group.add(label);

    group.position.set(options.x, 0, options.z);
    group.userData = {
      kind: 'battery',
      label: options.label || '',
      ledMat: topMat,
      screenMat: null,
      plateMat: null,
      labelSprite: label
    };
    group.traverse(object => {
      if (object.isMesh) object.userData.cabinet = group;
    });
    cabinets.push(group);
    scene.add(group);
    return group;
  }

  function createLoadBlock(options) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x16222f,
      metalness: 0.55,
      roughness: 0.45
    });
    const darkMetal = new THREE.MeshStandardMaterial({
      color: COLORS.steelDark,
      metalness: 0.62,
      roughness: 0.5
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.9, 1.25), bodyMat);
    body.position.y = 0.95;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const front = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.06), darkMetal);
    front.position.set(0, 0.95, 0.66);
    group.add(front);
    const ventMat = new THREE.MeshStandardMaterial({
      color: 0x0b1118,
      metalness: 0.3,
      roughness: 0.85
    });
    for (let i = 0; i < 4; i += 1) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 0.02), ventMat);
      vent.position.set(0, 0.65 + i * 0.22, 0.71);
      group.add(vent);
    }

    const loadMat = new THREE.MeshStandardMaterial({
      color: COLORS.ok,
      emissive: COLORS.ok,
      emissiveIntensity: 0.55
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 1.0), loadMat);
    top.position.y = 1.95;
    group.add(top);

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 1.4), darkMetal);
    base.position.y = 0.04;
    base.receiveShadow = true;
    group.add(base);

    const label = makeLabel(options.label || '', 2.0);
    label.position.set(0, 2.45, 0);
    label.userData.cabinet = group;
    label.visible = false;
    group.add(label);

    group.position.set(options.x, 0, options.z);
    group.userData = {
      routeId: options.routeId || null,
      kind: 'load',
      label: options.label || '',
      loadMat,
      ledMat: loadMat,
      screenMat: null,
      plateMat: null,
      labelSprite: label
    };
    group.traverse(object => {
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
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.92
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
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.92
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
        new THREE.Vector3(tx, 8.0, -4.4),
        new THREE.Vector3(tx, 8.0, -2.2),
        new THREE.Vector3(upsX, 8.0, -0.2),
        new THREE.Vector3(upsX, 2.5, -0.2),
        new THREE.Vector3(upsX, 8.0, -0.2),
        new THREE.Vector3(outX, 8.0, 2.0),
        new THREE.Vector3(outX, 2.5, 2.0),
        new THREE.Vector3(outX, 8.0, 2.0),
        new THREE.Vector3(tx, 8.0, 4.2),
        new THREE.Vector3(tx, 1.95, 4.2)
      ], COLORS.info, 0.07);

      const battery = createAngledPath([
        new THREE.Vector3(10.2, 2.4, 1.7),
        new THREE.Vector3(10.2, 8.0, 1.7),
        new THREE.Vector3(10.2, 8.0, -0.2),
        new THREE.Vector3(upsX, 8.0, -0.2),
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
          speed: 0.06 + i * 0.012
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
      new THREE.Vector3(-11.4, 8.1, -2.2),
      new THREE.Vector3(14.2, 8.1, -2.2)
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
    tray.position.set((fromX + toX) / 2, 8.35, z);
    tray.castShadow = true;
    scene.add(tray);

    const postMat = new THREE.MeshStandardMaterial({
      color: 0x243747,
      metalness: 0.6,
      roughness: 0.45
    });
    for (let x = fromX + 1.6; x <= toX - 1.2; x += 3) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6.95, 0.12), postMat);
      post.position.set(x, 4.8, z);
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
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 22),
      new THREE.MeshStandardMaterial({ color: 0x0a1119, roughness: 0.92, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(50, 50, 0x2b3d50, 0x182330);
    grid.position.y = 0.02;
    scene.add(grid);

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.28, 14),
      new THREE.MeshStandardMaterial({ color: 0x141f2b, roughness: 0.62, metalness: 0.35 })
    );
    platform.position.set(0, 0.14, -0.1);
    platform.receiveShadow = true;
    scene.add(platform);

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
    [-4.2, -3.6].forEach(z => {
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 4.6, 20), pylonMat);
      pylon.position.set(-12.2, 2.3, z);
      pylon.castShadow = true;
      scene.add(pylon);
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.72, 0.16, 24),
        new THREE.MeshStandardMaterial({ color: COLORS.info, emissive: COLORS.info, emissiveIntensity: 1.2 })
      );
      ring.position.set(-12.2, 3.4, z);
      scene.add(ring);
    });
    const mainsLabel = makeLabel('市电双路', 2.6);
    mainsLabel.position.set(-12.2, 5.1, -3.9);
    scene.add(mainsLabel);

    const armMat = new THREE.MeshStandardMaterial({
      color: 0x26394b,
      metalness: 0.6,
      roughness: 0.45
    });
    [-4.2, -3.6].forEach(z => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.12), armMat);
      arm.position.set(-12.2, 3.7, z);
      scene.add(arm);
      const insulator = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x8fa2b8, roughness: 0.5 })
      );
      insulator.position.set(-12.2, 3.86, z);
      scene.add(insulator);
    });
    const pylonCable = createPath([
      new THREE.Vector3(-12.2, 3.2, -3.9),
      new THREE.Vector3(-11.5, 2.9, -2.9),
      new THREE.Vector3(-11.0, 8.2, -2.2)
    ], 0x2b3f52, 0.03);
    scene.add(pylonCable.mesh);

    const busBody = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.28, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x223445, metalness: 0.5, roughness: 0.5 })
    );
    busBody.position.set(1.6, 8.1, -2.2);
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
    busGlow.position.set(1.6, 8.17, -2.2);
    scene.add(busGlow);

    const postMat = new THREE.MeshStandardMaterial({
      color: 0x243747,
      metalness: 0.6,
      roughness: 0.45
    });
    for (let x = -11; x <= 14.2; x += 2.8) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 7.9, 0.14), postMat);
      post.position.set(x, 4.0, -2.2);
      scene.add(post);
    }

    const chevronMat = new THREE.MeshStandardMaterial({
      color: COLORS.ok,
      emissive: COLORS.ok,
      emissiveIntensity: 0.7
    });
    for (let x = -11; x <= 14.2; x += 2.8) {
      const chevron = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 10), chevronMat);
      chevron.position.set(x, 8.27, -2.2);
      chevron.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
      scene.add(chevron);
      busChevrons.push(chevron);
    }

    const busLabel = makeLabel('ATS 双路切换母线', 3.2);
    busLabel.position.set(1.6, 8.75, -2.2);
    scene.add(busLabel);

    createCabinet({
      x: -11.4,
      y: 0.8,
      z: -2.2,
      w: 1.8,
      h: 1.6,
      d: 1.0,
      label: '油机 / ATS',
      kind: 'ats'
    });

    ROUTES.forEach((route, index) => {
      const tx = transformerX(index);
      createTransformer({
        x: tx,
        z: -4.4,
        label: route.code,
        routeId: route.id
      });
      createCabinet({
        x: tx + 0.55,
        z: -0.2,
        label: `${index + 1}#UPS`,
        routeId: route.id,
        kind: 'ups'
      });
      createCabinet({
        x: tx - 0.55,
        z: 2.0,
        label: `输出柜 ${index + 1}`,
        routeId: route.id,
        kind: 'output'
      });
      createLoadBlock({
        x: tx,
        z: 4.2,
        label: `负载 ${index + 1}`,
        routeId: route.id
      });
    });

    [9.7, 11.2, 12.7].forEach((x, index) => {
      createBatteryBank({
        x,
        z: 2.0,
        label: `电池组 ${index + 1}`
      });
    });

    [-4.4, -0.2, 2.0, 4.2].forEach(z => {
      addCableTray(z, -12.2, 13.5);
    });

    ROUTES.forEach((route, index) => {
      const tx = transformerX(index);
      const upsX = tx + 0.55;
      const outX = tx - 0.55;
      addCableDrop(tx, 8.38, -4.4, tx, 2.4, -4.4, 0x3b5a75);
      addCableDrop(upsX, 8.38, -0.2, upsX, 2.55, -0.2, 0x3b5a75);
      addCableDrop(outX, 8.38, 2.0, outX, 2.55, 2.0, 0x3b5a75);
      addCableDrop(tx, 8.38, 4.2, tx, 1.95, 4.2, 0x3b5a75);
      addTopJunctionBox(upsX, 2.6, -0.2, COLORS.info);
      addTopJunctionBox(outX, 2.6, 2.0, COLORS.ok);
    });

    [9.7, 11.2, 12.7].forEach(x => {
      addCableDrop(x, 8.38, 2.0, x, 2.45, 2.0, 0x3b5a75);
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
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute('aria-label', '配电架构 3D 模拟实物展示');
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(44, 1, 0.1, 120);
    camera.position.set(0, 16, 28);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2.5, -0.3);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 9;
    controls.maxDistance = 80;
    controls.maxPolarAngle = 1.42;

    const hemi = new THREE.HemisphereLight(0x9ab8d6, 0x0a1119, 1.0);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(9, 17, 11);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);
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
      const batteryOn = active && (!state.mainsOn || state.fault);
      item.battery.mesh.visible = batteryOn;
      if (batteryOn) {
        const batteryColor = state.fault ? COLORS.bad : COLORS.warn;
        item.batteryMat.color.setHex(batteryColor);
        item.batteryMat.emissive.setHex(batteryColor);
        item.batteryMat.emissiveIntensity = 0.85;
      }
      item.batteryParticles.forEach(particle => {
        particle.mesh.visible = batteryOn;
        if (batteryOn) {
          particle.mesh.material.color.setHex(state.fault ? COLORS.bad : COLORS.warn);
          particle.mesh.material.emissive.setHex(state.fault ? COLORS.bad : COLORS.warn);
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
    const progress = (time * particle.speed + particle.offset) % 1;
    particle.curve.getPointAt(progress, particle.mesh.position);
    const tangent = particle.curve.getTangentAt(progress);
    particle.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  }

  init();
  setRoute('1');
  update({ mainsOn: true, fault: false, lowBattery: false, battery: 96 });
  window.UPS3D = { setRoute, update, screenPoints, getSelection };
  animate();
})();
