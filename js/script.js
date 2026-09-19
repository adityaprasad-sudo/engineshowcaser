import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const sceneobj1 = new THREE.Scene();
sceneobj1.background = new THREE.Color(0xFFFFFF);

const camtestvar = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  25,
  10000
);

const rendthingy = new THREE.WebGLRenderer({ antialias: true });
rendthingy.setSize(window.innerWidth, window.innerHeight);
rendthingy.setPixelRatio(Math.min(window.devicePixelRatio, 2));
rendthingy.toneMapping = THREE.ACESFilmicToneMapping;
rendthingy.toneMappingExposure = 1.0;

document.body.appendChild(rendthingy.domElement);

const pmremGenerator = new THREE.PMREMGenerator(rendthingy);
sceneobj1.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const ctrlvar = new OrbitControls(camtestvar, rendthingy.domElement);
ctrlvar.enableDamping = true;
ctrlvar.dampingFactor = 0.05;
ctrlvar.autoRotate = true;
ctrlvar.minDistance = 100;
ctrlvar.maxDistance = 600;
ctrlvar.enablePan = false;
ctrlvar.autoRotateSpeed = 1.0;

new EXRLoader().load('./hdri/empty_warehouse_01_4k.exr', (textmp) => {
  textmp.mapping = THREE.EquirectangularReflectionMapping;
  sceneobj1.environment = textmp;
});

const amblightx = new THREE.AmbientLight(0xffffff, 1.5);
sceneobj1.add(amblightx);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 20, 10);
sceneobj1.add(directionalLight);

let propGear, fuelPumpGear, alternator, crankshaftfrontend, waterimpeller;
let mixer, fuelimpeller, alternatorcover, mainAction;
let Case1, Case2, Case3, Case4, Cover1, Cover2, Cover3, Cover4, Cover5, Cover6;

let engineRPM = 10; 

let engineModel;
let engineBasePosition = null;
let nativeAnimDuration = 0;

const loadr1 = new GLTFLoader();
loadr1.load(
  './models/white_round_exhibition_gallery.glb',
  (datain1) => {
    const modlobj = datain1.scene;
    modlobj.scale.set(200, 200, 200);
    modlobj.position.set(0, -300, 0);

    const bboxtmp = new THREE.Box3().setFromObject(modlobj);
    const midptvar = bboxtmp.getCenter(new THREE.Vector3());
    const szval = bboxtmp.getSize(new THREE.Vector3());

    sceneobj1.add(modlobj);

    modlobj.traverse((nodec) => {
      if (nodec.isMesh && nodec.name === 'Cylinder.016_Material.009_0') {
        nodec.material = nodec.material.clone();
        const coltmp = new THREE.Color(0xFFFF00);
        nodec.material.color.set(coltmp);
        nodec.material.emissive.set(coltmp);
        nodec.material.emissiveIntensity = 4.0;
        nodec.material.toneMapped = false;
        
        const wpvec = new THREE.Vector3();
        nodec.getWorldPosition(wpvec);

        const ptlit = new THREE.PointLight(0xffedd0, 30, 60, 1.2);
        ptlit.position.copy(wpvec);
        sceneobj1.add(ptlit);
      }
    });

    ctrlvar.target.set(0, -szval.y * 0.18, 0);

    const rvaltmp = szval.x * 0.35;
    const hvaltmp = -szval.y * 0.12;
    camtestvar.position.set(0, hvaltmp, rvaltmp);
    ctrlvar.update();
  },
  (xhrtest) => {
    console.log(`Loading Gallery: ${(xhrtest.loaded / xhrtest.total) * 100}%`);
  },
  (errvar) => {
    console.error('Error loading gallery model:', errvar);
  }
);

function makeflowtexfunc(hexcol) {
  const cvstmp = document.createElement('canvas');
  cvstmp.width = 128; 
  cvstmp.height = 128;
  const ctxtmp = cvstmp.getContext('2d');
  
  ctxtmp.fillStyle = '#111111';
  ctxtmp.fillRect(0, 0, 128, 128);
  
  ctxtmp.fillStyle = hexcol;
  for(let ix = 0; ix < 128; ix += 32) {
    ctxtmp.fillRect(ix, 0, 16, 128);
  }
  
  const textmp2 = new THREE.CanvasTexture(cvstmp);
  textmp2.wrapS = THREE.RepeatWrapping;
  textmp2.wrapT = THREE.RepeatWrapping;
  return textmp2;
}

