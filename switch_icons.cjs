const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./pages').concat(walk('./components'));
let filesChanged = 0;

files.forEach(file => {
  if (file.includes('Icon.tsx')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace <i className="fas fa-something text-white"></i>
  // Regex needs to handle spaces and optional extra classes
  content = content.replace(/<i\s+className=["'`](?:fas|far|fab|fal)\s+fa-([a-zA-Z0-9-]+)(?:\s+(.*?))?["'`]\s*><\/i>/g, (match, iconName, extraClass) => {
    let classes = (extraClass || '').trim();
    if (classes) {
      return `<Icon name="${iconName}" className="${classes}" />`;
    }
    return `<Icon name="${iconName}" />`;
  });

  // Handle template literals like <i className={`fas fa-check ${cond ? 'a' : 'b'}`}></i>
  content = content.replace(/<i\s+className=\{`\s*(?:fas|far|fab|fal)\s+fa-([a-zA-Z0-9-]+)(.*?)\s*`\}\s*><\/i>/g, (match, iconName, extraCode) => {
    let classes = (extraCode || '').trim();
    if (classes) {
      if (classes.startsWith(' ')) classes = classes.substring(1);
      return `<Icon name="${iconName}" className={\`${classes}\`} />`;
    }
    return `<Icon name="${iconName}" />`;
  });
  
  // Handle dynamically typed fa-icons like <i className={`fas ${condition ? 'fa-icon1' : 'fa-icon2'}`}></i>
  // This is too hard for regex, skipping for automatic.

  if (content !== originalContent) {
     if (!content.includes('import Icon ')) {
        const depth = file.split(path.sep).length - 1;
        let importPrefix = '';
        if (file.startsWith('pages/admin')) {
            importPrefix = '../../';
        } else if (file.startsWith('pages/') || file.startsWith('components/')) {
            importPrefix = '../';
        } else {
            importPrefix = './';
        }
        
        // Find last import
        const importsMatch = content.match(/import .*?;?\n/g);
        if (importsMatch) {
            const lastImport = importsMatch[importsMatch.length - 1];
            content = content.replace(lastImport, lastImport + `import Icon from '${importPrefix}components/Icon';\n`);
        } else {
            content = `import Icon from '${importPrefix}components/Icon';\n` + content;
        }
     }
     
     fs.writeFileSync(file, content, 'utf8');
     console.log(`Updated ${file}`);
     filesChanged++;
  }
});

console.log(`Total files updated: ${filesChanged}`);
