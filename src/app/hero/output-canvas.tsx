'use client';

import { ShaderMount } from '@paper-design/shaders-react';
import { liquidFragSource } from './liquid-frag';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// uniform sampler2D u_image_texture;
// uniform float u_time;
// uniform float u_ratio;
// uniform float u_img_ratio;
// uniform float u_cycleWidth;

// uniform float u_refraction;
// uniform float u_edgesPower;
// uniform float u_edgesWidth;
// uniform float u_edgeBlur;
// uniform float u_stripesBlur;
// uniform float u_noisePower;
// uniform float u_speed;

const vertexShaderSource = `#version 300 es
precision mediump float;

in vec2 a_position;
out vec2 vUv;

void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
}` as const;

const defaultParameters = {
  patternScale: 2.7,
  refraction: .03,
  edgeBlur: .5,
  patternBlur: .005,
  liquid: .0,
  speed: .3,
} as const;

export function OutputCanvas({ imageData }: { imageData: ImageData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [params, setParams] = useState<typeof defaultParameters>(defaultParameters);
  const [gl, setGl] = useState<WebGL2RenderingContext | null>(null);
  const [uniforms, setUniforms] = useState<Record<string, WebGLUniformLocation>>({});

  function updateUniforms() {
    console.log('updating uniforms');
    if (!gl || !uniforms) return;
    gl.uniform1f(uniforms.u_edgeBlur, params.edgeBlur);
    gl.uniform1f(uniforms.u_patternBlur, params.patternBlur);
    gl.uniform1f(uniforms.u_speed, params.speed);
    gl.uniform1f(uniforms.u_patternScale, params.patternScale);
    gl.uniform1f(uniforms.u_refraction, params.refraction);
    gl.uniform1f(uniforms.u_liquid, params.liquid);
  }

  useEffect(() => {
    function initShader() {
      const canvas = canvasRef.current;
      const gl = canvas?.getContext('webgl2');
      if (!canvas || !gl) {
        toast.error('Failed to initialize shader. Does your browser support WebGL2?');
        return;
      }

      function createShader(gl: WebGL2RenderingContext, sourceCode: string, type: number) {
        const shader = gl.createShader(type);
        if (!shader) {
          toast.error('Failed to create shader');
          return null;
        }

        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }

        return shader;
      }

      const vertexShader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
      const fragmentShader = createShader(gl, liquidFragSource, gl.FRAGMENT_SHADER);
      const program = gl.createProgram();
      if (!program || !vertexShader || !fragmentShader) {
        toast.error('Failed to create program or shaders');
        return;
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return null;
      }

      function getUniforms(program: WebGLProgram, gl: WebGL2RenderingContext) {
        let uniforms: Record<string, WebGLUniformLocation> = {};
        let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
          let uniformName = gl.getActiveUniform(program, i)?.name;
          if (!uniformName) continue;
          uniforms[uniformName] = gl.getUniformLocation(program, uniformName) as WebGLUniformLocation;
        }
        return uniforms;
      }
      const uniforms = getUniforms(program, gl);
      setUniforms(uniforms);

      // Vertex position
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      gl.useProgram(program);

      const positionLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(positionLocation);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      setGl(gl);
    }

    initShader();
    updateUniforms();
  }, []);

  // Keep uniforms updated
  useEffect(() => {
    if (!gl || !uniforms) return;

    updateUniforms();
  }, [gl, params, uniforms]);

  // Render every frame
  useEffect(() => {
    if (!gl || !uniforms) return;

    let renderId: number;
    function render() {
      const currentTime = performance.now();
      gl!.uniform1f(uniforms.u_time, currentTime);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      renderId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(renderId);
    };
  }, [gl]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || !gl || !uniforms) return;

    function resizeCanvas() {
      if (!canvasEl || !gl || !uniforms) return;
      const imgRatio = imageData.width / imageData.height;

      // Set max dimension to 500px
      const maxSize = 500;
      let width, height;
      if (imgRatio > 1) {
        width = Math.min(maxSize, imageData.width);
        height = width / imgRatio;
      } else {
        height = Math.min(maxSize, imageData.height);
        width = height * imgRatio;
      }

      canvasEl.width = width * devicePixelRatio;
      canvasEl.height = height * devicePixelRatio;

      // Set canvas style dimensions for actual display size
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;

      gl.viewport(0, 0, canvasEl.width, canvasEl.height);
      const canvasRatio = canvasEl.width / canvasEl.height;
      gl.uniform1f(uniforms.u_ratio, canvasRatio);
      gl.uniform1f(uniforms.u_img_ratio, imgRatio);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gl, uniforms, imageData]);

  useEffect(() => {
    if (!gl || !uniforms) return;

    // Delete any existing texture first
    const existingTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
    if (existingTexture) {
      gl.deleteTexture(existingTexture);
    }

    const imageTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);

    // Set texture parameters before uploading the data
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Ensure power-of-two dimensions or use appropriate texture parameters
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        imageData.width,
        imageData.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        imageData.data
      );

      gl.uniform1i(uniforms.u_image_texture, 0);
    } catch (e) {
      console.error('Error uploading texture:', e);
      toast.error('Failed to upload image texture');
    }

    return () => {
      // Cleanup texture when component unmounts or imageData changes
      if (imageTexture) {
        gl.deleteTexture(imageTexture);
      }
    };
  }, [gl, uniforms, imageData]);

  return (
    <div className="flex items-center justify-center rounded-lg bg-gradient-to-t from-[#d1d1d1] to-[#f1f1f1] p-8">
      <canvas ref={canvasRef} />
    </div>
  );
}
