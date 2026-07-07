import https from 'https';
import fs from 'fs';

https.get('https://plus-ui.blogspot.com/2024/10/resources.html?m=1', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    fs.writeFileSync('plusui.html', body);
    console.log('Downloaded.');
  });
});
