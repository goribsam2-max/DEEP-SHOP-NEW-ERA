const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

const skeletonCode = `const AppSkeleton = () => (
  <div className="w-full min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col z-[9999] fixed inset-0">
    <div className="h-14 md:h-16 w-full flex items-center justify-between px-4 md:px-6 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 shrink-0">
       <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
       <div className="w-24 h-6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
       <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    </div>
    <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden max-w-7xl mx-auto w-full">
       <div className="w-full h-40 md:h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />
       <div className="flex gap-4 overflow-hidden shrink-0 mt-2">
          {[1,2,3,4,5,6].map(i => <div key={i} className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />)}
       </div>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 mt-4">
          {[1,2,3,4].map(i => <div key={i} className="rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse h-48 md:h-64" />)}
       </div>
    </div>
    <div className="h-[60px] md:hidden w-full bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-4 shrink-0 pb-[env(safe-area-inset-bottom)] fixed bottom-0">
       {[1,2,3,4,5].map(i => <div key={i} className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />)}
    </div>
  </div>
);`;

code = code.replace(/if \(loading\) return \([\s\S]*?<\/div>\n\s*\);/, `if (loading) return <AppSkeleton />;`);
code = code.replace(/const App: React\.FC = \(\) => \{/, skeletonCode + '\n\nconst App: React.FC = () => {');

fs.writeFileSync('App.tsx', code);
