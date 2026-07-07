import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'pages');
const compDir = path.join(process.cwd(), 'components');

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('btn-primary')) {
    // Add import if not exists
    if (!content.includes('import { Button } from')) {
        // Find last import
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const endOfLastImport = content.indexOf('\n', lastImportIndex);
            content = content.slice(0, endOfLastImport) + '\nimport { Button } from "@/components/ui/button";' + content.slice(endOfLastImport);
        } else {
            content = 'import { Button } from "@/components/ui/button";\n' + content;
        }
    }
    
    // Replace <button className="... btn-primary ..." > with <Button variant="primary" className="..." >
    content = content.replace(/<button([^>]*?)className=(["'])(.*?)\bbtn-primary\b(.*?)(["'])([^>]*)>(.*?)<\/button>/gs, (match, prefix, q1, classBefore, classAfter, q2, suffix, inner) => {
        const newClass = `${classBefore} ${classAfter}`.replace(/\s+/g, ' ').trim();
        return `<Button${prefix}variant="primary" className=${q1}${newClass}${q2}${suffix}>${inner}</Button>`;
    });

    // Handle single line
    content = content.replace(/<button([^>]*?)className=(["'])(.*?)\bbtn-primary\b(.*?)(["'])([^>]*)\/>/g, (match, prefix, q1, classBefore, classAfter, q2, suffix) => {
        const newClass = `${classBefore} ${classAfter}`.replace(/\s+/g, ' ').trim();
        return `<Button${prefix}variant="primary" className=${q1}${newClass}${q2}${suffix}/>`;
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
};

const walk = (dir) => {
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
