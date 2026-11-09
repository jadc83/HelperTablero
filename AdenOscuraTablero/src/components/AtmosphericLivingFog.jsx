import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CANVAS_SIZE = 4000;
const CANVAS_OFFSET = 1000;

/**
 * Shaders GLSL optimizados para niebla volumétrica viva (Victorian occult fog)
 * y parpadeo cálido de linternas/antorchas en tiempo real.
 */
const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform sampler2D uMaskTexture;
  uniform vec2 uLights[12];
  uniform float uLightRadii[12];
  uniform vec3 uLightColors[12];
  uniform int uNumLights;
  uniform float uFogIntensity;
  uniform float uFlickerStrength;
  varying vec2 vUv;

  // Ruido pseudo-aleatorio rápido
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Ruido de gradiente 2D
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  // Fractional Brownian Motion (fbm) para volutas de humo y niebla orgánica
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // 1. Muestrear la máscara de visión 2D (donde se ha revelado el mapa)
    vec4 maskColor = texture2D(uMaskTexture, vUv);
    float darkness = maskColor.a; // 1.0 = niebla profunda, 0.0 = totalmente despejado

    if (darkness < 0.02) {
      discard; // Optimización de fragmentos transparentes
    }

    // 2. Volutas de niebla viva en dos capas cruzadas a velocidades distintas
    vec2 fogUv1 = vUv * 7.5 + vec2(uTime * 0.012, uTime * 0.007);
    vec2 fogUv2 = vUv * 13.0 - vec2(uTime * 0.009, -uTime * 0.014);
    
    float n1 = fbm(fogUv1);
    float n2 = fbm(fogUv2);
    float mist = smoothstep(0.15, 0.85, n1 * 0.65 + n2 * 0.35);

    // 3. Cálculos de parpadeo de luz cálida (antorchas/faroles en el perímetro)
    vec3 lightGlow = vec3(0.0);
    vec2 pixelPos = vUv * 4000.0;

    for (int i = 0; i < 12; i++) {
      if (i >= uNumLights) break;
      vec2 lPos = uLights[i];
      float lRad = uLightRadii[i];
      if (lRad <= 0.0) continue;

      float dist = distance(pixelPos, lPos);
      if (dist < lRad * 1.35) {
        // Micro-frecuencias armónicas para simular el crepitar de una llama real
        float flickerPhase = float(i) * 2.37;
        float flicker = 1.0 + uFlickerStrength * (
          sin(uTime * 6.5 + flickerPhase) * 0.45 +
          cos(uTime * 11.2 + flickerPhase * 1.7) * 0.35 +
          sin(uTime * 18.0 + flickerPhase * 3.1) * 0.20
        );

        float atten = clamp(1.0 - (dist / (lRad * 1.35 * flicker)), 0.0, 1.0);
        atten = pow(atten, 1.8);
        lightGlow += uLightColors[i] * atten * 0.55;
      }
    }

    // 4. Composición final: tinte abisal de niebla (#060913) impregnado de bruma viva y luz perimetral
    vec3 deepFogColor = vec3(0.024, 0.035, 0.065); // Tinte victoriano azul tinta/carbón
    vec3 mistColor = vec3(0.065, 0.085, 0.13);     // Tinte de las volutas en suspensión
    
    vec3 finalColor = mix(deepFogColor, mistColor, mist * uFogIntensity);
    finalColor += lightGlow * (0.4 + mist * 0.6);

    float finalAlpha = darkness * (0.68 + mist * 0.32 * uFogIntensity);
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

