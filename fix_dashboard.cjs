const fs = require('fs');
let code = fs.readFileSync('pages/seller/Dashboard.tsx', 'utf-8');

code = code.replace(/import { KycVerificationWizard } from "\.\.\/\.\.\/components\/KycVerificationWizard";\n/, '');
code = code.replace(/<KycVerificationWizard[\s\S]*?\/>/, '');
code = code.replace(/const \[isKycOpen, setIsKycOpen\] = useState\(false\);\n/, '');
code = code.replace(/setIsKycOpen\(true\)/g, 'navigate("/kyc-verification")');

fs.writeFileSync('pages/seller/Dashboard.tsx', code);
