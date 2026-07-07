import fs from 'fs';
import path from 'path';

function replaceColorsInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replacements for text
  content = content.replace(/text-primary-500/g, 'text-zinc-900 dark:text-zinc-100');
  content = content.replace(/text-primary-600/g, 'text-zinc-800 dark:text-zinc-200');
  content = content.replace(/text-primary-400/g, 'text-zinc-700 dark:text-zinc-300');
  content = content.replace(/hover:text-primary-600/g, 'hover:text-zinc-800 dark:hover:text-zinc-200');
  content = content.replace(/hover:text-primary-500/g, 'hover:text-zinc-900 dark:hover:text-zinc-100');

  // Multi-class combination for buttons
  content = content.replace(/bg-primary-500 hover:bg-primary-600 text-white/g, 'bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900');
  content = content.replace(/bg-primary-500 text-white/g, 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900');
  content = content.replace(/bg-primary-50 text-primary-600/g, 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100');

  // Replacements for bg
  content = content.replace(/bg-primary-50/g, 'bg-zinc-100 dark:bg-zinc-800');
  content = content.replace(/bg-primary-100/g, 'bg-zinc-200 dark:bg-zinc-700');
  content = content.replace(/bg-primary-500/g, 'bg-zinc-900 dark:bg-zinc-100');
  content = content.replace(/bg-primary-600/g, 'bg-zinc-800 dark:bg-zinc-200');
  content = content.replace(/hover:bg-primary-600/g, 'hover:bg-zinc-800 dark:hover:bg-zinc-200');
  content = content.replace(/hover:bg-primary-50/g, 'hover:bg-zinc-100 dark:hover:bg-zinc-800');

  // Replacements for borders
  content = content.replace(/border-primary-500/g, 'border-zinc-900 dark:border-zinc-100');
  content = content.replace(/border-primary-200/g, 'border-zinc-200 dark:border-zinc-800');
  content = content.replace(/focus:border-primary-500/g, 'focus:border-zinc-900 dark:focus:border-zinc-100');

  // Replacements for ring
  content = content.replace(/ring-primary-500/g, 'ring-zinc-900 dark:ring-zinc-100');
  content = content.replace(/focus:ring-primary-500/g, 'focus:ring-zinc-900 dark:focus:ring-zinc-100');

  // Others
  content = content.replace(/text-primary-700/g, 'text-zinc-950 dark:text-zinc-50');

  if (original !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function processDirectory(dir: string) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (/\.(tsx|ts|html|js|mjs|cjs)$/.test(fullPath)) {
      replaceColorsInFile(fullPath);
    }
  }
}

processDirectory('./pages');
processDirectory('./components');
processDirectory('./app');
replaceColorsInFile('./index.html');
replaceColorsInFile('./App.tsx');
