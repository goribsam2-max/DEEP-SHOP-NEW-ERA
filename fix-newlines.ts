import * as fs from 'fs';
const data = fs.readFileSync('pages/ProductDetails.tsx', 'utf8');
const fixedData = data.split('\\n').join('\n');
fs.writeFileSync('pages/ProductDetails.tsx', fixedData);
console.log("Fixed newlines");
