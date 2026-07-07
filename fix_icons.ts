import fs from 'fs';

function replaceSvg(filePath: string) {
   let content = fs.readFileSync(filePath, 'utf8');

   content = content.replace(/<i className="fas fa-chevron-left text-sm"><\/i>/g, '<Icon name="chevron-left" className="text-sm" />');
   content = content.replace(/fa-spin/g, 'animate-spin');
   content = content.replace(/fab fa-whatsapp/g, '');
   
   // Replace common inline SVGs
   content = content.replace(/<svg className="w-5 h-5"[^>]*><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" \/><\/svg>/g, '<Icon name="chevron-left" className="text-sm" />');
   content = content.replace(/<svg className="w-5 h-5"[^>]*><path strokeLinecap="round" strokeLinejoin="round" d="M15\.75 19\.5L8\.25 12l7\.5-7\.5" \/><\/svg>/g, '<Icon name="chevron-left" className="text-sm" />');

   content = content.replace(/<svg className="w-12 h-12 text-gray-400"[^>]*>.*?<\/svg>/g, '<Icon name="user" className="w-12 h-12 text-zinc-400" />');
   content = content.replace(/<svg className="w-4 h-4"[^>]*><path[^>]*d="M12 6v6m0 0v6m0-6h6m-6 0H6"[^>]*><\/svg>/g, '<Icon name="plus" className="text-xs" />');
   content = content.replace(/<svg className="w-12 h-12 text-[^"]*"[^>]*><path[^>]*d="M4\.5 12\.75l6 6 9-13\.5"[^>]*><\/svg>/g, '<Icon name="check" className="text-4xl text-emerald-500" />');
   content = content.replace(/<svg className="w-5 h-5"[^>]*>.*?d="M15 10\.5a3.*?<\/svg>/g, '<Icon name="map-marker" className="text-lg" />');
   content = content.replace(/<svg className="w-12 h-12 mb-4"[^>]*>.*?d="M15 10\.5a3.*?<\/svg>/g, '<Icon name="map-marker" className="text-4xl mb-4 text-emerald-500" />');
   
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
