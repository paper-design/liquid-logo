export type ShaderParams = {
  patternScale: number;
  refraction: number;
  edgeBlur: number;
  patternBlur: number;
  liquid: number;
  speed: number;
};

export const params = {
  refraction: {
    min: 0,
    max: 1,
    step: 0.001,
    default: 0.015,
  },
  edgeBlur: {
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.4,
  },
  patternBlur: {
    min: 0,
    max: 1,
    step: 0.001,
    default: 0.005,
  },
  liquid: {
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.07,
  },
  speed: {
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.3,
  },
  patternScale: {
    min: 0,
    max: 10,
    step: 0.1,
    default: 2,
  },
};

/** The default params for the shader in a ShaderParams object */
export const defaultParams: ShaderParams = Object.fromEntries(
  Object.entries(params).map(([key, value]) => [key, value.default])
) as ShaderParams;
