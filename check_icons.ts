import fs from 'fs';
import path from 'path';

const iconNamesUsed = new Set<string>();

function findIcons(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findIcons(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.matchAll(/<Icon[^>]*name=(["'])(.*?)\1/g);
            for (const match of matches) {
                iconNamesUsed.add(match[2]);
            }
            const evalMatches = content.matchAll(/<Icon[^>]*name=\{['"`](.*?)['"`]\}/g);
            for (const match of evalMatches) {
                 iconNamesUsed.add(match[1]);
            }
        }
    }
}
findIcons('./components');
findIcons('./pages');

const iconFile = fs.readFileSync('./components/Icon.tsx', 'utf8');
const mappedNames = [...iconFile.matchAll(/  '(.*?)': LucideIcons/g)].map(m => m[1]);

console.log("Used but not mapped:");
for (const used of iconNamesUsed) {
    if (!iconFile.includes(`'${used}':`)) {
        console.log(used);
    }
}
