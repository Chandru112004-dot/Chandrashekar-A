import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, CheckSquare, Phone, MapPin, Truck, AlertTriangle, ArrowRight, Tag, Ticket } from 'lucide-react';
import { Product, CartItem, Order } from '../types';

interface CustomerShopProps {
  products: Product[];
  cart: CartItem[];
  onUpdateCartItemAndQty: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onOrderPlaced: (newOrder: Order) => void;
  onNavigateToTracking: (orderId: string) => void;
  userRole?: string;
  onRefreshProducts?: () => void;
}

export default function CustomerShop({
  products,
  cart,
  onUpdateCartItemAndQty,
  onClearCart,
  onOrderPlaced,
  onNavigateToTracking,
  userRole = 'customer',
  onRefreshProducts
}: CustomerShopProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  
  // Checkout Form fields
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [custCity, setCustCity] = useState<string>('Sikar City Hub');
  const [custAddress, setCustAddress] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Coupon state fields
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);

  // Dynamic Cities & Shops
  const [cities, setCities] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('Sikar City Hub');
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);

  // Reviews & Rating draft states
  const [reviewName, setReviewName] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Initialize draft inputs when product modal is popped open
  useEffect(() => {
    if (detailedProduct) {
      const savedName = localStorage.getItem('qt_user_name') || '';
      setReviewName(savedName);
      setReviewRating(5);
      setReviewText('');
      setReviewError(null);
      setReviewSuccess(null);
    }
  }, [detailedProduct]);

  // Indian towns lists fallback
  const towns = ["Madhubani Towns", "Sikar City Hub", "Motihari Central", "Sasaram Junction", "Hajipur Bazaar", "Moradabad Sector 2", "Alwar Cantonment"];

  // Category labels with relatable emojis
  const categories = [
    { id: 'all', label: 'All Items 🛒' },
    { id: 'vegetables', label: 'Sabzi 🧅' },
    { id: 'fruits', label: 'Phal 🍎' },
    { id: 'dairy', label: 'Doodh & Dahi 🥛' },
    { id: 'kirana', label: 'Kirana 🌾' },
    { id: 'snacks', label: 'Snacks 🍿' },
    { id: 'household', label: 'Soap & Powder 🧼' },
    { id: 'medicine', label: 'Medicine 💊' },
  ];

  // Fetch cities and shops from backend APIs
  useEffect(() => {
    const savedTown = localStorage.getItem('qt_user_town') || 'Sikar City Hub';
    setSelectedCity(savedTown);
    setCustCity(savedTown);

    fetch('/api/cities')
      .then(res => res.json())
      .then(data => {
        setCities(data);
        const exists = data.some((c: any) => c.name === savedTown);
        if (!exists && data.length > 0) {
          setSelectedCity(data[0].name);
        }
      })
      .catch(err => console.error("Error fetching cities", err));

    fetch('/api/shops')
      .then(res => res.json())
      .then(data => {
        setShops(data);
      })
      .catch(err => console.error("Error fetching shops", err));
  }, []);

  // Pre-populate checkout details on open
  useEffect(() => {
    const savedName = localStorage.getItem('qt_user_name') || '';
    const savedPhone = localStorage.getItem('qt_user_phone') || '';
    const savedCity = localStorage.getItem('qt_user_town') || 'Sikar City Hub';
    const savedAddress = localStorage.getItem('qt_user_address') || '';

    if (savedName) setCustName(savedName);
    if (savedPhone) setCustPhone(savedPhone);
    if (savedCity) setCustCity(savedCity);
    if (savedAddress) setCustAddress(savedAddress);
  }, [isCartOpen]);

  const filteredShops = shops.filter(s => s.cityName === selectedCity);

  useEffect(() => {
    if (filteredShops.length > 0) {
      const exists = filteredShops.some(s => s.id === selectedShopId);
      if (!exists) {
        setSelectedShopId(filteredShops[0].id);
      }
    } else {
      setSelectedShopId('');
    }
  }, [selectedCity, shops]);

  // Filtering products by current shop and user constraints
  const filteredProducts = products.filter(p => {
    const matchesShop = !selectedShopId || p.shopId === selectedShopId;
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.localName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesShop && matchesCategory && matchesSearch;
  });

  // Calculate cart costings
  const subTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const deliveryCharges = subTotal === 0 ? 0 : subTotal >= 150 ? 0 : 15; // Free over ₹150, else ₹15
  const handlingCharges = subTotal === 0 ? 0 : 4; // Flat packing commission
  
  const baseGrandTotal = subTotal + deliveryCharges + handlingCharges;
  const grandTotal = subTotal === 0 ? 0 : Math.max(0, baseGrandTotal - (appliedCoupon ? appliedCoupon.discount : 0));

  // Handle addition directly from search tile
  const getProductQtyInCart = (prodId: string) => {
    const found = cart.find(item => item.product.id === prodId);
    return found ? found.quantity : 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please type a coupon code.");
      return;
    }
    setCouponError(null);
    setCouponSuccess(null);
    setIsApplyingCoupon(true);

    try {
      const resp = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartAmount: subTotal })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Failed to validate coupon");
      }
      setAppliedCoupon({
        code: data.code,
        discount: data.discount,
        description: data.description
      });
      setCouponSuccess(`Coupon code '${data.code}' applied! Saved ₹${data.discount}`);
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon code");
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    setCouponSuccess(null);
  };

  // Automatically validate coupon again when products inside basket changes (e.g. subTotal alters)
  useEffect(() => {
    if (appliedCoupon && subTotal > 0) {
      // Re-trigger quick valuation in background to ensure limit is still respected
      fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: appliedCoupon.code, cartAmount: subTotal })
      }).then(r => r.json()).then(data => {
        if (data && data.valid) {
          setAppliedCoupon({
            code: data.code,
            discount: data.discount,
            description: data.description
          });
        } else {
          // Void coupon as subtotal does not pass threshold anymore
          setAppliedCoupon(null);
          setCouponSuccess(null);
          setCouponError(data.error || "Coupon threshold not met anymore.");
        }
      }).catch(() => {
        setAppliedCoupon(null);
      });
    } else if (subTotal === 0) {
      handleRemoveCoupon();
    }
  }, [subTotal]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!custName.trim() || !custPhone.trim() || !custAddress.trim()) {
      setCheckoutError("Please enter all customer details so that delivery riders can find you.");
      return;
    }

    if (custPhone.trim().length < 10) {
      setCheckoutError("Please provide a valid Indian 10-digit mobile number for driver updates.");
      return;
    }

    if (cart.length === 0) {
      setCheckoutError("Your cart is empty. Add items or use AI assistant first.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: custName,
        customerPhone: custPhone,
        deliveryCity: custCity,
        deliveryAddress: custAddress,
        appliedCoupon: appliedCoupon ? appliedCoupon.code : undefined,
        discountAmount: appliedCoupon ? appliedCoupon.discount : 0,
        items: cart.map(c => ({
          productId: c.product.id,
          quantity: c.quantity
        }))
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed placing request.");
      }

      onOrderPlaced(data);
      onClearCart();
      setIsCartOpen(false);
      handleRemoveCoupon();
      
      // Auto-navigate user to Tracking view!
      onNavigateToTracking(data.id);
      
    } catch (err: any) {
      setCheckoutError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Category Slider & Search Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -ml-16 -mb-16"></div>
        
        <div className="relative max-w-3xl">
          <span className="bg-teal-500/20 text-teal-300 text-xs px-3 py-1.5 rounded-full font-extrabold uppercase tracking-widest border border-teal-500/30">
            ⚡ 10 Minute delivery town-wide
          </span>
          <h1 className="text-3.5xl font-black mt-3 sm:mt-4 leading-none tracking-tight">
            City Market Essentials Sourced Fresh
          </h1>
          <p className="text-sm text-teal-100/80 mt-2 font-medium max-w-xl">
            Reliable grocery, dairy, and urgent medical tablets delivered straight to your home gate within 10 minutes.
          </p>
          
          {/* Quick Search bar */}
          <div className="mt-6 flex items-center relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by english or local name (doodh, aloo, dahi, soap)..."
              className="w-full bg-white text-slate-800 text-sm pl-11 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* City and Shop Selection Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-6 shadow-xxs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              🗺️ Small Town Region Select
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Pick your active town name. Only local verified shops inside this limit will dispatch in 10 minutes.
            </p>
          </div>

          {/* City Dropdown search filter */}
          <div className="w-full md:w-64">
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setCustCity(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {cities.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Shop selection horizontal swiper or panel */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            🏬 Available Registered Shopkeepers in {selectedCity}
          </span>
          
          {filteredShops.length === 0 ? (
            <p className="text-xxs text-amber-600 font-bold bg-amber-50 rounded-xl p-3 border border-amber-100">
              ⚠️ No shops have registered under {selectedCity} yet. Contact admin to add a dark store.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredShops.map((shop) => {
                const isSelected = selectedShopId === shop.id;
                return (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => setSelectedShopId(shop.id)}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] group ${
                      isSelected 
                        ? 'bg-slate-900 text-white border-slate-905 shadow-md ring-2 ring-emerald-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2.5 mb-1.5">
                        <span className="font-extrabold text-xs group-hover:text-emerald-500 transition-colors uppercase truncate">
                          🏪 {shop.name}
                        </span>
                        {isSelected && (
                          <span className="bg-emerald-500 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded uppercase shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      {shop.details && (
                        <p className={`text-[10px] line-clamp-2 leading-relaxed mb-3 font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {shop.details}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-slate-100/10 pt-2.5 text-[9px] font-mono space-y-0.5 flex flex-col mt-auto">
                      <span className={isSelected ? 'text-slate-455 text-slate-400' : 'text-slate-500'}>
                        📧 {shop.email}
                      </span>
                      <span className={`font-bold uppercase ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`}>
                        GSTIN: {shop.gstin}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Shop Info Summary Banner */}
      {selectedShopId && (
        (() => {
          const activeShop = shops.find(s => s.id === selectedShopId);
          if (!activeShop) return null;
          return (
            <div className="bg-emerald-50/50 border border-emerald-150 rounded-3xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-xxs">
              <div className="flex items-start gap-3">
                <span className="text-3xl bg-white border border-emerald-200 p-2 rounded-2xl shadow-xxs select-none">🏪</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase">
                      Viewing storefront of: <span className="text-emerald-700 font-extrabold">{activeShop.name}</span>
                    </h3>
                    <span className="bg-emerald-600 text-white font-bold text-[8px] px-2 py-0.5 rounded-full uppercase leading-none">
                      Active Seller
                    </span>
                  </div>
                  <p className="text-xs text-slate-550 mt-1">
                    {activeShop.details || "Trusted high-quality local commodity seller."}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xxs font-mono text-slate-500 mt-2">
                    <span>📧 Seller Support: <strong className="font-bold font-sans text-slate-700">{activeShop.email}</strong></span>
                    <span>Receipt GSTIN: <strong className="font-bold text-slate-705">{activeShop.gstin}</strong></span>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-emerald-150 px-4 py-2.5 rounded-2xl uppercase tracking-wider text-center font-black text-xxs text-emerald-805 shrink-0 flex flex-col justify-center min-w-32 shadow-xxs">
                <span className="text-base font-black text-emerald-700 leading-none">{filteredProducts.length}</span>
                <span className="text-[8px] text-slate-400 mt-0.5 block font-bold">Goods Offered</span>
              </div>
            </div>
          );
        })()
      )}

      {/* Floating Cart Indicator */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 cursor-pointer ring-4 ring-white"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-3.5 -right-3.5 bg-yellow-400 text-slate-900 border-2 border-white text-xxs font-black w-6.5 h-6.5 rounded-full flex items-center justify-center">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <span>Review Cart (₹{subTotal})</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      )}

      {/* Category filters */}
      <div className="mb-6 overflow-x-auto scrollbar-none pb-2">
        <div className="flex gap-2.5 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Display Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-6">
          <p className="text-3xl mb-2">🤷🏽‍♂️</p>
          <h3 className="text-base font-bold text-slate-800">No match found</h3>
          <p className="text-xs text-slate-500 mt-1">We couldn't find matches for "{searchQuery}" inside {selectedCategory !== 'all' ? selectedCategory : 'our stock'}. Try clearing filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((p) => {
            const qty = getProductQtyInCart(p.id);
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col hover:shadow-lg transition-all relative group"
              >
                {/* Visual Category tag */}
                <span className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md z-10">
                  {p.category}
                </span>

                {/* Interactive Details trigger */}
                <div 
                  onClick={() => setDetailedProduct(p)}
                  className="cursor-pointer flex-1 flex flex-col group/inner"
                  title="Click to view full detail & merchant info"
                >
                  {/* Main Product Symbol */}
                  <div className="h-28 w-full bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden mb-3 select-none group-hover:scale-105 group-hover/inner:opacity-90 transition-all border border-slate-100/50 relative">
                    {p.image && (p.image.startsWith('http://') || p.image.startsWith('https://')) ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-5xl">{p.image}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xs font-black text-slate-800 leading-snug group-hover/inner:text-emerald-600 transition-colors uppercase tracking-tight">{p.localName}</h3>
                    <p className="text-[9px] text-slate-400 font-bold tracking-tight mt-1 uppercase bg-slate-50 border border-slate-150 rounded px-1.5 py-0.5 inline-block">Pack: {p.unit}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-semibold">{p.description}</p>
                    <div className="text-[10px] text-emerald-600 font-extrabold mt-2.5 uppercase tracking-wide flex items-center gap-1">
                      🔎 View details &amp; seller
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-50">
                  <div>
                    <span className="text-slate-400 text-xxs font-semibold">Price:</span>
                    <p className="text-base font-black text-slate-900 leading-none">₹{p.price}</p>
                  </div>

                  {/* Stock handling and visual add button */}
                  {p.stock === 0 ? (
                    <span className="text-xxs bg-red-50 text-red-600 font-bold px-2 py-1.5 rounded-lg border border-red-100">
                      Sold Out
                    </span>
                  ) : qty > 0 ? (
                    <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-1.5 py-1">
                      <button
                        onClick={() => onUpdateCartItemAndQty(p.id, qty - 1)}
                        className="p-1 rounded-lg bg-white shadow-xs text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-emerald-950 w-4 text-center">{qty}</span>
                      <button
                        onClick={() => onUpdateCartItemAndQty(p.id, qty + 1)}
                        disabled={qty >= p.stock}
                        className="p-1 rounded-lg bg-white shadow-xs text-emerald-700 hover:bg-emerald-100 disabled:opacity-30 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onUpdateCartItemAndQty(p.id, 1)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm shadow-emerald-50 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  )}
                </div>

                {/* Stock Indicator alerts for admin reassurance */}
                {p.stock > 0 && p.stock <= 5 && (
                  <p className="text-xxs text-amber-600 font-semibold mt-1.5 text-center bg-amber-50 rounded px-1">
                    Only {p.stock} left in hub!
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Product Detail Popup Modal */}
      {detailedProduct && (
        <div id="product-detail-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200 animate-scale-up flex flex-col relative max-h-[90vh]">
            
            {/* Modal Close button */}
            <button
              onClick={() => setDetailedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 hover:text-slate-950 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Banner Theme */}
            <div className="bg-gradient-to-tr from-emerald-50 to-teal-100 p-8 flex justify-center items-center border-b border-slate-100 relative shrink-0">
              <span className="absolute top-4 left-4 text-xxs font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-md">
                {detailedProduct.category}
              </span>
              <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-md select-none border border-emerald-100 p-2 text-center">
                {detailedProduct.image && (detailedProduct.image.startsWith('http://') || detailedProduct.image.startsWith('https://')) ? (
                  <img
                    src={detailedProduct.image}
                    alt={detailedProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-6xl">{detailedProduct.image}</span>
                )}
              </div>
            </div>

            {/* Modal Body Info details */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 uppercase leading-snug tracking-tight">
                  {detailedProduct.localName}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-450 uppercase font-extrabold tracking-wider mt-0.5">
                  <span>Pack size: <strong className="text-slate-705">{detailedProduct.unit}</strong></span>
                  <span>·</span>
                  <span>Category: <strong className="text-slate-705">{detailedProduct.category}</strong></span>
                </div>
              </div>

              {detailedProduct.description ? (
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed font-semibold">
                  <span className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Item Description:</span>
                  {detailedProduct.description}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic font-semibold">No description has been filled by seller for this item.</p>
              )}

              {/* Supplying Shopkeeper credentials */}
              {(() => {
                const supplierShop = shops.find(s => s.id === detailedProduct.shopId);
                if (!supplierShop) return null;
                return (
                  <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-black uppercase text-emerald-805 tracking-widest block">
                      🌾 Seller / Merchant Information:
                    </span>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-xl">🏪</span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs uppercase leading-none mt-0.5">
                          {supplierShop.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-normal">
                          {supplierShop.details || "Registered local brand committed to sustainable, safe delivery in 10-minutes."}
                        </p>
                        <div className="flex flex-wrap gap-x-3 text-[9px] font-mono text-slate-505 mt-2">
                          <span>GSTIN: <strong>{supplierShop.gstin}</strong></span>
                          <span>·</span>
                          <span>Coordinator: <strong>{supplierShop.email}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Price level and Stocks */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2 shrink-0">
                <div>
                  <span className="text-xxs text-slate-450 font-extrabold uppercase tracking-wide block">Price Point:</span>
                  <span className="text-2xl font-black text-slate-900">₹{detailedProduct.price}</span>
                </div>

                <div className="flex items-center gap-3">
                  {detailedProduct.stock === 0 ? (
                    <span className="bg-red-600 text-white font-black text-xs px-4 py-2 rounded-xl">
                      Sold out (Out of stock)
                    </span>
                  ) : (() => {
                    const quantity = getProductQtyInCart(detailedProduct.id);
                    return quantity > 0 ? (
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-250 rounded-xl p-1 shadow-sm">
                        <button
                          onClick={() => onUpdateCartItemAndQty(detailedProduct.id, quantity - 1)}
                          className="w-8 h-8 rounded-lg bg-white shadow-xs text-emerald-800 hover:bg-emerald-150 flex items-center justify-center border-0 font-extrabold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-emerald-950 w-6 text-center">{quantity}</span>
                        <button
                          onClick={() => onUpdateCartItemAndQty(detailedProduct.id, quantity + 1)}
                          disabled={quantity >= detailedProduct.stock}
                          className="w-8 h-8 rounded-lg bg-white shadow-xs text-emerald-800 hover:bg-emerald-150 flex items-center justify-center border-0 font-extrabold cursor-pointer disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onUpdateCartItemAndQty(detailedProduct.id, 1)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-emerald-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        + Add to Basket
                      </button>
                    );
                  })()}
                </div>
              </div>

              {detailedProduct.stock > 0 && (
                <p className="text-[10px] text-slate-500 font-bold text-center bg-slate-50 p-1.5 rounded-lg border border-slate-205">
                  ⚡ Micro-fulfillment dark store has: <b>{detailedProduct.stock} packets</b> available.
                </p>
              )}

              {/* 💬 REVIEWS AND FEEDBACK SECTION */}
              <div className="border-t border-slate-100 pt-5 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <span>💬 Customer Feedback &amp; Reviews</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                      {detailedProduct.reviews?.length || 0}
                    </span>
                  </h4>

                  {/* Average Stars indicator */}
                  {detailedProduct.reviews && detailedProduct.reviews.length > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-amber-500 font-extrabold font-mono">
                        {(detailedProduct.reviews.reduce((acc, r) => acc + r.rating, 0) / detailedProduct.reviews.length).toFixed(1)}
                      </span>
                      <span className="text-amber-400 font-bold">★</span>
                    </div>
                  )}
                </div>

                {/* List of Reviews */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {!detailedProduct.reviews || detailedProduct.reviews.length === 0 ? (
                    <p className="text-xxs text-slate-400 italic font-medium py-1">
                      No customer reviews yet. Be the first to add your feedback!
                    </p>
                  ) : (
                    detailedProduct.reviews.map((rev) => (
                      <div key={rev.id} className="bg-slate-50/50 border border-slate-150 rounded-2xl p-3 space-y-1 animate-fade-in text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-805 uppercase tracking-wide">
                            👤 {rev.reviewerName}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        
                        {/* Rating stars display */}
                        <div className="text-[10px] text-amber-500 font-bold tracking-tight">
                          {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                        </div>
                        
                        <p className="text-slate-600/90 leading-relaxed font-semibold mt-0.5 italic">
                          "{rev.text}"
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* ADD FEEDBACK MODULE DIRECTIVES */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-650 block">
                      ✍️ Express Your Experience
                    </span>
                    {userRole !== 'customer' && (
                      <span className="text-[9px] bg-amber-100 text-amber-805 font-black uppercase px-2 py-0.5 rounded select-none shadow-3xs">
                        ⚠️ Customer Only
                      </span>
                    )}
                  </div>

                  {userRole === 'customer' ? (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!reviewName.trim() || !reviewText.trim()) {
                          setReviewError("Please fill your name and feedback content.");
                          return;
                        }
                        setReviewError(null);
                        setReviewSuccess(null);
                        setIsSubmittingReview(true);
                        try {
                          const res = await fetch(`/api/products/${detailedProduct.id}/reviews`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              reviewerName: reviewName,
                              rating: reviewRating,
                              text: reviewText
                            })
                          });
                          const updatedProduct = await res.json();
                          if (!res.ok) {
                            throw new Error(updatedProduct.error || "Failed to post review.");
                          }
                          setReviewSuccess("Thank you! Your verified feedback has been loaded instantly.");
                          setReviewText('');
                          
                          // Refresh active product presentation in modal
                          setDetailedProduct(updatedProduct);
                          
                          // Refresh core list
                          if (onRefreshProducts) {
                            onRefreshProducts();
                          }
                        } catch (err: any) {
                          setReviewError(err.message || "Error saving feedback.");
                        } finally {
                          setIsSubmittingReview(false);
                        }
                      }}
                      className="space-y-3"
                    >
                      {/* Name input (prefilled) */}
                      <div>
                        <label className="block text-[9px] font-black text-slate-505 uppercase tracking-wider mb-0.5">Reviewer Name</label>
                        <input
                          type="text"
                          required
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          placeholder="e.g. Ramesh Giri"
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                        />
                      </div>

                      {/* Stars count select */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-550 uppercase tracking-wider shrink-0">Product Rating:</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none text-[15px] cursor-pointer transition-transform hover:scale-115 border-0 bg-transparent p-0"
                            >
                              <span className={star <= reviewRating ? "text-amber-500 font-bold" : "text-slate-300"}>
                                ★
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <div>
                        <label className="block text-[9px] font-black text-slate-505 uppercase tracking-wider mb-0.5">Critique / Remarks</label>
                        <textarea
                          required
                          rows={2}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="e.g. Sabzi are fresh and well-packed. Fast rider delivery!"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 resize-none font-medium"
                        />
                      </div>

                      {reviewError && (
                        <p className="text-[10px] text-red-700 bg-red-50 border border-red-100 rounded-lg p-2 font-bold">
                          ⚠️ {reviewError}
                        </p>
                      )}

                      {reviewSuccess && (
                        <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2 font-bold">
                          🎉 {reviewSuccess}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 rounded-xl text-xxs font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                      >
                        {isSubmittingReview ? "Submitting Remarks..." : "Post Verified Feedback"}
                      </button>
                    </form>
                  ) : (
                    <div className="text-[10px] text-slate-500 leading-relaxed font-bold bg-slate-100 rounded-xl p-2.5 border border-slate-200/50">
                      🔒 <b>Access restricted:</b> Only logged-in customers are permitted to leave public ratings and feedback on items. If you are a shopper, please enter the customer tab to write reviews.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Slide-out cart/checkout Sidebar Drawer */}
      {isCartOpen && (
        <div id="cart-drawer-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl relative animate-slide-left">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-black text-slate-800">Your Basket</h2>
                <span className="bg-emerald-100 text-emerald-800 text-xxs font-extrabold px-2 py-0.5 rounded-full">
                  {cart.length} items
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product list scroll area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {cart.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-2">🧺</div>
                  <h4 className="text-sm font-bold text-slate-800">Your basket is totally empty</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">Add nutritious dairy, medication, or vegetables to unlock 10-minute home dispatching.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {item.product.image && (item.product.image.startsWith('http://') || item.product.image.startsWith('https://')) ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-200"
                            />
                          ) : (
                            <span className="text-3xl select-none shrink-0">{item.product.image}</span>
                          )}
                          <div>
                            <h4 className="text-xs font-black text-slate-800">{item.product.localName}</h4>
                            <p className="text-xxs text-slate-500 font-medium">Unit: {item.product.unit} · ₹{item.product.price} each</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-xxs">
                          <button
                            onClick={() => onUpdateCartItemAndQty(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-slate-900 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateCartItemAndQty(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bill details */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-xxs mb-1 text-slate-500">Bill Summary</h4>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Subtotal Item Cost</span>
                      <span>₹{subTotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Packing &amp; Carrier fee</span>
                      <span>₹{handlingCharges}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Hyperlocal Delivery fee</span>
                      <span>
                        {deliveryCharges === 0 ? (
                          <span className="text-emerald-600 font-bold uppercase tracking-wider">FREE over ₹150</span>
                        ) : (
                          `₹${deliveryCharges}`
                        )}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-700 font-extrabold bg-emerald-100/30 p-1.5 rounded-lg">
                        <span>🏷️ Voucher Discount ({appliedCoupon.code})</span>
                        <span>-₹{appliedCoupon.discount}</span>
                      </div>
                    )}
                    
                    {deliveryCharges > 0 && (
                      <p className="text-xxs text-teal-600 italic bg-teal-50 p-2 rounded">
                        💡 Tip: Add items worth ₹{150 - subTotal} more to unlock <strong>FREE DELIVERY</strong>!
                      </p>
                    )}

                    <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-2.5 text-slate-900 mt-1">
                      <span>Total Amount to Pay</span>
                      <span>₹{grandTotal}</span>
                    </div>
                  </div>

                  {/* COUPON VOUCHERS BOX */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1.5 text-xxs font-extrabold text-slate-500 uppercase tracking-widest">
                        <Tag className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        Apply Promo Voucher
                      </div>
                      {appliedCoupon && (
                        <span className="text-3xs bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded uppercase">
                          Active
                        </span>
                      )}
                    </div>

                    {!appliedCoupon ? (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. WELCOME10, FREEPEAS30"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-1 font-mono uppercase placeholder:normal-case placeholder:font-sans"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon}
                            className="px-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isApplyingCoupon ? '...' : 'Apply'}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-3xs text-red-600 font-semibold mt-1.5">
                            ⚠️ {couponError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-2.5 flex items-center justify-between text-xxs">
                        <div className="flex gap-2 items-center">
                          <Ticket className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-extrabold text-slate-800 block font-mono">{appliedCoupon.code}</span>
                            <span className="text-emerald-700 font-medium">{appliedCoupon.description} (saved ₹{appliedCoupon.discount})</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="p-1 text-slate-400 hover:text-slate-650 font-bold hover:bg-slate-200 rounded cursor-pointer transition-colors"
                          title="Remove discount"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {couponSuccess && !couponError && (
                      <p className="text-[10px] text-emerald-700 font-bold">
                        🎉 {couponSuccess}
                      </p>
                    )}
                  </div>

                  {/* Checkout Form */}
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest pl-1 mb-3 flex items-center gap-1.5 text-slate-500">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      Home Address details
                    </h3>

                    <form onSubmit={handleCreateOrder} className="space-y-3">
                      <div>
                        <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          placeholder="e.g. Anand Kumar"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">WhatsApp Mobile</label>
                          <input
                            type="tel"
                            required
                            value={custPhone}
                            onChange={(e) => setCustPhone(e.target.value)}
                            placeholder="10-digit number"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Nearest Hub</label>
                          <select
                            value={custCity}
                            onChange={(e) => setCustCity(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {towns.map((town, i) => (
                              <option key={i} value={town}>{town}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Home Landmark Address</label>
                        <textarea
                          required
                          value={custAddress}
                          onChange={(e) => setCustAddress(e.target.value)}
                          placeholder="e.g. House No. 45-B, Gali No. 3 near Shiv Mandir, opposite Government High School"
                          rows={2.5}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
                      </div>

                      {checkoutError && (
                        <div className="p-3 bg-red-50 text-red-700 text-xxs rounded-xl flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{checkoutError}</span>
                        </div>
                      )}

                      <div className="bg-slate-50 p-2.5 rounded-xl text-xxs text-slate-500 text-center font-medium">
                        💵 Pay on Delivery (Cash / UPI at your doorstep)
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || cart.length === 0}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          "Booking Dispatch Bike..."
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4" />
                            Place Order - Pay ₹{grandTotal} on Delivery
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
