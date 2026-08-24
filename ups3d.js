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

  function devicePosition(index) {
    return {
      x: -8.1 + index * 1.8,
      z: index % 2 === 0 ? -0.35 : 0.35
    };
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
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    const width = scale || Math.max(2.2, text.length * 0.34);
    sprite.scale.set(width, width * 0.25, 1);
    return sprite;
  }

  function createCabinet(options) {
    const group = new THREE.Group();
    const w = options.w || 1.7;
    const h = options.h || 2.1;
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

    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0a1117,
      emissive: COLORS.info,
      emissiveIntensity: 0.8
    });
    const screen = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 0.2, 0.05), screenMat);
    screen.position.set(0, h * 0.24, d / 2 + 0.09);
    group.add(screen);

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
    group.traverse(object => {
      if (object.isMesh) object.userData.cabinet = group;
    });

    cabinets.push(group);
    scene.add(group);
    return group;
  }

  function buildScene() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 9),
      new THREE.MeshStandardMaterial({ color: 0x0a1119, roughness: 0.92, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(24, 24, 0x2b3d50, 0x182330);
    grid.position.y = 0.02;
    scene.add(grid);

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.28, 5.2),
      new THREE.MeshStandardMaterial({ color: 0x141f2b, roughness: 0.62, metalness: 0.35 })
    );
    platform.position.set(0, 0.14, 0);
    platform.receiveShadow = true;
    scene.add(platform);

    const aisle = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 5.4),
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
        label: device.name,
        deviceId: device.id
      });
    });

    const caption = makeLabel('UPS 实物阵列 1# - 10#', 4.2);
    caption.position.set(0, 3.6, 0);
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
      hud.title.textContent = device.name;
      hud.meta.textContent = `${device.transformer} / 输入 ${device.input} / 输出 ${device.output}`;
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
    updateStatusText(state);
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
    scene.fog = new THREE.Fog(0x0a1119, 26, 50);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute('aria-label', '全站 UPS 实物阵列 3D 展示');
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
    camera.position.set(0, 7, 14.5);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.7, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 7;
    controls.maxDistance = 34;
    controls.maxPolarAngle = 1.38;

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
    if (selectionRing && selectionRing.visible) {
      const pulse = 1 + Math.sin(time * 2.4) * 0.07;
      selectionRing.scale.set(pulse, pulse, 1);
      selectionRing.material.opacity = 0.7 + Math.sin(time * 2.4) * 0.22;
      selectionBeam.material.opacity = 0.1 + Math.sin(time * 1.8) * 0.035;
    }
    renderer.render(scene, camera);
  }

  init();
  update(lastState);
  window.UPSFleet3D = { setDevice, update, getSelection, screenPoints };
  animate();
})();
