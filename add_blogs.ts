import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

const blogs = [
  {
    title: "Top 5 Gadgets Every Developer Needs in 2026",
    excerpt: "Boost your productivity with these must-have tech accessories.",
    content: "When it comes to coding, having the right gear is essential. From ergonomic keyboards to high-res monitors, here are the top 5 gadgets you should check out. \n\nCheck out our premium selection [here](/?ref=topdev)! Every tool here increases your productivity by at least 20%.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    slug: "top-5-gadgets-developer-2026",
    createdAt: Date.now()
  },
  {
    title: "10 Secret iPhone Hacks You Didn't Know About",
    excerpt: "Unlock the full potential of your iOS device.",
    content: "Your iPhone has hidden features you've never used. Did you know you can use the back tap feature to take screenshots? Or hidden keyboard shortcuts to type faster? \n\nGrab our recommended fast chargers [here](/?ref=iphonesh) to keep your phone juiced up while trying these.",
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    slug: "10-secret-iphone-hacks",
    createdAt: Date.now() - 86400000
  },
  {
    title: "Mechanical vs Membrane Keyboards: Which is Better?",
    excerpt: "A deep dive into typing experiences.",
    content: "Mechanical keyboards offer tangible feedback and satisfying clicks, while membrane keyboards are quiet and affordable. Which one suits your setup? \n\nIf you prefer mechanical, check out our highly-rated accessories [here](/?ref=keebs).",
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    slug: "mechanical-vs-membrane",
    createdAt: Date.now() - 86400000 * 2
  },
  {
    title: "How to Build the Ultimate Smart Home Setup",
    excerpt: "Automate your life with these easy tricks.",
    content: "Building a smart home doesn't have to be expensive. Start with smart plugs and bulbs. You can control your entire room with Voice Assistants. \n\nGet started with our smart tech collection [here](/?ref=smh).",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    slug: "ultimate-smart-home",
    createdAt: Date.now() - 86400000 * 3
  },
  {
    title: "The Best Wireless Earbuds for Workouts",
    excerpt: "Sweat-proof, comfortable, and fantastic audio.",
    content: "Working out requires gear that stays in place. We've tested the top 10 wireless earbuds for running and weightlifting. \n\nCheck out our audio accessories [here](/?ref=audio) designed specifically for athletes.",
    image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    slug: "best-workout-earbuds",
    createdAt: Date.now() - 86400000 * 4
  },
  {
    title: "Why You Should Upgrade Your Monitor to 4K",
    excerpt: "Is 4K really worth the upgrade?",
    content: "The difference between 1080p and 4K is night and day, especially for text clarity and creative workflows. \n\nUpgrade your setup seamlessly with our exclusive cable bundle [here](/?ref=4ksetup).",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    slug: "upgrade-monitor-4k",
    createdAt: Date.now() - 86400000 * 5
  },
  {
    title: "Is the New iPad Pro Replacing Laptops?",
    excerpt: "With the M-series chips, Apple's tablet is more powerful than ever.",
    content: "The new iPad Pro brings desktop-class performance to a tablet form factor. But can it replace your MacBook? \n\nEquip your iPad with our premium protective gear [here](/?ref=ipadgear).",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    slug: "ipad-pro-replace-laptop",
    createdAt: Date.now() - 86400000 * 6
  },
  {
    title: "Quick Tips to Extend Your Battery Life",
    excerpt: "Stop your devices from dying mid-day.",
    content: "From turning off background app refresh to reducing screen brightness, these simple tricks will save your battery. \n\nFor heavy users, always pack a reliable power bank from our store [here](/?ref=pbank).",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    slug: "extend-battery-life",
    createdAt: Date.now() - 86400000 * 7
  },
  {
    title: "Top Travel Gadgets You Can't Leave Without",
    excerpt: "Pack smart and travel easy with these tech essentials.",
    content: "Universal adapters, noise-canceling headphones, and compact drones can elevate your travel experience. \n\nGet your travel tech checklist sorted with our travel kit [here](/?ref=travel).",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    slug: "top-travel-gadgets",
    createdAt: Date.now() - 86400000 * 8
  },
  {
    title: "Gaming on a Budget: Best Affordable Setup",
    excerpt: "High framerates don't have to cost a fortune.",
    content: "You don't need a $2000 PC to play your favorite titles. By selecting the right budget peripherals, you can game like a pro. \n\nExplore our budget-friendly gaming gear [here](/?ref=budgetgame).",
    image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    slug: "gaming-on-budget",
    createdAt: Date.now() - 86400000 * 9
  }
];

async function add() {
  for (const b of blogs) {
    await addDoc(collection(db, 'blogs'), b);
    console.log('Added', b.title);
  }
  process.exit(0);
}
add();
