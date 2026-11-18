import * as THREE from './vendor/three/three.module.js';

const clamp01 = value => THREE.MathUtils.clamp(value, 0, 1);
const ease = value => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function group(name) {
  const value = new THREE.Group();
  value.name = name;
  return value;
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .72, metalness: .08, ...options });
}

function addMesh(parent, geometry, surface, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function addPlane(parent, width, depth, color, y = 0, options = {}) {
  const plane = addMesh(parent, new THREE.PlaneGeometry(width, depth), material(color, options), [0, y, 0], [-Math.PI / 2, 0, 0]);
  plane.name = 'ground plane';
  return plane;
}

function addLine(parent, points, color, opacity = 1, draw = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point)));
  const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false, toneMapped: false });
  const line = new THREE.Line(geometry, lineMaterial);
  line.frustumCulled = false;
  if (draw) line.geometry.setDrawRange(0, 1);
  parent.add(line);
  return line;
}

function addLineSegments(parent, positions, color, opacity = 1) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.flat(), 3));
  const line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false, toneMapped: false }));
  line.frustumCulled = false;
  parent.add(line);
  return line;
}

function addRing(parent, radius, tube, color, opacity = 1, position = [0, 0, 0]) {
  const ring = addMesh(parent, new THREE.TorusGeometry(radius, tube, 8, 96), new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false, toneMapped: false }), position, [-Math.PI / 2, 0, 0]);
  ring.frustumCulled = false;
  return ring;
}

function addCurve(parent, curve, color, opacity = 1, steps = 150) {
  const points = curve.getPoints(steps);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.setDrawRange(0, 1);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false, toneMapped: false }));
  line.frustumCulled = false;
  parent.add(line);
  return { curve, line, steps };
}

function addGlowNode(parent, color, position, height = .34) {
  const node = group('network node');
  node.position.set(...position);
  const stem = addMesh(node, new THREE.CylinderGeometry(.025, .045, height, 8), material(color, { emissive: color, emissiveIntensity: .3, roughness: .44 }), [0, height / 2, 0]);
  const crown = addMesh(node, new THREE.SphereGeometry(.095, 14, 10), new THREE.MeshStandardMaterial({ color: 0xf5f5f0, emissive: color, emissiveIntensity: 1.35, roughness: .24, metalness: .22 }), [0, height + .06, 0]);
  stem.name = 'signal stem';
  crown.name = 'signal light';
  addRing(node, .17, .012, color, .62, [0, .025, 0]);
  parent.add(node);
  return node;
}

