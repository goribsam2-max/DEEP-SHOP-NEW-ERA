import fs from 'fs';
import path from 'path';

function replaceLeftovers(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replacements
  content = content.replace(/shadow-primary-500\/20/g, 'shadow-black/20 dark:shadow-white/10');
  content = content.replace(/dark:hover:text-primary-300/g, 'dark:hover:text-zinc-200');
  content = content.replace(/fill-primary-500\/10/g, 'fill-zinc-900/10 dark:fill-zinc-100/10');
  content = content.replace(/fill-primary-500/g, 'fill-zinc-900 dark:fill-zinc-100');
  content = content.replace(/bg-primary\/10/g, 'bg-zinc-900/10 dark:bg-zinc-100/10');
  content = content.replace(/bg-primary\/20/g, 'bg-zinc-900/20 dark:bg-zinc-100/20');
  content = content.replace(/border-primary\/30/g, 'border-zinc-900/30 dark:border-zinc-100/30');
  content = content.replace(/text-primary/g, 'text-zinc-900 dark:text-zinc-100');
  content = content.replace(/hover:text-primary/g, 'hover:text-zinc-900 dark:hover:text-zinc-100');
  content = content.replace(/border-primary/g, 'border-zinc-900 dark:border-zinc-100');
  content = content.replace(/hover:border-primary\/50/g, 'hover:border-zinc-900/50 dark:hover:border-zinc-100/50');
  content = content.replace(/hover:shadow-primary\/10/g, 'hover:shadow-zinc-900/10 dark:hover:shadow-zinc-100/10');

  // Specific issues seen in output
  content = content.replace(/dark:text-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-200/g, 'dark:text-zinc-300 dark:hover:text-zinc-100');
  content = content.replace(/text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:text-zinc-50 dark:text-zinc-300 dark:hover:text-zinc-100/g, 'text-zinc-800 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100');

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
      replaceLeftovers(fullPath);
    }
  }
}

processDirectory('./pages');
processDirectory('./components');
processDirectory('./app');
replaceLeftovers('./index.html');
replaceLeftovers('./App.tsx');
