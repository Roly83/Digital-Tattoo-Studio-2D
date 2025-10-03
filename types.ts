export interface Asset {
  id: string;
  src: string;
}

export interface Layer {
  id: string;
  assetId: string;
  src: string;
  originalSrc: string; 
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  brightness: number;
  contrast: number;
  isFixed: boolean;
}

export enum TattooStyle {
  AmericanTraditional = 'American Traditional',
  Realism = 'Realism',
  Tribal = 'Tribal',
  Watercolor = 'Watercolor',
  Japanese = 'Japanese (Irezumi)',
  Geometric = 'Geometric',
  Minimalist = 'Minimalist',
}
