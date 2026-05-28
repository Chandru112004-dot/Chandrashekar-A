import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Sparkles, Navigation, UserCog, Check, CircleHelp, Info, PhoneCall, RefreshCw, ClipboardList, User, HelpCircle, Lock, Unlock, Key, Store, ArrowRight } from 'lucide-react';
import { Product, CartItem, Order, OrderStatus } from './types';
import CustomerShop from './components/CustomerShop';
import AIAssistant from './components/AIAssistant';
import OrderTracking from './components/OrderTracking';
import AdminConsole from './components/AdminConsole';
import UserAccount from './components/UserAccount';
import UserOrders from './components/UserOrders';
import UserHelp from './components/UserHelp';
import ShopkeeperConsole from './components/ShopkeeperConsole';
import UserRegister from './components/UserRegister';

export default function App() {
  const [userRole, setUserRole] = useState<'unselected' | 'customer' | 'shopkeeper' | 'admin'>('unselected');
  const [appMode, setAppMode] = useState<'user' | 'admin'>('user');
  const [activeTab, setActiveTab] = useState<'shop' | 'ai-assistant' | 'track' | 'admin' | 'user-orders' | 'user-account' | 'user-help' | 'shopkeeper-platform'>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Admin login states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Poll intervals to refresh product stocks & incoming orders automatically
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAppData = async () => {
    try {
      const resProducts = await fetch('/api/products');
      const productsData = await resProducts.json();
      setProducts(productsData);

      const resOrders = await fetch('/api/orders');
      const ordersData = await resOrders.json();
      setOrders(ordersData);
    } catch (err) {
      console.error("Error loading full stack App data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
    syncTimerRef.current = setInterval(fetchAppData, 6000);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const isRegistered = localStorage.getItem('qt_user_registered') === 'true';
    const isShopkeeper = localStorage.getItem('quicktown_shopkeeper_session') ? true : false;
    if (isRegistered) {
      setUserRole('customer');
    } else if (isShopkeeper) {
      setUserRole('shopkeeper');
    }
  }, []);

  const handleUpdateCartItemAndQty = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(item => item.product.id === productId);
      
      if (quantity <= 0) {
        // Remove item
        return prevCart.filter(item => item.product.id !== productId);
      }

      // Cap at stock levels
      const cappedQty = Math.min(quantity, product.stock);

      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: cappedQty
        };
        showTemporaryAlert('info', `Updated quantity of ${product.localName} to ${cappedQty}`);
        return updated;
      } else {
        showTemporaryAlert('success', `Added ${product.localName} to your basket!`);
        return [...prevCart, { product, quantity: cappedQty }];
      }
    });
  };

  // Callback to append matches parsed by the Gemini AI Assistant directly into checkout cart
  const handleAddProductsToCart = (itemsToAdd: { product: Product; quantity: number }[]) => {
    setCart(prevCart => {
      const newCart = [...prevCart];
      itemsToAdd.forEach(item => {
        const existingIdx = newCart.findIndex(c => c.product.id === item.product.id);
        const stockCapped = Math.min(item.quantity, item.product.stock);

        if (existingIdx > -1) {
          // Add quantity
          const newQty = Math.min(newCart[existingIdx].quantity + stockCapped, item.product.stock);
          newCart[existingIdx] = {
            ...newCart[existingIdx],
            quantity: newQty
          };
        } else {
          newCart.push({ product: item.product, quantity: stockCapped });
        }
      });
      return newCart;
    });

    showTemporaryAlert('success', `Succesfully drafted ${itemsToAdd.length} AI generated commodities to basket!`);
    setActiveTab('shop'); // automatically flip back to shop view to show updated quantities
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderPlaced = (newOrder: Order) => {
    setOrders(prevOrders => [newOrder, ...prevOrders]);
    setSelectedTrackingId(newOrder.id);
    showTemporaryAlert('success', `Ticket ${newOrder.id} successfully lodged at dispatch deck!`);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        showTemporaryAlert('success', `Order ${orderId} updated to state: ${status}`);
        fetchAppData();
      }
    } catch (err) {
      console.error("Failed executing state transition on order", err);
    }
  };

  // Flash UI helper
  const showTemporaryAlert = (type: 'success' | 'info', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage(null);
    }, 3800);
  };

  if (userRole === 'unselected') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-y-auto antialiased">
        {/* Ambient background blur patterns */}
        <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-[32px] shadow-2xl p-8 sm:p-10 space-y-8 relative z-10 text-center animate-scale-up my-auto">
          
          <div className="space-y-3">
            <span className="text-4xl bg-gradient-to-tr from-emerald-50 to-teal-50 p-4 rounded-full inline-block shadow-xs animate-bounce select-none">🏍️</span>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">QuickTown Express</h1>
              <span className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded">10-MIN HOME DISPATCH</span>
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
              Direct secure connection to certified municipal storefronts. Please select your registration and login portal role:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Role Card */}
            <button
              id="role-customer-btn"
              onClick={() => {
                const isRegistered = localStorage.getItem('qt_user_registered') === 'true';
                setUserRole('customer');
                if (isRegistered) {
                  setActiveTab('shop');
                }
              }}
              className="p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl bg-slate-50 hover:bg-white text-left transition-all group flex flex-col justify-between min-h-[220px] cursor-pointer"
            >
              <div>
                <span className="text-3xl bg-emerald-50 text-emerald-800 p-2.5 rounded-xl inline-block mb-3 select-none group-hover:scale-110 transition-transform">
                  🏠
                </span>
                <h3 className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase text-xs tracking-tight">
                  Customer Portal
                </h3>
                <p className="text-[11px] text-slate-500 leading-normal mt-2.5 font-semibold">
                  Acquire fresh milk, local farm sabzi, warm baked items, first-aid remedies, and custom groceries delivered in 10-minutes flat.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center gap-1.5 text-xxs font-black text-emerald-600 uppercase tracking-wider">
                Access Storefront <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Shopkeeper Role Card */}
            <button
              id="role-shopkeeper-btn"
              onClick={() => {
                setUserRole('shopkeeper');
              }}
              className="p-6 rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-xl bg-slate-50 hover:bg-white text-left transition-all group flex flex-col justify-between min-h-[220px] cursor-pointer"
            >
              <div>
                <span className="text-3xl bg-amber-50 text-amber-800 p-2.5 rounded-xl inline-block mb-3 select-none group-hover:scale-110 transition-transform">
                  🏪
                </span>
                <h3 className="font-extrabold text-slate-905 uppercase text-xs tracking-tight">
                  Shopkeeper Cabinet
                </h3>
                <p className="text-[11px] text-slate-500 leading-normal mt-2.5 font-semibold">
                  Set up your localized storefront, handle inventory stocks, change unit packaging, add premium items, and monitor active dispatches.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center gap-1.5 text-xxs font-black text-amber-600 uppercase tracking-wider">
                Partner Workspace <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Admin Role Card */}
            <button
              id="role-admin-btn"
              onClick={() => {
                setUserRole('admin');
                setAppMode('admin');
                setActiveTab('admin');
              }}
              className="p-6 rounded-2xl border border-slate-200 hover:border-teal-500 hover:shadow-xl bg-slate-50 hover:bg-white text-left transition-all group flex flex-col justify-between min-h-[220px] cursor-pointer"
            >
              <div>
                <span className="text-3xl bg-teal-50 text-teal-850 p-2.5 rounded-xl inline-block mb-3 select-none group-hover:scale-110 transition-transform">
                  🛠️
                </span>
                <h3 className="font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors uppercase text-xs tracking-tight">
                  Logistics Station Admin
                </h3>
                <p className="text-[11px] text-slate-500 leading-normal mt-2.5 font-semibold">
                  Supervise town dispatch networks, coordinate courier operations, generate custom reward coupons, and simulate live traffic dispatches.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center gap-1.5 text-xxs font-black text-teal-650 uppercase tracking-wider">
                Admin Control Desk <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>🛡️ Certified safe local delivery network.</span>
            <span>100% Secure &amp; Managed Encryption</span>
          </div>

        </div>
      </div>
    );
  }

  if (userRole === 'customer' && localStorage.getItem('qt_user_registered') !== 'true') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-y-auto antialiased">
        <button
          onClick={() => setUserRole('unselected')}
          className="absolute top-4 left-4 z-50 bg-slate-900 text-white border-0 text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all cursor-pointer hover:bg-slate-800 flex items-center gap-1"
        >
          ← Back to Role Choice
        </button>
        <div className="w-full max-w-xl my-auto p-4">
          <UserRegister
            onRegisterComplete={(details) => {
              localStorage.setItem('qt_user_registered', 'true');
              localStorage.setItem('qt_user_name', details.name);
              localStorage.setItem('qt_user_phone', details.phone);
              localStorage.setItem('qt_user_email', details.email);
              localStorage.setItem('qt_user_city', details.city);
              localStorage.setItem('qt_user_address', details.address);
              setUserRole('customer');
              setActiveTab('shop');
              fetchAppData();
              showTemporaryAlert('success', `Welcome ${details.name}! Registration logged.`);
            }}
          />
        </div>
      </div>
    );
  }

  if (userRole === 'shopkeeper') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-y-auto antialiased">
        <header className="bg-slate-900 border-b border-slate-850 text-white sticky top-0 z-40 shadow-xl shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl bg-slate-800 p-2 rounded-xl border border-slate-700">🏪</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight leading-none uppercase text-slate-100">QuickTown Shopkeeper Hub</h1>
                  <span className="bg-amber-950 text-amber-305 border border-amber-500/35 font-extrabold text-[8px] px-1.5 py-0.5 rounded leading-none uppercase">VENDOR ACCESS</span>
                </div>
                <p className="text-xxs text-slate-400 font-semibold tracking-wide uppercase leading-none mt-1.5">
                  Manage dark stores commodity registries, listing stocks & delivery settings
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setUserRole('unselected');
              }}
              className="bg-slate-800 hover:bg-slate-705 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border border-slate-750 transition-all cursor-pointer animate-fade-in"
            >
              🚪 Exit Vendor Hub
            </button>
          </div>
        </header>

        <main className="flex-1 pb-16 bg-slate-50">
          <ShopkeeperConsole
            products={products}
            onRefreshProducts={fetchAppData}
          />
        </main>
      </div>
    );
  }

  if (userRole === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-y-auto antialiased">
        <header className="bg-slate-900 border-b border-slate-850 text-white sticky top-0 z-40 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Logo Brand / Status */}
            <div className="flex items-center gap-3">
              <span className="text-3xl bg-slate-800 p-2 rounded-xl border border-slate-700">🛠️</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight leading-none uppercase text-slate-100">QuickTown Operations Center</h1>
                  <span className="bg-teal-950 text-teal-300 border border-teal-500/35 font-extrabold text-3xs px-1.5 py-0.5 rounded leading-none">STAFF INTERFACE</span>
                </div>
                <p className="text-xxs text-slate-450 font-medium tracking-wide leading-none mt-1">
                  Real-time town supply chain management, order dispatches, & discount coupons portal
                </p>
              </div>
            </div>

            {/* Quick Stats or Actions in Header */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xxs font-mono bg-slate-850 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400 select-none">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
                <span className="font-bold text-slate-400">Database Active &amp; Live</span>
              </div>

              {/* EXIT ADMIN DESK TO SWITCH ROLE */}
              <button
                onClick={() => {
                  setUserRole('unselected');
                  setAppMode('user');
                  setActiveTab('shop');
                }}
                className="bg-red-600 hover:bg-red-750 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                title="Exit Admin Desk and return to Role Selector"
              >
                🚪 Exit Admin Desk
              </button>
            </div>

          </div>
        </header>

        <main className="flex-1 pb-16">
          {!isAdminLoggedIn ? (
            <div className="max-w-md mx-auto mt-16 px-4 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 text-white rounded-2xl flex items-center justify-center text-xl mx-auto shadow-md select-none">
                    🔒
                  </div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Operations Login Required</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Staff Credentials Authentication Gate</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (adminPin === '1234') {
                    setIsAdminLoggedIn(true);
                    setAdminPin('');
                    setAdminLoginError('');
                    showTemporaryAlert('success', 'Admin Operations Access Granted!');
                  } else {
                    setAdminLoginError('Invalid Staff ID PIN code. Please check standard pass credential.');
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 flex-wrap">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Username / Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value="admin@quicktown.com"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-500 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 flex-wrap">
                      <Lock className="w-3.5 h-3.5 text-slate-400" /> Operational PIN Code
                    </label>
                    <input
                      type="password"
                      placeholder="••••"
                      required
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2.5 text-sm tracking-widest text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono text-center font-black"
                  />
                  </div>

                  {adminLoginError && (
                    <p className="text-[10px] text-red-650 font-bold bg-red-50 p-2.5 rounded-xl border border-red-150">
                      ⚠️ {adminLoginError}
                    </p>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-2 items-start text-[10px] text-slate-500">
                    <Key className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-700 block mb-0.5">Quick Hint for testing:</span>
                      Enter staff credential PIN <span className="font-mono bg-slate-200 text-slate-850 font-black px-1.5 py-0.5 rounded text-[11px]">1234</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    Authenticate Credentials
                  </button>
                </form>

                <div className="border-t border-slate-100 pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUserRole('unselected');
                      setAppMode('user');
                      setActiveTab('shop');
                    }}
                    className="text-xxs font-extrabold uppercase text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    🚪 Return to Role Selector
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="bg-gradient-to-r from-teal-905 to-slate-900 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase">🛠️ Local Dark-Store Hub Console</h2>
                    <p className="text-xs text-teal-200">Manage real-time micro-town stock, track dispatches, and trigger traffic simulations.</p>
                  </div>
                </div>
              </div>
              
              <AdminConsole
                products={products}
                orders={orders}
                onRefreshData={fetchAppData}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            </div>
          )}
        </main>
      </div>
    );
  }

  // Otherwise, the ONLY role left is 'customer' && registered == true (Active Storefront Session)
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col antialiased">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xxs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3.5">
            <span className="text-4xl select-none bg-gradient-to-tr from-emerald-100 to-teal-50 p-2 rounded-2xl animate-spin-slow">🏍️</span>
            <div>
              <div className="flex items-center gap-1.5 matches-glow">
                <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">QuickTown</h1>
                <span className="bg-emerald-600 text-white font-extrabold text-3xs px-1.5 py-0.5 rounded leading-none">EXPRESS</span>
              </div>
              <p className="text-xxs text-slate-450 font-bold tracking-wide uppercase mt-0.5">
                City Delivery in 10-Min · Small Town Friendly
              </p>
            </div>
          </div>

          {/* Tab Navigation selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 select-none">
              <button
                type="button"
                onClick={() => setActiveTab('shop')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'shop'
                    ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-605 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                Store Items
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ai-assistant')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ai-assistant'
                    ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-605 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                AI Voice Helper
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('track')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 relative cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-605 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                Live Radar Track
                {orders.some(o => o.status !== 'Delivered' && o.status !== 'Cancelled') && (
                  <span className="absolute -top-0.5 right-0.5 min-w-1.5 h-1.5 rounded-full bg-red-500 border border-white animate-ping"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('user-orders');
                  fetchAppData();
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'user-orders'
                    ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-605 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                My Orders
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('user-account')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'user-account'
                    ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-605 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                My Account
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('user-help')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'user-help'
                    ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-605 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <CircleHelp className="w-3.5 h-3.5 text-emerald-600" />
                Help Guide
              </button>
            </nav>

            {/* Change role switcher */}
            <button
              type="button"
              onClick={() => {
                setUserRole('unselected');
              }}
              className="bg-slate-150 hover:bg-slate-200 text-slate-850 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border border-slate-250 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Return to initial onboarding screen"
            >
              🚪 Switch Role
            </button>
          </div>

        </div>
      </header>

      {/* Action Notification Alert Toast */}
      {alertMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 max-w-sm border border-slate-850 animate-fade-in animate-bounce">
          <div className="bg-emerald-500 rounded-full p-1 text-white animate-pulse">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Main View Router Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'shop' && (
          <div className="animate-fade-in">
            <CustomerShop
              products={products}
              cart={cart}
              onUpdateCartItemAndQty={handleUpdateCartItemAndQty}
              onClearCart={handleClearCart}
              onOrderPlaced={handleOrderPlaced}
              onNavigateToTracking={(id) => {
                setSelectedTrackingId(id);
                setActiveTab('track');
              }}
              userRole={userRole}
              onRefreshProducts={fetchAppData}
            />
          </div>
        )}

        {activeTab === 'ai-assistant' && (
          <div className="animate-fade-in px-4 py-8">
            <div className="max-w-2xl mx-auto text-center mb-6">
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">🎙️ Multilingual Grocery Assistant</h1>
              <p className="text-xs text-slate-550 mt-1 max-w-md mx-auto">
                Especially helpful for senior or rural shoppers. Don't worry about spelling. Simply say/type what you want in local slang or Hinglish (e.g., "doodh", "paneer", "paracetamol")!
              </p>
            </div>
            
            <AIAssistant onAddProductsToCart={handleAddProductsToCart} />
            
            <div className="bg-teal-50/50 border border-teal-150 p-4 rounded-2xl max-w-2xl mx-auto flex items-start gap-3 mt-4 text-xs text-teal-800">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-teal-600" />
              <div>
                <span className="font-bold">How it parses:</span> Gemini checks the synonyms dictionary on our Express server. It auto-assigns relevant pack units ("500 ml", "1 kg") and updates your basket without requiring manual shopping filters.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'track' && (
          <div className="animate-fade-in">
            <OrderTracking
              orderId={selectedTrackingId}
              ordersList={orders}
              onNavigateToShop={() => setActiveTab('shop')}
            />
          </div>
        )}

        {activeTab === 'user-orders' && (
          <div className="animate-fade-in">
            <UserOrders
              orders={orders}
              onNavigateToTracking={(id) => {
                setSelectedTrackingId(id);
                setActiveTab('track');
              }}
              onRefreshData={fetchAppData}
            />
          </div>
        )}

        {activeTab === 'user-account' && (
          <div className="animate-fade-in">
            <UserAccount onShowAlert={showTemporaryAlert} />
          </div>
        )}

        {activeTab === 'user-help' && (
          <div className="animate-fade-in">
            <UserHelp />
          </div>
        )}
      </main>

      {/* Sticky Bottom Help Ribbon tailored for small town users */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center mt-auto shadow-inner text-slate-500 text-xxs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-450 uppercase tracking-widest leading-relaxed text-center sm:text-left">
            🎯 QuickTown express delivery has served <b>43 small towns</b> and over <b>12,000+ happy families</b> under 10 minutes.
          </p>
          <div className="flex items-center gap-1 text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 cursor-pointer">
            <PhoneCall className="w-3 h-3 text-emerald-600" />
            <span>Toll-Free Helpline: 1800-419-8080</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
