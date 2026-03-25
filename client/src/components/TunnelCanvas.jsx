import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import TunnelParticles from './TunnelParticles';

const TunnelCanvas = ({ speed, progress, phase }) => {
  // Normalize speed to 0.0 - 1.0 for shaders (assuming max 50MB/s)
  const normalizedSpeed = Math.min(speed / (50 * 1024 * 1024), 1.0);
  const bloomIntensity = 0.5 + normalizedSpeed * 1.5;

  return (
    <div className="fixed inset-0 bg-black z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000000']} />
        
        <Suspense fallback={null}>
          <TunnelParticles 
            speed={normalizedSpeed} 
            bloom={normalizedSpeed} 
            phase={phase} 
          />
          
          {/* <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={0.2} 
              mipmapBlur 
              intensity={bloomIntensity} 
              radius={0.4}
            />
          </EffectComposer> */}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default TunnelCanvas;
