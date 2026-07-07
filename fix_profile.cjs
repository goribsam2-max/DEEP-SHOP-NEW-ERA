const fs = require('fs');
let code = fs.readFileSync('pages/Profile.tsx', 'utf-8');

// replace KycVerificationWizard import
code = code.replace(/import { KycVerificationWizard } from "@\/components\/KycVerificationWizard";\n/g, '');

// replace KycVerificationWizard component
code = code.replace(/<KycVerificationWizard[\s\S]*?\/>/, '');

// replace setIsKycOpen
code = code.replace(/setIsKycOpen\(true\)/g, 'navigate("/kyc-verification")');

// remove isKycOpen state
code = code.replace(/const \[isKycOpen, setIsKycOpen\] = useState\(false\);\n/, '');

// Fix phone error
code = code.replace(/AlertCircle } from "lucide-react";/, 'AlertCircle, Phone } from "lucide-react";');

fs.writeFileSync('pages/Profile.tsx', code);
