import * as gifenc from 'gifenc';

export interface StickerOption {
  id: string;
  title: string;
  desc: string;
}

export const STICKERS: StickerOption[] = [
  { id: 'flash_sale', title: 'Flash Sale (Neon)', desc: 'Neon glowing flash sale badge' },
  { id: 'discount_tag', title: 'Extra 5% OFF (Pro)', desc: 'Premium luxury discount badge' },
  { id: 'trusted_brand', title: 'Trusted Store', desc: 'Minimalist clean trust badge' },
  { id: 'new_arrival', title: 'New Arrival', desc: 'Trendy new gadget spotlight' },
];

async function loadFont() {
  try {
    const font = new FontFace('Outfit', 'url(https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NJtEtq.woff2)');
    await font.load();
    document.fonts.add(font);
  } catch (e) {
    console.warn("Font load failed, using fallback", e);
  }
}

export const generateStickerGif = async (
  id: string,
  colorScheme: 'black' | 'white',
  onProgress?: (p: number) => void
): Promise<string> => {
  const g = gifenc as any;
  const GIFEncoderFn = g.GIFEncoder || g.default?.GIFEncoder;
  const quantizeFn = g.quantize || g.default?.quantize;
  const applyPaletteFn = g.applyPalette || g.default?.applyPalette;

  if (!GIFEncoderFn || !quantizeFn || !applyPaletteFn) {
    throw new Error('gifenc methods not found');
  }

  await loadFont();
  await document.fonts.ready;

  const width = 320;
  const height = 320;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get canvas context');

  const gif = GIFEncoderFn();
  const frames = 24;
  const delay = 40; // ~25fps

  for (let i = 0; i < frames; i++) {
    const progress = i / frames;
    const time = progress * Math.PI * 2;

    const CHROMA_GREEN = '#00FF00';
    ctx.fillStyle = CHROMA_GREEN;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);

    const txtCol = colorScheme === 'black' ? '#ffffff' : '#09090b';
    const bgCol = colorScheme === 'black' ? '#09090b' : '#ffffff';

    if (id === 'flash_sale') {
      const scale = 1 + Math.sin(time) * 0.05;
      ctx.scale(scale, scale);
      
      const glowStr = Math.abs(Math.sin(time)) * 15 + 5;
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = glowStr;
      
      ctx.fillStyle = bgCol;
      ctx.beginPath();
      ctx.roundRect(-130, -130, 260, 260, 40);
      ctx.fill();
      
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ec4899';
      ctx.stroke();

      ctx.shadowBlur = 0;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 45px Outfit, sans-serif';
      ctx.fillStyle = '#ec4899';
      ctx.fillText('FLASH', 0, -40);
      ctx.fillStyle = txtCol;
      ctx.fillText('SALE', 0, 10);
      
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.fillStyle = '#f97316';
      ctx.fillText('VIBE GADGET', 0, 60);

    } else if (id === 'discount_tag') {
      const yOffset = Math.sin(time) * -10;
      ctx.translate(0, yOffset);

      ctx.fillStyle = bgCol;
      ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 130, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.lineWidth = 8;
      const grad = ctx.createLinearGradient(-130, -130, 130, 130);
      grad.addColorStop(0, '#8b5cf6');
      grad.addColorStop(1, '#3b82f6');
      ctx.strokeStyle = grad;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 24px Outfit, sans-serif';
      ctx.fillStyle = txtCol;
      ctx.fillText('EXTRA', 0, -40);
      
      ctx.font = '900 65px Outfit, sans-serif';
      ctx.fillStyle = grad;
      ctx.fillText('5%', 0, 15);

      ctx.font = '700 16px Outfit, sans-serif';
      ctx.fillStyle = '#8b5cf6';
      ctx.fillText('DISCOUNT', 0, 65);

    } else if (id === 'trusted_brand') {
      ctx.rotate(Math.sin(time) * 0.1);

      ctx.fillStyle = bgCol;
      ctx.beginPath();
      // Hexagon shape
      for (let j = 0; j < 6; j++) {
        const ag = (j / 6) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(ag) * 140;
        const y = Math.sin(ag) * 140;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.lineWidth = 5;
      ctx.strokeStyle = '#10b981';
      ctx.stroke();
      
      // inner dash
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const ag = (j / 6) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(ag) * 125;
        const y = Math.sin(ag) * 125;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 40px Outfit, sans-serif';
      ctx.fillStyle = txtCol;
      ctx.fillText('TRUSTED', 0, -25);
      ctx.fillStyle = '#10b981';
      ctx.fillText('STORE', 0, 15);
      
      ctx.font = '800 16px Outfit, sans-serif';
      ctx.fillStyle = txtCol;
      ctx.fillText('VIBE GADGET', 0, 60);

    } else if (id === 'new_arrival') {
      const rot = time;
      
      // Rotating outer dashed circle
      ctx.save();
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(0, 0, 140, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#eab308';
      ctx.setLineDash([20, 20]);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = bgCol;
      ctx.shadowColor = 'rgba(234, 179, 8, 0.3)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const scale = 1 + Math.sin(time * 2) * 0.05;
      ctx.scale(scale, scale);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 45px Outfit, sans-serif';
      ctx.fillStyle = '#eab308';
      ctx.fillText('NEW', 0, -25);
      ctx.fillStyle = txtCol;
      ctx.fillText('ARRIVAL', 0, 15);
      
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.fillStyle = '#ca8a04';
      ctx.fillText('LATEST VIBE', 0, 60);
    }

    ctx.restore();

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Transparent background logic
    for (let j = 0; j < data.length; j += 4) {
      if (data[j] === 0 && data[j+1] === 255 && data[j+2] === 0) {
        // Leave green, but we map it to transparent index
      } else {
        // slightly anti-alias the edges that blend into green by clamping or ignoring them.
        // Actually, gifenc palette is limited anyway.
      }
    }

    const palette = quantizeFn(data, 256);
    
    // Find the green color in palette and force it to be transparent index
    let greenIdx = 0;
    let minD = 999999;
    for (let k = 0; k < palette.length; k++) {
      const d = Math.abs(palette[k][0]-0) + Math.abs(palette[k][1]-255) + Math.abs(palette[k][2]-0);
      if (d < minD) {
        minD = d;
        greenIdx = k;
      }
    }
    
    const index = applyPaletteFn(data, palette);
    gif.writeFrame(index, width, height, { palette, delay, transparent: true, transparentIndex: greenIdx });

    if (onProgress) onProgress((i + 1) / frames);
    await new Promise(r => setTimeout(r, 0));
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes], { type: 'image/gif' });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
