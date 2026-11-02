declare module 'ogl' {
  export class Renderer {
    constructor(options?: { dpr?: number; alpha?: boolean; antialias?: boolean });
    gl: (WebGLRenderingContext | WebGL2RenderingContext) & {
      canvas: HTMLCanvasElement;
      drawingBufferWidth: number;
      drawingBufferHeight: number;
    };
    setSize(width: number, height: number): void;
    render(options: { scene: any }): void;
    // Some builds may expose dpr
    readonly dpr?: number;
  }

  export class Program {
    constructor(
      gl: WebGLRenderingContext | WebGL2RenderingContext,
      config: { vertex: string; fragment: string; uniforms?: any }
    );
    remove?(): void;
  }

  export class Triangle {
    constructor(gl: WebGLRenderingContext | WebGL2RenderingContext);
    remove?(): void;
  }

  export class Mesh<T = any> {
    constructor(
      gl: WebGLRenderingContext | WebGL2RenderingContext,
      opts: { geometry: T; program: Program }
    );
    remove?(): void;
  }
}
