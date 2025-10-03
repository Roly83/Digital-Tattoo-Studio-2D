import { TattooStyle } from './types';

export const TATTOO_STYLE_PROMPTS: Record<TattooStyle, string> = {
  [TattooStyle.AmericanTraditional]: 'bold black outlines, a limited color palette of red, green, yellow, and black, iconic sailor and patriotic motifs, high contrast, clean design, tattoo flash style.',
  [TattooStyle.Realism]: 'photorealistic, high detail, smooth gradients and shading, accurate proportions, often in black and grey but can be color, 3D effect, capturing the likeness of a photo.',
  [TattooStyle.Tribal]: 'bold, black, interlocking patterns, symmetrical designs, abstract shapes, sharp lines, often inspired by ancient Polynesian, Maori, or Haida art.',
  [TattooStyle.Watercolor]: 'vibrant colors, soft edges, paint splatters and drips, looks like a watercolor painting on skin, blends of color with no black outlines.',
  [TattooStyle.Japanese]: 'Irezumi style, rich in symbolism with dragons, koi fish, tigers, and gods. Bold outlines, vibrant colors, flowing composition that covers large body areas, detailed backgrounds with waves, clouds, or wind bars.',
  [TattooStyle.Geometric]: 'clean lines, perfect shapes like circles, triangles, and squares, intricate patterns, mandalas, sacred geometry, often blackwork, symmetrical.',
  [TattooStyle.Minimalist]: 'fine lines, simple, small, and discreet design, often black ink, uses negative space, basic shapes or single words.',
};
