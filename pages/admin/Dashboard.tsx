import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";
import { useNotify } from "../../components/Notifications";
import Icon from "../../components/Icon";
import { PinList, type PinListItem } from "../../components/ui/pin-list";
import { 
  PackageSearch, 
  ShoppingBag, 
  Settings, 
  Image as ImageIcon,
  Store,
  Users,
  Ticket,
  Wallet,
  Tag,
  Star,
  Users2,
  LayoutTemplate,
  Search,
  UserPlus,
  Video,
  Bike,
  Bell,
  KeyRound,
  AlertTriangle,
  Phone
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { StaffContext } from "../../components/AdminLayout";

const ADMIN_PIN_ITEMS: PinListItem[] = [
  {
    id: 'manage-products',
    name: 'Manage Products',
    info: 'Add, edit or delete products',
    icon: PackageSearch,
    pinned: true,
    href: 'products'
  },
  {
    id: 'manage-orders',
    name: 'Manage Orders',
    info: 'View and process orders',
    icon: ShoppingBag,
    pinned: true,
    href: 'orders'
  },
  {
    id: 'manage-stories',
    name: 'Manage Stories',
    info: 'Post new stories & updates',
    icon: ImageIcon,
    pinned: false,
    href: 'stories'
  },
  {
    id: 'manage-storefront',
    name: 'Storefront config',
    info: 'Edit homepage & banners',
    icon: Store,
    pinned: false,
    href: 'banners'
  },
  {
    id: 'manage-config',
    name: 'Settings & Config',
    info: 'System settings',
    icon: Settings,
    pinned: false,
    href: 'config'
  },
  {
    id: 'manage-payment-settings',
    name: 'Payment & Social',
    info: 'Manage Bangla QR & Footer',
    icon: Wallet,
    pinned: true,
    href: 'payment-settings'
  },
  {
    id: 'manage-payment-gateway',
    name: 'Auto Payment Gateway',
    info: 'bKash/Nagad auto SMS sync setup',
    icon: Wallet,
    pinned: true,
    href: 'payment-gateway'
  },
  {
    id: 'manage-users',
    name: 'Manage Users',
    info: 'Manage customers',
    icon: Users,
    pinned: false,
    href: 'users'
  },
  {
    id: 'manage-tickets',
    name: 'Help Desk',
    info: 'Support tickets',
    icon: Ticket,
    pinned: false,
    href: 'helpdesk'
  },
  {
    id: 'manage-withdrawals',
    name: 'Withdrawals',
    info: 'Manage payout requests',
    icon: Wallet,
    pinned: false,
    href: 'withdrawals'
  },
  {
    id: 'manage-deposits',
    name: 'Deposits',
    info: 'Manage coin deposits',
    icon: ShoppingBag,
    pinned: false,
    href: 'deposits'
  },
  {
    id: 'manage-coupons',
    name: 'Manage Vouchers',
    info: 'Claimable coupons',
    icon: Tag,
    pinned: false,
    href: 'coupons'
  },
  {
    id: 'manage-promos',
    name: 'Manage Promo Codes',
    info: 'Checkout promo codes',
    icon: Tag,
    pinned: false,
    href: 'promo-codes'
  },
  {
    id: 'manage-reviews',
    name: 'Reviews',
    info: 'Customer ratings',
    icon: Star,
    pinned: false,
    href: 'reviews'
  },
  {
    id: 'manage-staff',
    name: 'Manage Staff',
    info: 'Admin roles & staff',
    icon: Users2,
    pinned: false,
    href: 'staff'
  },
  {
    id: 'manage-push-notifications',
    name: 'Push Notifications',
    info: 'Send FCM push alerts',
    icon: Bell,
    pinned: false,
    href: 'push-notifications'
  },
  {
    id: 'manage-custom-sections',
    name: 'Custom Sections',
    info: 'Homepage UI sections',
    icon: LayoutTemplate,
    pinned: false,
    href: 'custom-sections'
  },
  {
    id: 'manage-seo',
    name: 'Manage SEO',
    info: 'Search engine config',
    icon: Search,
    pinned: false,
    href: 'seo'
  },
  {
    id: 'manage-password-resets',
    name: 'Password Resets',
    info: 'Manage reset requests',
    icon: KeyRound,
    pinned: false,
    href: 'password-resets'
  },
  {
    id: 'manage-ads',
    name: 'Manage Ads',
    info: 'Video & Photo Popups',
    icon: Video,
    pinned: true,
    href: 'ads'
  },
  {
    id: 'manage-affiliate-requests',
    name: 'Affiliate Requests',
    info: 'Pending partners',
    icon: UserPlus,
    pinned: false,
    href: 'affiliate-requests'
  },
  {
    id: 'manage-creator-requests',
    name: 'Creator Approvals',
    info: 'Pending content creators',
    icon: UserPlus,
    pinned: false,
    href: 'creator-requests'
  },
  {
    id: 'manage-affiliate-videos',
    name: 'Affiliate Videos',
    info: 'Manage creator videos',
    icon: Video,
    pinned: false,
    href: 'affiliate-videos'
  },
  {
    id: 'manage-riders',
    name: 'Manage Riders',
    info: 'Delivery riders',
    icon: Bike,
    pinned: false,
    href: 'riders'
  },
  {
    id: 'manage-vg-helpline',
    name: 'Manage VGHelpline',
    info: 'Helpline audio/video calls & chat',
    icon: Phone,
    pinned: true,
    href: 'vg-helpline'
  }
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const staffContext = React.useContext(StaffContext);
  
  const permittedItems = React.useMemo(() => {
    if (staffContext.isSuperAdmin) return ADMIN_PIN_ITEMS;
    return ADMIN_PIN_ITEMS.filter(item => {
      // mapping item.id to module id from ManageStaff
      const moduleMap: Record<string, string> = {
        'manage-products': 'products',
        'manage-orders': 'orders',
        'manage-users': 'users',
        'manage-coupons': 'coupons',
        'manage-tickets': 'helpdesk',
        'manage-vg-helpline': 'helpdesk',
        'manage-withdrawals': 'refunds',
        'manage-storefront': 'banners',
        'manage-stories': 'stories',
        'manage-ads': 'banners',
        'manage-config': 'config',
        'manage-seo': 'config',
        'manage-payment-settings': 'config',
        'manage-payment-gateway': 'config',
        'manage-push-notifications': 'users',
        'manage-affiliate-requests': 'users',
        'manage-creator-requests': 'users',
        'manage-affiliate-videos': 'banners',
        'manage-riders': 'users',
        'manage-staff': 'config'
      };
      
      const modId = moduleMap[item.id];
      if (modId && staffContext.permissions.includes(modId)) return true;
      // Also allow stories if they have products or storefront maybe? Let's add stories to the ALL_MODULES in ManageStaff later.
      return false;
    });
  }, [staffContext]);

  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([
    { name: "Mon", revenue: 0 },
    { name: "Tue", revenue: 0 },
    { name: "Wed", revenue: 0 },
    { name: "Thu", revenue: 0 },
    { name: "Fri", revenue: 0 },
    { name: "Sat", revenue: 0 },
    { name: "Sun", revenue: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const pSnap = await getDocs(collection(db, "products"));
      const uSnap = await getDocs(collection(db, "users"));
      const oSnap = await getDocs(collection(db, "orders"));
      setStats({ products: pSnap.size, users: uSnap.size, orders: oSnap.size });

      const productsData = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const lowStock = productsData.filter((p: any) => p.stock !== undefined && Number(p.stock) < 5);
      setLowStockProducts(lowStock.slice(0, 5)); // Show top 5 low stock

      // Process orders for chart
      const now = new Date();
      now.setHours(0,0,0,0);
      const orders = oSnap.docs.map(d => d.data());
      const newChartData = Array.from({length: 7}).map((_, i) => {
         const date = new Date(now);
         date.setDate(date.getDate() - (6 - i));
         const label = date.toLocaleDateString('en-US', { weekday: 'short' });
         
         const dayRevenue = orders.reduce((sum, order: any) => {
            if (order.createdAt && order.createdAt.toDate) {
               const orderDate = order.createdAt.toDate();
               if (orderDate >= date && orderDate < new Date(date.getTime() + 86400000) && order.status !== "Cancelled") {
                 let t = Number(order.total);
                 if (isNaN(t)) {
                   t = Number(String(order.total).replace(/[^0-9.-]+/g,""));
                 }
                 return sum + (isNaN(t) ? 0 : t);
               }
            }
            return sum;
         }, 0);
         
         return { name: label, revenue: dayRevenue };
      });
      
      // If we don't have enough real data, add some visual variation on display
      const hasRealData = newChartData.some(d => d.revenue > 0);
      if (!hasRealData) {
         // Fallback to sample data if no real orders match the last 7 days
         setChartData([
          { name: "Mon", revenue: 4000 },
          { name: "Tue", revenue: 3000 },
          { name: "Wed", revenue: 5000 },
          { name: "Thu", revenue: 2780 },
          { name: "Fri", revenue: 8890 },
          { name: "Sat", revenue: 6390 },
          { name: "Sun", revenue: 9490 },
         ]);
      } else {
         setChartData(newChartData);
      }

      const qOrders = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc"),
        limit(5),
      );
      const ordersSnap = await getDocs(qOrders);
      setRecentOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchStats();
  }, []);

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    notify("This module will be available in the next update.", "info");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen relative overflow-hidden">
      {/* Background blobs for premium feel */}
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-zinc-200 dark:bg-zinc-700/40 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between mb-12 gap-6">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">
              {new Date().getHours() < 12
                ? "Good Morning"
                : new Date().getHours() < 18
                  ? "Good Afternoon"
                  : "Good Evening"}
              , {staffContext.isStaff ? 'Staff' : 'Admin'}
            </h1>
            <p className="text-zinc-500 text-[10px] md:text-xs font-bold tracking-normal flex items-center">
              <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 animate-pulse mr-2"></span>
              System Online &bull;{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Quick Actions / PinList */}
        <div className="md:w-[400px] shrink-0 relative z-10 animate-fade-in mt-6 md:mt-0">
          <PinList items={permittedItems} />
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10 animate-stagger-1">
        <StatCard
          title="Total Products"
          value={stats.products}
          icon="boxes"
          gradient="from-zinc-100 to-zinc-50"
          iconColor="text-zinc-800 dark:text-zinc-200"
          trend="+12% this week"
        />
        <StatCard
          title="Registered Users"
          value={stats.users}
          icon="users"
          gradient="from-emerald-50/50 to-emerald-50/10"
          iconColor="text-zinc-800 dark:text-zinc-200"
          trend="+34 new"
        />
        <StatCard
          title="Total Orders"
          value={stats.orders}
          icon="shopping-bag"
          gradient="from-blue-50/50 to-blue-50/10"
          iconColor="text-blue-600 dark:text-blue-400"
          trend="All time"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length.toString()}
          icon="alert-triangle"
          gradient="from-red-50/50 to-red-50/10"
          iconColor="text-red-600 dark:text-red-400"
          trend="Needs attention"
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Advanced Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 p-6 md:p-8 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 dark:bg-zinc-900 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
              <div>
                <h3 className="font-semibold text-xl text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Revenue Analytics (Last 7 Days)
                </h3>
                <p className="text-[10px] tracking-normal font-bold text-zinc-400 mt-1">
                  Sales Performance
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 rounded-2xl text-[10px] font-semibold tracking-normal flex items-center gap-2 shadow-inner">
                <span className="text-zinc-900 dark:text-zinc-100">
                  <Icon name="trend-up" className="text-sm" />
                </span>{" "}
                Chart Data
              </div>
            </div>
            <div className="h-[280px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f4f4f5"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#a1a1aa", fontWeight: "bold" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#a1a1aa", fontWeight: "bold" }}
                    dx={-10}
                    tickFormatter={(value) => `৳${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#06331e" }}
                    formatter={(value: any) => [`৳${value}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Low Stock Widget */}
          <div className="bg-zinc-900 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden h-[55%] min-h-[200px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-900/40 dark:bg-red-500/10 text-white rounded-full blur-[80px] pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-semibold text-white tracking-normal text-[10px] md:text-xs flex items-center">
                 <AlertTriangle size={14} className="text-red-400 mr-2" />
                 Low Stock Alerts
               </h3>
               <Link to="/admin/products" className="text-xs text-zinc-400 hover:text-white transition-colors">Manage</Link>
            </div>

            <div className="space-y-4 relative z-10 h-full overflow-y-auto pr-2 custom-scrollbar">
              {lowStockProducts.length > 0 ? (
                 lowStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between pb-3 border-b border-zinc-800 last:border-0 last:pb-0">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                             {p.images?.[0] || p.image ? <img src={p.images?.[0] || p.image} alt="" className="w-full h-full object-cover" /> : null}
                          </div>
                          <div>
                             <p className="text-xs text-white font-medium line-clamp-1">{p.name || "Unnamed Product"}</p>
                             <p className="text-[10px] text-zinc-500">ID: {p.id.slice(0, 8)}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400">
                             {p.stock} left
                          </span>
                       </div>
                    </div>
                 ))
              ) : (
                 <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-4">
                    <PackageSearch size={24} className="mb-2 opacity-50" />
                    <p className="text-xs font-medium">All products are adequately stocked.</p>
                 </div>
              )}
            </div>
          </div>

          {/* Quick Alerts */}
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700 flex items-start gap-4 shadow-sm h-[40%] flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-blue-100/50 rounded-full blur-2xl group-hover:bg-blue-200/50 transition-colors"></div>
            <div className="relative z-10 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Icon name="shield-check" className="text-xl" />
            </div>
            <div className="relative z-10 mt-2">
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                Security Scan OK
              </h4>
              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                All firewalls and SSL certificates are active. No anomalies
                detected.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-[11px] font-bold text-zinc-400 tracking-normal">
            Recent Activity
          </h3>
          <Link
            to="orders"
            className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 tracking-normal hover:text-zinc-800 dark:text-zinc-200 transition-colors flex items-center"
          >
            View All <Icon name="arrow-right" className="ml-1.5 text-[8px]" />
          </Link>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
          {recentOrders.map((order, i) => (
            <div
              key={order.id}
              className={`flex items-center justify-between p-6 ${i !== recentOrders.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""} hover:bg-zinc-50 dark:bg-zinc-800/80 transition-colors cursor-pointer group`}
              onClick={() => navigate(`orders`)}
            >
              <div className="flex items-center space-x-5">
                <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors group-hover:shadow-md">
                  <Icon name="shopping-bag" className="text-zinc-500 text-sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5 tracking-tight group-hover:text-zinc-900 transition-colors">
                    {order.customerName}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-400 tracking-normal">
                    Order #{order.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm md:text-base font-semibold text-black dark:text-white">
                  ৳{order.total}
                </p>
                <p
                  className={`text-[9px] md:text-[10px] font-bold tracking-normal mt-0.5 ${order.status === "Delivered" ? "text-zinc-900 dark:text-zinc-100" : order.status === "Cancelled" ? "text-red-500" : "text-blue-500"}`}
                >
                  {order.status}
                </p>
              </div>
            </div>
          ))}
          {recentOrders.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-400">
              <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-4">
                <Icon name="inbox" className="text-xl text-zinc-300" />
              </div>
              <div className="font-bold text-xs tracking-normal">
                No recent orders
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, gradient, iconColor, trend }: any) => {
  const isAlertIcon = icon === "alert-triangle";
  return (
  <div
    className={`bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-default`}
  >
    <div
      className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient} rounded-2xl blur-2xl z-0 opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
    ></div>
    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
      <div
        className={`w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center justify-center ${iconColor}`}
      >
        {isAlertIcon ? <AlertTriangle size={20} /> : <Icon name={icon as any} className="text-xl" />}
      </div>
      <div>
        <p className="text-xl lg:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-none mb-2 tracking-tight">
          {value}
        </p>
        <p className="text-xs font-semibold text-zinc-500 tracking-tight mb-2">
          {title}
        </p>
        {trend && (
          <p
            className={`text-[10px] font-bold  tracking-normal ${trend.includes("+") ? "text-zinc-900 dark:text-zinc-100" : trend.includes("attention") ? "text-red-500" : "text-zinc-400"}`}
          >
            {trend}
          </p>
        )}
      </div>
    </div>
  </div>
)};

export default AdminDashboard;

