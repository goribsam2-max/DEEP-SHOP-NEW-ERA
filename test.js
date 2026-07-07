const https = require('https');
https.get('https://cdn.simpleicons.org/apple', (res) => {
  console.log(res.statusCode);
});
