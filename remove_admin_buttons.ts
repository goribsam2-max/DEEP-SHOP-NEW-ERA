import fs from 'fs';
import path from 'path';

function removeSpecificButtons(dirPath: string) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeSpecificButtons(fullPath);
        } else if (fullPath.endsWith('.tsx') && !fullPath.includes('header-3.tsx') && !fullPath.includes('MobileGuard.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;

            // Using regex to find the nearest previous div wrapper of the button, or just remove the button itself+its parent div if it's purely a header.
            // Actually, we can just replace the <button ... navigate... chevron-left... </button> OR <div class="flex items-center space-x-6 mb-10"><button ... chevron-left...</div>
            // Let's use a simpler approach: remove the chunk of code representing that entire header if it matches `className="flex items-center...` housing the `navigate`
            
            // Try matching the generic flex container for the back button
            const flexContainerRegex = /<div className="flex items-center(?: space-x-[A-Za-z0-9\-]+)? mb-[A-Za-z0-9\-]+">[\s\S]*?<button[\s\S]*?onClick={\(\)\s*=>\s*navigate\([^)]*\)}[\s\S]*?(?:arrow-left|chevron-left|ChevronLeft)[\s\S]*?<\/button>[\s\S]*?<\/div>\s*<\/div>/g;
            newContent = newContent.replace(flexContainerRegex, (match) => {
                return '';
            });

            const flexContainerRegex2 = /<div className="flex items-center(?: space-x-[A-Za-z0-9\-]+)? mb-[A-Za-z0-9\-]+">[\s\S]*?<button[\s\S]*?onClick={\(\)\s*=>\s*navigate\([^)]*\)}[\s\S]*?(?:arrow-left|chevron-left|ChevronLeft)[\s\S]*?<\/button>[\s\S]*?<\/div>/g;
            newContent = newContent.replace(flexContainerRegex2, (match) => {
                return '';
            });

            // Fallback: just remove the button if not removing the div
            const buttonRegex = /<button[\s\S]*?onClick={\(\)\s*=>\s*navigate\([^)]*\)}[\s\S]*?(?:arrow-left|chevron-left|ChevronLeft)[\s\S]*?<\/button>/g;
            newContent = newContent.replace(buttonRegex, '');

            const LinkRegex = /<Link[\s\S]*?to={\([^)]*\)}[\s\S]*?(?:arrow-left|chevron-left|ChevronLeft)[\s\S]*?<\/Link>/g;
            newContent = newContent.replace(LinkRegex, '');

            if (newContent !== content) {
                console.log(`Modified ${fullPath}`);
                fs.writeFileSync(fullPath, newContent, 'utf8');
            }
        }
    }
}

removeSpecificButtons('./pages');
removeSpecificButtons('./components');
