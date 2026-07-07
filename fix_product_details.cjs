const fs = require('fs');
let code = fs.readFileSync('pages/ProductDetails.tsx', 'utf-8');

// replace the seller info container classes
code = code.replace(/className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white dark:bg-zinc-900\/80 backdrop-blur-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm gap-4"/, 'className="flex flex-row justify-between items-center p-3 sm:p-4 bg-white dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm gap-2"');

code = code.replace(/<div className="flex items-center gap-4">/, '<div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">');

code = code.replace(/<div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">/, '<div className="flex items-center gap-1 sm:gap-2 shrink-0">');

fs.writeFileSync('pages/ProductDetails.tsx', code);
