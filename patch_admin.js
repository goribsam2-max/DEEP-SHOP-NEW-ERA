const fs = require('fs');
let code = fs.readFileSync('pages/admin/ManagePushNotifications.tsx', 'utf-8');

code = code.replace(/let subscriptions: any\[\] = \[\];[\s\S]*?if \(fcmTokens.length === 0 && uniqueSubs.length === 0\) \{[\s\S]*?return;\n      \}/, '');

code = code.replace(/subscriptions: uniqueSubs/, 'subscriptions: userSubscriptions');

fs.writeFileSync('pages/admin/ManagePushNotifications.tsx', code);
