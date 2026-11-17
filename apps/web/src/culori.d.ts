declare module 'culori' {
  export function oklch(color: string | object): any;
  export function formatHex(color: object): string;
  export function wcagContrast(colorA: string, colorB: string): number;
}
