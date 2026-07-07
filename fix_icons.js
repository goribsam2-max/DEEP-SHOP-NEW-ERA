const fs = require('fs');

function replaceSvg(filePath) {
   let content = fs.readFileSync(filePath, 'utf8');

   content = content.replace(/<i className="fas fa-chevron-left text-sm"><\/i>/g, '<Icon name="chevron-left" className="text-sm" />');
   content = content.replace(/fa-spin/g, 'animate-spin');
   content = content.replace(/fab fa-whatsapp/g, '');
   
   // Replace common inline SVGs
   content = content.replace(/<svg className="w-5 h-5"[^>]*><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" \/><\/svg>/g, '<Icon name="chevron-left" className="text-sm" />');
   content = content.replace(/<svg className="w-5 h-5"[^>]*><path strokeLinecap="round" strokeLinejoin="round" d="M15\.75 19\.5L8\.25 12l7\.5-7\.5" \/><\/svg>/g, '<Icon name="chevron-left" className="text-sm" />');

   fs.writeFileSync(filePath, content);
}

const files = [
  'pages/AboutUs.tsx', 'pages/ContactUs.tsx', 'pages/Home.tsx', 
  'pages/NewPassword.tsx', 'pages/PrivacyPolicy.tsx', 'pages/SitemapPage.tsx',
  'pages/Terms.tsx', 'pages/TicketDetails.tsx', 'pages/AddCard.tsx',
  'pages/CompleteProfile.tsx', 'pages/Coupon.tsx', 'pages/PasswordManager.tsx',
  'pages/PaymentMethods.tsx', 'pages/ShippingAddress.tsx', 'pages/VerifyCode.tsx'
];

files.forEach(f => {
  if(fs.existsSync(f)) {
    replaceSvg(f);
    console.log("Fixed", f);
  }
});
