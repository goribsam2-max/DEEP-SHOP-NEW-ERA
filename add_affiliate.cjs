const fs = require('fs');

let content = fs.readFileSync('pages/ProductDetails.tsx', 'utf8');

// Add state
content = content.replace(
  "const [quantity, setQuantity] = useState(1);",
  "const [quantity, setQuantity] = useState(1);\n  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);"
);

// Add useEffect
const useEffectStr = `
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        getDoc(doc(db, 'users', user.uid)).then(d => {
          if (d.exists() && d.data().affiliateCode) {
            setAffiliateCode(d.data().affiliateCode);
          }
        });
      } else {
        setAffiliateCode(null);
      }
    });
    return () => unsubAuth();
  }, []);
`;

content = content.replace(
  "useEffect(() => {",
  useEffectStr + "\n  useEffect(() => {"
);

// Add render block
const renderStr = `
           {affiliateCode && (
             <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 xl:p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-5"><Icon name="share" className="text-6xl" /></div>
               <div className="flex-1 relative z-10 w-full">
                 <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 mb-1 uppercase tracking-widest">Share & Earn ৳50!</p>
                 <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold opacity-80">Share this product. You get ৳50 and they get 5% off!</p>
               </div>
               <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center p-1.5 shrink-0 w-full sm:w-auto overflow-hidden relative z-10">
                 <input type="text" readOnly value={\`\${window.location.origin}/product/\${product.id}?ref=\${affiliateCode}\`} className="bg-transparent text-[10px] font-medium outline-none text-emerald-900 dark:text-emerald-100 w-full sm:w-32 px-2" />
                 <button onClick={() => { navigator.clipboard.writeText(\`\${window.location.origin}/product/\${product.id}?ref=\${affiliateCode}\`); notify('Link copied!', 'success'); }} className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors shrink-0 shadow-sm">
                   <Icon name="copy" className="text-xs" />
                 </button>
               </div>
             </div>
           )}
`;

content = content.replace(
  "         <div className=\"mb-12\">",
  renderStr + "\n         <div className=\"mb-12\">"
);

fs.writeFileSync('pages/ProductDetails.tsx', content);
console.log("Done");
