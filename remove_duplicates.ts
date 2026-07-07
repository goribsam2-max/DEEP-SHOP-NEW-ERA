import * as fs from 'fs';
const content = fs.readFileSync('pages/ProductDetails.tsx', 'utf8');
const lines = content.split('\n');

// Find the line that starts with 'const handleBundleAddToCart = () => {' AFTER line 770
const badStartIndex = lines.findIndex((l, i) => i > 770 && l.trim() === 'const handleBundleAddToCart = () => {');

if (badStartIndex !== -1) {
  // Find the 'export default ProductDetails;' at the end
  const endIndex = lines.findIndex((l, i) => i > badStartIndex && l.trim() === 'export default ProductDetails;');
  if (endIndex !== -1) {
     lines.splice(badStartIndex, endIndex - badStartIndex);
     fs.writeFileSync('pages/ProductDetails.tsx', lines.join('\n'));
     console.log("Successfully removed duplicated code block")
  }
} else {
  console.log("Could not find start index");
}
