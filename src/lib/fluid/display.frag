uniform sampler2D uDye;
uniform vec2 uResolution;
uniform vec3 uLow;
uniform vec3 uHigh;
uniform float uMaxAlpha;
uniform float uGain;

varying vec2 vUv;

// Cubic B-spline from four bilinear taps (GPU Gems 2, ch. 20)
float sampleInk(vec2 uv) {
  vec2 st = uv * uResolution - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 p0 = (i - 0.5 + w1 / g0) / uResolution;
  vec2 p1 = (i + 1.5 + w3 / g1) / uResolution;
  return g0.y * (g0.x * texture2D(uDye, p0).r + g1.x * texture2D(uDye, vec2(p1.x, p0.y)).r)
       + g1.y * (g0.x * texture2D(uDye, vec2(p0.x, p1.y)).r + g1.x * texture2D(uDye, p1).r);
}

void main() {
  float coverage = 1.0 - exp(-max(sampleInk(vUv), 0.0) * uGain);
  vec3 colour = mix(uLow, uHigh, smoothstep(0.2, 1.0, coverage));
  float alpha = uMaxAlpha * coverage;

  float noise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  alpha = clamp(alpha + (noise - 0.5) / 255.0 * min(alpha * 255.0, 1.0), 0.0, 1.0);

  gl_FragColor = vec4(colour * alpha, alpha);
}