const waterTex = makeflowtexfunc('#00aaff');
const fuelTex = makeflowtexfunc('#ffcc00');
const heatwatertex = makeflowtexfunc('#ff3300');
const insidewatertex = makeflowtexfunc('#E68D2E');
const exhuasttex = makeflowtexfunc('#999999');

window.fluidMaterials = [];

function makeSoftDotTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
const softDotTexture = makeSoftDotTexture();

const dracoldrtemp = new DRACOLoader();
dracoldrtemp.setDecoderPath('https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/libs/draco/');
const loadr2 = new GLTFLoader();
loadr2.setDRACOLoader(dracoldrtemp);

loadr2.load(
  './models/rotax912engine.glb',
  (datain2) => {
    const engmodelstuff = datain2.scene;
    engineModel = engmodelstuff;
    engmodelstuff.scale.set(8, 8, 8);
    engmodelstuff.position.set(0, -150, 0);
    engmodelstuff.rotation.set(0, Math.PI * 0.5, 0);
    sceneobj1.add(engmodelstuff);

    mixer = new THREE.AnimationMixer(engmodelstuff);
    if (datain2.animations.length > 0) {
      nativeAnimDuration = datain2.animations[0].duration;
      const targetRPS = engineRPM / 60;
      mixer.timeScale = targetRPS * nativeAnimDuration;

      datain2.animations.forEach((canim) => {
        mainAction = mixer.clipAction(canim);
        mainAction.play();
      });
    }

    propGear = engmodelstuff.getObjectByName('prop_gear');
    fuelPumpGear = engmodelstuff.getObjectByName('fuel_pump_gear');
    alternator = engmodelstuff.getObjectByName('crankshaft_alternator_end');
    crankshaftfrontend = engmodelstuff.getObjectByName('crankshaft_reduction_end');
    fuelimpeller = engmodelstuff.getObjectByName('fuel_impeller');
    waterimpeller = engmodelstuff.getObjectByName('water_pump_impeller');
    alternatorcover = engmodelstuff.getObjectByName('alternater');

    const wpipenarr = ['belowpipe1', 'belowpipe2', 'belowpipe3', 'belowpipe4'];
    const fpipenarr = ['fuel_pipe_left', 'fuel_pipe_right', 'fuelpipeinside1', 'fuelpipeinside2', 'fuelpipeinside3', 'fuelpipeinside4'];
    const heatewater = ['abovepipe1', 'abovepipe2', 'abovepipe3', 'abovepipe4'];
    const insidewater = ['waterpipeinside1', 'waterpipeinside2', 'waterpipeinside3', 'waterpipeinside4'];
    const exhaustPipes = ['exhaust1', 'exhaust2', 'exhaust3', 'exhaust4'];

    function setuppipefunc(narr, texp, spdval) {
      narr.forEach((nstr) => {
        const pobjtmp = engmodelstuff.getObjectByName(nstr);
        if (pobjtmp && pobjtmp.material) {
          pobjtmp.material = pobjtmp.material.clone();
          const texcln = texp.clone();
          texcln.needsUpdate = true;
          
          pobjtmp.material.map = texcln;
          pobjtmp.material.emissiveMap = texcln;
          pobjtmp.material.emissive = new THREE.Color(0xffffff);
          pobjtmp.material.emissiveIntensity = 0.8;
          pobjtmp.material.needsUpdate = true;
          window.fluidMaterials.push({ mat: pobjtmp.material, speed: spdval });
        }
      });
    }

    setuppipefunc(wpipenarr, waterTex, 0.5); 
    setuppipefunc(fpipenarr, fuelTex, 0.8);
    setuppipefunc(heatewater, heatwatertex, 0.8);
    setuppipefunc(insidewater, insidewatertex, 0.8);
    setuppipefunc(exhaustPipes, exhuasttex, 0.8);

    function doglassstuff(nodeobj, oplvl) {
      if (!nodeobj) return;
      nodeobj.traverse((nchild) => {
        if (nchild.isMesh && nchild.material) {
          nchild.material = nchild.material.clone();
          nchild.material.transparent = true;
          nchild.material.opacity = oplvl;
          nchild.material.depthWrite = false;
          nchild.material.needsUpdate = true;
        }
      });
    }

    const lctest = engmodelstuff.getObjectByName('engine_front1');
    const rctest = engmodelstuff.getObjectByName('cylinder_case_right');
    const hctest = engmodelstuff.getObjectByName('cylinder_case_left');
    Case1 = engmodelstuff.getObjectByName('cylinder_head_case');
    Case2 = engmodelstuff.getObjectByName('cylinder_head_case001');
    Case3 = engmodelstuff.getObjectByName('cylinder_head_case002');
    Case4 = engmodelstuff.getObjectByName('cylinder_head_case003');
    Cover1 = engmodelstuff.getObjectByName('cylinder002');
    Cover2 = engmodelstuff.getObjectByName('cylinder_head001');
    Cover3 = engmodelstuff.getObjectByName('cylinder001');
    Cover4 = engmodelstuff.getObjectByName('cylinderhead003');
    Cover5 = engmodelstuff.getObjectByName('cylinder');
    Cover6 = engmodelstuff.getObjectByName('cylinder003');

    const shellOpacity = 0.3;
    [
      lctest, rctest, hctest, alternatorcover,
      Case1, Case2, Case3, Case4, Cover1, Cover2, Cover3, Cover4, Cover5, Cover6
    ].forEach((oitem) => doglassstuff(oitem, shellOpacity));

    const fmmatvar = new THREE.PointsMaterial({
      color: 0xffffff,
      map: softDotTexture,
      vertexColors: true,
      size: 3.2 * 4,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const gsmmatvar = new THREE.SpriteMaterial({
      map: softDotTexture,
      color: 0x3399ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const cylnarr = ['cylinder', 'cylinder001', 'cylinder002', 'cylinder003']
    cylnarr.forEach((nstr) => {
      const cylobj = engmodelstuff.getObjectByName(nstr);
      if (cylobj) {
        const spktest = new THREE.PointLight(0xff4400, 0, 25);
        spktest.position.set(0, 2, 2.5);
        cylobj.add(spktest)
        window.combustionLights.push(spktest)
        const geotmp = new THREE.BufferGeometry()
        const posarrtmp = new Float32Array(300 * 3)
        const colarrtmp = new Float32Array(300 * 3)
        const layarrtmp = new Float32Array(300)
        const brtarrtmp = new Float32Array(300)

        for (let ix2 = 0; ix2 < 300; ix2++) {
          const thval = Math.random() * Math.PI * 2;
          const rdval = (15 * 4) * Math.sqrt(Math.random())
          const dpval = (Math.random() - 0.5) * (2.0 * 4)

          posarrtmp[ix2 * 3]     = Math.cos(thval) * rdval;
          posarrtmp[ix2 * 3 + 1] = dpval;
          posarrtmp[ix2 * 3 + 2] = Math.sin(thval) * rdval;

          layarrtmp[ix2] = Math.min(299, Math.floor((rdval / (2.2 * 4)) * 300));
          brtarrtmp[ix2] = 0.7 + Math.random() * 0.3;
        }

        geotmp.setAttribute('position', new THREE.BufferAttribute(posarrtmp, 3));
        geotmp.setAttribute('color', new THREE.BufferAttribute(colarrtmp, 3));

        const partobj = new THREE.Points(geotmp, fmmatvar);
        partobj.position.set(0, 2, 2.5);
        partobj.visible = false;
        cylobj.add(partobj);

        window.particleSystems.push(partobj);
        window.fireLayers.push(layarrtmp);
        window.fireBrightness.push(brtarrtmp);

        const glwobj = new THREE.Sprite(gsmmatvar.clone());
        glwobj.position.set(0, 2, 2.5);
        glwobj.scale.set(4, 4, 4);
        cylobj.add(glwobj);
        window.glowSprites.push(glwobj);
      }
    });

    const bboxtmp2 = new THREE.Box3().setFromObject(engmodelstuff);
    const center2 = bboxtmp2.getCenter(new THREE.Vector3());
    engmodelstuff.position.sub(center2);
    engineBasePosition = engmodelstuff.position.clone();

  },
  (xhrtest) => {
    console.log(`Loading Engine: ${(xhrtest.loaded / xhrtest.total) * 100}%`);
  },
  (errvar) => {
    console.error('Error loading engine model:', errvar);
  }
);

let jitterCurrent = new THREE.Vector3();
let jitterTarget = new THREE.Vector3();
let jitterTimer = 0;
let firingPunch = { 0: 0, 1: 0 };
let shakeClockTime = 0;

function triggerFiringPunch(pairIndex) {
  firingPunch[pairIndex] = 1.0;
}

function updateEngineShake(delta) {
  if (!engineModel || !engineBasePosition) return;

  shakeClockTime += delta;
  const vib = 0.25; 

  const rotFreqHz = (engineRPM / 60);
  const idleAmp = 0.015 + vib * 0.5;
  const humX = Math.sin(shakeClockTime * rotFreqHz * Math.PI * 2) * idleAmp;
  const humY = Math.sin(shakeClockTime * rotFreqHz * Math.PI * 2 * 1.7 + 1.3) * idleAmp * 0.6;

  let punchX = 0, punchY = 0;
  [0, 1].forEach((pairIndex) => {
    firingPunch[pairIndex] *= Math.max(0, 1 - delta * 14);
    const dir = pairIndex === 0 ? 1 : -1;
    const amp = firingPunch[pairIndex] * (0.15 + vib * 0.6);
    punchX += dir * amp;
    punchY += amp * 0.5;
  });

  jitterTimer += delta;
  if (jitterTimer > 0.06) {
    jitterTimer = 0;
    const jitterAmp = 0.02 + vib * 0.25;
    jitterTarget.set(
      (Math.random() - 0.5) * jitterAmp,
      (Math.random() - 0.5) * jitterAmp,
      (Math.random() - 0.5) * jitterAmp * 0.5
    );
  }
  jitterCurrent.lerp(jitterTarget, Math.min(1, delta * 10));

  engineModel.position.set(
    engineBasePosition.x + humX + punchX + jitterCurrent.x,
    engineBasePosition.y + humY + punchY + jitterCurrent.y,
    engineBasePosition.z + jitterCurrent.z
  );
  engineModel.rotation.z = (humX * 0.02) + (jitterCurrent.x * 0.01);
  engineModel.rotation.x = (humY * 0.015) + (jitterCurrent.y * 0.01);
}

const cylinderPairs = [[0, 1], [2, 3]];
const pairFireTime = [0, 0.5];
const cylinderFireTime = [0, 0, 0, 0];
cylinderPairs.forEach((pair, pairIndex) => {
  pair.forEach((cyl) => { cylinderFireTime[cyl] = pairFireTime[pairIndex]; });
});

const STROKE_COLORS = {
  power:       0xffffff,
  exhaust:     0x999999,
  intake:      0x3399ff,
  compression: 0xffaa33
};
const STROKE_NAMES = { power: 'Power', exhaust: 'Exhaust', intake: 'Intake', compression: 'Compression' };

const leadColor = new THREE.Color(0xffffff);
const bodyColor = new THREE.Color(0xff6600);
const tmpColor = new THREE.Color();

window.combustionLights = [];
window.particleSystems = [];
window.fireLayers = [];
window.fireBrightness = [];
window.glowSprites = [];

const hudDots = [0, 1, 2, 3].map(i => document.getElementById('dot' + i));
const hudNames = [0, 1, 2, 3].map(i => document.getElementById('name' + i));

function updateFlameFront(cylIndex, t) {
  const particles = window.particleSystems[cylIndex];
  const layers = window.fireLayers[cylIndex];
  const brightnessArr = window.fireBrightness[cylIndex];
  const colorAttr = particles.geometry.getAttribute('color');
  const colorArray = colorAttr.array;

  let growFront, burnFront;
  if (t <= 0.4) {
    growFront = (t / 0.4) * 300;
    burnFront = -1;
  } else {
    growFront = 300;
    burnFront = ((t - 0.4) / (1 - 0.4)) * 300;
  }

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const lit = layer < growFront && layer >= burnFront;

    if (!lit) {
      colorArray[i * 3] = 0;
      colorArray[i * 3 + 1] = 0;
      colorArray[i * 3 + 2] = 0;
      continue;
    }

    const isLeadingEdge = (growFront - layer) < 1.5 && burnFront < 0;
    tmpColor.copy(isLeadingEdge ? leadColor : bodyColor);
    const b = brightnessArr[i];
    colorArray[i * 3] = tmpColor.r * b;
    colorArray[i * 3 + 1] = tmpColor.g * b;
    colorArray[i * 3 + 2] = tmpColor.b * b;
  }
  colorAttr.needsUpdate = true;
}

function updateCylinderStroke(cylIndex, localPhase) {
  const light = window.combustionLights[cylIndex];
  const fire = window.particleSystems[cylIndex];
  const glow = window.glowSprites[cylIndex];

  let strokeKey;

  if (localPhase < 0.25) {
    strokeKey = 'power';
    const t = localPhase / 0.25;
    fire.visible = true;
    updateFlameFront(cylIndex, t);
    light.color.setHex(0xff5500);
    light.intensity = 90 * Math.max(0, 1 - t) * (1 - t); 
    glow.material.opacity = 0;
    if (t < 0.05) {
      const pairIndex = cylinderPairs.findIndex((pair) => pair.includes(cylIndex));
      if (pairIndex !== -1) triggerFiringPunch(pairIndex);
    }
  } else if (localPhase < 0.5) {
    strokeKey = 'exhaust';
    const rel = (localPhase - 0.25) / 0.25;
    fire.visible = false;
    light.color.setHex(STROKE_COLORS.exhaust);
    light.intensity = 2.0 * (1 - rel);
    glow.material.color.setHex(STROKE_COLORS.exhaust);
    glow.scale.setScalar((4 + rel * 3.5) * 4);
    glow.material.opacity = 0.35 * (1 - rel);
  } else if (localPhase < 0.75) {
    strokeKey = 'intake';
    const rel = (localPhase - 0.5) / 0.25;
    fire.visible = false;
    const pulse = Math.sin(rel * Math.PI);
    light.color.setHex(STROKE_COLORS.intake);
    light.intensity = pulse * 1.6;
    glow.material.color.setHex(STROKE_COLORS.intake);
    glow.scale.setScalar((3.5 + pulse * 0.8) * 4);
    glow.material.opacity = 0.3 * pulse;
  } else {
    strokeKey = 'compression';
    const rel = (localPhase - 0.75) / 0.25;
    fire.visible = false;
    light.color.setHex(STROKE_COLORS.compression);
    light.intensity = rel * rel * 3.0;
    glow.material.color.setHex(STROKE_COLORS.compression);
    glow.scale.setScalar((4.3 - rel * 1.0) * 4);
    glow.material.opacity = 0.15 + rel * rel * 0.35;
  }

  const stroke = STROKE_NAMES[strokeKey];
  tmpColor.setHex(strokeKey === 'power' ? 0xff6600 : STROKE_COLORS[strokeKey]);
  
  if (hudDots[cylIndex]) {
    hudDots[cylIndex].style.background = '#' + tmpColor.getHexString();
    hudDots[cylIndex].style.color = '#' + tmpColor.getHexString();
  }
  if (hudNames[cylIndex]) {
    hudNames[cylIndex].textContent = stroke;
  }
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const baseRotationSpeed = (engineRPM / 60) * Math.PI * 2 * delta;

  if (mixer && mainAction) {
    mixer.timeScale = (engineRPM / 60) * nativeAnimDuration;
    mixer.update(delta);

    const progress = mainAction.time / mainAction.getClip().duration;
    const timingOffset = 0.15;
    const syncedProgress = (progress + timingOffset) % 1;

    if (window.combustionLights.length === 4) {
      for (let cyl = 0; cyl < 4; cyl++) {
        const localPhase = ((syncedProgress - cylinderFireTime[cyl]) % 1 + 1) % 1;
        updateCylinderStroke(cyl, localPhase);
      }
    }
  }

  if (window.fluidMaterials) {
    window.fluidMaterials.forEach((item) => {
      item.mat.map.offset.x -= baseRotationSpeed * 0.1;
    });
  }

  if (propGear) propGear.rotation.y += baseRotationSpeed / 2.43;
  if (fuelPumpGear) fuelPumpGear.rotation.y -= baseRotationSpeed * 0.8;
  if (alternator) alternator.rotation.y -= baseRotationSpeed * 1.5;
  if (crankshaftfrontend) crankshaftfrontend.rotation.y -= baseRotationSpeed;
  if (fuelimpeller) fuelimpeller.rotation.x += baseRotationSpeed * 1.2;
  if (waterimpeller) waterimpeller.rotation.y -= baseRotationSpeed * 1.2;

  updateEngineShake(delta);

  ctrlvar.update();
  rendthingy.render(sceneobj1, camtestvar);
}

animate();

window.addEventListener('resize', () => {
  camtestvar.aspect = window.innerWidth / window.innerHeight;
  camtestvar.updateProjectionMatrix();
  rendthingy.setSize(window.innerWidth, window.innerHeight);
});