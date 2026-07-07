const fs = require('fs');

let code = fs.readFileSync('pages/admin/ManageVGHelpline.tsx', 'utf8');
code = code.replace(
  /const typeStr = typeof type !== 'undefined' \? type : callType;/g,
  `const typeStr = callType;`
);

fs.writeFileSync('pages/admin/ManageVGHelpline.tsx', code);
