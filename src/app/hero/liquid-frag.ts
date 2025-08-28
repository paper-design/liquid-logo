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

vec2 get_img_uv() {
    vec2 img_uv = vUv;
    img_uv -= .5;
    if (u_ratio > u_img_ratio) {
        img_uv.x = img_uv.x * u_ratio / u_img_ratio;
    } else {
        img_uv.y = img_uv.y * u_img_ratio / u_ratio;
    }
    float scale_factor = 1.;
    img_uv *= scale_factor;
    img_uv += .5;

    img_uv.y = 1. - img_uv.y;

    return img_uv;
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

void main() {
  vec2 uv = vUv;
  uv.y = 1. - uv.y;
  uv.x *= u_ratio;
  
  float t = .0004 * u_time;

  vec2 img_uv = get_img_uv();
  vec4 img = texture(u_image_texture, img_uv);

  vec3 color = vec3(0.);
  float opacity = 1.;

//  float radialMask = 1. - smoothstep(0., .5, length(uv - .5 - vec2(0., .1)));
  float radialMask = 1. - smoothstep(.2, .7, length(uv - .5 - vec2(0., .1)));
//  radialMask = pow(radialMask, 2.);

  float dirOuter = uv.y - t;
  dirOuter = mod(dirOuter, 1.);
  float outer = (smoothstep(.0, .5, dirOuter) * smoothstep(1., .5, dirOuter));
//  outer = pow(img.g, 1. + outer);
  outer = img.g * outer;
  outer *= .8;

  float dirInner = uv.y - t - .2;
  dirInner = mod(dirInner, 1.);
  float inner = (smoothstep(.0, .5, dirInner) * smoothstep(1., .5, dirInner));
  img.b += .2 * (radialMask - .5);
  inner = img.b * inner * radialMask + img.r * inner;

  
  float heat = max(inner, outer);
  heat = clamp(heat, 0., 1.);
  heat *= (.7 + .3 * radialMask);
  heat = pow(heat, .7);

  color = gradient(heat);

  color *= opacity;
  fragColor = vec4(color, opacity);
}
`;
