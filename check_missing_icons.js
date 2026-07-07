const fs = require('fs');
const path = require('path');

const svgIconsFile = fs.readFileSync('./components/svg-icons.ts', 'utf8');
const definedTokens = new Set([...svgIconsFile.matchAll(/'([^']+)':/g)].map(m => m[1]));

function searchFiles(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) searchFiles(fullPath, callback);
        else if (fullPath.endsWith('.tsx')) callback(fullPath);
    });
}

const usedTokens = new Set();
searchFiles('./pages', (f) => {
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.matchAll(/name=["']([a-zA-Z0-9_-]+)["']/g);
    for (const match of matches) {
        usedTokens.add(match[1]);
    }
});
searchFiles('./components', (f) => {
    if (f.includes('svg-icons.ts') || f.includes('icons-data.ts')) return;
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.matchAll(/name=["']([a-zA-Z0-9_-]+)["']/g);
    for (const match of matches) {
        usedTokens.add(match[1]);
    }
});

const missing = [...usedTokens].filter(t => !definedTokens.has(t));
console.log('Missing Icons: ', missing.join(', '));
