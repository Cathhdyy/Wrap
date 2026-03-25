import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import vert from '../shaders/tunnel.vert.glsl?raw';
import frag from '../shaders/tunnel.frag.glsl?raw';

const TunnelParticles = ({ speed, bloom, phase }) => {
  const meshRef = useRef();
  
  const count = 20000;
  
  const [positions, randoms, indices] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    const idx = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      idx[i] = i;
      rnd[i] = Math.random();
    }
    return [pos, rnd, idx];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeed: { value: 0.5 },
    uBloom: { value: 0.1 },
    uCollapse: { value: 0 }
  }), []);

  useFrame((state) => {
    const { clock } = state;
    uniforms.uTime.value = clock.getElapsedTime();
    
    // Smoothly interpolate uniforms
    const targetSpeed = phase === 'active' ? 1.0 + speed * 10 : 0.5;
    const targetBloom = phase === 'active' ? 0.1 + bloom * 2 : 0.1;
    const targetCollapse = phase === 'disconnected' ? 1.0 : 0.0;

    uniforms.uSpeed.value = THREE.MathUtils.lerp(uniforms.uSpeed.value, targetSpeed, 0.05);
    uniforms.uBloom.value = THREE.MathUtils.lerp(uniforms.uBloom.value, targetBloom, 0.05);
    uniforms.uCollapse.value = THREE.MathUtils.lerp(uniforms.uCollapse.value, targetCollapse, 0.05);
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={count}
          array={randoms}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aIndex"
          count={count}
          array={indices}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
      />
    </points>
  );
};

export default TunnelParticles;
