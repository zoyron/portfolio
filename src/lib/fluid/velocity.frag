uniform sampler2D uVelocity;
uniform vec2 uResolution;
uniform vec4 uStroke;
uniform vec2 uStrokeForce;
uniform float uStrokeRadius;
uniform vec4 uCurrent;
uniform vec2 uCurrentForce;
uniform float uCurrentRadius;
uniform float uViscosity;
uniform float uVorticity;
uniform float uCurlLimit;
uniform float uDamping;
uniform float uMaxSpeed;

varying vec2 vUv;

const float DT = 0.13;
const float K = 0.2;

void main() {
  vec2 texel = 1.0 / uResolution;
  vec4 c = texture2D(uVelocity, vUv);
  vec4 r = texture2D(uVelocity, vUv + vec2(texel.x, 0.0));
  vec4 l = texture2D(uVelocity, vUv - vec2(texel.x, 0.0));
  vec4 t = texture2D(uVelocity, vUv + vec2(0.0, texel.y));
  vec4 b = texture2D(uVelocity, vUv - vec2(0.0, texel.y));

  vec3 ddx = (r - l).xyz * 0.5;
  vec3 ddy = (t - b).xyz * 0.5;
  float divergence = ddx.x + ddy.y;
  vec2 densityGradient = vec2(ddx.z, ddy.z);

  c.z -= DT * dot(vec3(densityGradient, divergence), c.xyz);
  vec2 viscosity = uViscosity * (r.xy + l.xy + t.xy + b.xy - 4.0 * c.xy);
  c.xyw = texture2D(uVelocity, vUv - DT * c.xy * texel).xyw;

  vec2 cell = vUv * uResolution;
  vec2 force = uStrokeForce * splat(cell, uStroke, uStrokeRadius)
             + uCurrentForce * splat(cell, uCurrent, uCurrentRadius);
  c.xy += DT * (viscosity - (K / DT) * densityGradient + force);

  c.xy *= uDamping;
  c.xy = sign(c.xy) * max(abs(c.xy) - 1e-4, 0.0);

  c.w = b.x - t.x + r.y - l.y;
  vec2 confinement = vec2(abs(t.w) - abs(b.w), abs(l.w) - abs(r.w));
  c.xy += confinement * (uVorticity / (length(confinement) + 1e-5)) * c.w;

  vec2 edge = min(cell, uResolution - cell);
  c.x *= smoothstep(0.0, 4.0, edge.x);
  c.y *= smoothstep(0.0, 4.0, edge.y);

  c = clamp(c, vec4(-uMaxSpeed, -uMaxSpeed, 0.5, -uCurlLimit), vec4(uMaxSpeed, uMaxSpeed, 3.0, uCurlLimit));
  gl_FragColor = c;
}
