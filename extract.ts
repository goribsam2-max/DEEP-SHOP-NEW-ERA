import fs from 'fs';

const html = fs.readFileSync('plusui.html', 'utf8');
const svgs = html.match(/<svg[^>]*>.*?<\/svg>/g) || [];
console.log(`Found ${svgs.length} SVGs`);
svgs.slice(0, 50).forEach((svg, i) => {
    // Just extract a hint of the SVG like its class or viewBox
    const start = svg.substring(0, 150);
    console.log(`${i}: ${start}...`);
});
