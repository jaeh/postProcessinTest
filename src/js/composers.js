import * as THREE from 'three'
import { ShaderMaterial } from 'three'

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'

import { promisifiedLoad } from './lib/index.js'

const main = async () => {
  const WIDTH = window.innerWidth
  const HEIGHT = window.innerHeight

  // DEFINING SCENE, SCENE2, CAMERA and RENDERER
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000)
  camera.position.set(0, 0, 5)
  const renderer = new THREE.WebGLRenderer({ alpha: true })
  renderer.setSize(WIDTH, HEIGHT)
  // renderer.autoClear = false

  document.body.appendChild(renderer.domElement)

  // LIGHTS
  const light = new THREE.HemisphereLight(0xffffff, 0x080820, 5)
  scene.add(light)

  // DEFINING THE SANDWITCH
  const loader = new GLTFLoader()
  const model = await promisifiedLoad(loader, '/models/sandwitch.glb')

  const sandwitch = model.scene
  sandwitch.scale.set(2, 2, 2)
  sandwitch.renderOrder = 999
  scene.add(sandwitch)

  const sphereGeo = new THREE.SphereGeometry(1)
  const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
  const sphere = new THREE.Mesh(sphereGeo, sphereMaterial)
  sphere.position.set(1, 1, 3)
  scene.add(sphere)

  // PLANE, CATPIC
  const imageLoader = new THREE.TextureLoader()
  const catPic = await promisifiedLoad(imageLoader, '/images/cat.jpg')
  const geometry = new THREE.BoxGeometry(9, 6, 2)
  const material = new THREE.MeshStandardMaterial({ map: catPic })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  // SHADER SETUP
  const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`
  const fragShader = `
precision highp float;

varying vec2 vUv;
uniform sampler2D input1;
uniform sampler2D input2;
uniform sampler2D input3;
void main()	{
  vec4 texel1 = texture2D(input1, vUv);
  vec4 texel2 = texture2D(input2, vUv);
  vec4 texel3 = texture2D(input3, vUv);
  float overlapFactor1 = (1.0 - texel1.a) * texel2.a;
  vec4 overlappedTexel = texel1 + (texel2 * overlapFactor1);

  float overlapFactor2 = (1.0 - overlappedTexel.a) * texel3.a;
  vec4 finalTexel = overlappedTexel + (texel3 * overlapFactor2);
  gl_FragColor = texel1 + (texel2 * overlapFactor1) + (texel3 * overlapFactor2);
}`

  // POST PROCESSES
  const compositRenderTarget1 = new THREE.WebGLRenderTarget(WIDTH, HEIGHT)
  const compositRenderTarget2 = new THREE.WebGLRenderTarget(WIDTH, HEIGHT)
  const compositRenderTarget3 = new THREE.WebGLRenderTarget(WIDTH, HEIGHT)

  const compShaderUniforms = {
    input1: { value: compositRenderTarget1.texture },
    input2: { value: compositRenderTarget2.texture },
    input3: { value: compositRenderTarget3.texture },
    time: { value: 1.0 },
  }

  const compositShader = new ShaderMaterial({
    uniforms: compShaderUniforms,
    vertexShader: vertexShader,
    fragmentShader: fragShader,
  })

  const compositComposer = new EffectComposer(renderer)
  // const renderPass = new RenderPass(scene, camera)
  // compositComposer.addPass(renderPass)
  const compositPass = new ShaderPass(compositShader)
  compositComposer.addPass(compositPass)
  // compositComposer.addPass(new OutputPass())

  const composer1 = new EffectComposer(renderer, compositRenderTarget1)

  {
    const renderPass = new RenderPass(scene, camera)
    renderPass.clear = true
    renderPass.alpha = true
    renderPass.transparent = true
    renderPass.premultipliedAlpha = true

    composer1.addPass(renderPass)

    const effect1_1 = new UnrealBloomPass(undefined, 0.1, 2, 1)
    composer1.addPass(effect1_1)

    const effect1 = new ShaderPass(DotScreenShader)
    effect1.material.transparent = false
    effect1.material.opacity = 0.2
    effect1.uniforms['scale'].value = 4
    // effect1.enabled = false
    composer1.addPass(effect1)

    composer1.addPass(new OutputPass())
  }

  const composer2 = new EffectComposer(renderer, compositRenderTarget2)

  {
    const renderPass = new RenderPass(scene, camera)
    renderPass.clear = true
    renderPass.alpha = true
    renderPass.transparent = false
    renderPass.premultipliedAlpha = true
    composer2.addPass(renderPass)

    const effect1 = new ShaderPass(DotScreenShader)
    effect1.material.transparent = true
    effect1.material.opacity = 0.2
    effect1.uniforms['scale'].value = 0.2
    // effect1.enabled = false
    composer2.addPass(effect1)

    composer2.addPass(new OutputPass())
  }

  const composer3 = new EffectComposer(renderer, compositRenderTarget3)

  {
    const renderPass = new RenderPass(scene, camera)
    renderPass.clear = true
    renderPass.alpha = true
    renderPass.transparent = true
    renderPass.premultipliedAlpha = true

    composer3.addPass(renderPass)

    const effect4 = new ShaderPass(RGBShiftShader)
    effect4.uniforms['amount'].value = 0.02
    // effect4.enabled = false
    composer3.addPass(effect4)

    // const effect3_1 = new ShaderPass(DotScreenShader)
    // effect3_1.material.transparent = true
    // effect3_1.material.opacity = 0.2
    // effect3_1.uniforms['scale'].value = 0.2
    // // effect3_1.enabled = false
    // composer3.addPass(effect3_1)

    composer3.addPass(new OutputPass())
  }

  const clock = new THREE.Clock()

  // RENDERING
  function animate() {
    requestAnimationFrame(animate)

    const deltaTime = clock.getDelta()

    sandwitch.rotation.y += 0.01

    cube.visible = false
    sandwitch.visible = true
    sphere.visible = false

    composer1.render(deltaTime)

    cube.visible = false
    sandwitch.visible = false
    sphere.visible = true

    composer2.render(deltaTime)

    cube.visible = true
    sandwitch.visible = false
    sphere.visible = false

    composer3.render(deltaTime)

    compositComposer.render(deltaTime)

    compositRenderTarget1.dispose()
    compositRenderTarget2.dispose()
    compositRenderTarget3.dispose()
  }

  animate()
}

main()
