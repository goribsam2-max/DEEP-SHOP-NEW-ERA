const fs = require('fs');
const path = require('path');

const files = [
  'pages/Profile.tsx',
  'pages/Settings.tsx',
  'pages/MyOrders.tsx',
  'pages/Checkout.tsx',
  'pages/Wishlist.tsx',
  'pages/CompleteProfile.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(path.join(__dirname, f), 'utf8');
  content = content.replace(/bg-black/g, 'bg-[#06331e]');
  content = content.replace(/text-black/g, 'text-[#06331e]');
  content = content.replace(/border-black/g, 'border-[#06331e]');
  content = content.replace(/bg-zinc-900/g, 'bg-[#0a4a2b]');
  content = content.replace(/text-zinc-900/g, 'text-[#06331e]');
  fs.writeFileSync(path.join(__dirname, f), content);
  console.log(`Replaced in ${f}`);
});
