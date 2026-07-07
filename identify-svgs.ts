import fs from 'fs';

const html = fs.readFileSync('plusui.html', 'utf8');
const regex = /<svg([^>]*)>.*?<\/svg>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  const attrs = match[1];
  const fullSvg = match[0];
  if (attrs.includes('id=') || attrs.includes('class=') || attrs.includes('aria-label=')) {
    console.log(attrs.substring(0, 100));
  }
}
