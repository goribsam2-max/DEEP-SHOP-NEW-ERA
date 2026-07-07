const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walk(dirPath, callback) : 
      (dirPath.endsWith('.tsx') && callback(dirPath));
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Background and gradients
  content = content.replace(/bg-gradient-to-[a-z]+ from-\[#[a-zA-Z0-9]+\] to-emerald-\d+/g, 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800');
  content = content.replace(/bg-gradient-to-[a-z]+ from-emerald-\d+ to-teal-\d+/g, 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900');
  
  // Clean up primary colours to monochrome
  content = content.replace(/bg-\[#06331e\]/g, 'bg-zinc-900 dark:bg-zinc-100');
  content = content.replace(/text-emerald-500/g, 'text-zinc-900 dark:text-white');
  content = content.replace(/bg-emerald-500/g, 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900');
  content = content.replace(/text-emerald-600/g, 'text-zinc-800 dark:text-zinc-200');
  content = content.replace(/text-emerald-400/g, 'text-zinc-800 dark:text-zinc-200');
  content = content.replace(/bg-emerald-50/g, 'bg-zinc-50 dark:bg-zinc-900');
  content = content.replace(/border-emerald-100/g, 'border-zinc-200');
  
  // Shadows
  content = content.replace(/shadow-2xl/g, 'shadow-sm');
  content = content.replace(/shadow-xl/g, 'shadow-sm');
  content = content.replace(/drop-shadow-\[.*?\]/g, '');
  content = content.replace(/drop-shadow-[a-z]+/g, '');
  
  // Borders
  content = content.replace(/border-dashed/g, 'border-solid');
  
  // Rounding
  content = content.replace(/rounded-\[.*?\]/g, 'rounded-2xl');
  content = content.replace(/rounded-3xl/g, 'rounded-2xl');
  content = content.replace(/rounded-full/g, 'rounded-full'); // Keep this usually
  
  // Typography
  content = content.replace(/font-black/g, 'font-medium');
  content = content.replace(/font-extrabold/g, 'font-semibold');
  content = content.replace(/tracking-\[.*?\]/g, 'tracking-normal');
  content = content.replace(/tracking-widest/g, '');
  content = content.replace(/\buppercase\b/g, ''); // REMOVED UPPERCASE
  
  // Animations inside generic hover states
  content = content.replace(/hover:-translate-y-1/g, 'hover:scale-[1.02] transition-transform');
  content = content.replace(/active:scale-90/g, 'active:scale-95');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated', filePath);
  }
}

['pages', 'components'].forEach(dir => {
  if (fs.existsSync(dir)) walk(dir, processFile);
});
