const fs = require('fs');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

async function test() {
  const width = 10;
  const height = 10;
  // create dummy image data
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i+1] = 0;
    data[i+2] = 0;
    data[i+3] = 255;
  }
  const palette = quantize(data, 256);
  const index = applyPalette(data, palette);
  const gif = GIFEncoder();
  gif.writeFrame(index, width, height, { palette });
  gif.finish();
  const bytes = gif.bytes();
  fs.writeFileSync('test.gif', bytes);
  console.log("Success! size: ", bytes.length);
}
test().catch(console.error);
