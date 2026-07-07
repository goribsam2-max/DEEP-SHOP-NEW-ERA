const fs = require('fs');
let code = fs.readFileSync('pages/KycVerification.tsx', 'utf-8');

// replace props
code = code.replace(/interface KycVerificationWizardProps {[\s\S]*?}/, '');
code = code.replace(/export const KycVerificationWizard: React\.FC<KycVerificationWizardProps> = \({[\s\S]*?}\) => {/, 'export default function KycVerification() {\n  const navigate = require("react-router-dom").useNavigate();');
code = code.replace(/import { useNotify } from "\.\/Notifications";/g, 'import { useNotify } from "../components/Notifications";');
code = code.replace(/import { Button } from "\.\/ui\/button";/g, 'import { Button } from "../components/ui/button";');
code = code.replace(/import { Input } from "\.\/ui\/input";/g, 'import { Input } from "../components/ui/input";');
code = code.replace(/Video\n} from "lucide-react";/, 'Video, ChevronLeft\n} from "lucide-react";');

// replace return statement layout
code = code.replace(/if \(!isOpen\) return null;[\s\S]*?<div className="fixed inset-0 bg-black\/80 z-\[1000\] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">[\s\S]*?<div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-\[32px\] overflow-hidden shadow-2xl flex flex-col my-auto max-h-\[95vh\]">/, `
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-inter pb-20">
      <div className="max-w-2xl mx-auto md:py-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 md:px-0 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">KYC Verification</h1>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-none md:rounded-2xl border-y md:border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col">
`);

code = code.replace(/<button \n            onClick={onClose} \n            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center justify-center text-sm font-bold"\n          >\n            ✕\n          <\/button>/, '');

code = code.replace(/<Button onClick={onClose} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold px-8 py-5 rounded-xl">\n                    Close KYC Dashboard\n                  <\/Button>/, '<Button onClick={() => navigate(-1)} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold px-8 py-5 rounded-xl">Return to Profile</Button>');

// Replace end closing tags
// Let's do a simple replace of the last 4 div closures.
// It might be tricky, we'll see.
fs.writeFileSync('pages/KycVerification.tsx', code);
