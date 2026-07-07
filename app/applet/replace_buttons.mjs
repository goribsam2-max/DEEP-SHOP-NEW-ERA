import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'pages');
const compDir = path.join(process.cwd(), 'components');

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('btn-primary') || content.includes('btn-secondary')) {
    // Add import if not exists
    if (!content.includes('import { Button } } from') && !content.includes('import { Button } from')) {
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const endOfLastImport = content.indexOf('\n', lastImportIndex);
            content = content.slice(0, endOfLastImport) + '\nimport { Button } from "@/components/ui/button";' + content.slice(endOfLastImport);
        } else {
            content = 'import { Button } from "@/components/ui/button";\n' + content;
        }
    }
    
    content = content.replace(/<button\b([\s\S]*?)>([\s\S]*?)<\/button>/g, (match, attrs, inner) => {
        if (attrs.includes('btn-primary') || attrs.includes('btn-secondary')) {
            let variant = 'primary';
            if (attrs.includes('btn-secondary')) variant = 'secondary';
            
            let newAttrs = attrs.replace(/\bbtn-(primary|secondary)\b/g, '').replace(/className=(["'])\s+/g, 'className=$1').replace(/\s+(["'])/g, '$1');
            return `<Button${newAttrs} variant="${variant}">${inner}</Button>`;
        }
        return match;
    });

    content = content.replace(/<button\b([\s\S]*?)\/>/g, (match, attrs) => {
        if (attrs.includes('btn-primary') || attrs.includes('btn-secondary')) {
            let variant = 'primary';
            if (attrs.includes('btn-secondary')) variant = 'secondary';
            
            let newAttrs = attrs.replace(/\bbtn-(primary|secondary)\b/g, '').replace(/className=(["'])\s+/g, 'className=$1').replace(/\s+(["'])/g, '$1');
            return `<Button${newAttrs} variant="${variant}" />`;
        }
        return match;
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
};

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

walk(pagesDir);
walk(compDir);
