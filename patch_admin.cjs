const fs = require('fs');
let code = fs.readFileSync('pages/admin/Dashboard.tsx', 'utf8');

if (!code.includes("manage-vghelpline")) {
  code = code.replace(
    /const ADMIN_PIN_ITEMS: PinListItem\[\] = \[/,
    `const ADMIN_PIN_ITEMS: PinListItem[] = [
  {
    id: 'manage-vghelpline',
    name: 'Manage VGHelpline',
    info: 'Manage live video/audio calls',
    icon: Video,
    pinned: true,
    href: 'vg-helpline'
  },`
  );

  code = code.replace(
    /const moduleMap: Record<string, string> = \{/,
    `const moduleMap: Record<string, string> = {
        'manage-vghelpline': 'helpdesk',`
  );
  
  fs.writeFileSync('pages/admin/Dashboard.tsx', code);
}
