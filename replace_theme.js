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
      
      // We want to replace standard black themes with #06331e and emerald themes
      
      // Button backgrounds
      content = content.replace(/bg-black/g, 'bg-[#06331e]');
      // Active borders
      content = content.replace(/border-black/g, 'border-[#06331e]');
      // Active rings
      content = content.replace(/ring-black/g, 'ring-[#06331e]');
      // Text highlights (like links, active stars) - Be careful with standard text-black
      // Will only do specific hover states or yellow stars to emerald (maybe?)
      
      fs.writeFileSync(fullPath, content);
      console.log('Updated ' + fullPath);
    }
  }
}

processDir('./pages');
processDir('./components');
