import sharp from "sharp";

/** Maior lado da foto após redimensionamento (miniatura de perfil). */
const MAX_DIMENSION = 1024;

/**
 * Converte qualquer imagem aceita pelo libvips/sharp para WebP otimizado.
 * Redimensiona mantendo proporção, aplica orientação EXIF e compressão.
 */
export async function convertProfileImageToOptimizedWebp(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 82,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer();
}
