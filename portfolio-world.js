import * as THREE from './vendor/three/three.module.js';

const reducedDpr = () => Math.min(window.devicePixelRatio || 1, window.matchMedia('(max-width: 760px)').matches ? 1 : 1.35);

function disposeGroup(group) {
  group.traverse(object => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
    else object.material?.dispose();
  });
}

function makeHero() {
  const group = new THREE.Group();
  group.name = 'Curiosity mechanism';
  const metal = new THREE.MeshStandardMaterial({ color: 0x87917e, metalness: .82, roughness: .24 });
  const lime = new THREE.MeshStandardMaterial({ color: 0xc8ff4d, emissive: 0x526d1d, emissiveIntensity: .55, metalness: .3, roughness: .2 });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.1, .15, 160, 16, 2, 3), metal);
  group.add(knot);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.31, 2), lime);
  group.add(core);
  const orbitMaterials = [metal, lime, new THREE.MeshStandardMaterial({ color: 0x52594b, metalness: .8, roughness: .3 })];
  const orbitData = [
    [1.64, [1.02, .18, -.42]], [1.87, [-.64, .92, .2]], [1.39, [.28, -.42, 1.1]]
  ];
  orbitData.forEach(([radius, rotation], index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, index === 0 ? .014 : .009, 8, 128), orbitMaterials[index]);
    ring.rotation.set(...rotation);
    group.add(ring);
  });
  const bead = new THREE.Mesh(new THREE.SphereGeometry(.065, 14, 10), lime);
  bead.position.set(1.78, .25, .05);
  group.add(bead);
  group.userData.motion = { knot, core, bead };
  return group;
}

