const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const importStatement = `import Messages from './pages/Messages';\n`;
if (!code.includes('Messages')) {
  code = code.replace(/import KycVerification from '\.\/pages\/KycVerification';/, importStatement + `import KycVerification from './pages/KycVerification';`);
  code = code.replace(/<Route path="\/kyc-verification" element={<KycVerification \/>} \/>/, `<Route path="/kyc-verification" element={<KycVerification />} />\n            <Route path="/messages" element={<Messages />} />`);
  fs.writeFileSync('App.tsx', code);
}
