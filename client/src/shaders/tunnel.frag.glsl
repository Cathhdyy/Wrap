uniform float uTime;
uniform float uBloom;
varying float vDistance;

void main() {
  // Circular particle shape
  float dist = distance(gl_PointCoord, vec2(0.5));
  if (dist > 0.5) discard;

  // Colors based on distance/bloom
  vec3 colorA = vec3(0.1, 0.4, 1.0); // Blue
  vec3 colorB = vec3(0.8, 0.2, 1.0); // Purple/Pink
  
  float strength = 1.0 - dist * 2.0;
  strength = pow(strength, 3.0);
  
  vec3 color = mix(colorA, colorB, sin(vDistance * 0.1 + uTime) * 0.5 + 0.5);
  
  // Add energy glow (bloom)
  color *= (1.0 + uBloom * 5.0);
  
  // Fade out far particles
  float alpha = smoothstep(50.0, 20.0, vDistance);
  
  gl_FragColor = vec4(color, strength * alpha);
}
