import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Landmark, Mail, Store, AlertCircle, ShoppingBag, Plus, Trash2, ArrowRight, RefreshCw } from 'lucide-react';
import { Product, Shop, City } from '../types';

interface ShopkeeperConsoleProps {
  products: Product[];
  onRefreshProducts: () => void;
}

export default function ShopkeeperConsole({
  products,
  onRefreshProducts
}: ShopkeeperConsoleProps) {
  // Authentication states
  const [loggedInShop, setLoggedInShop] = useState<Shop | null>(null);

  // Login Form fields
  const [shopName, setShopName] = useState('');
  const [cityName, setCityName] = useState('');
  const [gstin, setGstin] = useState('');
  const [email, setEmail] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  
  // Loaded collections for registration help
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [shopsList, setShopsList] = useState<Shop[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  // Product addition state inside logged in Shop
  const [newName, setNewName] = useState('');
  const [newLocalName, setNewLocalName] = useState('');
  const [newCategory, setNewCategory] = useState('vegetables');
  const [newPrice, setNewPrice] = useState('45');
  const [newUnit, setNewUnit] = useState('1 kg');
  const [newStock, setNewStock] = useState('100');
  const [newImage, setNewImage] = useState('🥦');
  const [newDescription, setNewDescription] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const fetchLists = async () => {
    setLoadingInitial(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/cities'),
        fetch('/api/shops')
      ]);
      const cData = await cRes.json();
      const sData = await sRes.json();
      setCitiesList(cData);
      setShopsList(sData);
      if (cData.length > 0 && !cityName) {
        setCityName(cData[0].name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchLists();
    // Check if session stored
    const cached = localStorage.getItem('quicktown_shopkeeper_session');
    if (cached) {
      try {
        setLoggedInShop(JSON.parse(cached));
      } catch (err) {}
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgError(null);

    const cleanName = shopName.trim();
    const cleanGstin = gstin.trim().toUpperCase();
    const cleanEmail = email.trim();
    const cleanAddress = shopAddress.trim();

    if (!cleanName || !cityName || !cleanGstin || !cleanEmail || !cleanAddress) {
      setMsgError("All fields including Name, City, GSTIN, Email, and Shop Address are strictly required.");
      return;
    }

    if (cleanGstin.length !== 15) {
      setMsgError("GSTIN must consist of exactly 15 alphanumeric characters.");
      return;
    }

    // Lookup in remote shops database
    let matchedShop = shopsList.find(s => s.gstin.toUpperCase() === cleanGstin);

    if (matchedShop) {
      // Login matching
      setLoggedInShop(matchedShop);
      localStorage.setItem('quicktown_shopkeeper_session', JSON.stringify(matchedShop));
    } else {
      // Dynamic dynamic onboarding on the fly! Creates a registered shopkeeper storefront in DB!
      try {
        const response = await fetch('/api/shops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            cityName: cityName,
            gstin: cleanGstin,
            email: cleanEmail,
            address: cleanAddress,
            details: `Premium locally sourced commodity store registered by ${cleanName} at ${cleanAddress}.`
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Onboarding registered shop failed");
        }

        setLoggedInShop(data);
        localStorage.setItem('quicktown_shopkeeper_session', JSON.stringify(data));
        await fetchLists(); // refresh shops catalog
      } catch (err: any) {
        setMsgError(err.message || "Failed dynamic onboarding");
      }
    }
  };

  const handleLogout = () => {
    setLoggedInShop(null);
    localStorage.removeItem('quicktown_shopkeeper_session');
  };

  // Filter products that explicitly belong to this shop
  const shopProducts = products.filter(p => loggedInShop && p.shopId === loggedInShop.id);

  // Mark items which are low stock (below 5 units)
  const lowStockItems = shopProducts.filter(p => p.stock < 5);

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    if (!newName.trim() || !newPrice || !newUnit) {
      setAddError("Title, pricing, and sales unit packaging are required fields.");
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          localName: newLocalName.trim() || `${newName.trim()} (${newName.trim()})`,
          category: newCategory,
          price: Number(newPrice),
          unit: newUnit,
          stock: Number(newStock),
          image: newImage,
          description: newDescription.trim(),
          shopId: loggedInShop?.id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed registering item");
      }

      setAddSuccess(`Registered '${data.localName}' in dark store!`);
      // Reset forms
      setNewName('');
      setNewLocalName('');
      setNewDescription('');

      onRefreshProducts();
    } catch (err: any) {
      setAddError(err.message || "Error submitting item");
    }
  };

  const handleUpdateStockInline = async (productId: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: nextStock })
      });
      if (res.ok) {
        onRefreshProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to erase '${name}' from your registered list?`)) return;
    try {
      const r = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (r.ok) {
        onRefreshProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Render Login page if not authenticated
  if (!loggedInShop) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-5">
          
          <div className="text-center space-y-1.5Packed">
            <span className="text-4xl bg-gradient-to-tr from-emerald-50 to-teal-50 p-3 rounded-2xl inline-block shadow-xxs">🏪</span>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight mt-3">Shopkeeper Franchise Login</h2>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
              Secure onboard &amp; inventory control cabinet
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            <div>
              <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-1">
                🏪 Shopkeeper / Brand Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sikar Fresh Grains"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-1">
                📍 Town Base City Region
              </label>
              <select
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
              >
                {citiesList.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-1">
                🧾 Alphanumeric GSTIN ID (15 Characters Required)
              </label>
              <input
                type="text"
                required
                maxLength={15}
                placeholder="21AAAAA0000A1Z1"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-1">
                📧 Store Contact Email Coordinator
              </label>
              <input
                type="email"
                required
                placeholder="e.g. contact@sikarfresh.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-1">
                📍 Exact Address of the Shop
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shop 14, Main Bazaar Road, near Clock Tower"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            {msgError && (
              <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-150 rounded-xl p-3 font-bold">
                ⚠️ {msgError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white border-0 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Verify &amp; Enter Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-[10px] text-emerald-800 leading-relaxed font-medium">
            💡 <b>Helpful System Note:</b> Entering any valid brand credentials is syntactically matched. If you aren't listed in the database, the system will instantly onboard your store and register your business inside {cityName}!
          </div>

        </div>
      </div>
    );
  }

  // Render Dashboard if authenticated
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      
      {/* Header operations info */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl border border-slate-850">
        <div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950 px-2.5 py-1 rounded border border-emerald-900">
            Storekeeper Active Chamber
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight mt-2 flex items-center gap-2">
            🏪 {loggedInShop.name}
          </h2>
          <p className="text-xxs text-slate-400 mt-1 uppercase font-extrabold tracking-widest leading-relaxed">
            City Limit: {loggedInShop.cityName} · GSTIN: {loggedInShop.gstin} · {loggedInShop.email}
            {loggedInShop.address && <span className="block mt-1 text-emerald-400">📍 Address: {loggedInShop.address}</span>}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-rose-650 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2 border-0 rounded-xl cursor-pointer transition-colors"
        >
          Logout Session
        </button>
      </div>

      {/* Low Stock Warning Panel if any stock levels are < 5 */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-black text-amber-805 uppercase tracking-wider">
              ⚠️ Warning: Low Inventory Stocks alert!
            </h3>
            <p className="text-xxs text-amber-700 font-medium">
              You have {lowStockItems.length} products with stock below 5 units. replenishment required immediately to prevent shipping cancellations.
            </p>
            <div className="flex gap-2.5 mt-2 flex-wrap pb-1">
              {lowStockItems.map(p => (
                <span key={p.id} className="bg-amber-100 border border-amber-250 text-amber-850 font-extrabold text-[8px] px-2 py-0.5 rounded uppercase">
                  {p.localName} ({p.stock} units left)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Actions Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create/Add Product Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xxs h-fit space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Introduce Store Goods</h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Register a customized essential item that displays dynamically to nearby users.
            </p>
          </div>

          <form onSubmit={handleAddProductSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xxs font-extrabold text-slate-550 uppercase mb-1">Standard Item Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Fresh Red Apple"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-850"
              />
            </div>

            <div>
              <label className="block text-xxs font-extrabold text-slate-550 uppercase mb-1">Hindi / Local Title</label>
              <input
                type="text"
                placeholder="e.g. Kashmiri Seb (Apple)"
                value={newLocalName}
                onChange={(e) => setNewLocalName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-850"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xxs font-extrabold text-slate-550 uppercase mb-1">Category Group</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-850 font-bold"
                >
                  <option value="vegetables"> Sabzi (Vegetables)</option>
                  <option value="fruits"> Phal (Fruits)</option>
                  <option value="dairy"> Doodh (Dairy)</option>
                  <option value="kirana"> Kirana Food</option>
                  <option value="snacks"> Ready Snacks</option>
                  <option value="household"> Laundry &amp; Soap</option>
                  <option value="medicine"> Care Pill</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-550 uppercase mb-1">Pack Unit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 kg / 500 ml"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-850"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xxs font-extrabold text-slate-550 uppercase mb-1">Price (₹ INR)</label>
                <input
                  type="number"
                  required
                  placeholder="40"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-850 font-bold"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-550 uppercase mb-1">Initial Stock</label>
                <input
                  type="number"
                  required
                  placeholder="100"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-850"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1">
              <label className="col-span-3 text-xxs font-extrabold text-slate-550 uppercase">Visual Illustration Glyph</label>
              {['🥦', '🍎', '🥛', '🌾', '🍿', '🧼', '💊', '🥚', '📦'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewImage(emoji)}
                  className={`p-2 rounded text-base transition-colors border ${
                    newImage === emoji ? 'bg-emerald-50 border-emerald-500 scale-105 font-bold' : 'bg-slate-50 border-slate-200 hover:bg-slate-105'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xxs font-extrabold text-slate-550 uppercase mb-1">Short Description</label>
              <input
                type="text"
                placeholder="Brief origin, organic certifications..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            {addError && (
              <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-150 p-2.5 rounded-xl font-bold">
                ⚠️ {addError}
              </p>
            )}

            {addSuccess && (
              <p className="text-[10px] text-emerald-750 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-bold">
                ✅ {addSuccess}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Add Item to Marketplace
            </button>
          </form>
        </div>

        {/* List of current owned products */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xxs lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-805 uppercase tracking-wider">
              My Registered Dark Storefront Inventory ({shopProducts.length})
            </h3>
            <button 
              type="button"
              onClick={onRefreshProducts}
              className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-200 border-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {shopProducts.length === 0 ? (
            <div className="p-20 text-center text-slate-400 font-medium">
              You haven't listed any unique commodities. Fill out the marketplace template on the left to start listing items in {loggedInShop.cityName}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-105 bg-slate-100 text-slate-500 font-extrabold uppercase tracking-wide border-b border-slate-200 text-xxs">
                    <th className="p-4">Commodity</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock on Hand</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {shopProducts.map(p => {
                    const isLow = p.stock < 5;
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-rose-50/30' : ''}`}>
                        <td className="p-4 flex items-center gap-2.5">
                          <span className="text-xl">{p.image}</span>
                          <div>
                            <span className="font-extrabold text-slate-850 block">{p.localName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{p.unit} · {p.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-650 font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-4 font-extrabold text-slate-800">
                          ₹{p.price}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateStockInline(p.id, p.stock, -1)}
                              className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 font-bold flex items-center justify-center border-0 cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <span className={`font-mono text-center min-w-8 font-black ${isLow ? 'text-rose-600 text-xs bg-rose-105 p-1 rounded font-black border border-rose-300' : 'text-slate-800 font-bold'}`}>
                              {p.stock}
                              {isLow && (
                                <span className="block text-[7px] font-black uppercase text-rose-700 tracking-wider">
                                  Low Stock
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateStockInline(p.id, p.stock, 1)}
                              className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 font-bold flex items-center justify-center border-0 cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.localName)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg transition-colors cursor-pointer"
                            title="Erase product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
