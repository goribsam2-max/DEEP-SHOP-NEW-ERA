const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const importStatement = `import KycVerification from './pages/KycVerification';\n`;
if (!code.includes('KycVerification')) {
  code = code.replace(/import EditProfile from '\.\/pages\/EditProfile';/, importStatement + `import EditProfile from './pages/EditProfile';`);
  code = code.replace(/<Route path="\/profile\/edit" element={<EditProfile \/>} \/>/, `<Route path="/profile/edit" element={<EditProfile />} />\n            <Route path="/kyc-verification" element={<KycVerification />} />`);
  fs.writeFileSync('App.tsx', code);
}
