// language=GLSL
export const liquidFragSource = /* glsl */ `#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_image_texture;
uniform float u_time;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_patternScale;
uniform float u_refraction;
uniform float u_edge;
uniform float u_patternBlur;
uniform float u_liquid;


#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846


vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
  m = m*m;
  m = m*m;
  vec3 x = 2. * fract(p * C.www) - 1.;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130. * dot(m, g);
}

vec2 getImgUV() {
  vec2 uv = vUv;
  uv -= .5;
  if (u_ratio > u_img_ratio) {
      uv.x = uv.x * u_ratio / u_img_ratio;
  } else {
      uv.y = uv.y * u_img_ratio / u_ratio;
  }
  float scale_factor = 1.;
  uv *= scale_factor;
  uv += .5;

  uv.y = 1. - uv.y;

  return uv;
}

float getImgFrame(vec2 uv, float th) {
  float frame = 1.;
  frame *= smoothstep(-th, 0., uv.y);
  frame *= (1. - smoothstep(1., 1. + th, uv.y));
  frame *= smoothstep(-th, 0., uv.x);
  frame *= (1. - smoothstep(1., 1. + th, uv.x));
  return frame;
}

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

vec3 gradient(float t) {
  vec3 colors[4] = vec3[4](
    vec3(0., 0., 0.),
    vec3(0., .3, 1.),
    vec3(1., 1., 0.),
    vec3(1., 0., 0.)
  );
  float n = 4.;
  float scaled = t * n;
  int i = int(floor(scaled));
  int j = min(i + 1, int(n) - 1);
  float f = fract(scaled);

  return mix(colors[i], colors[j], smoothstep(0., 1., f));
}

float getMask(float cycle, float y) {
//  float maskGrowTime = clamp((cycle - 0.6) / (0.8 - 0.6), 0.0, 1.0);
  float maskFadeTime = 1.0 - clamp((cycle - 0.9) / (1.0 - 0.9), 0.0, 1.0);
  float maskGrowTime = clamp(3. * cycle, 0.0, 1.0);
//  float maskFadeTime = clamp((cycle - 0.3) / 0.7, 0.0, 1.0);

  
  float maskPos = y;
  float posY = .9 * cycle - .1;

  float mask = 0.;
  float movingDown = (smoothstep(posY, posY + .2, y) * smoothstep(posY + .6, posY + .2, y));
  movingDown *= maskFadeTime;
  mask += movingDown;

  float growing = maskGrowTime * (smoothstep(-.1, -.1, y) * smoothstep(.5, -.1, y));
  mask += growing;
  
  
  mask = clamp(mask, 0., 1.);
  return mask;
}

void main() {
  vec2 uv = vUv;
  uv.y = 1. - uv.y;
  uv.x *= u_ratio;
  
  float t = .001 * u_time;
//  t = u_refraction;
  
  vec2 imgUV = getImgUV();
  float imgSoftFrame = getImgFrame(imgUV, .3);
  vec4 img = texture(u_image_texture, imgUV);
  img *= imgSoftFrame;

  vec3 color = vec3(0.);

  float radialMask = 1. - smoothstep(.0, .4, length(uv - .5 - vec2(0., .1)));

  float cycle = mod(t, 1.);
  float innerMask = getMask(cycle, uv.y);

  float innerBlur = pow(img.r, 5.);
  innerBlur += img.b;
  innerBlur += .5 * (radialMask - .5);
  
  float outerBlur = img.g;
  cycle = mod(t + .2, 1.);
  float outerMask = getMask(cycle, uv.y);

  outerBlur = pow(outerBlur, 1.2);
  float outer = outerBlur * (.5 + .5 * outerMask);
  
  float inner = innerBlur;
  inner -= .5 * innerMask;
  inner = clamp(inner, 0., 1.);

  float heat = inner + outer;
  heat = clamp(heat, 0., 1.);
  
  color = gradient(heat);

  fragColor = vec4(color, 1.);
}
`;
