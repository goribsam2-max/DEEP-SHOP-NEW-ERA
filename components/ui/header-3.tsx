import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { createPortal } from "react-dom";
import { useTheme } from "../ThemeContext";
import { AnimatedThemeToggler } from "./animated-theme-toggler";
import { LanguageSwitcher } from "./LanguageSwitcher";
import Icon from "../Icon";
import AccountMenu from "./account-menu";
import { useIsland } from "./dynamic-island";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Home,
  Search,
  ShoppingBag,
  Heart,
  User,
  Bell,
  Box,
  ShoppingCart,
  Newspaper,
  Headset,
  Moon,
  Sun,
  ChevronLeft,
  ListOrdered,
  Star,
  Image as ImageIcon,
  DollarSign,
  Layout,
  MessageSquare,
  Users,
  Bike,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

import { triggerHaptic } from "../../lib/haptics";
import { Modal } from "@/components/ui/modal";

type LinkItem = {
  title: string;
  href: string;
  icon: any;
  description?: string;
};

const adminLinks: LinkItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
    description: "Overview & Stats",
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: ShoppingBag,
    description: "Manage items",
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ListOrdered,
    description: "Track & update orders",
  },
  {
    title: "Users & Staff",
    href: "/admin/users",
    icon: Users,
    description: "Manage accounts",
  },
  {
    title: "Delivery Riders",
    href: "/admin/riders",
    icon: Bike,
    description: "Rider assignments",
  },
  {
    title: "Withdrawals",
    href: "/admin/withdrawals",
    icon: DollarSign,
    description: "Affiliate payouts",
  },
  {
    title: "Reviews",
    href: "/admin/reviews",
    icon: Star,
    description: "Customer feedback",
  },
  {
    title: "Banners",
    href: "/admin/banners",
    icon: ImageIcon,
    description: "Promo images",
  },
  {
    title: "Onboarding Offers",
    href: "/admin/onboarding-offers",
    icon: ImageIcon,
    description: "Welcome screens",
  },
  {
    title: "Stories",
    href: "/admin/stories",
    icon: Layout,
    description: "App stories/highlights",
  },
  {
    title: "UI Builder",
    href: "/admin/custom-sections",
    icon: FileText,
    description: "Custom sections",
  },
  {
    title: "Live Chats",
    href: "/admin/chats",
    icon: MessageSquare,
    description: "Real-time support chats",
  },
  {
    title: "Help Desk",
    href: "/admin/helpdesk",
    icon: MessageSquare,
    description: "Support tickets",
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    description: "Push alerts",
  },
  {
    title: "Config",
    href: "/admin/config",
    icon: Settings,
    description: "App settings",
  },
];

const productLinks: LinkItem[] = [
  {
    title: "Build Box",
    href: "/build-box",
    description: "Create your custom tech bundle",
    icon: Box,
  },
  {
    title: "Home",
    href: "/",
    description: "Discover new border cross phones & devices",
    icon: Home,
  },
  {
    title: "Catalog",
    href: "/all-products",
    description: "Browse our full collection",
    icon: Box,
  },
  {
    title: "Pay",
    href: "/payment-methods",
    description: "Secure payment options",
    icon: DollarSign,
  },
  {
    title: "Receive",
    href: "/orders",
    description: "Track and manage your orders",
    icon: ShoppingBag,
  },
  {
    title: "Ship",
    href: "/orders",
    description: "Shipping details and status",
    icon: Bike,
  },
  {
    title: "Review",
    href: "/wishlist",
    description: "Your saved favorite items",
    icon: Star,
  },
];

