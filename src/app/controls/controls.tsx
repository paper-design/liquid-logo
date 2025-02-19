import { Control } from './control';
import { ShaderParams } from '../hero/output-canvas';
import { roundOptimized } from '../math/round-optimized';
import { defaultParams } from './params';

export function Controls({ params, setParams }: { params: ShaderParams; setParams: (params: ShaderParams) => void }) {
  function setParam(key: keyof ShaderParams, value: number) {
    const newParams = { ...params, [key]: value };
    setParams(newParams);

    if (typeof window !== 'undefined') {
      // When params change, put them into the querystring
      const url = new URL(window.location.href);
      Object.entries(newParams).forEach(([key, value]) => {
        if (typeof value === 'number') {
          url.searchParams.set(key, roundOptimized(value, 3).toString());
        }
      });
      window.history.pushState({}, '', url.toString());
    }
  }

  return (
    <div className="hidden flex-col gap-4 py-4 md:flex">
      <Control
        label="Refraction"
        value={params.refraction}
        min={0}
        max={0.1}
        step={0.001}
        onChange={(value) => setParam('refraction', value)}
      />
      <Control
        label="Edge Blur"
        value={params.edge}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => setParam('edge', value)}
      />
      <Control
        label="Pattern Blur"
        value={params.patternBlur}
        min={0}
        max={1}
        step={0.001}
        onChange={(value) => setParam('patternBlur', value)}
      />
      <Control
        label="Liquify"
        value={params.liquid}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => setParam('liquid', value)}
      />
      <Control
        label="Speed"
        value={params.speed}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => setParam('speed', value)}
      />
      <Control
        label="Pattern Repeats"
        value={params.patternScale}
        min={0}
        max={10}
        step={0.1}
        onChange={(value) => setParam('patternScale', value)}
      />

      <button className="rounded-md bg-blue-500 px-4 py-2 text-white" onClick={() => setParams(defaultParams)}>
        Reset
      </button>
    </div>
  );
}
