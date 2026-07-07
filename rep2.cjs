const fs = require('fs');
const path = require('path');

const files = [
  'pages/AllProducts.tsx',
  'pages/Wishlist.tsx',
  'index.html'
];

files.forEach(f => {
  try {
    let content = fs.readFileSync(path.join(__dirname, f), 'utf8');
    
    // index.html changes: Replace --zinc-900 to #06331e
    if(f === 'index.html') {
      content = content.replace(/--zinc-900: #09090b;/g, '--zinc-900: #06331e;');
      content = content.replace(/background-color: var\(--zinc-900\);/g, 'background-color: #06331e;');
    } else {
      content = content.replace(/hover:bg-black/g, 'hover:bg-[#06331e]');
      content = content.replace(/bg-black/g, 'bg-[#06331e]');
      content = content.replace(/text-black/g, 'text-[#06331e]');
      content = content.replace(/border-black/g, 'border-[#06331e]');
      content = content.replace(/hover:text-black/g, 'hover:text-[#06331e]');
      content = content.replace(/hover:border-black/g, 'hover:border-[#06331e]');
      content = content.replace(/btn-primary/g, 'btn-primary bg-[#06331e]');
    }
    
    fs.writeFileSync(path.join(__dirname, f), content);
    console.log(`Updated ${f}`);
  } catch(e){
    console.log(`Failed on ${f}: ${e.message}`);
  }
});
