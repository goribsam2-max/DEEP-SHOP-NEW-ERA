const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Fix background images in blog teaser being too dark (opacity-20 -> opacity-40)
      content = content.replace(/opacity-20 group-hover:opacity-30/g, 'opacity-40 group-hover:opacity-60');
      content = content.replace(/opacity-10 group-hover:opacity-20/g, 'opacity-40 group-hover:opacity-60');
      
      // Remove mix-blend-multiply from all images or replace with dark:mix-blend-normal
      content = content.replace(/mix-blend-multiply/g, 'mix-blend-multiply dark:mix-blend-normal');
      // If it became duplicated
      content = content.replace(/mix-blend-multiply dark:mix-blend-normal dark:mix-blend-normal/g, 'mix-blend-multiply dark:mix-blend-normal');
      
      if (content !== originalContent) {
         fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir('./pages');
processDir('./components');
let appContent = fs.readFileSync('./App.tsx', 'utf8');
let originalApp = appContent;
appContent = appContent.replace(/mix-blend-multiply/g, 'mix-blend-multiply dark:mix-blend-normal');
if (appContent !== originalApp) fs.writeFileSync('./App.tsx', appContent);

console.log("Done reset_dark.js");