const AtmosphericLivingFog = ({
  fowEnabled = true,
  livingFogEnabled = true,
  fowCanvasRef,
  tokens = [],
  maps = [],
  fowVisionRadius = 180,
  isPlayerView = false
}) => {
  const mountRef = useRef(null);
  const threeRefs = useRef(null);

  useEffect(() => {
    if (!fowEnabled || !livingFogEnabled || !mountRef.current || !fowCanvasRef?.current) return;

    const width = CANVAS_SIZE;
    const height = CANVAS_SIZE;

    // Escena ortográfica exacta alineada 1:1 con las coordenadas del tablero
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
      0.1, 100
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1); // 1 es ideal para mapas grandes de 4000px sin sobrecargar memoria
    mountRef.current.appendChild(renderer.domElement);

    // Textura desde el canvas 2D de FogLayer
    const maskTexture = new THREE.CanvasTexture(fowCanvasRef.current);
    maskTexture.minFilter = THREE.LinearFilter;
    maskTexture.magFilter = THREE.LinearFilter;

    // Uniforms del shader
    const uniforms = {
      uTime: { value: 0 },
      uMaskTexture: { value: maskTexture },
      uLights: { value: Array(12).fill(new THREE.Vector2(0, 0)) },
      uLightRadii: { value: new Float32Array(12).fill(0) },
      uLightColors: { value: Array(12).fill(new THREE.Vector3(1, 0.7, 0.3)) },
      uNumLights: { value: 0 },
      uFogIntensity: { value: 0.8 },
      uFlickerStrength: { value: 0.12 }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      depthWrite: false
    });

    const geometry = new THREE.PlaneGeometry(width, height);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    threeRefs.current = {
      scene,
      camera,
      renderer,
      uniforms,
      maskTexture,
      material,
      geometry
    };

    let reqId;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (uniforms && maskTexture) {
        uniforms.uTime.value = clock.getElapsedTime();
        maskTexture.needsUpdate = true;
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      if (renderer.domElement && mountRef.current) {
        try { mountRef.current.removeChild(renderer.domElement); } catch (e) {}
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      maskTexture.dispose();
      threeRefs.current = null;
    };
  }, [fowEnabled, livingFogEnabled, fowCanvasRef]);

  // Actualizar posiciones de luces y antorchas dinámicamente en los uniforms
  useEffect(() => {
    if (!threeRefs.current) return;
    const { uniforms } = threeRefs.current;

    const lightList = [];

    // 1. Luces estáticas activas en el mapa (antorchas, faroles)
    maps.forEach(el => {
      if (el.type === 'light' && el.isOn !== false && lightList.length < 12) {
        const size = el.width || 36;
        lightList.push({
          x: el.x + size / 2 + CANVAS_OFFSET,
          y: (CANVAS_SIZE - (el.y + size / 2 + CANVAS_OFFSET)), // Inversión Y en WebGL
          radius: el.radius || 220,
          color: new THREE.Vector3(1.0, 0.65, 0.25) // Ámbar victoriano
        });
      }
    });

    // 2. Luces portátiles de héroes aliados (linternas de mano)
    tokens.forEach(tok => {
      if (!tok.isHidden && tok.faction !== 'enemy' && lightList.length < 12) {
        const size = tok.size || 50;
        lightList.push({
          x: tok.x + size / 2 + CANVAS_OFFSET,
          y: (CANVAS_SIZE - (tok.y + size / 2 + CANVAS_OFFSET)),
          radius: fowVisionRadius * 0.9,
          color: new THREE.Vector3(0.95, 0.75, 0.45)
        });
      }
    });

    const lightPosArr = [];
    const lightRadiiArr = new Float32Array(12);
    const lightColorArr = [];

    for (let i = 0; i < 12; i++) {
      if (i < lightList.length) {
        lightPosArr.push(new THREE.Vector2(lightList[i].x, lightList[i].y));
        lightRadiiArr[i] = lightList[i].radius;
        lightColorArr.push(lightList[i].color);
      } else {
        lightPosArr.push(new THREE.Vector2(-9999, -9999));
        lightRadiiArr[i] = 0;
        lightColorArr.push(new THREE.Vector3(0, 0, 0));
      }
    }

    uniforms.uLights.value = lightPosArr;
    uniforms.uLightRadii.value = lightRadiiArr;
    uniforms.uLightColors.value = lightColorArr;
    uniforms.uNumLights.value = lightList.length;
  }, [tokens, maps, fowVisionRadius]);

  if (!fowEnabled || !livingFogEnabled) return null;

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: -CANVAS_OFFSET,
        left: -CANVAS_OFFSET,
        width: `${CANVAS_SIZE}px`,
        height: `${CANVAS_SIZE}px`,
        pointerEvents: 'none',
        zIndex: 9,
        opacity: isPlayerView ? 1 : 0.75,
        mixBlendMode: 'normal'
      }}
    />
  );
};

export default AtmosphericLivingFog;
