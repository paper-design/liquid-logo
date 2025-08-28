'use client';

/** Cleans up the input image by turning it into a black and white mask with a beveled edge */

export function parseLogoImage(file: File | string): Promise<{ imageData: ImageData; pngBlob: Blob }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  return new Promise((resolve, reject) => {
    if (!file || !ctx) {
      reject(new Error('Invalid file or context'));
      return;
    }

    const img = new Image();
    img.onload = function () {
      // Force SVG to load at a high fidelity size if it's an SVG
      if (typeof file === 'string' ? file.endsWith('.svg') : file.type === 'image/svg+xml') {
        img.width = 500; // or whatever base size you prefer
        img.height = 500;
      }

      const MAX_SIZE = 500;
      const MIN_SIZE = 500;
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      // Calculate new dimensions if image is too large or too small
      if (width > MAX_SIZE || height > MAX_SIZE || width < MIN_SIZE || height < MIN_SIZE) {
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else if (width < MIN_SIZE) {
            height = Math.round((height * MIN_SIZE) / width);
            width = MIN_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          } else if (height < MIN_SIZE) {
            width = Math.round((width * MIN_SIZE) / height);
            height = MIN_SIZE;
          }
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ratio = width / height;
      const blurPadding = 80;

      // Draw the user image on an offscreen canvas.
      const shapeCanvas = document.createElement('canvas');
      shapeCanvas.width = width;
      shapeCanvas.height = height;
      const shapeCtx = shapeCanvas.getContext('2d')!;
      shapeCtx.filter = "grayscale(100%)";
      shapeCtx.fillStyle = "white";
      shapeCtx.fillRect(0, 0, width, height);
      shapeCtx.drawImage(img, blurPadding, blurPadding / ratio, width - 2 * blurPadding, height - 2 * blurPadding / ratio);

      // 1) Build the inside/outside mask:
      // Non-shape pixels: pure white (255,255,255,255) or fully transparent.
      // Everything else is part of a shape.
      const shapeImageData = shapeCtx.getImageData(0, 0, width, height);
      const data = shapeImageData.data;

      shapeCtx.fillRect(0, 0, width, height);
      shapeCtx.filter = 'blur(80px)';
      shapeCtx.drawImage(img, blurPadding, blurPadding / ratio, width - 2 * blurPadding, height - 2 * blurPadding / ratio);
      shapeCtx.filter = 'blur(18px)';
      shapeCtx.drawImage(img, blurPadding, blurPadding / ratio, width - 2 * blurPadding, height - 2 * blurPadding / ratio);
      const outerBlurData = shapeCtx.getImageData(0, 0, width, height).data;

      shapeCtx.fillRect(0, 0, width, height);
      shapeCtx.filter = 'blur(30px)';
      shapeCtx.drawImage(img, blurPadding, blurPadding / ratio, width - 2 * blurPadding, height - 2 * blurPadding / ratio);
      const innerBlurData = shapeCtx.getImageData(0, 0, width, height).data;

      shapeCtx.fillRect(0, 0, width, height);
      shapeCtx.filter = 'blur(2px)';
      shapeCtx.drawImage(img, blurPadding, blurPadding / ratio, width - 2 * blurPadding, height - 2 * blurPadding / ratio);
      const contourData = shapeCtx.getImageData(0, 0, width, height).data;

      const shapeMask = new Array(width * height).fill(false);
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var idx4 = (y * width + x) * 4;
          var r = data[idx4];
          // var g = data[idx4 + 1];
          // var b = data[idx4 + 2];
          var a = data[idx4 + 3];
          // if ((r === 255 && g === 255 && b === 255 && a === 255) || a === 0) {
          if ((r === 255 && a === 255) || a === 0) {
            shapeMask[y * width + x] = false;
          } else {
            shapeMask[y * width + x] = true;
          }
        }
      }

      function inside(x: number, y: number) {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        return shapeMask[y * width + x];
      }

      // 2) Identify boundary (pixels that have at least one non-shape neighbor)
      var boundaryMask = new Array(width * height).fill(false);
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var idx = y * width + x;
          if (!shapeMask[idx]) continue;
          var isBoundary = false;
          for (var ny = y - 1; ny <= y + 1 && !isBoundary; ny++) {
            for (var nx = x - 1; nx <= x + 1 && !isBoundary; nx++) {
              if (!inside(nx, ny)) {
                isBoundary = true;
              }
            }
          }
          if (isBoundary) {
            boundaryMask[idx] = true;
          }
        }
      }

      // 3) Poisson solve: Δu = -C (i.e. u_xx + u_yy = C), with u=0 at the boundary.
      var u = new Float32Array(width * height).fill(0);
      var newU = new Float32Array(width * height).fill(0);
      var C = 0.01;
      var ITERATIONS = 300;

      function getU(x: number, y: number, arr: Float32Array) {
        if (x < 0 || x >= width || y < 0 || y >= height) return 0;
        if (!shapeMask[y * width + x]) return 0;
        return arr[y * width + x];
      }

      for (var iter = 0; iter < ITERATIONS; iter++) {
        for (var y = 0; y < height; y++) {
          for (var x = 0; x < width; x++) {
            var idx = y * width + x;
            if (!shapeMask[idx] || boundaryMask[idx]) {
              newU[idx] = 0;
              continue;
            }
            var sumN = getU(x + 1, y, u) + getU(x - 1, y, u) + getU(x, y + 1, u) + getU(x, y - 1, u);
            newU[idx] = (C + sumN) / 4;
          }
        }
        // Swap u with newU
        for (var i = 0; i < width * height; i++) {
          u[i] = newU[i];
        }
      }

      // 4) Normalize the solution and apply a nonlinear remap.
      var maxVal = 0;
      for (var i = 0; i < width * height; i++) {
        if (u[i] > maxVal) maxVal = u[i];
      }
      const outImg = ctx.createImageData(width, height);

      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var idx = y * width + x;
          var px = idx * 4;
          const innerContour = u[idx] / maxVal;
          let mixer = contourData[px] / 255;
          function mix(a, b, t) {
            return a * (1 - t) + b * t;
          }
          outImg.data[px] = mix(255 * (1 - innerContour), 0, mixer);
          outImg.data[px + 1] = mix(0, (255 - outerBlurData[px + 1]), mixer);
          outImg.data[px + 2] = mix(innerBlurData[px + 2], 0, mixer);
          outImg.data[px + 3] = contourData[px];
        }
      }
      ctx.putImageData(outImg, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob'));
          return;
        }
        resolve({
          imageData: outImg,
          pngBlob: blob,
        });
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = typeof file === 'string' ? file : URL.createObjectURL(file);
  });
}
