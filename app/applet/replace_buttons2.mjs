import fs from 'fs';
import path from 'path';

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('btn-primary') || content.includes('btn-secondary')) {
      // Split by <button 
      let parts = content.split('<button ');
      for (let i = 1; i < parts.length; i++) {
          let part = parts[i];
          let endIdx = part.indexOf('>');
          if (endIdx !== -1) {
              let attrs = part.substring(0, endIdx);
              if (attrs.includes('btn-primary') || attrs.includes('btn-secondary')) {
                  let variant = attrs.includes('btn-primary') ? 'primary' : 'secondary';
                  let newAttrs = attrs.replace(/\bbtn-(primary|secondary)\b/g, '').replace(/className=(["'])\s+/g, 'className=$1').replace(/\s+(["'])/g, '$1');
                  parts[i] = newAttrs + part.substring(endIdx);
                  // We also need to replace the closing tag if we rename <button to <Button
                  // We'll handle changing <button to <Button at the join step
              }
          }
      }
      content = parts.join('<AnotherButtonTagThatNeedsReplace ');
      content = content.replace(/<AnotherButtonTagThatNeedsReplace /g, (match, offset, str) => {
          let endIdx = str.indexOf('>', offset);
          let attrs = str.substring(offset, endIdx !== -1 ? endIdx : str.length);
          if (attrs.includes('variant="primary"') || attrs.includes('variant="secondary"')) {
              return '<Button ';
          }
           return '<button ';
      });

      // replace </button> with </Button> if there's variant
      let finalContent = "";
      let openTags = []; // we don't have a full AST so we'll just do a hacky regex for <button ... variant=" ... > ... </button>
      
      // Let's just string replace the known usages without HTML AST
      content = content.replace(/<button([^>]+btn-(primary|secondary)[^>]*)>([\s\S]*?)<\/button>/g, (match, attrs, variantClass, inner) => {
          let variant = variantClass === 'primary' ? 'primary' : 'secondary';
          let newAttrs = attrs.replace(new RegExp(`\\bbtn-${variantClass}\\b`, 'g'), '').replace(/className=(["'])\s+/g, 'className=$1').replace(/\s+(["'])/g, '$1');
          return `<Button${newAttrs} variant="${variant}">${inner}</Button>`;
      });
      content = content.replace(/<button([^>]+btn-(primary|secondary)[^>]*)\/>/g, (match, attrs, variantClass) => {
          let variant = variantClass === 'primary' ? 'primary' : 'secondary';
          let newAttrs = attrs.replace(new RegExp(`\\bbtn-${variantClass}\\b`, 'g'), '').replace(/className=(["'])\s+/g, 'className=$1').replace(/\s+(["'])/g, '$1');
          return `<Button${newAttrs} variant="${variant}" />`;
      });

      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
  }
}

const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'ui' || file === 'ThemeContext.tsx') continue; // Skip ui folder
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
};
walk(path.join(process.cwd(), 'pages'));
walk(path.join(process.cwd(), 'components'));
