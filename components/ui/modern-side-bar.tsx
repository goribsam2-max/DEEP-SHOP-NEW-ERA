"use client";
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  FileText,
  Bell,
  Search,
  HelpCircle,
  ShoppingBag,
  ListOrdered,
  Star,
  Image,
  DollarSign,
  Layout,
  MessageSquare,
  Users,
  Bike
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

import { StaffContext } from '../AdminLayout';
export interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string | number;
  moduleId?: string;
}

interface SidebarProps {
  className?: string;
  children?: React.ReactNode;
  userData?: any;
}

export function Sidebar({ className = "", children, userData }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

      const { isStaff, permissions, isSuperAdmin } = React.useContext(StaffContext);
      
      const ALL_NAVIGATION_ITEMS: NavigationItem[] = [
        { id: "dashboard", name: "Dashboard", icon: Home, href: "/admin", moduleId: "dashboard" },
        { id: "products", name: "Products", icon: ShoppingBag, href: "/admin/products", moduleId: "products" },
        { id: "orders", name: "Orders", icon: ListOrdered, href: "/admin/orders", moduleId: "orders" },
        { id: "users", name: "Users & Staff", icon: Users, href: "/admin/users", moduleId: "users" },
        { id: "riders", name: "Delivery Riders", icon: Bike, href: "/admin/riders", moduleId: "riders" },
        { id: "withdrawals", name: "Withdrawals", icon: DollarSign, href: "/admin/withdrawals", moduleId: "withdrawals" },
        { id: "reviews", name: "Reviews", icon: Star, href: "/admin/reviews", moduleId: "reviews" },
        { id: "banners", name: "Banners", icon: Image, href: "/admin/banners", moduleId: "banners" },
        { id: "onboarding-offers", name: "Onboarding Offers", icon: Image, href: "/admin/onboarding-offers", moduleId: "onboarding-offers" },
        { id: "stories", name: "Stories", icon: Layout, href: "/admin/stories", moduleId: "stories" },
        { id: "custom-sections", name: "UI builder", icon: FileText, href: "/admin/custom-sections", moduleId: "custom-sections" },
        { id: "chats", name: "Live Chats", icon: MessageSquare, href: "/admin/chats", moduleId: "chats" },
        { id: "helpdesk", name: "Help Desk", icon: MessageSquare, href: "/admin/helpdesk", moduleId: "helpdesk" },
        { id: "notifications", name: "Notifications", icon: Bell, href: "/admin/notifications", moduleId: "notifications" },
        { id: "config", name: "Config", icon: Settings, href: "/admin/config", moduleId: "config" },
      ];

      const navigationItems = React.useMemo(() => {
        if (isSuperAdmin) return ALL_NAVIGATION_ITEMS;
        return ALL_NAVIGATION_ITEMS.filter(item => 
          item.moduleId === 'dashboard' || permissions.includes(item.moduleId || '')
        );
      }, [isSuperAdmin, permissions]);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleItemClick = (href: string) => {
    if (href === 'logout') {
      signOut(auth).then(() => navigate('/'));
      return;
    }
    navigate(href);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-white shadow-md border border-slate-100 md:hidden hover:bg-slate-50 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ? 
          <X className="h-5 w-5 text-slate-600" /> : 
          <Menu className="h-5 w-5 text-slate-600" />
        }
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
          onClick={toggleSidebar} 
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-64"}
          md:translate-x-0 md:static md:z-auto
          ${className}
        `}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/60 h-16 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 bg-[#EF8020] rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-semibold text-slate-800 text-sm truncate">DEEP SHOP</span>
                <span className="text-[10px] text-slate-500 truncate">{userData?.role === 'staff' ? "Staff Dashboard" : "Admin Dashboard"}</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 bg-[#EF8020] rounded-lg flex items-center justify-center mx-auto shadow-sm shrink-0">
              <span className="text-white font-bold text-sm">D</span>
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1 rounded-md hover:bg-slate-100 transition-all duration-200 shrink-0"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            )}
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="px-3 py-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          <ul className="space-y-0.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.href)}
                    className={`
                      w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-left transition-all duration-200 group relative
                      ${isActive
                        ? "bg-black/5 text-black"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                      ${isCollapsed ? "justify-center px-1.5" : ""}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center justify-center min-w-[20px]">
                      <Icon
                        className={`
                          h-4 w-4 flex-shrink-0
                          ${isActive 
                            ? "text-black" 
                            : "text-slate-500 group-hover:text-slate-700"
                          }
                        `}
                      />
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full truncate">
                        <span className={`text-sm truncate ${isActive ? "font-medium" : "font-normal"}`}>{item.name}</span>
                        {item.badge && (
                          <span className={`
                            px-1.5 py-0.5 text-[10px] font-medium rounded-full
                            ${isActive
                              ? "bg-black/10 text-black"
                              : "bg-slate-100 text-slate-600"
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Badge for collapsed state */}
                    {isCollapsed && item.badge && (
                      <div className="absolute top-0 right-0 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-black/10 border border-white">
                        <span className="text-[8px] font-medium text-black">
                          {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                        </span>
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-1 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {item.name}
                        {item.badge && (
                          <span className="ml-1.5 px-1 py-0.5 bg-slate-700 rounded-full text-[10px]">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section with profile and logout */}
        <div className="mt-auto border-t border-slate-200 shrink-0">
          {/* Profile Section */}
          <div className={`border-b border-slate-200 bg-slate-50/30 ${isCollapsed ? 'py-3 px-2' : 'p-3'}`}>
            {!isCollapsed ? (
              <div className="flex items-center px-2 py-1.5 rounded-md bg-white hover:bg-slate-50 transition-colors duration-200">
                <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-slate-700 font-medium text-xs">{(userData?.name || "AD").substring(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0 ml-2">
                  <p className="text-sm font-medium text-slate-800 truncate">{userData?.name || "Admin"}</p>
                  <p className="text-[10px] text-slate-500 truncate">{userData?.role || "Administrator"}</p>
                </div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full ml-2 shrink-0" title="Online" />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-slate-700 font-medium text-xs">{(userData?.name || "AD").substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-2">
            <button
              onClick={() => handleItemClick("logout")}
              className={`
                w-full flex items-center rounded-md text-left transition-all duration-200 group
                text-red-600 hover:bg-red-50 hover:text-red-700
                ${isCollapsed ? "justify-center p-2" : "space-x-2 px-3 py-2"}
              `}
              title={isCollapsed ? "Logout" : undefined}
            >
              <div className="flex items-center justify-center min-w-[20px]">
                <LogOut className="h-4 w-4 flex-shrink-0 text-red-500 group-hover:text-red-600" />
              </div>
              
              {!isCollapsed && (
                <span className="text-sm">Logout</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-1 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Logout
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 md:bg-transparent">
         {/* Top spacer on mobile for hamburger */}
         <div className="h-16 shrink-0 md:hidden border-b border-slate-200 bg-white" />
         
         <div className="flex-1 rounded-tl-lg md:rounded-l-2xl md:border-l border-t border-slate-200 bg-white shadow-sm flex flex-col h-full overflow-y-auto w-full">
            {children}
         </div>
      </div>
    </div>
  );
}