function createGeoSense() {
  const root = group('GeoSense destination map');
  root.rotation.y = -.16;
  addPlane(root, 9.2, 6.5, 0x10181b, -.12, { roughness: .96, metalness: .02 });

  const mapLines = [];
  for (let x = -4.3; x <= 4.31; x += .72) mapLines.push([[x, -.095, -3.05], [x, -.095, 3.05]]);
  for (let z = -3.0; z <= 3.01; z += .72) mapLines.push([[-4.45, -.095, z], [4.45, -.095, z]]);
  addLineSegments(root, mapLines.flat(), 0x30444b, .4);

  const roads = [
    [-3.55, -1.82, 1.7, .14, .035], [-1.45, -1.82, 2.0, .14, .035],
    [.95, -1.82, 2.4, .14, .035], [3.0, -1.1, .14, 1.6, .035],
    [-2.85, -.32, .14, 2.85, .035], [-.65, .05, .14, 2.75, .035],
    [1.65, .5, .14, 2.5, .035], [-2.4, 1.35, 2.0, .14, .035],
    [0, 2.28, 2.1, .14, .035], [3.35, 2.28, 1.0, .14, .035]
  ];
  roads.forEach(([x, z, width, depth, y]) => addMesh(root, new THREE.BoxGeometry(width, .025, depth), material(0x293337, { roughness: .84 }), [x, y, z]));

  const blockMaterial = material(0x1a2529, { roughness: .86, metalness: .1 });
  const blocks = [
    [-3.65, -2.55, .48, .46, .25], [-2.2, -2.55, .72, .38, .34], [-.95, -2.55, .55, .4, .28],
    [1.05, -2.55, .62, .42, .48], [2.45, -2.55, .55, .48, .31], [3.75, -2.55, .52, .42, .26],
    [-3.7, .48, .56, .62, .44], [-1.82, .55, .44, .72, .35], [.18, .75, .6, .58, .4],
    [2.65, -.48, .62, .54, .52], [-3.65, 2.7, .5, .35, .25], [-1.55, 2.85, .72, .35, .31],
    [.4, 2.85, .56, .38, .3], [2.05, 2.85, .5, .35, .27], [3.55, 1.2, .5, .6, .36]
  ];
  const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
  const blockInstances = new THREE.InstancedMesh(blockGeometry, blockMaterial, blocks.length);
  const object = new THREE.Object3D();
  blocks.forEach(([x, z, width, depth, height], index) => {
    object.position.set(x, .05 + height / 2, z);
    object.scale.set(width, height, depth);
    object.rotation.y = index % 3 === 0 ? .08 : 0;
    object.updateMatrix();
    blockInstances.setMatrixAt(index, object.matrix);
  });
  blockInstances.instanceMatrix.needsUpdate = true;
  blockInstances.name = 'low map blocks';
  root.add(blockInstances);

  const route = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.55, .05, -2.2), new THREE.Vector3(-2.15, .08, -1.65),
    new THREE.Vector3(-1.42, .08, -.72), new THREE.Vector3(-.5, .09, -.46),
    new THREE.Vector3(.4, .09, .2), new THREE.Vector3(1.55, .1, .48),
    new THREE.Vector3(2.45, .11, 1.35)
  ]);
  const routeLine = addCurve(root, route, 0x43c9e8, .96, 180);
  const routeGlow = addCurve(root, route, 0x43c9e8, .23, 180);
  routeGlow.line.material.linewidth = 3;

  const destination = group('saved destination');
  destination.position.set(2.45, .06, 1.35);
  addMesh(destination, new THREE.CylinderGeometry(.055, .08, .35, 10), material(0x43c9e8, { emissive: 0x167b91, emissiveIntensity: .65 }), [0, .2, 0]);
  addMesh(destination, new THREE.SphereGeometry(.14, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe7fbff, emissive: 0x43c9e8, emissiveIntensity: 1.3, roughness: .2 }), [0, .42, 0]);
  const destinationPulse = addRing(destination, .44, .018, 0x43c9e8, .78, [0, .035, 0]);
  const arrivalPulse = addRing(destination, .68, .009, 0x9befff, .4, [0, .02, 0]);
  root.add(destination);

  const marker = group('moving passenger position');
  addMesh(marker, new THREE.SphereGeometry(.13, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd9fbff, emissive: 0x43c9e8, emissiveIntensity: 1.45, roughness: .18 }), [0, .12, 0]);
  addRing(marker, .25, .012, 0x43c9e8, .72, [0, .035, 0]);
  const markerHalo = addRing(marker, .38, .008, 0x84e9f8, .26, [0, .025, 0]);
  root.add(marker);

  const glow = new THREE.PointLight(0x43c9e8, 2.8, 5.5, 2);
  glow.position.set(-.5, 1.5, 0);
  root.add(glow);
  const camera = { position: [0, 7.1, 10.9], target: [0, 0, 0], fov: 38, mobilePosition: [0, 8.5, 13] };
  let lastDistance = '';
  let lastState = '';

  return {
    root,
    camera,
    update(progress, time, host) {
      const p = ease(progress);
      const drawn = Math.max(2, Math.floor(routeLine.steps * p));
      routeLine.line.geometry.setDrawRange(0, drawn);
      routeGlow.line.geometry.setDrawRange(0, drawn);
      route.getPointAt(p, marker.position);
      marker.position.y += .18 + Math.sin(time * 2.2) * .035;
      markerHalo.rotation.z = time * .45;
      destinationPulse.scale.setScalar(1 + Math.sin(time * 2.8) * .045 + (p > .96 ? .12 : 0));
      arrivalPulse.scale.setScalar(1 + ((time * .38) % 1) * (p > .97 ? .7 : .05));
      arrivalPulse.material.opacity = p > .97 ? .5 * (1 - ((time * .38) % 1)) : .16;
      const distance = p > .995 ? '0 m' : `${(2.4 * (1 - p)).toFixed(2)} km`;
      const state = p > .97 ? 'DESTINATION REACHED' : 'ROUTE PREVIEW';
      if (distance !== lastDistance) {
        const value = host?.querySelector('[data-scene-distance]');
        if (value) value.textContent = distance;
        lastDistance = distance;
      }
      if (state !== lastState) {
        const value = host?.querySelector('[data-scene-state]');
        if (value) value.textContent = state;
        lastState = state;
      }
    }
  };
}

