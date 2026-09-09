// src/components/drawings/editor/dominantColor.ts
// cover 이미지 분석: 대표색 + 종횡비(aspect).
// 색은 canvas 픽셀 최빈색(흰/검 배경 감점, 채도 가점), aspect 는 이미지 자연 크기 기준.

const SAMPLE_EDGE = 64; // 축소해서 계산 (속도 + 노이즈 완화)

export type CoverAnalysis = {
  dominantColor: string | null;
  aspect: number | null; // width / height
};

// 색 + 비율을 한 번의 이미지 로드로 함께 구한다.
export async function analyzeCover(src: string): Promise<CoverAnalysis> {
  try {
    const img = await loadImage(src);
    const aspect =
      img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : null;

    const canvas = document.createElement("canvas");
    const scale = Math.min(
      SAMPLE_EDGE / img.naturalWidth,
      SAMPLE_EDGE / img.naturalHeight,
      1
    );
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { dominantColor: null, aspect };
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { dominantColor: dominantFromPixels(data), aspect };
  } catch {
    return { dominantColor: null, aspect: null }; // CORS 등 실패 시
  }
}

// 색만 필요할 때의 얇은 래퍼 (하위 호환)
export async function extractDominantColor(src: string): Promise<string | null> {
  const { dominantColor } = await analyzeCover(src);
  return dominantColor;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Storage public URL 은 CORS 허용됨
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function dominantFromPixels(pixels: Uint8ClampedArray): string | null {
  const buckets = new Map<string, number>();
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
    if (a < 125) continue;
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    const max = Math.max(qr, qg, qb), min = Math.min(qr, qg, qb);
    const sat = max === 0 ? 0 : (max - min) / max;
    const light = (max + min) / 2 / 255;
    let weight = 1;
    if (light > 0.92 || light < 0.08) weight = 0.15;
    weight += sat * 0.8;
    const key = `${qr},${qg},${qb}`;
    buckets.set(key, (buckets.get(key) ?? 0) + weight);
  }
  let best: string | null = null;
  let bestW = -1;
  for (const [key, w] of buckets) {
    if (w > bestW) { bestW = w; best = key; }
  }
  if (!best) return null;
  const [r, g, b] = best.split(",").map(Number);
  return (
    "#" +
    [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()
  );
}