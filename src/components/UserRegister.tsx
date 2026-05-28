import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Sparkles, Navigation, Globe } from 'lucide-react';
import { City } from '../types';

interface UserRegisterProps {
  onRegisterComplete: (details: { name: string; phone: string; email: string; city: string; address: string }) => void;
}

export default function UserRegister({ onRegisterComplete }: UserRegisterProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [address, setAddress] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch approved cities pool from backend!
  useEffect(() => {
    fetch('/api/cities')
      .then(res => res.json())
      .then(data => {
        setCities(data);
        if (data.length > 0) {
          setSelectedCity(data[0].name);
        }
        setLoadingCities(false);
      })
      .catch(err => {
        console.error("Error fetching cities", err);
        setLoadingCities(false);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length !== 10) {
      setErrorMsg("Please provide a valid 10-digit cellular phone number.");
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }
    if (!selectedCity) {
      setErrorMsg("Please select your city node.");
      return;
    }
    if (!address.trim() || address.trim().length < 10) {
      setErrorMsg("Please write a detailed delivery address (minimum 10 characters).");
      return;
    }

    // Persist into localStorage
    localStorage.setItem('qt_user_registered', 'true');
    localStorage.setItem('qt_user_name', name.trim());
    localStorage.setItem('qt_user_phone', phone.trim());
    localStorage.setItem('qt_user_email', email.trim());
    localStorage.setItem('qt_user_town', selectedCity);
    localStorage.setItem('qt_user_address', address.trim());
    
    // Auto populate coordinates to allow shop matching!
    localStorage.setItem('address_name', name.trim());
    localStorage.setItem('address_phone', phone.trim());
    localStorage.setItem('address_city', selectedCity);
    localStorage.setItem('address_detail', address.trim());

    onRegisterComplete({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: selectedCity,
      address: address.trim()
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Absolute background visual flares */}
      <div className="absolute top-[-250px] right-[-250px] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-[32px] shadow-xl p-8 space-y-6 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-550 bg-emerald-600/10 border border-emerald-500/20 rounded-full font-black text-[10px] text-emerald-700 tracking-wider uppercase animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Welcome to QuickTown
          </div>
          
          <h1 id="register-header" className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Create Customer Account
          </h1>
          <p className="text-xs text-slate-500 leading-normal max-w-sm mx-auto">
            QuickTown guarantees lightning-fast 10-minute grocery delivery from micro-dark stores straight to small towns.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-3xs font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Anand Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-3xs font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone number
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10 digit cellphone No"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-3xs font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email ID
              </label>
              <input
                type="email"
                required
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-3xs font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Select City Name
            </label>
            {loadingCities ? (
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500">
                Fetching regional dark store networks...
              </div>
            ) : (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-3xs font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Complete Delivery Address
            </label>
            <textarea
              required
              rows={3}
              placeholder="House Number, Street name, Land structures, Landmark area..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 border border-red-150 rounded-xl p-3 text-xxs font-bold">
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-xs font-black uppercase tracking-widest rounded-xl transition-all hover:scale-101 cursor-pointer shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-4 h-4" />
            Validate &amp; Open Website
          </button>

        </form>

        <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Fast micro-fulfillment dark stores
          </span>
          <span className="font-bold text-slate-500">Secure Client Sandbox</span>
        </div>

      </div>
    </div>
  );
}