function createAgriNex() {
  const root = group('AgriNex farm and marketplace');
  root.rotation.y = -.18;
  addPlane(root, 9, 6.4, 0x111a12, -.1, { roughness: .96 });
  const fieldMaterial = material(0x263923, { roughness: .94 });
  const fieldCenters = [[-2.65, -1.62], [0, -1.62], [2.65, -1.62], [-2.65, 1.45], [0, 1.45], [2.65, 1.45]];
  fieldCenters.forEach(([x, z], index) => {
    const patch = addMesh(root, new THREE.BoxGeometry(2.26, .09, 2.25), fieldMaterial, [x, -.02, z]);
    patch.name = `crop bed ${index + 1}`;
  });

  const cropGroup = group('instanced crop rows');
  root.add(cropGroup);
  const cropPositions = [];
  for (const [cx, cz] of fieldCenters) {
    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 8; column++) {
        cropPositions.push([cx - .92 + column * .26, .16 + ((row + column) % 3) * .035, cz - .88 + row * .58, (column % 3) * .08]);
      }
    }
  }
  const stemGeometry = new THREE.CylinderGeometry(.023, .035, .43, 5);
  const stemMaterial = material(0x52733b, { roughness: .86 });
  const stems = new THREE.InstancedMesh(stemGeometry, stemMaterial, cropPositions.length);
  const leafGeometry = new THREE.ConeGeometry(.11, .32, 5);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x8fbf67, roughness: .74, emissive: 0x18320e, emissiveIntensity: .2 });
  const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, cropPositions.length);
  const cropObject = new THREE.Object3D();
  cropPositions.forEach(([x, y, z, turn], index) => {
    cropObject.position.set(x, y, z);
    cropObject.rotation.set(0, turn, 0);
    cropObject.scale.set(1, .78 + (index % 4) * .08, 1);
    cropObject.updateMatrix();
    stems.setMatrixAt(index, cropObject.matrix);
    cropObject.position.y += .37 + (index % 4) * .025;
    cropObject.rotation.z = (index % 2 ? .13 : -.13);
    cropObject.updateMatrix();
    leaves.setMatrixAt(index, cropObject.matrix);
  });
  stems.instanceMatrix.needsUpdate = true;
  leaves.instanceMatrix.needsUpdate = true;
  stems.name = 'crop stems';
  leaves.name = 'crop crowns';
  cropGroup.add(stems, leaves);

  const farmer = addGlowNode(root, 0x8fbf67, [-3.35, .03, .05], .48);
  farmer.name = 'farmer supply point';
  const buyer = addGlowNode(root, 0xe3bd73, [3.45, .03, .05], .48);
  buyer.name = 'buyer market point';

  const flow = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.25, .2, .05), new THREE.Vector3(-2.5, .42, -.1),
    new THREE.Vector3(-1.35, .7, .45), new THREE.Vector3(0, .84, .12),
    new THREE.Vector3(1.45, .62, -.48), new THREE.Vector3(2.55, .35, .02),
    new THREE.Vector3(3.42, .2, .05)
  ]);
  const supplyLine = addCurve(root, flow, 0x8fbf67, .92, 156);
  const logisticsLine = addCurve(root, flow, 0xe3bd73, .24, 156);

  const produceMaterial = material(0xc4a05c, { emissive: 0x251806, emissiveIntensity: .3, roughness: .48 });
  const crate = group('produce moving through market');
  const crateBody = addMesh(crate, new THREE.BoxGeometry(.34, .27, .34), produceMaterial, [0, 0, 0]);
  const crateTop = addMesh(crate, new THREE.BoxGeometry(.36, .035, .36), material(0x8fbf67, { roughness: .7 }), [0, .15, 0]);
  crateBody.name = 'produce crate';
  crate.add(crateTop);
  root.add(crate);

  const graph = group('demand and supply plot');
  graph.position.set(2.4, .75, -2.15);
  const graphMaterial = material(0x1d2a1c, { roughness: .82, metalness: .08 });
  addMesh(graph, new THREE.BoxGeometry(2.25, .045, 1.25), graphMaterial, [0, 0, 0]);
  const graphFrame = [
    [[-1.05, .06, -.53], [1.05, .06, -.53]], [[-1.05, .06, -.53], [-1.05, .06, .53]],
    [[-1.05, .06, .53], [1.05, .06, .53]], [[1.05, .06, -.53], [1.05, .06, .53]]
  ];
  addLineSegments(graph, graphFrame.flat(), 0x9caa91, .38);
  const barHeights = [.24, .39, .32, .62, .48, .74, .57, .86];
  const demandBars = [];
  const supplyBars = [];
  barHeights.forEach((height, index) => {
    const bar = addMesh(graph, new THREE.BoxGeometry(.105, height, .13), material(0x8fbf67, { emissive: 0x15240d, emissiveIntensity: .18 }), [-.75 + index * .21, .065 + height / 2, -.1]);
    demandBars.push(bar);
    if (index % 2 === 0) {
      const second = addMesh(graph, new THREE.BoxGeometry(.08, height * .56, .11), material(0xe3bd73, { roughness: .66 }), [-.75 + index * .21, .065 + height * .28, .18]);
      supplyBars.push(second);
    }
  });
  const graphCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.8, .4, .13), new THREE.Vector3(-.38, .54, .13), new THREE.Vector3(.02, .43, .13),
    new THREE.Vector3(.44, .79, .13), new THREE.Vector3(.82, .68, .13)
  ]);
  const graphLine = addCurve(graph, graphCurve, 0xf0d392, .72, 64);
  graphLine.line.geometry.setDrawRange(0, graphLine.steps + 1);
  root.add(graph);

  const wind = new THREE.PointLight(0x8fbf67, 2.2, 6.5, 2);
  wind.position.set(-1.8, 2.5, 1.4);
  root.add(wind);
  const camera = { position: [0, 7.7, 12.8], target: [0, .1, 0], fov: 38, mobilePosition: [0, 9.2, 15] };
  return {
    root,
    camera,
    update(progress, time) {
      const p = ease(progress);
      const count = Math.max(2, Math.floor(supplyLine.steps * p));
      supplyLine.line.geometry.setDrawRange(0, count);
      logisticsLine.line.geometry.setDrawRange(0, count);
      flow.getPointAt(p, crate.position);
      crate.position.y += .18 + Math.sin(time * 2.1) * .045;
      crate.rotation.y = Math.sin(time * 1.6) * .12;
      cropGroup.rotation.z = Math.sin(time * .45) * .012;
      farmer.children[1].rotation.y = time * .55;
      buyer.children[1].rotation.y = -time * .48;
      graph.rotation.y = Math.sin(time * .22) * .025;
      demandBars.forEach((bar, index) => { bar.scale.y = 1 + Math.sin(time * .65 + index * .7) * .045; });
      supplyBars.forEach((bar, index) => { bar.scale.y = 1 + Math.sin(time * .56 + index) * .055; });
    }
  };
}

