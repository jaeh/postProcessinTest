import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ShaderPass, EffectComposer} from 'postprocessing';
import {ShaderMaterial} from "three";


const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight


// DEFINING SCENE, CAMERA, and RENDERER
const scene = new THREE.Scene();
const sceneSecond = new THREE.Scene();
const imageLoader = new THREE.TextureLoader();
const catPic = imageLoader.load('cat.jpg');

const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
camera.position.set(0, 0, 5);
const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(WIDTH, HEIGHT);
document.body.appendChild(renderer.domElement);


// LIGHT
const light = new THREE.HemisphereLight(0xffffff, 0x080820, 5);
scene.add(light);
const lightSecond = new THREE.HemisphereLight(0xffffff, 0x080820, 5);
sceneSecond.add(lightSecond);


// DEFINING THE SANDWITCH
let sandwitch;
const loader = new GLTFLoader()
loader.load('3d files/sandwitch.gltf', function (model) {
    sandwitch = model.scene;
    sandwitch.scale.set(2, 2, 2);
    scene.add(sandwitch);
});


//PLANE
const geometry = new THREE.BoxGeometry(9, 6, 2);
const material = new THREE.MeshStandardMaterial({map: catPic});
const cube = new THREE.Mesh(geometry, material);
sceneSecond.add(cube);
// cube.rotation.set(0, 0.2, 0)
// const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeWidth/screenARation);
// let plane = new THREE.Mesh(planeGeometry);


// SHADER SETUP
const vertexShader = `
            varying vec2 vUv;
			void main()	{
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`;
const fragShader = `
            varying vec2 vUv;
			uniform sampler2D input1;
			uniform sampler2D input2;
			void main()	{
                vec2 pixelatedUV = floor(vUv * 90.0) / 90.0;
			
				vec4 texel1 = texture2D(input1, pixelatedUV);
                vec4 texel2 = texture2D(input2, vUv);
                float overlapFactor = (1.0 - texel1.a) * texel2.a;
                vec4 overlappedTexel = texel1 + texel2 * overlapFactor;
                gl_FragColor = overlappedTexel;
			}`;

// const textureLoader = new THREE.TextureLoader();
// const catPic = textureLoader.load('cat.jpg');


// POST PROCESSES
const compositRenderTarget1 = new THREE.WebGLRenderTarget(WIDTH, HEIGHT);
const compositRenderTarget2 = new THREE.WebGLRenderTarget(WIDTH, HEIGHT);


let shaderUniforms = {
    input1: {value: compositRenderTarget1.texture},
    input2: {value: compositRenderTarget2.texture},
    time: {value: 1.0}
};


const compositShader = new ShaderMaterial({
    uniforms: shaderUniforms,
    vertexShader: vertexShader,
    fragmentShader: fragShader,
});


const composer = new EffectComposer(renderer);

const compositPass = new ShaderPass(compositShader);
composer.addPass(compositPass);

// RENDERING
function animate() {
    requestAnimationFrame(animate);
    sandwitch.rotation.y += 0.01;

    renderer.setRenderTarget(compositRenderTarget1);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.setRenderTarget(compositRenderTarget2);


    renderer.render(sceneSecond, camera);
    renderer.setRenderTarget(null);
    // shaderUniforms['time'].value = performance.now() / 1000;
    composer.render();

    compositRenderTarget2.dispose()
    compositRenderTarget1.dispose()
}

animate();

