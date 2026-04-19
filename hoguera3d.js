// Three.js hoguera: thousands of embers rising with curl-like noise
// Exposes: window.Hoguera.mount(canvas, { mode, onHover, getSecrets, tint })
// mode: 'hero' (tight, no interaction) | 'full' (fullscreen, interactive, per-ember data)

(function () {
  const CATEGORIES = {
    amor:      '#D4537E',
    despedida: '#D85A30',
    gratitud:  '#1D9E75',
    perdon:    '#534AB7',
    enojo:     '#EF9F27',
    verdad:    '#888780',
  };

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  // Simple value noise (fast, good enough for ember drift)
  function makeNoise() {
    const perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function grad(h, x, y, z) {
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
      return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }

    return function (x, y, z) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      const u = fade(x), v = fade(y), w = fade(z);
      const A  = perm[X] + Y,     AA = perm[A] + Z,     AB = perm[A + 1] + Z;
      const B  = perm[X + 1] + Y, BA = perm[B] + Z,     BB = perm[B + 1] + Z;
      return lerp(
        lerp(lerp(grad(perm[AA],   x,   y,   z),
                  grad(perm[BA],   x-1, y,   z), u),
             lerp(grad(perm[AB],   x,   y-1, z),
                  grad(perm[BB],   x-1, y-1, z), u), v),
        lerp(lerp(grad(perm[AA+1], x,   y,   z-1),
                  grad(perm[BA+1], x-1, y,   z-1), u),
             lerp(grad(perm[AB+1], x,   y-1, z-1),
                  grad(perm[BB+1], x-1, y-1, z-1), u), v), w);
    };
  }

  function mount(canvas, opts = {}) {
    const mode = opts.mode || 'hero';
    const THREE = window.THREE;
    if (!THREE) { console.error('THREE not loaded'); return () => {}; }

    const scene = new THREE.Scene();
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 3.5, mode === 'full' ? 18 : 14);
    camera.lookAt(0, 3, 0);

    // Particle count by mode
    const COUNT = mode === 'full' ? 3200 : 1400;

    // Assign data per ember
    const secrets = (opts.getSecrets && opts.getSecrets()) || [];
    const emberData = new Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      let cat, secret;
      if (secrets.length && mode === 'full') {
        // First N embers bound to real secrets; rest are filler
        if (i < secrets.length) {
          secret = secrets[i];
          cat = secret.cat;
        } else {
          // Distribute filler matching stats roughly
          const r = Math.random();
          cat = r < 0.38 ? 'amor' : r < 0.65 ? 'despedida' : r < 0.79 ? 'gratitud'
              : r < 0.90 ? 'perdon' : r < 0.97 ? 'enojo' : 'verdad';
        }
      } else {
        const r = Math.random();
        cat = r < 0.38 ? 'amor' : r < 0.65 ? 'despedida' : r < 0.79 ? 'gratitud'
            : r < 0.90 ? 'perdon' : r < 0.97 ? 'enojo' : 'verdad';
      }
      emberData[i] = {
        cat,
        secret: secret || null,
        intensity: 0.55 + Math.random() * 0.45, // emotional intensity
        seed: Math.random() * 1000,
      };
    }

    // Geometry
    const geometry = new THREE.BufferGeometry();
    const positions  = new Float32Array(COUNT * 3);
    const basePos    = new Float32Array(COUNT * 3);
    const colors     = new Float32Array(COUNT * 3);
    const sizes      = new Float32Array(COUNT);
    const alphas     = new Float32Array(COUNT);
    const phases     = new Float32Array(COUNT);
    const speeds     = new Float32Array(COUNT);
    const lifetimes  = new Float32Array(COUNT);
    const ages       = new Float32Array(COUNT);
    const highlight  = new Float32Array(COUNT); // 0..1 hover glow

    for (let i = 0; i < COUNT; i++) {
      // Spawn near the base of the fire (radius narrows near floor)
      const r = Math.pow(Math.random(), 0.6) * 3.2;
      const a = Math.random() * Math.PI * 2;
      basePos[i*3]   = Math.cos(a) * r;
      basePos[i*3+1] = -1 + Math.random() * 0.5;
      basePos[i*3+2] = Math.sin(a) * r;

      positions[i*3]   = basePos[i*3];
      positions[i*3+1] = basePos[i*3+1] + Math.random() * 10;
      positions[i*3+2] = basePos[i*3+2];

      const rgb = hexToRgb(CATEGORIES[emberData[i].cat]);
      colors[i*3] = rgb[0]; colors[i*3+1] = rgb[1]; colors[i*3+2] = rgb[2];

      sizes[i]     = (0.10 + emberData[i].intensity * 0.28) * (mode === 'full' ? 1.15 : 1);
      alphas[i]    = 0.0;
      phases[i]    = Math.random() * Math.PI * 2;
      speeds[i]    = 0.25 + Math.random() * 0.55;
      lifetimes[i] = 6 + Math.random() * 6;
      ages[i]      = Math.random() * lifetimes[i];
      highlight[i] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha',   new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('aHighlight', new THREE.BufferAttribute(highlight, 1));

    // Shader — round soft ember with warm glow
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        attribute float aHighlight;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vHi;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vAlpha = aAlpha;
          vHi = aHighlight;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float size = aSize * (1.0 + aHighlight * 1.8);
          gl_PointSize = size * 320.0 * uPixelRatio / -mv.z;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vHi;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          // Soft round ember with warm falloff
          float core = smoothstep(0.5, 0.0, d);
          float glow = pow(core, 1.6);
          vec3 col = vColor * (0.6 + 0.8 * glow);
          // Highlighted ember gets extra warm lift
          col += vec3(0.35, 0.22, 0.08) * vHi * glow;
          float a = glow * vAlpha * (1.0 + vHi * 0.6);
          gl_FragColor = vec4(col, a);
        }
      `,
      vertexColors: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Subtle ember core glow at base (big soft circle)
    const glowTex = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,160,70,0.55)');
      g.addColorStop(0.4, 'rgba(216,90,48,0.18)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    })();

    const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(10, 10, 1);
    glow.position.set(0, -0.6, 0);
    scene.add(glow);

    // Second inner glow (brighter)
    const glowMat2 = glowMat.clone();
    glowMat2.opacity = 0.7;
    const glow2 = new THREE.Sprite(glowMat2);
    glow2.scale.set(5, 5, 1);
    glow2.position.set(0, -0.4, 0);
    scene.add(glow2);

    const noise = makeNoise();

    // Resize handling
    function resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Interaction (full mode only)
    let mouse = new THREE.Vector2(-10, -10);
    let dragging = false;
    let lastX = 0, lastY = 0;
    let orbitAz = 0, orbitEl = 0.15;
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.18 };

    let hoveredIdx = -1;

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        orbitAz -= dx * 0.005;
        orbitEl = Math.max(-0.2, Math.min(0.6, orbitEl + dy * 0.003));
        lastX = e.clientX; lastY = e.clientY;
      }
    }
    function onPointerDown(e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    }
    function onPointerUp(e) {
      dragging = false;
      canvas.releasePointerCapture?.(e.pointerId);
    }
    function onLeave() { mouse.x = mouse.y = -10; }

    if (mode === 'full') {
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerup',   onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('pointerleave', onLeave);
    }

    // Filter state (full mode)
    let activeFilter = null;
    function setFilter(cat) { activeFilter = cat; }

    // Mobile ember tracking
    let mobileEmberIdx = -1;
    function setMobileEmber(idx) { mobileEmberIdx = idx; }

    let running = true;
    let autoOrbit = 0;
    let last = performance.now();

    function tick(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Camera
      if (mode === 'full') {
        if (!dragging) autoOrbit += dt * 0.05;
        const az = orbitAz + autoOrbit;
        const dist = 16;
        camera.position.x = Math.sin(az) * Math.cos(orbitEl) * dist;
        camera.position.z = Math.cos(az) * Math.cos(orbitEl) * dist;
        camera.position.y = 3.5 + Math.sin(orbitEl) * dist * 0.4;
      } else {
        autoOrbit += dt * 0.08;
        camera.position.x = Math.sin(autoOrbit) * 1.5;
        camera.position.z = 13 + Math.cos(autoOrbit) * 1.0;
        camera.position.y = 3.3 + Math.sin(autoOrbit * 0.6) * 0.4;
      }
      camera.lookAt(0, 3, 0);

      // Update embers
      const pos = geometry.attributes.position.array;
      const aArr = geometry.attributes.aAlpha.array;
      const hArr = geometry.attributes.aHighlight.array;

      for (let i = 0; i < COUNT; i++) {
        const d = emberData[i];
        ages[i] += dt;
        if (ages[i] > lifetimes[i]) {
          // respawn at base
          ages[i] = 0;
          pos[i*3]   = basePos[i*3];
          pos[i*3+1] = basePos[i*3+1];
          pos[i*3+2] = basePos[i*3+2];
        }

        const life = ages[i] / lifetimes[i];
        // Rise with slight inward narrowing then outward drift
        const t = now * 0.0001 + d.seed;
        const nx = noise(pos[i*3]*0.18, pos[i*3+1]*0.18, t);
        const nz = noise(pos[i*3]*0.18 + 9, pos[i*3+1]*0.18, t + 3);
        pos[i*3]   += nx * dt * 0.7;
        pos[i*3+2] += nz * dt * 0.7;
        pos[i*3+1] += speeds[i] * dt * (1.0 + life * 1.4);

        // Slight inward pull low in fire
        if (pos[i*3+1] < 1.5) {
          pos[i*3]   *= 1 - dt * 0.3;
          pos[i*3+2] *= 1 - dt * 0.3;
        }

        // Alpha: fade in, hold, fade out
        let a;
        if (life < 0.15)      a = life / 0.15;
        else if (life > 0.75) a = (1 - life) / 0.25;
        else                  a = 1;
        a *= 0.55 + d.intensity * 0.45;

        // Filter dimming
        if (activeFilter && d.cat !== activeFilter) a *= 0.12;

        aArr[i] = a;

        // Highlight decay
        hArr[i] *= Math.max(0, 1 - dt * 4);
      }

      // Raycast for hover (full mode)
      if (mode === 'full' && opts.onHover) {
        raycaster.setFromCamera(mouse, camera);
        // Manual raycast against real-secret embers only for speed + meaning
        let bestIdx = -1, bestDist = Infinity;
        const camDirToPoint = new THREE.Vector3();
        const maxRealIdx = Math.min(COUNT, (opts.getSecrets && opts.getSecrets().length) || 0);
        for (let i = 0; i < maxRealIdx; i++) {
          const px = pos[i*3], py = pos[i*3+1], pz = pos[i*3+2];
          camDirToPoint.set(px, py, pz).sub(camera.position);
          const along = camDirToPoint.dot(raycaster.ray.direction);
          if (along < 0) continue;
          const closest = raycaster.ray.direction.clone().multiplyScalar(along).add(camera.position);
          const dist = closest.distanceTo(new THREE.Vector3(px, py, pz));
          const screenSize = sizes[i] * 2.2;
          if (dist < screenSize && along < bestDist) {
            bestDist = along;
            bestIdx = i;
          }
        }
        if (bestIdx !== hoveredIdx) {
          hoveredIdx = bestIdx;
          const data = hoveredIdx >= 0 ? emberData[hoveredIdx] : null;
          opts.onHover(data && data.secret ? { secret: data.secret, cat: data.cat } : null);
        }
        if (hoveredIdx >= 0) hArr[hoveredIdx] = 1;
      }

      // Mobile ember: project 3D position to screen and report it each frame
      if (mobileEmberIdx >= 0 && opts.onMobilePosition) {
        const px = pos[mobileEmberIdx*3];
        const py = pos[mobileEmberIdx*3+1];
        const pz = pos[mobileEmberIdx*3+2];
        const vec = new THREE.Vector3(px, py, pz);
        vec.project(camera);
        const sx = ( vec.x * 0.5 + 0.5) * canvas.clientWidth;
        const sy = (-vec.y * 0.5 + 0.5) * canvas.clientHeight;
        opts.onMobilePosition(sx, sy);
      }

      // Gentle pulse on base glow
      const pulse = 0.85 + Math.sin(now * 0.0012) * 0.08 + Math.sin(now * 0.0031) * 0.04;
      glow.material.opacity = 0.55 * pulse;
      glow2.material.opacity = 0.6 * pulse;

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
      geometry.attributes.aHighlight.needsUpdate = true;

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // API
    return {
      setFilter,
      setMobileEmber,
      dispose() {
        running = false;
        ro.disconnect();
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('pointercancel', onPointerUp);
        canvas.removeEventListener('pointerleave', onLeave);
        geometry.dispose();
        material.dispose();
        glowMat.dispose(); glowMat2.dispose(); glowTex.dispose();
        renderer.dispose();
      },
    };
  }

  window.Hoguera = { mount };
})();
