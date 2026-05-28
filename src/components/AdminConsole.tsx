import React, { useState, useEffect } from 'react';
import { Layers, Plus, TrendingUp, AlertCircle, ShoppingBag, ShieldCheck, DollarSign, RefreshCw, Trash2, Edit3, PlusCircle, Search, Filter, Tag, Ticket, Percent } from 'lucide-react';
import { Product, Order, OrderStatus } from '../types';

interface AdminConsoleProps {
  products: Product[];
  orders: Order[];
  onRefreshData: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export default function AdminConsole({
  products,
  orders,
  onRefreshData,
  onUpdateOrderStatus
}: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'coupons' | 'riders' | 'cities'>('orders');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Coupons listing and creation state
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponVal, setCouponVal] = useState('15');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponMinCart, setCouponMinCart] = useState('100');
  const [couponDesc, setCouponDesc] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  // Delivery personnel (riders) states
  const [riders, setRiders] = useState<any[]>([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderStatus, setRiderStatus] = useState<'Idle' | 'Delivering' | 'Offline'>('Idle');

  // Cities and registered shops states
  const [adminCities, setAdminCities] = useState<any[]>([]);
  const [adminShops, setAdminShops] = useState<any[]>([]);
  const [loadingCitiesAndShops, setLoadingCitiesAndShops] = useState(false);
  const [newCityName, setNewCityName] = useState('');

  // States to add a registered shop inside city
  const [newShopName, setNewShopName] = useState('');
  const [newShopCity, setNewShopCity] = useState('');
  const [newShopGstin, setNewShopGstin] = useState('');
  const [newShopEmail, setNewShopEmail] = useState('');
  const [newShopDetails, setNewShopDetails] = useState('');

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const r = await fetch('/api/coupons');
      const data = await r.json();
      setCoupons(data);
    } catch (e) {
      console.error("Failed fetching coupons", e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const fetchRiders = async () => {
    setLoadingRiders(true);
    try {
      const r = await fetch('/api/riders');
      const d = await r.json();
      setRiders(d);
    } catch (e) {
      console.error("Failed fetching riders", e);
    } finally {
      setLoadingRiders(false);
    }
  };

  const fetchCitiesAndShops = async () => {
    setLoadingCitiesAndShops(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/cities'),
        fetch('/api/shops')
      ]);
      const cData = await cRes.json();
      const sData = await sRes.json();
      setAdminCities(cData);
      setAdminShops(sData);
      if (cData.length > 0 && !newShopCity) {
        setNewShopCity(cData[0].name);
      }
    } catch (e) {
      console.error("Failed fetching cities/shops", e);
    } finally {
      setLoadingCitiesAndShops(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCoupons();
    } else if (activeTab === 'riders') {
      fetchRiders();
    } else if (activeTab === 'cities') {
      fetchCitiesAndShops();
    }
  }, [activeTab]);

  const handleCreateRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderName.trim() || !riderPhone.trim()) {
      alert("Name and phone number are required!");
      return;
    }
    try {
      const res = await fetch('/api/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: riderName.trim(),
          phone: riderPhone.trim(),
          status: riderStatus
        })
      });
      if (res.ok) {
        setRiderName('');
        setRiderPhone('');
        fetchRiders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRiderStatus = async (id: string, nextStatus: 'Idle' | 'Delivering' | 'Offline') => {
    try {
      await fetch(`/api/riders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchRiders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRider = async (id: string) => {
    if (!window.confirm("Delete this rider?")) return;
    try {
      await fetch(`/api/riders/${id}`, { method: 'DELETE' });
      fetchRiders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    try {
      const res = await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCityName.trim() })
      });
      if (res.ok) {
        setNewCityName('');
        fetchCitiesAndShops();
      } else {
        const d = await res.json();
        alert(d.error || "Failed representing city.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !newShopCity || !newShopGstin.trim() || !newShopEmail.trim()) {
      alert("All parameters are required!");
      return;
    }
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newShopName.trim(),
          cityName: newShopCity,
          gstin: newShopGstin.trim().toUpperCase(),
          email: newShopEmail.trim(),
          details: newShopDetails.trim() || undefined
        })
      });
      if (res.ok) {
        setNewShopName('');
        setNewShopGstin('');
        setNewShopEmail('');
        setNewShopDetails('');
        fetchCitiesAndShops();
      } else {
        const d = await res.json();
        alert(d.error || "Failed registering storefront.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    setIsCreatingCoupon(true);

    if (!couponCode.trim()) {
      setCouponError("Voucher alphanumeric code is mandatory.");
      setIsCreatingCoupon(false);
      return;
    }

    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          discountType: couponType,
          value: Number(couponVal),
          minCartAmount: Number(couponMinCart),
          description: couponDesc.trim() || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create coupon voucher.");
      }

      setCouponSuccess(`Voucher '${data.code}' active in database!`);
      setCouponCode('');
      setCouponDesc('');
      fetchCoupons();
    } catch (err: any) {
      setCouponError(err.message || "Failed creating promo code");
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete Coupon ${code}?`)) return;
    try {
      const resp = await fetch(`/api/coupons/${code}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        fetchCoupons();
      }
    } catch (e) {
      console.error("Failed to delete coupon", e);
    }
  };

  // Filter state controllers
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for custom Product adding
  const [name, setName] = useState('');
  const [localName, setLocalName] = useState('');
  const [category, setCategory] = useState<string>('vegetables');
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState('40');
  const [unit, setUnit] = useState('1 kg');
  const [stock, setStock] = useState('100');
  const [image, setImage] = useState('🥦');
  const [description, setDescription] = useState('');

  // Settle basic arithmetic metrics
  const totalSales = orders
    .filter(o => o.status === 'Delivered')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const pendingOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;

  const getCategoryBadgeInfo = (cat: string) => {
    const normalized = cat.toLowerCase().trim();
    switch (normalized) {
      case 'vegetables': return { label: 'Sabzi (Vegetables)', emoji: '🥦', color: 'bg-emerald-50 text-emerald-805 border-emerald-150' };
      case 'fruits': return { label: 'Phal (Fruits)', emoji: '🍎', color: 'bg-rose-50 text-rose-805 border-rose-150' };
      case 'dairy': return { label: 'Doodh & Dairy', emoji: '🥛', color: 'bg-blue-50 text-blue-805 border-blue-150' };
      case 'kirana': return { label: 'Kirana / Flour', emoji: '🌾', color: 'bg-amber-50 text-amber-805 border-amber-150' };
      case 'snacks': return { label: 'Ready Snacks', emoji: '🍿', color: 'bg-indigo-50 text-indigo-805 border-indigo-150' };
      case 'household': return { label: 'Laundry & Soap', emoji: '🧼', color: 'bg-violet-50 text-violet-805 border-violet-150' };
      case 'medicine': return { label: 'Medicine Table', emoji: '💊', color: 'bg-teal-50 text-teal-805 border-teal-150' };
      case 'pens': return { label: 'Pens & Stationery', emoji: '✍️', color: 'bg-sky-50 text-sky-855 border-sky-150' };
      case 'shoes': return { label: 'Shoes & Footwear', emoji: '👟', color: 'bg-orange-50 text-orange-855 border-orange-150' };
      case 'books': return { label: 'Books & Reading', emoji: '📚', color: 'bg-yellow-50 text-yellow-855 border-yellow-150' };
      default: return { 
        label: cat.charAt(0).toUpperCase() + cat.slice(1), 
        emoji: '📦', 
        color: 'bg-slate-50 text-slate-805 border-slate-150' 
      };
    }
  };

  // Filter products based on selected category pill and search query
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return matchesCategory;
    
    return matchesCategory && (
      p.name.toLowerCase().includes(searchLower) ||
      p.localName.toLowerCase().includes(searchLower) ||
      p.id.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower)
    );
  });

  const handleAddNewProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !price || !unit) {
      setFormError("Product Title, Price and pack unit are required.");
      return;
    }

    try {
      const finalCategory = category === 'custom' ? (customCategory.trim().toLowerCase() || 'other') : category;
      const payload = {
        name,
        localName: localName.trim() || `${name} (${name})`,
        category: finalCategory,
        price: Number(price),
        unit,
        stock: Number(stock || 50),
        image,
        description
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed connecting to store system.");
      }

      onRefreshData();
      setIsAddingProduct(false);

      // Reset fields
      setName('');
      setLocalName('');
      setCategory('vegetables');
      setCustomCategory('');
      setPrice('40');
      setUnit('1 kg');
      setStock('100');
      setImage('🥦');
      setDescription('');
    } catch (err: any) {
      setFormError(err.message || "An issue occurred.");
    }
  };

  const handleUpdateStockInline = async (productId: string, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      onRefreshData();
    } catch (err) {
      console.error("Inline stock update failed", err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product from QuickTown core catalog?")) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error("Delete product failed", err);
    }
  };

  // Automated load simulator to trigger rapid testing mock orders
  const triggerSimulatedOrder = async () => {
    try {
      // Pick random items from current products
      const randomProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, Math.floor(1 + Math.random() * 3));
      if (!randomProducts.length) return;

      const items = randomProducts.map(p => ({
        productId: p.id,
        quantity: Math.floor(1 + Math.random() * 3)
      }));

      // Random Indian name generators
      const names = ["Sanjay Gupta", "Pooja Trivedi", "Rajesh Dixit", "Megha Agrawal", "Arun Maurya", "Simran Kaur"];
      const addresses = ["A-102 Parsvnath Colony, Near Hanuman Chowk", "Gali No 2 behind Saini Dairy, Ward 12", "Flat 40B, Railway Station Officers Colony"];

      const payload = {
        customerName: names[Math.floor(Math.random() * names.length)],
        customerPhone: `+91 ${Math.floor(7000000000 + Math.random() * 2000000000)}`,
        deliveryCity: "Sikar City Hub",
        deliveryAddress: addresses[Math.floor(Math.random() * addresses.length)],
        items
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error("Simulated order trigger failed", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xxs">
          <span className="text-slate-400 text-xxs font-extrabold uppercase tracking-widest block">Total Sales (₹)</span>
          <p className="text-2xl font-black text-slate-800 mt-1">₹{totalSales}</p>
          <span className="text-emerald-600 text-xxs font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> Checked Out orders
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xxs">
          <span className="text-slate-400 text-xxs font-extrabold uppercase tracking-widest block">Active Dispatches</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{pendingOrders}</p>
          <span className="text-amber-600 text-xxs font-bold mt-1 block">🛵 In-transit / packaging</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xxs">
          <span className="text-slate-400 text-xxs font-extrabold uppercase tracking-widest block">Warehouse Goods</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{products.length}</p>
          <span className="text-slate-500 text-xxs block mt-1">Ready for custom shipping</span>
        </div>

        {/* Dynamic simulator trigger inside card */}
        <div className="bg-gradient-to-tr from-slate-900 to-slate-850 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-xxs font-extrabold text-slate-300 uppercase tracking-widest">Traffic Simulator</h4>
            <p className="text-xxs text-slate-400 mt-0.5">Inject rapid mock purchases instantly.</p>
          </div>
          <button
            onClick={triggerSimulatedOrder}
            className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-xxs font-extrabold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            🤖 Simulate Order
          </button>
        </div>
      </div>

      {/* Navigation Toggles */}
      <div className="flex border-b border-slate-200 mb-6 items-center justify-between overflow-x-auto scrollbar-none">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-xs font-black tracking-wider uppercase border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'orders' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Incoming Dispatch Queue ({orders.length})
          </button>
          
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 text-xs font-black tracking-wider uppercase border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Inventory Warehouse Hub ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`pb-3 text-xs font-black tracking-wider uppercase border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'coupons' ? 'border-emerald-600 text-emerald-805' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Discount Coupons ({coupons.length})
          </button>

          <button
            onClick={() => setActiveTab('riders')}
            className={`pb-3 text-xs font-black tracking-wider uppercase border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'riders' ? 'border-emerald-600 text-emerald-805' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Delivery personnel 🛵 ({riders.length})
          </button>

          <button
            onClick={() => setActiveTab('cities')}
            className={`pb-3 text-xs font-black tracking-wider uppercase border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'cities' ? 'border-emerald-600 text-emerald-805' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Cities &amp; Shops Directory 🗺️
          </button>
        </div>

        {activeTab === 'inventory' && (
          <button
            onClick={() => setIsAddingProduct(!isAddingProduct)}
            className="mb-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Good
          </button>
        )}
      </div>

      {/* Custom Add Product overlay form */}
      {activeTab === 'inventory' && isAddingProduct && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-6 max-w-2xl animate-fade-in">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Introduce New Product/Emergency Essential</h3>
          
          <form onSubmit={handleAddNewProductSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Standard Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lemon"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
              />
            </div>

            <div>
              <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Hindi/Local Title</label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="e.g. Nimbu (Lemon)"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
              />
            </div>

            <div>
              <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Category Group</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
              >
                <option value="vegetables">🥦 Sabzi (Vegetables)</option>
                <option value="fruits">🍎 Phal (Fruits)</option>
                <option value="dairy">🥛 Doodh &amp; Dairy</option>
                <option value="kirana">🌾 Kirana / Flour</option>
                <option value="snacks">🍿 Ready Snacks</option>
                <option value="household">🧼 Laundry &amp; Soap</option>
                <option value="medicine">💊 Medicine tablets</option>
                <option value="pens">✍️ Pens &amp; Stationery</option>
                <option value="shoes">👟 Shoes &amp; Footwear</option>
                <option value="books">📚 Books &amp; Reading</option>
                <option value="custom">✨ Type Custom Category...</option>
              </select>
            </div>

            {category === 'custom' && (
              <div>
                <label className="block text-xxs font-extrabold text-slate-505 uppercase mb-1">Custom Category Name</label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. books, pens, apparel"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850 font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Price (₹ INR)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
              />
            </div>

            <div>
              <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Unit Weight/Pack</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 250 g or 1 Pack"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
              />
            </div>

            <div>
              <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Initial Hub Stock</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
              />
            </div>

            <div>
              <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Emoji Icon Code</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="e.g. 🍋"
                className="w-full bg-white text-center border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">Warehouse Notes/Disclaimers</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sourced directly from local small-town farms..."
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
              />
            </div>

            {formError && (
              <div className="col-span-2 md:col-span-3 bg-red-50 text-red-700 p-2 text-xxs rounded flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="col-span-2 md:col-span-3 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsAddingProduct(false)}
                className="px-4 py-2 border border-slate-200 text-slate-500 text-xxs uppercase font-extrabold rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 border border-slate-900 text-white text-xxs uppercase font-extrabold rounded-xl hover:bg-slate-800"
              >
                Assemble Good
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RENDER TAB 1: Incoming Dispatch Queue */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-md mx-auto">
              <p className="text-4xl mb-2">💤</p>
              <h3 className="text-base font-bold text-slate-700">Dispatch shelf empty</h3>
              <p className="text-xs text-slate-500 mt-1">No orders have been generated yet. Go to Shop or click 'Simulate Order' to begin testing dispatch pipelines.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((or) => (
                <div
                  key={or.id}
                  className={`bg-white rounded-2xl p-5 border shadow-xxs transition-colors ${
                    or.status === 'Delivered' ? 'border-slate-100 opacity-75' : 'border-emerald-100 ring-2 ring-emerald-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <span className="text-slate-400 text-xxs font-mono">{new Date(or.createdAt).toLocaleTimeString()}</span>
                      <h4 className="text-sm font-black text-slate-800">{or.id}</h4>
                    </div>

                    {/* Badge displaying current state */}
                    <span className={`text-xxs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      or.status === 'Placed' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      or.status === 'Packing' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                      or.status === 'On the Way' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                      or.status === 'Cancelled' ? 'bg-rose-100 text-rose-850' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {or.status}
                    </span>
                  </div>

                  {/* Customer Landmark Details */}
                  <div className="space-y-2 mb-4 text-xs font-medium">
                    <p className="text-slate-700">
                      👤 <span className="font-bold text-slate-800">{or.customerName}</span> ({or.customerPhone})
                    </p>
                    <p className="text-slate-650 flex items-start gap-1">
                      <span className="pt-0.5 text-slate-400">📍</span> 
                      <span>{or.deliveryCity} · {or.deliveryAddress}</span>
                    </p>
                  </div>

                  {/* Items list detail */}
                  <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1">
                    <p className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Ordered Goods</p>
                    {or.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-700 font-bold">
                        <span>• {it.name} x {it.quantity}</span>
                        <span>₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-black border-t border-slate-200 pt-1.5 mt-1 text-slate-900">
                      <span>Total Invoice</span>
                      <span>₹{or.totalAmount}</span>
                    </div>
                  </div>

                  {/* Operational workflow dispatches */}
                  {or.status !== 'Delivered' && or.status !== 'Cancelled' ? (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                      
                      {or.status === 'Placed' && (
                        <button
                          onClick={() => onUpdateOrderStatus(or.id, 'Packing')}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xxs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          🎒 Start Packing
                        </button>
                      )}

                      {or.status === 'Packing' && (
                        <button
                          onClick={() => onUpdateOrderStatus(or.id, 'On the Way')}
                          className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xxs uppercase tracking-wider rounded-xl transition-all cursor-pointer animate-pulse"
                        >
                          🏍️ Assign &amp; Dispatch
                        </button>
                      )}

                      {or.status === 'On the Way' && (
                        <button
                          onClick={() => onUpdateOrderStatus(or.id, 'Delivered')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xxs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          🎯 Delivered Successfully
                        </button>
                      )}

                      <button
                        onClick={() => onUpdateOrderStatus(or.id, 'Cancelled')}
                        className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-105 border border-rose-100 font-extrabold text-xxs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    </div>
                  ) : (
                    <div className="text-slate-450 text-xxs font-bold text-center italic mt-2 py-1 bg-slate-50 rounded">
                      {or.status === 'Cancelled' ? "🚫 This request was cancelled." : "💼 Consignment complete & settled."}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER TAB 2: Warehouse Goods Database Inventory */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs animate-fade-in">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Core catalog active stock</h3>
            <span className="text-xxs bg-emerald-50 text-emerald-800 font-black px-2.5 py-1 rounded border border-emerald-100">
              Total items: {products.length}
            </span>
          </div>

          {/* CATEGORY & KEYWORD FILTER TOOLBAR */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input Filter */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search catalog by name, ID or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
              <span className="text-slate-400 text-xxs font-extrabold uppercase tracking-wide mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Category:
              </span>
              
              {/* "All" button badge */}
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xxs font-extrabold rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm font-black'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🏷️ All ({products.length})
              </button>

              {/* Dynamic computed categories sorted */}
              {Array.from(new Set(products.map(p => p.category)))
                .filter(Boolean)
                .map((cat) => {
                  const badge = getCategoryBadgeInfo(cat);
                  const count = products.filter(p => p.category === cat).length;
                  const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xxs font-extrabold rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? `${badge.color} ring-2 ring-emerald-500/30 scale-[1.02] shadow-sm font-black`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50/80'
                      }`}
                    >
                      <span className="text-xs select-none">{badge.emoji}</span>
                      <span>{badge.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'opacity-80' : 'text-slate-405'} font-black`}>({count})</span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-105 text-xxs font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Item details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">UnitPrice</th>
                  <th className="p-4 text-center">Remaining Stock</th>
                  <th className="p-4 text-right">Alter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <div className="max-w-xs mx-auto py-4">
                        <p className="text-3xl mb-1.5">🔍</p>
                        <h4 className="text-xs font-bold text-slate-700">No matching goods found</h4>
                        <p className="text-xxs text-slate-400 mt-1">Try tweaking your search term or selecting another category filter above.</p>
                        {(searchTerm || selectedCategory !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedCategory('all');
                            }}
                            className="mt-3.5 px-3 py-1.5 bg-slate-100 font-extrabold text-xxs text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Reset filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* ID, title, description */}
                      <td 
                        className="p-4 cursor-pointer"
                        onClick={() => {
                          const inputEl = document.getElementById(`stock-input-${p.id}`) as HTMLInputElement;
                          if (inputEl) {
                            inputEl.focus();
                            inputEl.select();
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {p.image && (p.image.startsWith('http://') || p.image.startsWith('https://')) ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-200"
                            />
                          ) : (
                            <span className="text-3xl select-none shrink-0">{p.image}</span>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-slate-800 leading-tight hover:text-emerald-700 transition-colors">{p.localName}</h4>
                              {p.stock < 5 && (
                                <span className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-200 animate-pulse uppercase tracking-wider shrink-0 select-none">
                                  ⚠️ Low Stock
                                </span>
                              )}
                            </div>
                            <p className="text-xxs text-slate-400 font-medium tracking-tight mt-0.5">ID: {p.id} · Pack Unit: {p.unit} <span className="text-emerald-600 font-bold ml-1 hover:underline">(Click row to edit Qty)</span></p>
                          </div>
                        </div>
                      </td>
   
                      {/* Category */}
                      <td className="p-4">
                        <span className="text-xxs font-bold uppercase py-0.5 px-2 bg-slate-100 text-slate-600 rounded">
                          {p.category}
                        </span>
                      </td>
   
                      {/* Unit price */}
                      <td className="p-4 font-black text-slate-800 text-sm">
                        ₹{p.price}
                      </td>
   
                      {/* Stock level inline buttons */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 w-max mx-auto bg-slate-150 border border-slate-200 rounded-xl p-1.5 shadow-3xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateStockInline(p.id, p.stock, -1)}
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-800 flex items-center justify-center font-extrabold cursor-pointer hover:bg-slate-200"
                            title="Reduce stock by 1"
                          >
                            -
                          </button>
                          <input
                            id={`stock-input-${p.id}`}
                            type="number"
                            min="0"
                            value={p.stock}
                            onChange={async (e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val >= 0) {
                                try {
                                  await fetch(`/api/products/${p.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ stock: val })
                                  });
                                  onRefreshData();
                                } catch (err) {
                                  console.error("Inline stock update failed", err);
                                }
                              }
                            }}
                            className={`w-14 text-center text-xs font-black bg-white border border-slate-250 rounded-lg py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${p.stock <= 5 ? 'text-red-650' : 'text-slate-800'}`}
                            title="Direct Quantity Editor"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateStockInline(p.id, p.stock, 1)}
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-800 flex items-center justify-center font-extrabold cursor-pointer hover:bg-slate-200"
                            title="Restock by 1"
                          >
                            +
                          </button>
                        </div>
                      </td>
  
                      {/* Delete Good */}
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                          title="Erase item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
  
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TAB 3: COUPONS MANAGEMENT SECTION */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Create Coupon Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xxs h-fit">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
              <PlusCircle className="w-5 h-5 text-emerald-600 font-bold" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Create Promo Coupon</h3>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Coupon Alphanumeric Code</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Benefit Type</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="percentage">Percentage OFF (%)</option>
                    <option value="fixed">Fixed Cash OFF (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Benefit Value</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="15"
                    value={couponVal}
                    onChange={(e) => setCouponVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Min Order Value Required (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="100"
                  value={couponMinCart}
                  onChange={(e) => setCouponMinCart(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Save flat ₹50 on all basket items!"
                  value={couponDesc}
                  onChange={(e) => setCouponDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {couponError && (
                <div className="bg-red-50 text-red-650 p-3 rounded-xl border border-red-100 text-[10px] flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{couponError}</span>
                </div>
              )}

              {couponSuccess && (
                <div className="bg-emerald-50 text-emerald-850 p-3 rounded-xl border border-emerald-100 text-[10px] flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{couponSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isCreatingCoupon}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-50 disabled:opacity-55"
              >
                <Ticket className="w-4 h-4" />
                {isCreatingCoupon ? 'Creating Voucher...' : 'Register Coupon Code'}
              </button>
            </form>
          </div>

          {/* List Coupons Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xxs lg:col-span-2 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Tag className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Active Store coupon codes</h3>
              </div>
              <button 
                type="button"
                onClick={fetchCoupons}
                className="p-1 text-slate-400 hover:text-slate-650 rounded hover:bg-slate-200 cursor-pointer"
                title="Refresh Coupon Dictionary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCoupons ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingCoupons && coupons.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                <p className="text-xxs font-bold uppercase tracking-widest text-slate-400">Loading coupons...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="p-16 text-center">
                <span className="text-4xl">🎫</span>
                <h4 className="text-sm font-bold text-slate-800 mt-2">Zero coupons defined yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Create custom coupons to let customers checkout with percentage discounts or fixed Indian Rupee savings.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/50 text-slate-500 font-extrabold uppercase tracking-wide border-b border-slate-200 text-xxs select-none">
                      <th className="p-4">Voucher Code</th>
                      <th className="p-4">Discount Applied</th>
                      <th className="p-4">Threshold Requirement</th>
                      <th className="p-4">Overview Description</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {coupons.map((c) => (
                      <tr key={c.code} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <span className="bg-slate-100 p-1.5 rounded-lg border border-slate-200 font-mono text-xs font-black text-slate-850">
                            {c.code}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 font-bold text-emerald-700 text-xs">
                            <Percent className="w-3.5 h-3.5" />
                            {c.discountType === 'percentage' ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`}
                          </span>
                        </td>
                        <td className="p-4 text-slate-800 font-bold">
                          {c.minCartAmount > 0 ? `Min order ₹${c.minCartAmount}` : 'No Minimum spend'}
                        </td>
                        <td className="p-4 text-slate-500 max-w-xs truncate">
                          {c.description}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                            title="Erase coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ------------------------- */}
      {/* DELIVERY PERSONNEL (RIDERS) TAB */}
      {/* ------------------------- */}
      {activeTab === 'riders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Create Rider Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xxs h-fit">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Register Active Delivery representative</h3>
            <form onSubmit={handleCreateRider} className="space-y-4">
              <div>
                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Rider Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Singh"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850 font-medium"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Cell Contact phone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543201"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">Initial Duty Status</label>
                <select
                  value={riderStatus}
                  onChange={(e: any) => setRiderStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850 font-medium"
                >
                  <option value="Idle">🟢 Idle (Waiting for dispatch)</option>
                  <option value="Delivering">🔵 Delivering (On the Road)</option>
                  <option value="Offline">🔴 Offline (Off duty)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                🏍️ Add Delivery Agent
              </button>
            </form>
          </div>

          {/* Riders List Board */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xxs lg:col-span-2 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Active Delivery representatives list</h3>
              <button 
                type="button" 
                onClick={fetchRiders}
                className="p-1 px-2 text-xxs bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-bold cursor-pointer flex items-center gap-1 border-0"
              >
                <RefreshCw className={`w-3 h-3 ${loadingRiders ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {loadingRiders && riders.length === 0 ? (
              <div className="p-20 text-center">
                <p className="text-xs text-slate-400">Loading active couriers...</p>
              </div>
            ) : riders.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-medium">
                No active delivery riders inside Database. Complete registration on the left.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/50 text-slate-500 font-extrabold uppercase tracking-wide border-b border-slate-200 text-xxs">
                      <th className="p-4">Delivery Partner</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4">Duty State</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {riders.map(r => (
                      <tr key={r.id}>
                        <td className="p-4 font-bold text-slate-800 flex items-center gap-1.5">
                          🏍️ {r.name}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-600">
                          {r.phone}
                        </td>
                        <td className="p-4">
                          <select
                            value={r.status}
                            onChange={(e) => handleUpdateRiderStatus(r.id, e.target.value as any)}
                            className={`p-1 px-2 text-xxs rounded-lg font-bold cursor-pointer border ${
                              r.status === 'Idle' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              r.status === 'Delivering' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-slate-100 text-slate-500 border-slate-300'
                            }`}
                          >
                            <option value="Idle">🟢 Idle</option>
                            <option value="Delivering">🔵 Delivering</option>
                            <option value="Offline">🔴 Offline</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button" 
                            onClick={() => handleDeleteRider(r.id)}
                            className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Erase
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ------------------------- */}
      {/* CITIES & REGISTERED SHOPS TAB */}
      {/* ------------------------- */}
      {activeTab === 'cities' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Create City Form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xxs">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">📍 Register Approved Delivery City</h3>
              <form onSubmit={handleAddCity} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Enter New City Name (e.g. Aligarh Junction)"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850 font-medium"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl border-0 cursor-pointer transition-colors"
                >
                  Create City
                </button>
              </form>
            </div>

            {/* Register Shopkeepers Form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xxs">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">🏬 Register verified Shopkeeper</h3>
              <form onSubmit={handleAddShop} className="space-y-3">
                <div className="grid grid-cols-2 gap-3.5">
                  <input
                    type="text"
                    required
                    placeholder="Shop Name (e.g. Sikar Dairy)"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
                  />
                  <select
                    value={newShopCity}
                    onChange={(e) => setNewShopCity(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-855 font-bold"
                  >
                    <option value="">-- Choose City --</option>
                    {adminCities.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <input
                    type="text"
                    required
                    placeholder="15-char GSTIN Number"
                    maxLength={15}
                    value={newShopGstin}
                    onChange={(e) => setNewShopGstin(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850 font-mono"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Contact Email ID"
                    value={newShopEmail}
                    onChange={(e) => setNewShopEmail(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Overview Details (e.g. Fresh organic grains and household essentials...)"
                  value={newShopDetails}
                  onChange={(e) => setNewShopDetails(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-850"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Register Shopkeeper Storefront
                </button>
              </form>
            </div>

          </div>

          {/* Directory grid section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">🗺️ Registered cities &amp; Shops Hub Directory</h3>
            
            {loadingCitiesAndShops ? (
              <div className="p-12 text-center text-slate-400 text-xs">Loading directory...</div>
            ) : adminCities.length === 0 ? (
              <p className="text-xxs text-slate-400 font-bold">No registered cities available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {adminCities.map((city) => {
                  const matchingShops = adminShops.filter(s => s.cityName === city.name);
                  return (
                    <div key={city.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                      
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📍</span>
                          <span className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">{city.name}</span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-805 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-emerald-200">
                          {matchingShops.length} Registered Shops
                        </span>
                      </div>

                      {matchingShops.length === 0 ? (
                        <p className="text-xxs text-slate-400 font-medium italic">
                          No shops have registered under {city.name} yet. Use the shopkeeper registration form above to initialize one.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {matchingShops.map((shop) => (
                            <div key={shop.id} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-xs uppercase mb-1 flex items-center gap-1">
                                  🏪 {shop.name}
                                </h4>
                                {shop.details && (
                                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                    {shop.details}
                                  </p>
                                )}
                              </div>
                              <div className="border-t border-slate-250 pt-2.5 space-y-0.5 text-[9px] font-mono text-slate-500">
                                <p>📧 Email: <span className="font-bold text-slate-700">{shop.email}</span></p>
                                <p>🧾 GSTIN: <span className="font-black text-emerald-600 uppercase">{shop.gstin}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
