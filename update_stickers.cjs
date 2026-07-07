const fs = require('fs');
const code = fs.readFileSync('pages/Affiliate.tsx', 'utf-8');
const lines = code.split('\n');

const stickersStr = `  const stickers = [
    {
      id: "flash_sale",
      title: "Flash Sale (Neon)",
      desc: "Neon glowing flash sale badge",
      svg: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;900&amp;display=swap');
          @keyframes glow { 0%, 100% { filter: drop-shadow(0 0 10px #ec4899); transform: scale(1); } 50% { filter: drop-shadow(0 0 25px #ec4899) drop-shadow(0 0 10px #ec4899); transform: scale(1.05); } }
          .fst { animation: glow 2s ease-in-out infinite; transform-origin: center; }
          .t1 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 45px; fill: #ec4899; }
          .t2 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 45px; fill: \${textColor}; }
          .t3 { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 16px; fill: #f97316; }
        </style>
        <g class="fst">
          <rect x="30" y="30" width="260" height="260" rx="40" fill="\${bgColor}" stroke="#ec4899" stroke-width="6" />
          <text x="160" y="130" text-anchor="middle" class="t1">FLASH</text>
          <text x="160" y="180" text-anchor="middle" class="t2">SALE</text>
          <text x="160" y="230" text-anchor="middle" class="t3">VIBE GADGET</text>
        </g>
      </svg>\`,
    },
    {
      id: "discount_tag",
      title: "Extra 5% OFF (Pro)",
      desc: "Premium luxury discount badge",
      svg: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&amp;display=swap');
          @keyframes floatTag { 0%, 100% { transform: translateY(0); filter: drop-shadow(0 15px 20px rgba(139,92,246,0.4)); } 50% { transform: translateY(-10px); filter: drop-shadow(0 25px 25px rgba(139,92,246,0.5)); } }
          .dct { animation: floatTag 3s ease-in-out infinite; transform-origin: center; }
          .t1 { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 24px; fill: \${textColor}; }
          .t2 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 65px; fill: url(#grad); }
          .t3 { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 16px; fill: #8b5cf6; }
        </style>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8b5cf6"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <g class="dct">
          <circle cx="160" cy="160" r="130" fill="\${bgColor}" stroke="url(#grad)" stroke-width="8" />
          <text x="160" y="125" text-anchor="middle" class="t1">EXTRA</text>
          <text x="160" y="195" text-anchor="middle" class="t2">5%</text>
          <text x="160" y="240" text-anchor="middle" class="t3">DISCOUNT</text>
        </g>
      </svg>\`,
    },
    {
      id: "trusted_brand",
      title: "Trusted Store",
      desc: "Minimalist clean trust badge",
      svg: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&amp;display=swap');
          @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
          .bg-hex { animation: rotate 20s linear infinite; transform-origin: 160px 160px; }
          .tbl { animation: pulse 2s ease-in-out infinite; transform-origin: center; }
          .t1 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 40px; fill: \${textColor}; }
          .t2 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 40px; fill: #10b981; }
          .t3 { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 16px; fill: \${textColor}; }
        </style>
        <g class="tbl">
          <g class="bg-hex">
            <polygon points="160,20 281.24,90 281.24,230 160,300 38.76,230 38.76,90" fill="\${bgColor}" stroke="#10b981" stroke-width="5" />
            <polygon points="160,35 268.25,97.5 268.25,222.5 160,285 51.75,222.5 51.75,97.5" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="10 10" />
          </g>
          <text x="160" y="145" text-anchor="middle" class="t1">TRUSTED</text>
          <text x="160" y="185" text-anchor="middle" class="t2">STORE</text>
          <text x="160" y="235" text-anchor="middle" class="t3">VIBE GADGET</text>
        </g>
      </svg>\`,
    },
    {
      id: "new_arrival",
      title: "New Arrival",
      desc: "Trendy new gadget spotlight",
      svg: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;900&amp;display=swap');
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes bop { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(234,179,8,0.3)); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(234,179,8,0.6)); } }
          .naring { animation: spin 10s linear infinite; transform-origin: 160px 160px; }
          .nabop { animation: bop 1s ease-in-out infinite; transform-origin: center; }
          .t1 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 45px; fill: #eab308; }
          .t2 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 45px; fill: \${textColor}; }
          .t3 { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 16px; fill: #ca8a04; }
        </style>
        <g>
          <circle cx="160" cy="160" r="140" fill="none" stroke="#eab308" stroke-width="4" stroke-dasharray="20 20" class="naring" />
          <g class="nabop">
            <circle cx="160" cy="160" r="120" fill="\${bgColor}" />
            <text x="160" y="145" text-anchor="middle" class="t1">NEW</text>
            <text x="160" y="185" text-anchor="middle" class="t2">ARRIVAL</text>
            <text x="160" y="235" text-anchor="middle" class="t3">LATEST VIBE</text>
          </g>
        </g>
      </svg>\`,
    }
  ];`;

// find indices
const startIdx = lines.findIndex(l => l.includes('const stickers = ['));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('];'));

lines.splice(startIdx, endIdx - startIdx + 1, stickersStr);

fs.writeFileSync('pages/Affiliate.tsx', lines.join('\n'));
console.log('Successfully updated Affiliate.tsx SVGs');
