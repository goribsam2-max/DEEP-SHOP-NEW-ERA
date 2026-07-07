import fs from "fs";
import path from "path";

function processFile(filePath: string) {
    let content = fs.readFileSync(filePath, "utf8");
    let original = content;

    // Darker than black reduction
    content = content.replace(/bg-black(?!\/)/g, "bg-zinc-900");
    content = content.replace(/dark:bg-black/g, "dark:bg-zinc-900");
    
    // Lighten zinc-900 and zinc-950
    content = content.replace(/dark:bg-zinc-950/g, "dark:bg-zinc-900");
    content = content.replace(/dark:bg-zinc-900(?!\/)/g, "dark:bg-zinc-800");
    content = content.replace(/dark:bg-\\[\\#09090b\\]/g, "dark:bg-zinc-900");

    // Reduce pure white instances as base background
    content = content.replace(/bg-white(?!\/)/g, "bg-zinc-50");

    if (content !== original) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`Updated contrast in ${filePath}`);
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
