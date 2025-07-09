
self.onmessage = async (e) => {
    const file = e.data;
    try {
        const bitmap = await createImageBitmap(file)
        let height = bitmap.height;
        let width = bitmap.width;

        const MAX_SIZE = 1000;
        const MIN_SIZE = 500;

        if (width > MAX_SIZE || height > MAX_SIZE || width < MIN_SIZE || height < MIN_SIZE) {
            if (width > height) {
                const ratio = MAX_SIZE / width;
                width = Math.min(MAX_SIZE, Math.max(MIN_SIZE, width));
                height = Math.round(height * ratio);
            } else {
                const ratio = MAX_SIZE / height;
                height = Math.min(MAX_SIZE, Math.max(MIN_SIZE, height));
                width = Math.round(width * ratio);
            }
        }

        const shapeCanvas = new OffscreenCanvas(width, height)
        const ctx = shapeCanvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context');

        ctx.drawImage(bitmap, 0, 0, width, height);

        const shapeImageData = ctx.getImageData(0, 0, width, height);
        const data = shapeImageData.data;
        const shapeMask = new Array(width * height).fill(false);

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var idx4 = (y * width + x) * 4;
                var r = data[idx4];
                var g = data[idx4 + 1];
                var b = data[idx4 + 2];
                var a = data[idx4 + 3];
                if ((r === 255 && g === 255 && b === 255 && a === 255) || a === 0) {
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
        const alpha = 2.0; // Adjust for contrast.
        const outImg = ctx.createImageData(width, height);

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var idx = y * width + x;
                var px = idx * 4;
                if (!shapeMask[idx]) {
                    outImg.data[px] = 255;
                    outImg.data[px + 1] = 255;
                    outImg.data[px + 2] = 255;
                    outImg.data[px + 3] = 255;
                } else {
                    const raw = u[idx] / maxVal;
                    const remapped = Math.pow(raw, alpha);
                    const gray = 255 * (1 - remapped);
                    outImg.data[px] = gray;
                    outImg.data[px + 1] = gray;
                    outImg.data[px + 2] = gray;
                    outImg.data[px + 3] = 255;
                }
            }
        }

        ctx.putImageData(outImg, 0, 0);
        const pngBlob = await shapeCanvas.convertToBlob();

        self.postMessage({ imageData: outImg, pngBlob });

    } catch (error) {
        console.error('Error parsing logo image:', error);
        self.postMessage({ error });
    }
}