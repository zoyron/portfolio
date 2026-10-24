float splat(vec2 cell, vec4 segment, float radius) {
  vec2 pa = cell - segment.xy;
  vec2 ba = segment.zw - segment.xy;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  vec2 d = pa - ba * h;
  return exp(-dot(d, d) / (radius * radius));
}
