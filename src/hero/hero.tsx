'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultParams, params, type ShaderParams } from './params';
import { Canvas } from './canvas';
import { Slider } from 'radix-ui';
import { NumberInput } from '@/app/number-input';
import { roundOptimized } from '@/app/round-optimized';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { parseLogoImage } from './parse-logo-image';
import { uploadImage } from '@/hero/upload-image';
import isEqual from 'lodash-es/isEqual';

interface HeroProps {
  imageId: string;
}

type State = ShaderParams & {
  background: string;
};

const defaultState = { ...defaultParams, background: 'metal' };

export function Hero({ imageId }: HeroProps) {
  const [state, setState] = useState<State>(defaultState);
  const [dragging, setDragging] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsPendingUpdate = useRef(false);

  const stateRef = useRef(state);

  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [processing, setProcessing] = useState<boolean>(true);

  // Check URL for image ID on mount
  useEffect(() => {
    setProcessing(true);

    async function updateImageData() {
      try {
        const res = await fetch(`https://p1ljtcp1ptfohfxm.public.blob.vercel-storage.com/${imageId}.png`);
        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob);

        // Create a temporary canvas to turn the image back into imageData for the shader
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setImageData(imageData);
      } catch (error) {
        console.error(error);
      }

      setProcessing(false);
    }

    updateImageData();
  }, [imageId]);

  useEffect(() => {
    stateRef.current = state;

    // Debounce the history updates (Safari doesn't like frequent URL updates)
    const timeoutId = setTimeout(() => {
      const searchParams = new URLSearchParams();

      Object.entries(stateRef.current).forEach(([key, value]) => {
        if (typeof value === 'number') {
          searchParams.set(key, roundOptimized(value, 4).toString());
        } else {
          searchParams.set(key, value);
        }
      });

      searchParamsPendingUpdate.current = false;
      window.history.replaceState({}, '', pathname + '?' + searchParams.toString());
    }, 250); // Add 250ms delay between updates

    return () => clearTimeout(timeoutId);
  }, [state, pathname]);

  useEffect(() => {
    if (searchParamsPendingUpdate.current) {
      return;
    }

    const paramsState: any = {};
    let isEqual = true;

    for (const [key, value] of searchParams.entries()) {
      if (!(key in state)) {
        continue;
      }

      const number = parseFloat(value);
      paramsState[key] = Number.isNaN(number) ? value : number;

      // @ts-ignore
      let currentValue = stateRef.current[key];
      // Match the precision of the params
      if (typeof currentValue === 'number') {
        currentValue = roundOptimized(currentValue, 4);
      }

      if (paramsState[key] !== currentValue) {
        isEqual = false;
      }
    }

    if (isEqual === false) {
      console.log('Updating state from URL params');
      setState((state) => ({ ...state, ...paramsState }));
    }
  }, [searchParams]);

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: FileList) => {
    if (files.length > 0) {
      const file = files[0];
      const fileType = file.type;

      // Check file size (4.5MB = 4.5 * 1024 * 1024 bytes)
      const maxSize = 4.5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 4.5MB');
        return;
      }

      // Check if file is an image or SVG
      if (fileType.startsWith('image/') || fileType === 'image/svg+xml') {
        setProcessing(true);
        parseLogoImage(file).then(({ imageData, pngBlob }) => {
          // Set the image data for the shader to pick up
          setImageData(imageData);
          setProcessing(false);

          // Upload the image
          uploadImage(pngBlob)
            .then((imageId) => {
              // Update the URL for sharing
              if (typeof window !== 'undefined' && typeof imageId === 'string' && imageId.length > 0) {
                // const currentParams = searchParams.values.length ? '?' + searchParams.toString() : '';
                window.history.pushState({}, '', `/share/${imageId}`);
              }
            })
            .catch(console.error)
            .finally(() => setProcessing(false));
        });
      } else {
        toast.error('Please upload only images or SVG files');
      }
    }
  };

  return (
    <div
      className="flex flex-col items-stretch gap-24 px-32 max-md:max-w-564 md:grid md:grid-cols-[500px_500px] md:gap-32"
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(false);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(false);
        const files = event.dataTransfer.files;
        handleFiles(files);
      }}
    >
      <div
        className="flex aspect-square w-full items-center justify-center rounded-10"
        style={{
          background: (() => {
            switch (state.background) {
              case 'metal':
                return 'linear-gradient(to bottom, #eee, #b8b8b8)';
            }
            return state.background;
          })(),
        }}
      >
        <div className="aspect-square h-full">
          {imageData && <Canvas imageData={imageData} params={state} processing={processing} />}
        </div>
      </div>

      <div className="grid auto-rows-[minmax(40px,auto)] grid-cols-[auto_200px] items-center gap-x-24 gap-y-12 rounded-8 p-16 outline outline-white/20 sm:grid-cols-[auto_160px_100px]">
        <div>
          <label className="pr-16 text-nowrap">Background</label>
        </div>
        <div className="flex h-40 items-center gap-9 sm:col-span-2">
          <button
            className="size-28 cursor-pointer rounded-full text-[0px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            style={{ background: 'linear-gradient(to bottom, #eee, #b8b8b8)' }}
            onClick={() => setState({ ...state, background: 'metal' })}
          >
            Metal
          </button>

          <button
            className="size-28 cursor-pointer rounded-full bg-white text-[0px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={() => setState({ ...state, background: 'white' })}
          >
            White
          </button>

          <button
            className="size-28 cursor-pointer rounded-full bg-black text-[0px] outline outline-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={() => setState({ ...state, background: 'black' })}
          >
            Black
          </button>

          <label
            className="size-28 cursor-pointer rounded-full text-[0px] focus-within:cursor-default [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-offset-2 [&:has(:focus-visible)]:outline-focus"
            style={{
              background: `
                radial-gradient(circle, white, transparent 65%),
                conic-gradient(
                  in oklch,
                  oklch(63.2% 0.254 30),
                  oklch(79% 0.171 70),
                  oklch(96.7% 0.211 110),
                  oklch(87.4% 0.241 150),
                  oklch(90.2% 0.156 190),
                  oklch(76.2% 0.152 230),
                  oklch(46.5% 0.305 270),
                  oklch(59.5% 0.301 310),
                  oklch(65.9% 0.275 350),
                  oklch(63.2% 0.254 30)
                )
              `,
            }}
          >
            <input
              className="h-full w-full cursor-pointer rounded-full opacity-0"
              type="color"
              onChange={(event) => setState({ ...state, background: event.currentTarget.value })}
            />
            Custom
          </label>
        </div>

        <Control
          label="Dispersion"
          // note we renamed refraction to dispersion but many share links already call it refraction so we're just making a label change for now
          // we could update it to dispersion everywhere if we have time to rewrite the querystring parser to use either name and map it into dispersion
          value={state.refraction}
          min={params.refraction.min}
          max={params.refraction.max}
          step={params.refraction.step}
          onValueChange={(value) => setState((state) => ({ ...state, refraction: value }))}
        />
        <Control
          label="Edge"
          value={state.edge}
          min={params.edge.min}
          max={params.edge.max}
          step={params.edge.step}
          onValueChange={(value) => setState((state) => ({ ...state, edge: value }))}
        />
        <Control
          label="Pattern Blur"
          value={state.patternBlur}
          min={params.patternBlur.min}
          max={params.patternBlur.max}
          step={params.patternBlur.step}
          onValueChange={(value) => setState((state) => ({ ...state, patternBlur: value }))}
        />
        <Control
          label="Liquify"
          value={state.liquid}
          min={params.liquid.min}
          max={params.liquid.max}
          step={params.liquid.step}
          onValueChange={(value) => setState((state) => ({ ...state, liquid: value }))}
        />
        <Control
          label="Speed"
          value={state.speed}
          min={params.speed.min}
          max={params.speed.max}
          step={params.speed.step}
          onValueChange={(value) => setState((state) => ({ ...state, speed: value }))}
        />
        <Control
          label="Pattern Scale"
          value={state.patternScale}
          min={params.patternScale.min}
          max={params.patternScale.max}
          step={params.patternScale.step}
          format={(value) => (value === '0' || value === '10' ? value : parseFloat(value).toFixed(1))}
          onValueChange={(value) => setState((state) => ({ ...state, patternScale: value }))}
        />

        <div className="col-span-full mt-12">
          <label
            htmlFor="file-input"
            className="mb-16 flex h-40 cursor-pointer items-center justify-center rounded-4 bg-button font-medium select-none"
          >
            <input type="file" accept="image/*,.svg" onChange={handleFileInput} id="file-input" className="hidden" />
            Upload image
          </label>
          <p className="w-fill text-sm text-white/80">
            Tips: transparent or white background is required. Shapes work better than words. Use an SVG or a
            high-resolution image.
          </p>
        </div>
      </div>
    </div>
  );
}

