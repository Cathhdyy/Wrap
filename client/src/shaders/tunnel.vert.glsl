uniform float uTime;
uniform float uSpeed;
uniform float uCollapse;
attribute float aRandom;
attribute float aIndex;

varying vec2 vUv;
varying float vDistance;

void main() {
  vUv = uv;
  
  // Create a cylindrical spiral
  float radius = 2.0 + sin(aIndex * 0.01) * 0.5;
  float angle = aIndex * 0.1;
  
  // Add z-movement based on time and speed
  float zPos = mod(aIndex * 0.1 - uTime * uSpeed, 100.0) - 50.0;
  
  vec3 pos = vec3(
    cos(angle) * radius,
    sin(angle) * radius,
    zPos
  );

  // Collapse animation: pull all particles to center
  pos = mix(pos, vec3(0.0), uCollapse);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
  // Size attenuation
  gl_PointSize = (10.0 + aRandom * 20.0) * (1.0 / -mvPosition.z);
  vDistance = abs(zPos);
  
  gl_Position = projectionMatrix * mvPosition;
}