export function Header() {
  const [open, setOpen] = React.useState(false);
  const [showBackDialog, setShowBackDialog] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [categories, setCategories] = React.useState<string[]>([]);
  const scrolled = useScroll(10);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isIslandActive = useIsland();
  const [cartCount, setCartCount] = React.useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const cartStr = localStorage.getItem('f_cart');
        let cart = [];
        try { cart = cartStr && cartStr !== "undefined" ? JSON.parse(cartStr) : []; } catch(e){}
        if (Array.isArray(cart)) {
          const validItems = cart.filter(item => item && (item.id || item.productId));
          const count = validItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } catch (e) {
        setCartCount(0);
      }
    };
    updateCount();
    window.addEventListener("update_cart", updateCount);
    return () => window.removeEventListener("update_cart", updateCount);
  }, []);

  const isAdmin = location.pathname.startsWith("/admin");
  const isAffiliate = location.pathname.startsWith("/affiliate");
  const isInnerPage =
    location.pathname !== "/" && location.pathname !== "/admin" && !isAffiliate;
  const linksToShow = isAdmin ? adminLinks : productLinks;

  useEffect(() => {
    import("@/firebase").then(({ auth, db }) => {
      const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));

      import("firebase/firestore").then(({ collection, getDocs, query }) => {
        const fetchCategories = async () => {
          try {
            const q = query(collection(db, "products"));
            const snapshot = await getDocs(q);
            const allCategories = new Set<string>();
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.category) allCategories.add(data.category);
            });
            setCategories(Array.from(allCategories).slice(0, 8)); // Get top 8 categories
          } catch (error) {
            console.error("Failed to fetch categories:", error);
          }
        };
        fetchCategories();
      });

      return () => unsubscribeAuth();
    });
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  let headerBgClass = "bg-transparent border-transparent";
  let isDarkHeaderBg = true;

  const buttonClass = "transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 shadow-sm rounded-full w-10 h-10";

  return (
    <header
      className={cn(
        "fixed top-0 z-[120] w-full transition-all duration-300 ease-in-out pointer-events-auto",
        scrolled || open ? "bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm" : "bg-transparent border-transparent"
      )}
    >
      <nav
        className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-4 lg:px-6 h-14 md:h-16 transition-all duration-500"
      >
        <div className="flex items-center gap-1 md:gap-3 pointer-events-auto">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              triggerHaptic();
              if (location.pathname === '/withdraw') {
                  navigate('/affiliate');
              } else if (isInnerPage) {
                navigate(-1);
              } else {
                setOpen(!open);
                window.dispatchEvent(
                  new CustomEvent("toggleSidebar", { detail: !open }),
                );
              }
            }}
            className="flex items-center justify-center transition-all w-10 h-10 border-transparent shadow-none rounded-full shrink-0"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            {isInnerPage ? (
              <ChevronLeft className="size-6 text-zinc-900 dark:text-white" />
            ) : (
              <MenuToggleIcon open={open} className="size-5 text-zinc-900 dark:text-white" duration={300} />
            )}
          </Button>
          <NavLink
            to={isAdmin ? "/admin" : "/"}
            className={cn("p-1 flex items-center shrink-0 rounded-3xl border-none ring-0 shadow-none hover:shadow-none bg-transparent transition-all duration-300", isIslandActive ? "opacity-0 scale-95 pointer-events-none w-0 overflow-hidden" : "opacity-100 scale-100 w-auto")}
          >
            <WordmarkIcon className="h-5 sm:h-6 w-auto" />
          </NavLink>
        </div>

        <div className={cn("hidden items-center gap-2 md:flex pointer-events-auto transition-all duration-300", isIslandActive ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              triggerHaptic();
              navigate("/search");
            }}
            className={buttonClass}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              triggerHaptic();
              navigate("/wishlist");
            }}
            className={buttonClass}
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              triggerHaptic();
              navigate("/cart");
            }}
            className={cn("relative", buttonClass)}
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#1cdb5e] text-white text-[10px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white dark:border-zinc-800 shadow-sm">
                {cartCount}
              </span>
            )}
          </Button>

          <div className="flex items-center gap-1 rounded-full p-1.5 bg-transparent shadow-none">
            <LanguageSwitcher />
            <AnimatedThemeToggler className="rounded-full shadow-none border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 w-9 h-9 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                triggerHaptic();
                navigate("/notifications");
              }}
              className="rounded-full shadow-none border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 w-9 h-9 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
            </Button>
            {location.pathname !== "/profile" && (
              <AccountMenu scrolled={scrolled} isPill />
            )}
          </div>
        </div>
        <div className={cn("flex items-center gap-2 md:hidden pointer-events-auto transition-all duration-300", isIslandActive ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100")}>
          <div className="flex items-center gap-1 rounded-full p-1.5 bg-transparent shadow-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                triggerHaptic();
                navigate("/cart");
              }}
              className="relative rounded-full shadow-none border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 w-9 h-9 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" strokeWidth={2.2} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1cdb5e] text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-zinc-900 shadow-sm">
                  {cartCount}
                </span>
              )}
            </Button>
            <LanguageSwitcher />
            <AnimatedThemeToggler className="rounded-full shadow-none border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 w-9 h-9 flex text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                triggerHaptic();
                navigate("/notifications");
              }}
              className="hidden sm:flex rounded-full shadow-none border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 w-9 h-9 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
            </Button>
            {location.pathname !== "/profile" && (
              <AccountMenu scrolled={scrolled} isPill />
            )}
          </div>
        </div>
      </nav>

      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        className="flex flex-col justify-between gap-2 overflow-y-auto bg-white dark:bg-zinc-900 pb-20 md:pb-4 border-l md:border-l-0 md:border-r border-zinc-200 dark:border-zinc-800 no-scrollbar"
      >
        <div className="max-w-full block">
          <div className="flex w-full flex-col gap-y-2 pb-4">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 px-4 mt-4 mb-2">
              {isAdmin ? "Admin Pages" : "Explore Pages"}
            </span>
            {linksToShow.map((link) => (
              <ListItem
                key={link.title}
                {...link}
                className="mx-2"
                onClick={() => {
                  triggerHaptic();
                  setOpen(false);
                }}
              />
            ))}

            {!isAdmin && categories.length > 0 && (
              <>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 px-4 mt-6 mb-2">
                  Categories
                </span>
                <div className="grid grid-cols-2 gap-2 px-2">
                  {categories.map((cat, i) => (
                    <NavLink
                      key={i}
                      to={`/search?q=${encodeURIComponent(cat)}`}
                      onClick={() => {
                        triggerHaptic();
                        setOpen(false);
                      }}
                      className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                    >
                      {cat}
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4 mt-auto border-t border-zinc-100 dark:border-zinc-800 w-full mb-4">
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full bg-transparent border-zinc-200 dark:border-zinc-700 mb-2 text-zinc-700 dark:text-zinc-200"
              onClick={() => {
                setOpen(false);
                navigate("/");
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back to Store
            </Button>
          )}
          {!user ? (
            <>
              <Button
                variant="outline"
                className="w-full bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
                onClick={() => {
                  setOpen(false);
                  navigate("/auth-selector");
                }}
              >
                Sign In
              </Button>
              <Button
                className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900"
                onClick={() => {
                  setOpen(false);
                  navigate("/auth-selector");
                }}
              >
                Sign Up
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
                onClick={() => {
                  setOpen(false);
                  navigate("/profile");
                }}
              >
                Account
              </Button>
              <Button
                className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900"
                onClick={() => {
                  setOpen(false);
                  navigate("/orders");
                }}
              >
                My Orders
              </Button>
            </>
          )}
        </div>
      </MobileMenu>
    </header>
  );
}

type MobileMenuProps = React.ComponentProps<"div"> & {
  open: boolean;
  onClose?: () => void;
};

function MobileMenu({ open, children, onClose, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <>
      <div 
        className={cn(
          "fixed inset-0 z-[110] bg-black/20 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <div
        id="mobile-menu"
        data-slot={open ? "open" : "closed"}
        className={cn(
          "bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800",
          "fixed top-0 bottom-0 z-[115] flex flex-col overflow-hidden shadow-2xl pt-14 md:pt-16",
          "md:left-0 md:w-64", // desktop
          "left-0 w-full md:max-w-xs", // mobile takes full width
          // Slide in from left on both mobile and desktop.
          "data-[slot=open]:animate-in data-[slot=closed]:animate-out ease-out duration-300",
          "data-[slot=open]:slide-in-from-left-full data-[slot=closed]:slide-out-to-left-full",
          className,
        )}
        {...props}
      >
        <div className="size-full h-full overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}

function ListItem({
  title,
  description,
  icon: IconComp,
  className,
  href,
  onClick,
}: LinkItem & { className?: string; onClick?: () => void }) {
  return (
    <NavLink
      to={href}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "w-full flex items-center flex-row gap-x-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 rounded-xl p-2 transition-colors",
          isActive && "bg-zinc-100 dark:bg-zinc-800",
          className,
        )
      }
    >
      <div className="bg-zinc-100 dark:bg-zinc-800 flex aspect-square size-12 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0">
        <IconComp className="text-zinc-700 dark:text-zinc-300 size-5" />
      </div>
      <div className="flex flex-col items-start justify-center">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
          {title}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
          {description}
        </span>
      </div>
    </NavLink>
  );
}

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // Initial check

    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

const WordmarkIcon = (props: React.ComponentProps<"span">) => (
  <span
    className="lowercase text-[28px] tracking-tight mt-0.5 text-zinc-900 dark:text-white"
    style={{
      fontFamily: "'Comfortaa', 'Righteous', cursive",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    }}
    {...props}
  >
    deep shop
  </span>
);
