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

#define pow2(x) (x * x)

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846


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


vec2 getPosition(int i, float t) {
  float a = float(i) * .37;
  float b = .6 + mod(float(i), 3.) * .3;
  float c = .8 + mod(float(i + 1), 4.) * 0.25;

  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);

  return .5 + .5 * vec2(x, y);
}


vec3 background(vec2 uv, float t) {
  vec4 u_colors[4] = vec4[4](
    vec4(.5, 0.8, 1., 1.0),
    vec4(0., 0.6, .5, 1.0),
    vec4(1., 1., 0.5, 1.0),
    vec4(1., 0., 0.6, 1.0)
  );
  
  float u_distortion = .8;
  float u_swirl = .8;
  
  float radius = smoothstep(0., 1., length(uv - .5));
  float center = 1. - radius;
  for (float i = 1.; i <= 2.; i++) {
    uv.x += u_distortion * center / i * sin(t + i * .4 * smoothstep(.0, 1., uv.y)) * cos(.2 * t + i * 2.4 * smoothstep(.0, 1., uv.y));
    uv.y += u_distortion * center / i * cos(t + i * 2. * smoothstep(.0, 1., uv.x));
  }

  vec2 uvRotated = uv;
//  uvRotated -= vec2(.5);
//  float angle = 3. * u_swirl * radius;
//  uvRotated = rotate(uvRotated, -angle);
//  uvRotated += vec2(.5);

  vec3 color = vec3(0.);
  float totalWeight = 0.;

  for (int i = 0; i < 4; i++) {
    vec2 pos = getPosition(i, t);
    vec3 colorFraction = u_colors[i].rgb;

    float dist = 0.;
    if (mod(float(i), 2.) > 1.) {
      dist = length(uv - pos);
    } else {
      dist = length(uvRotated - pos);
    }

    dist = pow(dist, 3.5);
    float weight = 1. / (dist + 1e-3);
    color += colorFraction * weight;
    totalWeight += weight;
  }

  return color /= totalWeight;
}


void main() {
  vec2 uv = vUv;
  
  float t = .003 * u_time;
  
  vec2 img_uv = get_img_uv();
  vec4 img = texture(u_image_texture, img_uv);

  float edge = img.r;
  float imageShape = 1. - smoothstep(.5, .7, edge);
  
  uv += .8 * imageShape * pow(img.r, 3.);
  uv += .4 * imageShape * pow(img.r, 1.);
  
  vec3 color = background(uv, t);
  color.r = background(uv + .1 * edge * imageShape, t).r;
 
    color += .3 * edge * imageShape;
    color += .05 * imageShape;

  fragColor = vec4(color, 1.);
}
`;