export function initPortfolioWorld({ gsap, ScrollTrigger, reducedMotionQuery, finePointerQuery }) {
  const canvas = document.getElementById('world-canvas');
  const hosts = [...document.querySelectorAll('.scene-host[data-scene]')];
  if (!canvas || !hosts.length || reducedMotionQuery.matches) return;

  const root = document.documentElement;
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const rendererOptions = {
    alpha: true, antialias: !mobileQuery.matches,
    powerPreference: 'low-power', stencil: false, depth: true
  };
  let context = null;
  try {
    context = canvas.getContext('webgl2', rendererOptions);
  } catch {
    root.dataset.worldFallback = 'no-webgl2';
  }
  if (!context || context.isContextLost()) {
    root.dataset.worldFallback = 'no-webgl2';
    root.dataset.worldReady = 'false';
    return;
  }
  const renderer = new THREE.WebGLRenderer({ canvas, context, ...rendererOptions });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 80);
  const world = new THREE.Group();
  scene.add(world);
  scene.add(new THREE.HemisphereLight(0xe8ece4, 0x13130f, 1.55));
  const key = new THREE.DirectionalLight(0xf5f5f0, 3.2);
  key.position.set(-4, 7, 8);
  scene.add(key);
  const accent = new THREE.PointLight(0xc8ff4d, 12, 12, 2);
  accent.position.set(3, 2.5, 3);
  scene.add(accent);

  const hero = makeHero();
  const records = hosts.map(host => ({
    host, id: host.dataset.scene, progress: 0, sceneData: null, ready: false,
    failed: false, trigger: null, observedRatio: 0
  }));
  const projectIds = new Set(['geosense', 'agrinex', 'rsa', 'gurubaran']);
  let activeRecord = null;
  let activeGroup = null;
  let rafId = 0;
  let elapsed = 0;
  let visible = !document.hidden;
  let disposed = false;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let projectsPromise = null;
  let size = { width: 1, height: 1 };

  function updateSize(record = activeRecord) {
    if (!record || disposed) return;
    const bounds = record.host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    if (width === size.width && height === size.height) return;
    size = { width, height };
    renderer.setPixelRatio(reducedDpr());
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const data = record.sceneData?.camera;
    camera.fov = data?.fov || (mobileQuery.matches ? 43 : 38);
    camera.position.fromArray(data?.mobilePosition && mobileQuery.matches ? data.mobilePosition : (data?.position || [0, 0, mobileQuery.matches ? 9 : 8]));
    camera.lookAt(...(data?.target || [0, 0, 0]));
    camera.updateProjectionMatrix();
  }

  function renderFrame(now) {
    rafId = 0;
    if (disposed || !visible || reducedMotionQuery.matches || !activeRecord || !activeGroup) return;
    elapsed = now * .001;
    pointerX += (targetX - pointerX) * .055;
    pointerY += (targetY - pointerY) * .055;
    const record = activeRecord;
    const group = activeGroup;
    if (record.id === 'hero') {
      const { knot, core, bead } = group.userData.motion;
      group.rotation.set(pointerY * .12, elapsed * .11 + pointerX * .18, Math.sin(elapsed * .2) * .04);
      knot.rotation.x = .2 + Math.sin(elapsed * .22) * .08;
      knot.rotation.y = elapsed * .17;
      core.rotation.set(elapsed * -.12, elapsed * .19, 0);
      bead.position.set(Math.cos(elapsed * .35) * 1.78, Math.sin(elapsed * .42) * .28, Math.sin(elapsed * .35) * .18);
    } else {
      group.rotation.x = pointerY * .018;
      group.rotation.z = pointerX * -.018;
      record.sceneData?.update?.(record.progress, elapsed, record.host);
    }
    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(renderFrame);
  }

  function start() {
    if (!disposed && visible && !reducedMotionQuery.matches && activeGroup && !rafId) rafId = window.requestAnimationFrame(renderFrame);
  }

  function stop() {
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  async function prepareProject(record) {
    if (record.ready || record.failed) return;
    try {
      projectsPromise ||= import('./project-scenes.js?v=20261118-scenes4');
      const { createProjectScene } = await projectsPromise;
      if (disposed) return;
      record.sceneData = createProjectScene(record.id);
      record.ready = true;
      world.add(record.sceneData.root);
    } catch (error) {
      record.failed = true;
      root.dataset.worldFallback = 'true';
    }
  }

  async function activate(record) {
    if (disposed || reducedMotionQuery.matches) return;
    if (!record) {
      stop();
      canvas.hidden = true;
      activeRecord = null;
      activeGroup = null;
      root.dataset.worldReady = 'false';
      return;
    }
    if (activeRecord === record && activeGroup) return;
    activeRecord = record;
    stop();
    canvas.hidden = true;
    if (projectIds.has(record.id)) await prepareProject(record);
    if (disposed || activeRecord !== record) return;
    const nextGroup = record.id === 'hero' ? hero : record.sceneData?.root;
    if (!nextGroup) return;
    if (activeGroup) activeGroup.visible = false;
    records.forEach(item => { if (item.sceneData?.root) item.sceneData.root.visible = item === record; });
    hero.visible = record.id === 'hero';
    nextGroup.visible = true;
    activeGroup = nextGroup;
    if (!nextGroup.parent) world.add(nextGroup);
    record.host.appendChild(canvas);
    canvas.hidden = false;
    size = { width: 0, height: 0 };
    updateSize(record);
    record.sceneData?.update?.(record.progress, elapsed, record.host);
    root.dataset.worldReady = 'true';
    start();
  }

  function selectHost() {
    if (disposed || reducedMotionQuery.matches) return;
    const height = window.innerHeight;
    const midpoint = height * .52;
    const visibleRecords = records.map(record => {
      const rect = record.host.getBoundingClientRect();
      const isVisible = rect.bottom > 0 && rect.top < height;
      const distance = Math.abs((rect.top + rect.bottom) / 2 - midpoint);
      return { record, isVisible, distance };
    }).filter(item => item.isVisible);
    visibleRecords.sort((a, b) => a.distance - b.distance);
    activate(visibleRecords[0]?.record || null);
  }

  const scrollTriggers = [];
  if (gsap && ScrollTrigger) {
    records.forEach(record => {
      record.trigger = ScrollTrigger.create({
        trigger: record.host,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: self => {
          record.progress = self.progress;
          if (activeRecord === record && record.sceneData?.update) record.sceneData.update(record.progress, elapsed, record.host);
        },
        onEnter: selectHost,
        onEnterBack: selectHost
      });
      scrollTriggers.push(record.trigger);
    });
  }

  const intersectionObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const record = records.find(item => item.host === entry.target);
      if (record) record.observedRatio = entry.intersectionRatio;
    });
    selectHost();
  }, { threshold: [0, .1, .25, .5, .75] }) : null;
  records.forEach(record => intersectionObserver?.observe(record.host));

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(() => updateSize()) : null;
  records.forEach(record => resizeObserver?.observe(record.host));
  const onScroll = () => selectHost();
  const onResize = () => { size = { width: 0, height: 0 }; updateSize(); selectHost(); };
  const onPointer = event => {
    if (!finePointerQuery.matches || event.pointerType === 'touch' || !activeRecord) return;
    const bounds = activeRecord.host.getBoundingClientRect();
    targetX = THREE.MathUtils.clamp((event.clientX - bounds.left) / Math.max(1, bounds.width) - .5, -.5, .5) * 2;
    targetY = -THREE.MathUtils.clamp((event.clientY - bounds.top) / Math.max(1, bounds.height) - .5, -.5, .5) * 2;
  };
  const onVisibility = () => {
    visible = !document.hidden;
    if (visible) start(); else stop();
  };
  const onMotion = event => {
    if (event.matches) {
      stop();
      canvas.hidden = true;
      root.dataset.worldReady = 'false';
    } else {
      selectHost();
    }
  };
  const onContextLost = event => {
    event.preventDefault();
    root.dataset.worldFallback = 'context-lost';
    cleanup();
  };

  function cleanup() {
    if (disposed) return;
    disposed = true;
    stop();
    scrollTriggers.forEach(trigger => trigger.kill());
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', onVisibility);
    reducedMotionQuery.removeEventListener('change', onMotion);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    disposeGroup(hero);
    records.forEach(record => { if (record.sceneData?.root) disposeGroup(record.sceneData.root); });
    renderer.dispose();
    root.dataset.worldReady = 'false';
  }

  canvas.addEventListener('webglcontextlost', onContextLost, false);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  reducedMotionQuery.addEventListener('change', onMotion);
  window.addEventListener('pagehide', event => { if (!event.persisted) cleanup(); }, { once: true });
  window.portfolioWorldDiagnostics = () => ({
    activeScene: activeRecord?.id || null,
    cachedScenes: records.filter(record => record.ready).map(record => record.id),
    rendererCount: 1,
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    pixelRatio: renderer.getPixelRatio(),
    visible: visible && Boolean(activeRecord)
  });
  selectHost();
}
