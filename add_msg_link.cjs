const fs = require('fs');
let code = fs.readFileSync('pages/Profile.tsx', 'utf-8');

if (!code.includes("MessageSquare,")) {
  code = code.replace(/import { Settings, UserPlus,/, 'import { MessageSquare, Settings, UserPlus,');
}

code = code.replace(/<NewMenuItem icon={<Phone className="w-5 h-5 text-cyan-500" \/>} label="Audio Helpline"/, `<NewMenuItem icon={<MessageSquare className="w-5 h-5 text-blue-500" />} label="Messages (Inbox)" color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" onClick={() => navigate('/messages')} />\n                 <NewMenuItem icon={<Phone className="w-5 h-5 text-cyan-500" />} label="Audio Helpline"`);

fs.writeFileSync('pages/Profile.tsx', code);
