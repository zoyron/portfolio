uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform vec2 uResolution;
uniform vec4 uStroke;
uniform float uStrokeInk;
uniform float uStrokeRadius;
uniform vec4 uCurrent;
uniform float uCurrentInk;
uniform float uCurrentRadius;
uniform float uAdvect;
uniform float uDecay;
uniform float uFade;

varying vec2 vUv;

void main() {
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  float ink = texture2D(uDye, vUv - uAdvect * velocity / uResolution).r;

  vec2 cell = vUv * uResolution;
  ink += uStrokeInk * splat(cell, uStroke, uStrokeRadius);
  ink += uCurrentInk * splat(cell, uCurrent, uCurrentRadius);
  ink = max(ink * uDecay - uFade, 0.0);

  vec2 edge = min(cell, uResolution - cell);
  ink *= mix(0.94, 1.0, smoothstep(0.0, 6.0, min(edge.x, edge.y)));

  gl_FragColor = vec4(min(ink, 3.0), 0.0, 0.0, 1.0);
}
