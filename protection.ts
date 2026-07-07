export function setupProtection() {
  // Prevent Bots & AI Crawlers in a more subtle way using JS checks
  const ua = navigator.userAgent.toLowerCase();
  const suspiciousBots = [
    "chatgpt",
    "gptbot",
    "anthropic",
    "claude",
    "google-extended",
    "googlebot",
    "lovable",
    "gemini"
  ];
  if (suspiciousBots.some((bot) => ua.includes(bot))) {
    // Break the page completely for bots without showing obvious error
    document.body.innerHTML = "";
    if (window.stop) window.stop();
    return;
  }

  // Force replace http with https in images
  const forceHttps = (node: any) => {
    if (
      node.tagName === "IMG" &&
      node.src &&
      node.src.startsWith("http://") &&
      !node.src.includes("localhost")
    ) {
      node.src = node.src.replace(/^http:\/\//i, "https://");
    }
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "src"
      ) {
        forceHttps(mutation.target);
      } else if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node: any) => {
          if (node.tagName === "IMG") forceHttps(node);
          else if (node.querySelectorAll) {
            node.querySelectorAll("img").forEach(forceHttps);
          }
        });
      }
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });

  // Intercept and hide API keys, sensitive data from console
  const origLog = console.log;
  const origError = console.error;
  const origWarn = console.warn;
  const origInfo = console.info;
  const origDebug = console.debug;
  const origClear = console.clear;

  origClear();
  origLog(
    "%cSTOP!%c\n\nThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or 'hack' someone's account, it is a scam and will give them access to your account.\n\n%cWHOLE SITE MADE BY VIBE GADGET",
    "color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0 #000;",
    "color: inherit; font-size: 16px;",
    "color: #10b981; font-size: 30px; font-weight: bold; font-family: monospace; text-shadow: 1px 1px 0 #000;"
  );

  const obf = ["404", "firebase", "genai", "ai", "run.app", "onesignal", "vercel", "api key", "currentcolor", "tailwind"];
  function shouldHide(args: any[]) {
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (typeof arg === "string") {
            const lower = arg.toLowerCase();
            if (obf.some(w => lower.includes(w))) return true;
        } else if (arg && arg.message && typeof arg.message === "string") {
            const lower = arg.message.toLowerCase();
            if (obf.some(w => lower.includes(w))) return true;
        }
    }
    return false;
  }

  console.log = function (...args) { if (!shouldHide(args)) origLog.apply(console, args); };
  console.error = function (...args) { if (!shouldHide(args)) origError.apply(console, args); };
  console.warn = function (...args) { if (!shouldHide(args)) origWarn.apply(console, args); };
  console.info = function (...args) { if (!shouldHide(args)) origInfo.apply(console, args); };
  console.debug = function (...args) { if (!shouldHide(args)) origDebug.apply(console, args); };

  window.addEventListener("unhandledrejection", function (e) {
    if (e.reason && shouldHide([e.reason])) {
        e.preventDefault();
    }
  });

  window.addEventListener("error", function (e) {
    if (e.message && (shouldHide([e.message]) || e.message.includes('circle'))) {
        e.preventDefault();
    }
  });

  // Anti-debugging (debugger loop) which is hidden in minified output 
  setInterval(() => {
     const before = Date.now();
     // eslint-disable-next-line no-debugger
     debugger; 
     const after = Date.now();
     if (after - before > 100) { // console is open
        document.body.style.display = 'none'; // hide everything
        // Clear sensitive session data to prevent tampering
        sessionStorage.clear();
        // We do not clear localStorage so users don't lose their carts, 
        // but session states are cleared to protect them.
     } else {
        document.body.style.display = 'block';
     }
  }, 1000);

  // Keyboard protection (screenshots and devtools)
  document.addEventListener("keydown", (e) => {
    // PrintScreen
    if (e.key === "PrintScreen" || e.keyCode === 44) {
      navigator.clipboard.writeText("");
      document.body.style.opacity = '0';
      setTimeout(() => document.body.style.opacity = '1', 2000);
    }
    // Mac shortcuts Cmd + Shift + 3/4/5
    if (e.metaKey && e.shiftKey && ["3","4","5","s","S"].includes(e.key)) {
      navigator.clipboard.writeText("");
      document.body.style.opacity = '0';
      setTimeout(() => document.body.style.opacity = '1', 2000);
    }
    // Windows Snipping
    if (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S')) {
      navigator.clipboard.writeText("");
      document.body.style.opacity = '0';
      setTimeout(() => document.body.style.opacity = '1', 2000);
    }
    // Save, Print, Source, Console
    if (e.ctrlKey || e.metaKey) {
       if (["c","a","p","s","u","i","j"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          return false;
       }
    }
    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
  });

  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('copy', e => { e.clipboardData?.setData('text/plain', ''); e.preventDefault(); return false; });
  document.addEventListener('cut', e => { e.preventDefault(); return false; });
  document.addEventListener('paste', e => { e.preventDefault(); return false; });
}
