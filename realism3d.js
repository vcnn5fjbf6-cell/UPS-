/**
 * UPS 3D 真实感增强工具包
 * 提供：程序化环境反射贴图、PBR 材质贴图、几何合并构建器、设备铭牌与接触阴影。
 * 依赖 vendor/three.min.js（r128），在 power3d.js / ups3d.js 之前加载。
 */
(function () {
  'use strict';

  const THREE = window.THREE;
  if (!THREE) return;

  const cache = new Map();

  function canvasOf(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function speckle(ctx, width, height, count, colors, maxRadius) {
    for (let i = 0; i < count; i += 1) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        random(0.2, maxRadius || 1.8),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  /* ---------------------------------------------------------------
   * 1. 程序化环境贴图：模拟机房顶灯 + 远端机柜，为金属提供真实反射
   * --------------------------------------------------------------- */
  function equirectTexture() {
    if (cache.has('env')) return cache.get('env');
    const canvas = canvasOf(1024, 512);
    const ctx = canvas.getContext('2d');

    const sky = ctx.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, '#16212d');
    sky.addColorStop(0.3, '#101a24');
    sky.addColorStop(0.55, '#0b141c');
    sky.addColorStop(0.75, '#070d13');
    sky.addColorStop(1, '#04070a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 512);

    // 顶部灯带：金属表面最关键的条状高光来源
    for (let i = 0; i < 8; i += 1) {
      const x = i * 128 + 24;
      const glow = ctx.createLinearGradient(0, 30, 0, 140);
      glow.addColorStop(0, 'rgba(214, 233, 255, 0)');
      glow.addColorStop(0.5, 'rgba(228, 241, 255, 0.85)');
      glow.addColorStop(1, 'rgba(120, 170, 220, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x, 30, 78, 110);
      ctx.fillStyle = 'rgba(248, 252, 255, 0.92)';
      ctx.fillRect(x + 12, 64, 54, 8);
    }

    // 中部冷色 / 绿色环境光斑
    const band = ctx.createLinearGradient(0, 140, 0, 340);
    band.addColorStop(0, 'rgba(99, 179, 255, 0.22)');
    band.addColorStop(0.5, 'rgba(73, 209, 125, 0.11)');
    band.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, 140, 1024, 200);

    // 远端机柜剪影，避免金属反射成一片死黑
    for (let i = 0; i < 30; i += 1) {
      const w = random(16, 42);
      const h = random(56, 150);
      ctx.fillStyle = 'rgba(5, 10, 15, ' + random(0.45, 0.8).toFixed(2) + ')';
      ctx.fillRect(i * 35 + random(0, 10), 320 - h, w, h);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.encoding = THREE.sRGBEncoding;
    texture.name = 'ups-env-equirect';
    cache.set('env', texture);
    return texture;
  }

  function installEnvironment(renderer, scene, options) {
    const opts = options || {};
    // r128 未做材质颜色空间转换，保持线性输出，避免深色外壳被整体提亮
    renderer.envMapIntensity = opts.intensity || 1;
    const source = equirectTexture();
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const target = pmrem.fromEquirectangular(source);
    scene.environment = target.texture;
    pmrem.dispose();
    return target.texture;
  }

  /* ---------------------------------------------------------------
   * 2. PBR 贴图：拉丝金属粗糙度、环氧地坪、铭牌、接触阴影
   * --------------------------------------------------------------- */
  function brushedRoughness() {
    if (cache.has('brushed')) return cache.get('brushed');
    const canvas = canvasOf(512, 512);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#787878';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3200; i += 1) {
      const y = Math.random() * 512;
      const x = Math.random() * 512;
      const len = random(30, 340);
      const value = Math.floor(random(96, 178));
      ctx.strokeStyle = 'rgba(' + value + ',' + value + ',' + value + ',0.18)';
      ctx.lineWidth = random(0.2, 1.5);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + random(-0.8, 0.8));
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.name = 'ups-brushed-roughness';
    cache.set('brushed', texture);
    return texture;
  }

  function floorMaps() {
    if (cache.has('floor')) return cache.get('floor');

    const color = canvasOf(512, 512);
    const cctx = color.getContext('2d');
    const base = cctx.createLinearGradient(0, 0, 512, 512);
    base.addColorStop(0, '#16222e');
    base.addColorStop(0.5, '#101a24');
    base.addColorStop(1, '#0c151d');
    cctx.fillStyle = base;
    cctx.fillRect(0, 0, 512, 512);
    speckle(cctx, 512, 512, 5200, ['rgba(255,255,255,0.05)', 'rgba(140,190,230,0.05)', 'rgba(0,0,0,0.16)'], 1.5);
    // 环氧地坪分格缝
    cctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    cctx.lineWidth = 3;
    [0, 256].forEach(function (offset) {
      cctx.beginPath();
      cctx.moveTo(offset, 0);
      cctx.lineTo(offset, 512);
      cctx.moveTo(0, offset);
      cctx.lineTo(512, offset);
      cctx.stroke();
    });
    cctx.strokeStyle = 'rgba(120, 170, 220, 0.08)';
    cctx.lineWidth = 1;
    [0, 256].forEach(function (offset) {
      cctx.beginPath();
      cctx.moveTo(offset + 3, 0);
      cctx.lineTo(offset + 3, 512);
      cctx.moveTo(0, offset + 3);
      cctx.lineTo(512, offset + 3);
      cctx.stroke();
    });

    const rough = canvasOf(256, 256);
    const rctx = rough.getContext('2d');
    rctx.fillStyle = '#6e6e6e';
    rctx.fillRect(0, 0, 256, 256);
    speckle(rctx, 256, 256, 1600, ['rgba(255,255,255,0.10)', 'rgba(0,0,0,0.12)'], 3.2);

    const map = new THREE.CanvasTexture(color);
    map.encoding = THREE.sRGBEncoding;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(9, 9);
    map.anisotropy = 4;
    const roughnessMap = new THREE.CanvasTexture(rough);
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(9, 9);

    const result = { map: map, roughnessMap: roughnessMap };
    cache.set('floor', result);
    return result;
  }

  function nameplateTexture(title, subtitle, accent) {
    const key = 'plate|' + title + '|' + subtitle + '|' + accent;
    if (cache.has(key)) return cache.get(key);

    const canvas = canvasOf(512, 224);
    const ctx = canvas.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, 0, 224);
    bg.addColorStop(0, '#2c3a48');
    bg.addColorStop(0.45, '#1a2530');
    bg.addColorStop(1, '#0e161e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 224);
    for (let i = 0; i < 400; i += 1) {
      const y = Math.random() * 224;
      ctx.strokeStyle = 'rgba(255,255,255,' + random(0.01, 0.05).toFixed(3) + ')';
      ctx.lineWidth = random(0.3, 1.1);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + random(-1, 1));
      ctx.stroke();
    }
    ctx.strokeStyle = accent || '#63b3ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 204);
    ctx.fillStyle = accent || '#63b3ff';
    ctx.fillRect(10, 10, 492, 8);

    ctx.fillStyle = '#e8eef7';
    ctx.font = '700 52px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 34, 92);

    ctx.fillStyle = '#9fb3c8';
    ctx.font = '500 30px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(subtitle || '', 34, 158);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 4;
    cache.set(key, texture);
    return texture;
  }

  function nameplate(title, subtitle, width, height, accent) {
    const texture = nameplateTexture(title, subtitle, accent);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.42,
      metalness: 0.35,
      envMapIntensity: 0.6
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    return mesh;
  }

  function warningTexture(text, color) {
    const key = 'warn|' + text + '|' + color;
    if (cache.has(key)) return cache.get(key);
    const canvas = canvasOf(512, 160);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f7d046';
    ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = '#1a1206';
    ctx.fillRect(0, 0, 512, 12);
    ctx.fillRect(0, 148, 512, 12);
    ctx.fillStyle = '#1a1206';
    ctx.font = '800 54px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 82);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    cache.set(key, texture);
    return texture;
  }

  function contactShadowTexture() {
    if (cache.has('shadow')) return cache.get('shadow');
    const canvas = canvasOf(256, 256);
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
    grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    cache.set('shadow', texture);
    return texture;
  }

  function contactShadow(width, depth, opacity) {
    const material = new THREE.MeshBasicMaterial({
      map: contactShadowTexture(),
      transparent: true,
      opacity: opacity === undefined ? 0.62 : opacity,
      depthWrite: false,
      color: 0x000000
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 1;
    return mesh;
  }

  /* ---------------------------------------------------------------
   * 3. 几何合并构建器：用少量 draw call 承载大量真实细节零件
   * --------------------------------------------------------------- */
  const UNIT = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 24, 1),
    cyl12: new THREE.CylinderGeometry(1, 1, 1, 12, 1),
    cyl6: new THREE.CylinderGeometry(1, 1, 1, 6, 1),
    sphere: new THREE.SphereGeometry(1, 18, 12),
    cone: new THREE.ConeGeometry(1, 1, 20, 1)
  };

  function transformGeometry(geometry, position, rotation, scale) {
    const clone = geometry.clone();
    const matrix = new THREE.Matrix4();
    matrix.compose(
      new THREE.Vector3(
        (position && position[0]) || 0,
        (position && position[1]) || 0,
        (position && position[2]) || 0
      ),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(
        (rotation && rotation[0]) || 0,
        (rotation && rotation[1]) || 0,
        (rotation && rotation[2]) || 0
      )),
      new THREE.Vector3(
        scale ? scale[0] : 1,
        scale ? scale[1] : 1,
        scale ? scale[2] : 1
      )
    );
    clone.applyMatrix4(matrix);
    return clone;
  }

  function mergeGeometries(list) {
    let total = 0;
    const prepared = list.map(function (geometry) {
      const flat = geometry.index ? geometry.toNonIndexed() : geometry.clone();
      total += flat.attributes.position.count;
      return flat;
    });
    const position = new Float32Array(total * 3);
    const normal = new Float32Array(total * 3);
    const uv = new Float32Array(total * 2);
    let offset = 0;
    prepared.forEach(function (geometry) {
      position.set(geometry.attributes.position.array, offset * 3);
      if (geometry.attributes.normal) normal.set(geometry.attributes.normal.array, offset * 3);
      if (geometry.attributes.uv) uv.set(geometry.attributes.uv.array, offset * 2);
      offset += geometry.attributes.position.count;
    });
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(position, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    merged.computeBoundingSphere();
    return merged;
  }

  function Builder() {
    this.buckets = new Map();
  }

  Builder.prototype.add = function (key, geometry) {
    if (!this.buckets.has(key)) this.buckets.set(key, []);
    this.buckets.get(key).push(geometry);
  };

  Builder.prototype.geo = function (key, geometry, position, rotation, scale) {
    this.add(key, transformGeometry(geometry, position, rotation, scale));
    return this;
  };

  Builder.prototype.box = function (key, x, y, z, w, h, d, rotation) {
    return this.geo(key, UNIT.box, [x, y, z], rotation, [w, h, d]);
  };

  Builder.prototype.cyl = function (key, x, y, z, radius, height, rotation, segments) {
    const geo = segments === 6 ? UNIT.cyl6 : segments === 12 ? UNIT.cyl12 : UNIT.cyl;
    return this.geo(key, geo, [x, y, z], rotation, [radius, height, radius]);
  };

  Builder.prototype.sphere = function (key, x, y, z, radius, scale) {
    return this.geo(key, UNIT.sphere, [x, y, z], null, [
      radius * (scale ? scale[0] : 1),
      radius * (scale ? scale[1] : 1),
      radius * (scale ? scale[2] : 1)
    ]);
  };

  Builder.prototype.cone = function (key, x, y, z, radius, height, rotation) {
    return this.geo(key, UNIT.cone, [x, y, z], rotation, [radius, height, radius]);
  };

  /** 返回 { 材质键: 合并后的 BufferGeometry }，可跨实例复用 */
  Builder.prototype.merge = function () {
    const result = {};
    this.buckets.forEach(function (list, key) {
      result[key] = mergeGeometries(list);
    });
    return result;
  };

  /** 生成一批按材质分组的合并网格并挂到 group 上 */
  Builder.prototype.attach = function (group, materials, options) {
    const opts = options || {};
    const meshes = {};
    this.buckets.forEach(function (list, key) {
      const material = materials[key];
      if (!material) return;
      const geometry = mergeGeometries(list);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = opts.castShadow !== false;
      mesh.receiveShadow = opts.receiveShadow !== false;
      mesh.name = key;
      group.add(mesh);
      meshes[key] = mesh;
    });
    return meshes;
  };

  /** 多孔通风栅：成排的百叶叶片，合并后只占一个 draw call */
  Builder.prototype.louvres = function (key, x, y, z, width, height, count, depth, rotation) {
    const step = height / count;
    for (let i = 0; i < count; i += 1) {
      const ly = y - height / 2 + step * (i + 0.5);
      this.box(key, x, ly, z, width, step * 0.42, depth || 0.05, rotation);
    }
    return this;
  };

  /* ---------------------------------------------------------------
   * 4. 机柜几何：UPS / 输出柜 / ATS 共用，构建一次后按尺寸缓存
   * --------------------------------------------------------------- */
  const cabinetCache = new Map();

  function buildCabinetGeometry(w, h, d, options) {
    const o = options || {};
    const b = new Builder();
    const zf = d / 2;
    const zb = -d / 2;
    const single = o.doorStyle === 'single';
    const doorTopY = h * 0.395;
    const doorBottomY = -h * 0.435;

    // 柜体主结构
    b.box('paint', 0, 0, 0, w, h, d);
    b.box('dark', 0, h / 2 + 0.03, 0, w + 0.07, 0.06, d + 0.07);
    b.box('dark', 0, -h / 2 + 0.05, 0, w + 0.06, 0.1, d + 0.06);
    // 四角立柱，让柜体有骨架感
    [-1, 1].forEach(function (sx) {
      [-1, 1].forEach(function (sz) {
        b.box('metal', sx * (w / 2 - 0.035), 0, sz * (d / 2 - 0.035), 0.07, h, 0.07);
      });
    });

    if (single) {
      const doorW = w * 0.92;
      b.box('paint', 0, -h * 0.02, zf + 0.025, doorW, h * 0.83, 0.05);
      b.box('dark', 0, -h * 0.02, zf + 0.055, doorW - 0.16, h * 0.74, 0.012);
      b.box('paint', 0, -h * 0.02, zf + 0.065, doorW - 0.2, h * 0.68, 0.01);
      [-h * 0.34, -h * 0.02, h * 0.3].forEach(function (hy) {
        b.box('metal', -doorW / 2 + 0.01, hy, zf + 0.05, 0.055, 0.17, 0.05);
      });
      const handleX = doorW / 2 - 0.1;
      b.box('metal', handleX, -h * 0.02, zf + 0.07, 0.05, 0.36, 0.05);
      b.cyl('metal', handleX, -h * 0.02, zf + 0.095, 0.042, 0.07, [Math.PI / 2, 0, 0], 12);
      b.cyl('metal', handleX, -h * 0.02 - 0.22, zf + 0.065, 0.022, 0.05, [Math.PI / 2, 0, 0], 12);
    } else {
      [-1, 1].forEach(function (side) {
        const doorW = w * 0.47;
        const doorX = side * w * 0.245;
        b.box('paint', doorX, -h * 0.03, zf + 0.025, doorW - 0.02, h * 0.82, 0.05);
        b.box('dark', doorX, -h * 0.03, zf + 0.055, doorW - 0.17, h * 0.72, 0.012);
        b.box('paint', doorX, -h * 0.03, zf + 0.065, doorW - 0.21, h * 0.66, 0.01);
        [-h * 0.32, -h * 0.03, h * 0.26].forEach(function (hy) {
          b.box('metal', doorX - side * (doorW / 2 - 0.015), hy, zf + 0.05, 0.055, 0.16, 0.05);
        });
        const handleX = doorX + side * (doorW / 2 - 0.08);
        b.box('metal', handleX, -h * 0.03, zf + 0.07, 0.05, 0.34, 0.05);
        b.cyl('metal', handleX, -h * 0.03, zf + 0.095, 0.042, 0.07, [Math.PI / 2, 0, 0], 12);
        b.cyl('metal', handleX, -h * 0.03 - 0.21, zf + 0.065, 0.022, 0.05, [Math.PI / 2, 0, 0], 12);
      });
      b.box('dark', 0, -h * 0.03, zf + 0.05, 0.022, h * 0.82, 0.02);
    }

    // HMI 触摸屏凹槽（屏幕本身由调用方单独放置）
    if (o.hmi) {
      b.box('dark', 0, h * 0.3, zf + 0.06, w * 0.62, 0.46, 0.03);
      b.box('metal', 0, h * 0.3 + 0.235, zf + 0.08, w * 0.66, 0.022, 0.014);
      b.box('metal', 0, h * 0.3 - 0.235, zf + 0.08, w * 0.66, 0.022, 0.014);
      b.box('dark', 0, h * 0.3 - 0.32, zf + 0.062, w * 0.5, 0.085, 0.022);
      b.cyl('warning', w * 0.33, h * 0.14, zf + 0.062, 0.085, 0.02, [Math.PI / 2, 0, 0], 24);
      b.cyl('emergency', w * 0.33, h * 0.14, zf + 0.095, 0.062, 0.055, [Math.PI / 2, 0, 0], 24);
    }

    // 指针仪表组（配电柜 / ATS 面板）
    if (o.meters) {
      const my = h * 0.3;
      b.box('dark', 0, my, zf + 0.06, w * 0.7, 0.4, 0.035);
      [-0.26, 0, 0.26].forEach(function (ox) {
        b.cyl('metal', ox * w, my, zf + 0.085, 0.115, 0.03, [Math.PI / 2, 0, 0], 24);
        b.cyl('screenDark', ox * w, my, zf + 0.1, 0.095, 0.012, [Math.PI / 2, 0, 0], 24);
        b.box('accent', ox * w, my, zf + 0.108, 0.014, 0.13, 0.01);
      });
    }

    // 断路器操作手柄
    if (o.breakers !== false) {
      const rows = o.breakerRows || 1;
      for (let r = 0; r < rows; r += 1) {
        const by = -h * 0.19 - r * 0.42;
        [-0.3, 0.3].forEach(function (ox) {
          b.box('dark', ox * w, by, zf + 0.07, 0.2, 0.36, 0.03);
          b.box('accent', ox * w, by + 0.07, zf + 0.1, 0.1, 0.17, 0.045);
        });
      }
    }

    // 前下部进风栅
    b.box('dark', 0, -h * 0.36, zf + 0.035, w * 0.82, 0.46, 0.025);
    b.louvres('grille', 0, -h * 0.36, zf + 0.055, w * 0.76, 0.4, 9, 0.05);

    // 侧面散热栅与搬运把手
    [-1, 1].forEach(function (side) {
      const sx = side * (w / 2 + 0.012);
      for (let i = 0; i < 8; i += 1) {
        b.box('grille', sx, -h * 0.26 + i * 0.075, 0, 0.028, 0.032, d * 0.48);
      }
      [-h * 0.14, h * 0.12].forEach(function (hy) {
        b.box('metal', side * (w / 2 + 0.03), hy, 0, 0.05, 0.06, 0.44);
      });
    });

    // 背门与接地端子
    b.box('dark', 0, -h * 0.03, zb - 0.02, w * 0.9, h * 0.76, 0.04);
    b.box('metal', 0, -h * 0.03, zb - 0.045, 0.06, 0.22, 0.05);
    b.cyl('copper', -w * 0.3, -h * 0.42, zb - 0.03, 0.035, 0.09, [Math.PI / 2, 0, 0], 12);

    // 顶部排风风扇护罩（风扇本体由调用方放置并旋转）
    if (o.fans !== false) {
      [-0.26, 0.26].forEach(function (ox) {
        b.cyl('grille', ox * w, h / 2 + 0.115, 0, 0.25, 0.018, null, 24);
        for (let i = 0; i < 4; i += 1) {
          b.box('grille', ox * w, h / 2 + 0.13, 0, 0.48, 0.012, 0.022, [0, (i * Math.PI) / 4, 0]);
        }
        b.cyl('dark', ox * w, h / 2 + 0.035, 0, 0.26, 0.06, null, 24);
      });
    }

    // 顶部电缆进线
    [-0.28, 0.28].forEach(function (ox) {
      b.cyl('metal', ox * w, h / 2 + 0.11, d * 0.2, 0.075, 0.16, null, 12);
      b.cyl('insulator', ox * w, h / 2 + 0.25, d * 0.2, 0.038, 0.16, null, 12);
      b.cyl('metal', ox * w, h / 2 + 0.09, -d * 0.24, 0.06, 0.12, null, 12);
    });

    // 脚轮与调平脚
    if (o.casters !== false) {
      const wx = w / 2 - 0.2;
      const wz = d / 2 - 0.2;
      [[-wx, -wz], [wx, -wz], [-wx, wz], [wx, wz]].forEach(function (p) {
        b.box('metal', p[0], -h / 2 + 0.01, p[1], 0.12, 0.14, 0.12);
        b.cyl('rubber', p[0], -h / 2 - 0.09, p[1], 0.085, 0.06, [0, 0, Math.PI / 2], 12);
      });
    }
    [[-w * 0.42, -d * 0.42], [w * 0.42, -d * 0.42], [-w * 0.42, d * 0.42], [w * 0.42, d * 0.42]].forEach(function (p) {
      b.cyl('metal', p[0], -h / 2 - 0.06, p[1], 0.045, 0.12, null, 12);
    });

    // 底座 + 选中高亮底板
    b.box('plate', 0, -h / 2 - 0.11, 0, w + 0.26, 0.06, d + 0.28);
    b.box('dark', 0, -h / 2 - 0.15, 0, w + 0.34, 0.03, d + 0.36);

    // 正面高压警告标签
    b.geo('warning', new THREE.PlaneGeometry(0.34, 0.106), [-w * 0.3, -h * 0.36, zf + 0.075]);

    // 顶部母排 / 电缆标识牌
    b.box('dark', 0, h / 2 + 0.07, 0, w * 0.5, 0.02, 0.1);

    return b.merge();
  }

  function cabinetGeometry(w, h, d, options) {
    const o = options || {};
    const key = [
      w.toFixed(3), h.toFixed(3), d.toFixed(3),
      o.doorStyle || 'double', o.hmi ? 1 : 0, o.meters ? 1 : 0,
      o.fans === false ? 0 : 1, o.breakers === false ? 0 : 1, o.breakerRows || 1
    ].join('|');
    if (!cabinetCache.has(key)) {
      cabinetCache.set(key, buildCabinetGeometry(w, h, d, o));
    }
    return cabinetCache.get(key);
  }

  window.UPS3DKit = {
    installEnvironment: installEnvironment,
    brushedRoughness: brushedRoughness,
    floorMaps: floorMaps,
    nameplate: nameplate,
    nameplateTexture: nameplateTexture,
    warningTexture: warningTexture,
    contactShadow: contactShadow,
    mergeGeometries: mergeGeometries,
    transformGeometry: transformGeometry,
    Builder: Builder,
    cabinetGeometry: cabinetGeometry,
    UNIT: UNIT
  };
})();
