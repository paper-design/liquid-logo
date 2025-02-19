import { ShaderParams } from '../hero/output-canvas';

const params = {
  refraction: {
    value: 0.015,
    min: 0,
    max: 1,
    step: 0.001,
  },
  edge: {
    value: 0.4,
    min: 0,
    max: 1,
    step: 0.01,
  },
  patternBlur: {
    value: 0.005,
    min: 0,
    max: 1,
    step: 0.001,
  },
  liquid: {
    value: 0.07,
    min: 0,
    max: 1,
    step: 0.01,
  },
  speed: {
    value: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
  },
  patternScale: {
    value: 2,
    min: 0,
    max: 10,
    step: 0.1,
  },
};

/** The default params for the shader in a ShaderParams object */
export const defaultParams: ShaderParams = Object.fromEntries(
  Object.entries(params).map(([key, value]) => [key, value.value])
) as ShaderParams;

/** Pulls params from the querystring or uses the default params */
export const getInitialParams: (searchParams: URLSearchParams) => ShaderParams = (searchParams) => {
  const paramKeys = Object.keys(params);

  const initialParams: Record<string, number> = {};
  for (const key of paramKeys) {
    const value = searchParams.get(key);
    initialParams[key as keyof ShaderParams] = value ? parseFloat(value) : defaultParams[key as keyof ShaderParams];
  }
  return initialParams as ShaderParams;
};
