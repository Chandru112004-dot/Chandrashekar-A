import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Award, CheckCircle, Save, Star } from 'lucide-react';

interface UserAccountProps {
  onShowAlert: (type: 'success' | 'info', message: string) => void;
}

export default function UserAccount({ onShowAlert }: UserAccountProps) {
  // Local persistence for user profile details
  const [name, setName] = useState('Anand Kumar');
  const [phone, setPhone] = useState('9876543210');
  const [address, setAddress] = useState('House No. 45-B, Gali No. 3 near Shiv Mandir, opposite Government High School');
  const [town, setTown] = useState('Sikar City Hub');

  useEffect(() => {
    const savedName = localStorage.getItem('qt_user_name');
    const savedPhone = localStorage.getItem('qt_user_phone');
    const savedAddress = localStorage.getItem('qt_user_address');
    const savedTown = localStorage.getItem('qt_user_town');

    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
    if (savedAddress) setAddress(savedAddress);
    if (savedTown) setTown(savedTown);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('qt_user_name', name);
    localStorage.setItem('qt_user_phone', phone);
    localStorage.setItem('qt_user_address', address);
    localStorage.setItem('qt_user_town', town);
    
    // Also store in normal localStorage keys that might be used by CustomerShop for checkout autopopulate!
    localStorage.setItem('address_name', name);
    localStorage.setItem('address_phone', phone);
    localStorage.setItem('address_city', town);
    localStorage.setItem('address_detail', address);

    onShowAlert('success', 'Profile details saved inside device local secure storage!');
  };

  const towns = [
    "Madhubani Towns", 
    "Sikar City Hub", 
    "Motihari Central", 
    "Sasaram Junction", 
    "Hajipur Bazaar", 
    "Moradabad Sector 2", 
    "Alwar Cantonment"
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          My Customer Account
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your delivery coordinates and view your green delivery streak milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Stats Profile card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 relative overflow-hidden shadow-md">
            <div className="absolute right-[-10px] bottom-[-15px] opacity-10 font-black text-6xl select-none">
              QT
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-500 flex items-center justify-center text-xl">
                🧔
              </div>
              <div>
                <h3 className="font-extrabold text-sm">{name || 'Guest User'}</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Gold Loyal Tier
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3.5 space-y-2.5 text-xxs font-medium text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Preferred Town:</span>
                <span className="font-bold text-white">{town}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Carbon Savings:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-0.5">🌿 2.4 Kilograms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery Method:</span>
                <span className="font-bold text-emerald-400">🚲 Bicycle Only</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Active Badges
            </h4>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                <span className="text-lg">🚲</span>
                <div>
                  <h5 className="text-[10px] font-bold text-slate-800">Eco-Heal Rider</h5>
                  <p className="text-[9px] text-slate-500 leading-tight">Every delivery was successfully transported via electric cycle vehicles.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                <span className="text-lg">🤝</span>
                <div>
                  <h5 className="text-[10px] font-bold text-slate-800">Town Booster</h5>
                  <p className="text-[9px] text-slate-500 leading-tight">Supporting hyper-local town markets and farm fresh dark store partners.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Address details Form */}
        <div className="md:col-span-2">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xxs">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Default Coordinates</h3>
              <p className="text-[10px] text-slate-500">Inputs provided below are pre-populated on checkout so you don't have to write descriptions every time.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-extrabold text-slate-450 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Anand Kumar"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-extrabold text-slate-450 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                    placeholder="10 digit cellular number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-450 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Town Dark Store Node
                </label>
                <select
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                >
                  {towns.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-450 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Complete Delivery Address
                </label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-medium"
                  placeholder="Street details, house pin codes, land structures..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-50"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
