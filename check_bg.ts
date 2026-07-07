import fs from "fs";
import path from "path";

function processFile(filePath: string) {
    let content = fs.readFileSync(filePath, "utf8");
    let original = content;

    // We address remaining 'bg-white' or 'bg-black' things in className strings only!
    content = content.replace(/className="([^"]*?)bg-white([^"]*?)"/g, 'className="$1bg-zinc-50$2"');
    content = content.replace(/className=\{`([^`]*?)bg-white([^`]*?)`\}/g, 'className={`$1bg-zinc-50$2`}');

    content = content.replace(/className="([^"]*?)bg-black([^"]*?)"/g, 'className="$1bg-zinc-900$2"');
    content = content.replace(/className=\{`([^`]*?)bg-black([^`]*?)`\}/g, 'className={`$1bg-zinc-900$2`}');

    if (content !== original) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`Updated white/black in ${filePath}`);
    }
}

function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts") || fullPath.endsWith(".jsx")) {
            processFile(fullPath);
        }
    }
}

walkDir("./components");
walkDir("./pages");
processFile("./App.tsx");