function createRsaBookings() {
  const root = group('RSA badminton booking court');
  root.rotation.y = -.08;
  addPlane(root, 10.6, 7.2, 0x0b1610, -.12, { roughness: .96 });
  const courtLength = 8.58;
  const courtWidth = 3.9;
  const court = addMesh(root, new THREE.BoxGeometry(courtLength, .075, courtWidth), material(0x15542b, { roughness: .76, metalness: .03, emissive: 0x09210f, emissiveIntensity: .18 }), [0, 0, 0]);
  court.name = 'badminton court surface';
  const lineY = .044;
  const x0 = -courtLength / 2;
  const x1 = courtLength / 2;
  const z0 = -courtWidth / 2;
  const z1 = courtWidth / 2;
  const singlesZ = 1.66;
  const longServiceX = 3.62;
  const shortServiceX = 1.28;
  const courtMarks = [
    [[x0, lineY, z0], [x1, lineY, z0]], [[x1, lineY, z0], [x1, lineY, z1]],
    [[x1, lineY, z1], [x0, lineY, z1]], [[x0, lineY, z1], [x0, lineY, z0]],
    [[x0, lineY, -singlesZ], [x1, lineY, -singlesZ]], [[x0, lineY, singlesZ], [x1, lineY, singlesZ]],
    [[0, lineY, z0], [0, lineY, z1]],
    [[-shortServiceX, lineY, z0], [-shortServiceX, lineY, z1]],
    [[shortServiceX, lineY, z0], [shortServiceX, lineY, z1]],
    [[-longServiceX, lineY, z0], [-longServiceX, lineY, z1]],
    [[longServiceX, lineY, z0], [longServiceX, lineY, z1]],
    [[0, lineY, -singlesZ], [0, lineY, singlesZ]]
  ];
  addLineSegments(root, courtMarks.flat(), 0xf4f5f0, .9);

  const netGroup = group('badminton net and posts');
  const netMaterial = material(0xe0e6df, { roughness: .78, metalness: .04 });
  [-1, 1].forEach(sign => addMesh(netGroup, new THREE.CylinderGeometry(.035, .045, .98, 10), material(0xcbd5cc, { metalness: .54, roughness: .33 }), [0, .49, sign * (courtWidth / 2 - .04)]));
  const netLines = [];
  const netTop = .94;
  for (let z = -courtWidth / 2 + .08; z <= courtWidth / 2 - .08; z += .22) netLines.push([[0, .05, z], [0, netTop, z]]);
  for (let y = .1; y < netTop; y += .13) netLines.push([[0, y, z0], [0, y, z1]]);
  addLineSegments(netGroup, netLines.flat(), 0xb8c5ba, .5);
  addLine(netGroup, [[0, netTop, z0], [0, netTop, z1]], 0xf5f5f0, .9);
  root.add(netGroup);

  const selectedCourt = addMesh(root, new THREE.PlaneGeometry(2.15, 1.25), new THREE.MeshBasicMaterial({ color: 0x74d986, transparent: true, opacity: .14, depthWrite: false, side: THREE.DoubleSide }), [2.55, lineY + .008, -.15], [-Math.PI / 2, 0, 0]);
  selectedCourt.name = 'selected court zone';
  const selectedOutline = addLineSegments(root, [
    [[1.48, lineY + .015, -.77], [3.62, lineY + .015, -.77]], [[3.62, lineY + .015, -.77], [3.62, lineY + .015, .47]],
    [[3.62, lineY + .015, .47], [1.48, lineY + .015, .47]], [[1.48, lineY + .015, .47], [1.48, lineY + .015, -.77]]
  ].flat(), 0x77d986, .86);

  const flight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.25, 2.55, .75), new THREE.Vector3(-2.2, 2.86, .5),
    new THREE.Vector3(-.8, 2.36, .1), new THREE.Vector3(.55, 1.55, -.24),
    new THREE.Vector3(2.55, .92, -.15)
  ]);
  const trajectory = addCurve(root, flight, 0xf5f5f0, .7, 150);
  const shuttle = group('feather shuttlecock');
  const featherMaterial = material(0xf3f4ed, { roughness: .56, metalness: .02, emissive: 0x30372b, emissiveIntensity: .13, side: THREE.DoubleSide });
  addMesh(shuttle, new THREE.ConeGeometry(.32, .6, 10), featherMaterial, [0, .01, 0], [0, 0, Math.PI]);
  addMesh(shuttle, new THREE.SphereGeometry(.095, 12, 8), material(0xd4b58c, { roughness: .55 }), [0, -.34, 0]);
  addMesh(shuttle, new THREE.TorusGeometry(.255, .018, 6, 14), material(0xe0e3dc, { roughness: .58 }), [0, .29, 0]);
  addMesh(shuttle, new THREE.SphereGeometry(.035, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf8f7ee, emissive: 0xf5f5f0, emissiveIntensity: .65 }), [0, -.34, 0]);
  root.add(shuttle);
  const flightLight = new THREE.PointLight(0xf5f5f0, 1.1, 3.8, 2);
  root.add(flightLight);
  const confirmRing = addRing(root, .48, .018, 0x77d986, .86, [2.55, .06, -.15]);
  const camera = { position: [0, 7.8, 12.7], target: [0, .1, 0], fov: 38, mobilePosition: [0, 9.6, 15.4] };
  let lastState = '';
  return {
    root,
    camera,
    update(progress, time, host) {
      const p = ease(progress);
      const count = Math.max(2, Math.floor(trajectory.steps * p));
      trajectory.line.geometry.setDrawRange(0, count);
      flight.getPointAt(p, shuttle.position);
      shuttle.rotation.z = -.32 + Math.sin(time * 2) * .09;
      shuttle.rotation.x = .3 + Math.cos(time * 1.5) * .12;
      flightLight.position.copy(shuttle.position);
      flightLight.position.y += .15;
      confirmRing.scale.setScalar(.92 + Math.sin(time * 2.1) * .045 + (p > .9 ? .13 : 0));
      selectedCourt.material.opacity = .12 + Math.sin(time * 1.8) * .025 + (p > .82 ? .09 : 0);
      const state = p > .92 ? 'BOOKING CONFIRMED' : 'CHOOSE A COURT';
      if (state !== lastState) {
        const value = host?.querySelector('[data-scene-state]');
        if (value) value.textContent = state;
        lastState = state;
      }
    }
  };
}

