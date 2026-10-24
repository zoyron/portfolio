uniform sampler2D uSource;
uniform vec4 uScale;

varying vec2 vUv;

void main() {
  gl_FragColor = texture2D(uSource, vUv) * uScale;
}