interface ControlProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?: (value: string) => string;
  onValueChange: (value: number) => void;
}

function Control({ label, min, max, step, format, value, onValueChange }: ControlProps) {
  return (
    <>
      <div>
        <label className="pr-16 text-nowrap" htmlFor={label}>
          {label}
        </label>
      </div>
      <div>
        <Slider.Root min={min} max={max} step={step} value={[value]} onValueChange={([value]) => onValueChange(value)}>
          <Slider.Track className="relative flex h-32 w-full touch-none items-center rounded-full select-none">
            <span inert className="absolute inset-x-0 h-6 rounded-full bg-white/20" />
            <Slider.Range className="absolute h-6 rounded-full bg-blue select-none" />
            <Slider.Thumb
              tabIndex={-1}
              className="block size-16 rounded-full bg-white outline-focus select-none focus-visible:outline-2"
              style={{ boxShadow: '0 2px 6px -2px black' }}
            />
          </Slider.Track>
        </Slider.Root>
      </div>
      <div className="max-sm:hidden">
        <NumberInput
          id={label}
          min={min}
          max={max}
          increments={[step, step * 10]}
          format={format}
          className="h-40 w-full rounded-4 bg-white/15 pl-12 text-sm tabular-nums outline-white/20 focus:outline-2 focus:-outline-offset-1 focus:outline-blue"
          value={value.toString()}
          onValueCommit={(value) => onValueChange(parseFloat(value))}
        />
      </div>
    </>
  );
}