function makeSegmentInstances(parent, segments, color, thickness, emissive = 0x000000) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const surface = material(color, { metalness: .58, roughness: .38, emissive, emissiveIntensity: .35 });
  const instances = new THREE.InstancedMesh(geometry, surface, segments.length);
  const axis = new THREE.Vector3(1, 0, 0);
  const direction = new THREE.Vector3();
  const object = new THREE.Object3D();
  segments.forEach((segment, index) => {
    const a = new THREE.Vector3(...segment[0]);
    const b = new THREE.Vector3(...segment[1]);
    direction.subVectors(b, a);
    const length = direction.length();
    direction.normalize();
    object.position.copy(a).add(b).multiplyScalar(.5);
    object.quaternion.setFromUnitVectors(axis, direction);
    object.scale.set(length, thickness, thickness);
    object.updateMatrix();
    instances.setMatrixAt(index, object.matrix);
  });
  instances.instanceMatrix.needsUpdate = true;
  parent.add(instances);
  return instances;
}

function createGurubaran() {
  const root = group('Gurubaran Builders steel frame');
  root.rotation.y = -.35;
  addPlane(root, 10.6, 8.1, 0x11100e, -.12, { roughness: .96 });
  const floorGrid = [];
  for (let x = -5; x <= 5.01; x += .5) floorGrid.push([[x, -.095, -3.8], [x, -.095, 3.8]]);
  for (let z = -3.5; z <= 3.51; z += .5) floorGrid.push([[-5.1, -.095, z], [5.1, -.095, z]]);
  addLineSegments(root, floorGrid.flat(), 0x3a332b, .34);

  const xs = [-3.6, -1.8, 0, 1.8, 3.6];
  const zs = [-2.7, -.9, .9, 2.7];
  const floorHeight = 1.08;
  const levels = [];
  const floorMaterial = material(0xd6d0c8, { transparent: true, opacity: .08, metalness: .04, roughness: .82, depthWrite: false, side: THREE.DoubleSide });

  for (let levelIndex = 0; levelIndex < 4; levelIndex++) {
    const level = group(`structural level ${levelIndex + 1}`);
    level.position.y = levelIndex * floorHeight;
    const columns = [];
    const beams = [];
    const braces = [];
    const accentBraces = [];
    for (const x of xs) {
      for (const z of zs) {
        columns.push([[x, .02, z], [x, floorHeight, z]]);
      }
    }
    for (let zi = 0; zi < zs.length; zi++) {
      for (let xi = 0; xi < xs.length - 1; xi++) {
        const x0 = xs[xi], x1 = xs[xi + 1], z = zs[zi];
        beams.push([[x0, .03, z], [x1, .03, z]], [[x0, floorHeight, z], [x1, floorHeight, z]]);
        if (zi === 0 || zi === zs.length - 1) {
          braces.push([[x0, .1, z], [x1, floorHeight - .08, z]], [[x1, .1, z], [x0, floorHeight - .08, z]]);
          if ((xi + levelIndex) % 2 === 0) accentBraces.push([[x0, .1, z], [x1, floorHeight - .08, z]]);
        }
      }
    }
    for (let xi = 0; xi < xs.length; xi++) {
      for (let zi = 0; zi < zs.length - 1; zi++) {
        const x = xs[xi], z0 = zs[zi], z1 = zs[zi + 1];
        beams.push([[x, .03, z0], [x, .03, z1]], [[x, floorHeight, z0], [x, floorHeight, z1]]);
        if (xi === 0 || xi === xs.length - 1) {
          braces.push([[x, .1, z0], [x, floorHeight - .08, z1]], [[x, .1, z1], [x, floorHeight - .08, z0]]);
          if ((zi + levelIndex) % 2 === 0) accentBraces.push([[x, .1, z0], [x, floorHeight - .08, z1]]);
        }
      }
    }

    makeSegmentInstances(level, columns, 0xe4e8e6, .075, 0x1b2421);
    makeSegmentInstances(level, beams, 0xd5dbd8, .062, 0x121a17);
    makeSegmentInstances(level, braces, 0xbfc9c4, .035, 0x0d1713);
    makeSegmentInstances(level, accentBraces, 0xf1a45d, .025, 0x814619);
    const slab = addMesh(level, new THREE.BoxGeometry(7.35, .055, 5.45), floorMaterial.clone(), [0, floorHeight - .05, 0]);
    slab.name = `partial floor plate ${levelIndex + 1}`;
    root.add(level);
    levels.push({ group: level, slab });
  }

  const perimeter = addRing(root, .18, .012, 0xf1a45d, .65, [-4.55, .03, -3.45]);
  const survey = [
    [-3.6, .12, -2.7], [3.6, .12, -2.7], [-3.6, .12, 2.7], [3.6, .12, 2.7]
  ];
  survey.forEach((position, index) => {
    const beacon = addMesh(root, new THREE.SphereGeometry(.055, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf1a45d, emissive: 0xf1a45d, emissiveIntensity: .8, roughness: .3 }), position);
    beacon.name = `survey point ${index + 1}`;
  });
  const workLight = new THREE.PointLight(0xf1a45d, 2.4, 8, 2);
  workLight.position.set(0, 4.6, 3.6);
  root.add(workLight);
  const camera = { position: [8.4, 7.7, 11.8], target: [0, 1.5, 0], fov: 38, mobilePosition: [10.5, 9.1, 14.7] };
  let lastLevel = '';
  return {
    root,
    camera,
    update(progress, time, host) {
      const stage = clamp01(progress) * levels.length;
      const completed = Math.floor(stage);
      const local = stage >= levels.length ? 1 : stage - completed;
      levels.forEach(({ group: level, slab }, index) => {
        const full = index < completed;
        const current = index === completed && local > .006;
        level.visible = full || current;
        level.scale.y = full ? 1 : current ? Math.max(.015, ease(local)) : 1;
        const solidity = full ? (index > 0 ? .17 : .1) : current ? .08 + ease(local) * .1 : .055;
        slab.material.opacity = solidity;
      });
      perimeter.rotation.y = time * .16;
      workLight.intensity = 2.2 + Math.sin(time * .8) * .16;
      const levelNumber = Math.min(levels.length, Math.max(1, completed + (local > .1 ? 1 : 0)));
      const label = stage >= levels.length ? 'FRAME COMPLETE' : `LEVEL ${String(levelNumber).padStart(2, '0')} / 04`;
      const meter = `${Math.round(clamp01(progress) * 100)}%`;
      const labelElement = host?.querySelector('[data-scene-level]');
      const progressElement = host?.querySelector('[data-scene-progress]');
      if (label !== lastLevel) {
        if (labelElement) labelElement.textContent = label;
        lastLevel = label;
      }
      if (progressElement) progressElement.style.width = meter;
    }
  };
}

const builders = {
  geosense: createGeoSense,
  agrinex: createAgriNex,
  rsa: createRsaBookings,
  gurubaran: createGurubaran
};

export function createProjectScene(id) {
  const builder = builders[id];
  if (!builder) throw new Error(`Unknown portfolio project scene: ${id}`);
  return builder();
}
