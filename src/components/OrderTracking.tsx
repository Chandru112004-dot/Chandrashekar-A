import React, { useState, useEffect, useRef } from 'react';
import { Truck, CheckCircle, PackageOpen, Play, MapPin, Phone, ShieldAlert, Navigation, RefreshCw, Layers, Printer, FileText, Check, ArrowDownToLine, Sparkles } from 'lucide-react';
import { Order } from '../types';

interface OrderTrackingProps {
  orderId: string | null;
  onNavigateToShop: () => void;
  ordersList: Order[];
}

export default function OrderTracking({ orderId, onNavigateToShop, ordersList }: OrderTrackingProps) {
  const [activeId, setActiveId] = useState<string | null>(orderId);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [isReceiptCollapsed, setIsReceiptCollapsed] = useState(false);
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-select latest order ID if none is supplied but orders exist
  useEffect(() => {
    if (!activeId && ordersList && ordersList.length > 0) {
      setActiveId(ordersList[0].id);
    }
  }, [ordersList, activeId]);

  // Fetch live order details and coordinates from backend
  const fetchTracking = async () => {
    if (!activeId) return;
    try {
      const res = await fetch(`/api/orders/${activeId}/tracking`);
      if (!res.ok) {
        throw new Error("Order records are preparing.");
      }
      const data = await res.json();
      setTrackingData(data);
      setErrorText(null);
    } catch (err: any) {
      setErrorText("Waiting for dispatch center database loading...");
    }
  };

  useEffect(() => {
    fetchTracking();
    
    // Standard hyper-active polling simulating high-speed Blinkit operations
    pollTimerRef.current = setInterval(fetchTracking, 4500);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [activeId]);

  // Canvas drawing logic representing local town sector grid
  useEffect(() => {
    if (!trackingData || !mapCanvasRef.current) return;
    const canvas = mapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and reset canvas sizes
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Grid Roads representing small-town layout
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    // Main Bypass road
    ctx.beginPath();
    ctx.moveTo(40, h / 2 - 20);
    ctx.lineTo(w - 40, h / 2 - 20);
    ctx.stroke();

    // Crossing 1
    ctx.beginPath();
    ctx.moveTo(w * 0.25, 30);
    ctx.lineTo(w * 0.25, h - 30);
    ctx.stroke();

    // Crossing 2
    ctx.beginPath();
    ctx.moveTo(w * 0.75, 30);
    ctx.lineTo(w * 0.75, h - 30);
    ctx.stroke();

    // Diagonals linking sectors
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.lineTo(w - 40, h - 40);
    ctx.stroke();

    // 2. Draw Landmarks label and icons
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px Inter, system-ui';
    ctx.fillText("Market Chowk", w * 0.25 + 6, h / 2 - 30);
    ctx.fillText("Civil Crossing", w * 0.75 - 70, h / 2 - 5);

    // Hub coordinates (Dark Store) located at Left
    const hubX = 60;
    const hubY = h / 2 - 20;

    // Customer coordinates located at Right
    const custX = w - 80;
    const custY = h / 2 - 20;

    // 3. Draw Route linking Hub to Home in Green dashes
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(hubX, hubY);
    ctx.lineTo(w * 0.25, h / 2 - 20);
    ctx.lineTo(w * 0.75, h / 2 - 20);
    ctx.lineTo(custX, custY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 4. Draw Warehouse (Hub marker)
    ctx.fillStyle = '#065f46'; // Teal-800
    ctx.beginPath();
    ctx.arc(hubX, hubY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.fillText("🏪", hubX - 6, hubY + 4);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px Inter';
    ctx.fillText("DARK STORE", hubX - 25, hubY - 20);

    // 5. Draw Customer Location (Home marker)
    ctx.fillStyle = '#1e3a8a'; // Blue-900
    ctx.beginPath();
    ctx.arc(custX, custY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText("🏠", custX - 6, custY + 4);

    ctx.fillStyle = '#0f172a';
    ctx.fillText("YOUR GATE", custX - 25, custY - 20);

    // 6. Draw Rider motorcycle position on track based on progress percentage
    const riderProgress = trackingData.progress / 100;
    const rx = hubX + (custX - hubX) * riderProgress;
    const ry = hubY; // keeping it simple along horizontal high road for standard visual stability

    if (trackingData.status !== 'Delivered' && trackingData.status !== 'Cancelled' && trackingData.progress > 0) {
      // Draw concentric motion waves
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(rx, ry, 12 + Math.sin(Date.now() / 150) * 4, 0, Math.PI * 2);
      ctx.stroke();

      // Dispatch Rider Node circle
      ctx.fillStyle = '#10b981'; // Emerald
      ctx.beginPath();
      ctx.arc(rx, ry, 10, 0, Math.PI * 2);
      ctx.fill();

      // Bike icon emoji
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText("🏍️", rx - 6, ry + 4.5);

      // Label rider above helmet
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 9px Inter';
      ctx.fillText(trackingData.riderName || "Rider", rx - 20, ry + 22);
    }

  }, [trackingData]);

  // Manually fire polling API refresh
  const triggerManualRefresh = () => {
    setLoading(true);
    fetchTracking().finally(() => setLoading(false));
  };

  // Simulate high-speed local checkout thermal print spooler
  const handlePrintReceipt = () => {
    if (isPrinting) return;
    setIsPrinting(true);
    setPrintProgress(0);
    setPrintSuccess(false);

    const interval = setInterval(() => {
      setPrintProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsPrinting(false);
            setPrintSuccess(true);
            setTimeout(() => setPrintSuccess(false), 5000);
          }, 800);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Search Order bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Track Local Orders</h3>
          <p className="text-xxs text-slate-500 font-medium">Select an order from your history below to watch live dispatch progress.</p>
        </div>

        <div className="flex gap-2">
          {ordersList.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No orders found yet</span>
          ) : (
            <select
              value={activeId || ''}
              onChange={(e) => setActiveId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold p-2 rounded-xl text-slate-700"
            >
              {ordersList.map(item => (
                <option key={item.id} value={item.id}>
                  {item.id} (₹{item.totalAmount} · {item.status})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={triggerManualRefresh}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 font-bold text-xs"
            title="Refresh current state coordinates"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!activeId ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center my-6">
          <p className="text-4xl mb-3">📦</p>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">No Active Deliveries</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">You have not booked any live 10-minute dispatch bikes on this browser tab yet.</p>
          <button
            onClick={onNavigateToShop}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider hover:opacity-90 cursor-pointer"
          >
            Open Fresh Market Catalog
          </button>
        </div>
      ) : trackingData ? (
        <div className="space-y-6 animate-fade-in">

          {/* Quick status progress header */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-xxs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Live Dispatch Status
                </span>
                <h2 className="text-2xl font-black mt-2 text-slate-800">
                  {trackingData.status === 'Placed' && "🎉 Order Booked Successfully"}
                  {trackingData.status === 'Packing' && "🎒 Packing your papers bags"}
                  {trackingData.status === 'On the Way' && "🏍️ Rider dispatch speeding out!"}
                  {trackingData.status === 'Delivered' && "✅ Arrived at your Gate!"}
                  {trackingData.status === 'Cancelled' && "❌ Order Cancelled"}
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                  {trackingData.description}
                </p>
              </div>

              {/* Huge ETA Timer pill */}
              <div className="bg-gradient-to-tr from-emerald-900 to-teal-900 text-white px-5 py-4 rounded-2xl shadow-sm text-center shrink-0 min-w-36">
                <span className="text-xxs font-bold text-teal-300 tracking-wider uppercase block">Estimated Delivery</span>
                <span className="text-3xl font-black leading-none mt-0.5 inline-block">
                  {trackingData.status === 'Delivered' ? "0" : trackingData.etaMinutes || "8"}
                </span>
                <span className="text-xs font-bold block text-emerald-200">Minutes left</span>
              </div>
            </div>

            {/* Simulated Progress bar */}
            <div className="mt-8">
              <div className="w-full bg-slate-100 h-2.5 rounded-full relative overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${trackingData.progress}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3.5 text-center text-xxs font-black text-slate-400">
                <div className={`transition-colors ${trackingData.progress >= 10 ? 'text-emerald-600 font-extrabold' : ''}`}>
                  PLACED
                </div>
                <div className={`transition-colors ${trackingData.progress >= 40 ? 'text-emerald-600 font-extrabold' : ''}`}>
                  PACKING
                </div>
                <div className={`transition-colors ${trackingData.progress >= 70 ? 'text-emerald-600 font-extrabold' : ''}`}>
                  ON MOTORCYCLE
                </div>
                <div className={`transition-colors ${trackingData.progress >= 100 ? 'text-emerald-600 font-extrabold' : ''}`}>
                  DELIVERED
                </div>
              </div>
            </div>
          </div>

          {/* Graphical Live Radar Tracking Map */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-4 shadow-inner">
            <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm relative">
              
              {/* Floating Speed Telemetry indicators */}
              <div className="absolute top-4 left-4 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl text-xxs font-mono flex items-center gap-1.5 backdrop-blur-xs select-none">
                <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>SPEED: {trackingData.status === 'On the Way' ? '42 km/h' : '0 km/h'}</span>
              </div>

              <div className="absolute top-4 right-4 bg-teal-500 text-white px-3 py-1.5 rounded-xl text-xxs font-extrabold flex items-center gap-1.5 select-none uppercase tracking-wide">
                <span>Rider GPS Active</span>
              </div>

              <canvas
                ref={mapCanvasRef}
                width={800}
                height={260}
                className="w-full h-auto bg-slate-50 border border-slate-100 rounded-xl"
              />
            </div>
          </div>

          {/* Rider contact details bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            
            {/* Rider profile */}
            <div className="flex items-center gap-4 border-b md:border-b-0 pb-4 md:pb-0 md:border-r border-slate-100 pr-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl border border-slate-200 shadow-xxs">
                🧑🏽‍🚀
              </div>
              <div>
                <span className="text-xxs font-extrabold text-teal-600 uppercase tracking-widest block">Your Fast Carrier partner</span>
                <h4 className="text-sm font-black text-slate-800 mt-0.5">{trackingData.riderName || "Rider assigned"}</h4>
                <p className="text-xxs text-amber-600 font-bold mt-0.5">🚀 Delivery Speed rating: 4.9⭐</p>
              </div>
            </div>

            {/* Quick action triggers */}
            <div className="flex sm:items-center justify-between gap-4">
              <div>
                <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest block">Contact Carrier</span>
                <p className="text-xs font-black text-slate-800 mt-0.5">{trackingData.riderPhone || "+91 Phone assigned"}</p>
              </div>

              <a
                href={`tel:${trackingData.riderPhone}`}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-extrabold text-xs rounded-xl flex items-center gap-2 border border-slate-200 transition-colors uppercase tracking-wider"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                Dail Phone
              </a>
            </div>

          </div>

          {/* Payment breakdown reminder check standard for small towns */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200/50 p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Cash on Delivery (POD) Alert!</h4>
              <p className="text-xs text-amber-700 font-medium leading-relaxed mt-0.5">
                Our parcel carrier will accept either physical cold cash or cash-transfers via your GooglePay/PhonePe UPI scanner at the gates. No need to transact online inside this app. Keeps it simple and safe.
              </p>
            </div>
          </div>

          {/* DYNAMIC PAYMENT RECEIPT SLIP */}
          {activeId && (
            (() => {
              const activeOrder = ordersList.find(o => o.id === activeId);
              if (!activeOrder) return null;

              const itemsSubtotal = activeOrder.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0;
              const ecoBagCharge = 5;
              const deliveryFee = 15;
              const discountPromo = 20; // free delivery promotion for launch
              const roundedTotal = itemsSubtotal;

              return (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        Official Payment Receipt
                      </h3>
                      <p className="text-xxs text-slate-400 font-medium">Verified local town business delivery receipt standard</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrintReceipt}
                        disabled={isPrinting}
                        className="p-1 px-3 text-xxs font-extrabold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        {isPrinting ? "Spooling..." : "Print Slip"}
                      </button>
                    </div>
                  </div>

                  {/* Printing indicator overlay */}
                  {isPrinting && (
                    <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 mb-4 text-center animate-pulse">
                      <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-700">
                        <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                        Connecting to Bluetooth Thermal Printer... {printProgress}%
                      </div>
                      <div className="w-48 bg-slate-200 h-1 rounded-full mx-auto mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-150" style={{ width: `${printProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  {printSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-4 text-center flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 animate-bounce">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Slip printed successfully! Check your local device's thermal spooler feed.
                    </div>
                  )}

                  {/* THE THERMAL SLIP CONTAINER */}
                  <div className="max-w-md mx-auto bg-[#faf9f4] border border-slate-200/50 rounded-2xl shadow-inner p-5 font-mono text-zinc-800 text-xs relative overflow-hidden">
                    
                    {/* Retro Zig Zag Jagged styling elements */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-200 to-slate-200" style={{ backgroundImage: `linear-gradient(-45deg, transparent 4px, #e2e8f0 4.5px, #faf9f4 5px), linear-gradient(45deg, transparent 4px, #e2e8f0 4.5px, #faf9f4 5px)`, backgroundSize: "12px 6px", backgroundRepeat: "repeat-x" }}></div>
                    
                    {/* Receipt watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
                      <div className="border-[8px] border-emerald-950 p-4 rounded-full text-5xl font-black rotate-12">
                        PAID
                      </div>
                    </div>

                    <div className="text-center pt-3 pb-4">
                      <span className="text-sm font-black tracking-widest text-slate-900 block uppercase">★ QUICKTOWN EXPRESS ★</span>
                      <span className="text-xxs text-zinc-500 font-medium block">10-MIN EXPRESS SECTOR HUB #04</span>
                      <span className="text-xxs text-zinc-500 font-medium block">SMALL TOWN DISPATCH CORP PVT. LTD.</span>
                    </div>

                    <div className="border-t border-dashed border-zinc-300 py-3 space-y-1 text-zinc-600 text-[11px]">
                      <div className="flex justify-between">
                        <span>BILL MEMO ID:</span>
                        <span className="font-extrabold text-zinc-800">{activeOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TIMESTAMP:</span>
                        <span>{new Date(activeOrder.createdAt || Date.now()).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DELIVERY TO:</span>
                        <span className="font-extrabold text-zinc-800">{activeOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CONTACT PHONE:</span>
                        <span>{activeOrder.customerPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CITY SECTOR:</span>
                        <span className="uppercase">{activeOrder.deliveryCity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DESPATCH GATE:</span>
                        <span className="truncate max-w-[200px] text-zinc-800 font-bold">{activeOrder.deliveryAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EXECUTIVE CARRIER:</span>
                        <span className="text-teal-700 font-bold">{trackingData?.riderName || "Express Driver"}</span>
                      </div>
                    </div>

                    {/* Barcode representation */}
                    <div className="flex justify-center gap-[2.5px] h-6 my-4 overflow-hidden opacity-75">
                      {[1, 3, 2, 4, 1, 2, 4, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 1, 3, 4, 2, 1, 3].map((w, idx) => (
                        <div key={idx} className="bg-zinc-800" style={{ width: `${w}px` }}></div>
                      ))}
                    </div>

                    <span className="text-center block text-[10px] text-zinc-400 mb-2 font-bold tracking-widest">TRANSACTION ITEMS AUDIT</span>

                    {/* Table row items */}
                    <table className="w-full text-left text-[11px] border-t border-b border-dashed border-zinc-300 py-2 my-2 border-collapse">
                      <thead>
                        <tr className="text-zinc-500 font-black">
                          <th className="py-1">ITEM DESCRIPTION</th>
                          <th className="py-1 text-center">QTY</th>
                          <th className="py-1 text-right">RATE</th>
                          <th className="py-1 text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dotted divide-zinc-200">
                        {activeOrder.items?.map((item: any, idx: number) => (
                          <tr key={idx} className="text-zinc-700">
                            <td className="py-1.5 font-bold">{item.name} <span className="text-[10px] text-zinc-400 font-normal">({item.unit})</span></td>
                            <td className="py-1.5 text-center">{item.quantity}</td>
                            <td className="py-1.5 text-right">₹{item.price}</td>
                            <td className="py-1.5 text-right font-black text-zinc-800">₹{item.price * item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Payment breakdown block */}
                    <div className="space-y-1.5 text-zinc-600 text-[11px] py-1">
                      <div className="flex justify-between">
                        <span>ITEMS SUB-TOTAL:</span>
                        <span>₹{itemsSubtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ECO-FRIENDLY PACKAGING:</span>
                        <span>₹{ecoBagCharge}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>10-MIN EXPRESS FREIGHT:</span>
                        <span>₹{deliveryFee}</span>
                      </div>
                      <div className="flex justify-between text-teal-700 font-bold">
                        <span>SMALL TOWN TEAM WELCOME OFFER:</span>
                        <span>-₹{discountPromo}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400 font-semibold">
                        <span>CENTRAL CGST/SGST (FREE DEED):</span>
                        <span>₹0.00</span>
                      </div>

                      <div className="border-t border-dashed border-zinc-400 pt-2.5 mt-2 flex justify-between text-xs text-zinc-900 font-black">
                        <span>CASH TOTAL PAYABLE:</span>
                        <span className="text-sm text-emerald-700">₹{roundedTotal}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                        <span>BILL CONVERSION VALUE:</span>
                        <span>ROUNDED OFF</span>
                      </div>
                    </div>

                    {/* Stamp of validation and UPI Quick Code */}
                    <div className="border-t border-dashed border-zinc-300 mt-4 pt-4 flex flex-col items-center">
                      <div className="flex items-center gap-2.5 bg-zinc-100 p-2.5 rounded-xl border border-zinc-200 w-full justify-center">
                        {/* Vector representation of UPI Scanner square */}
                        <div className="w-12 h-12 bg-white p-1 rounded-md border border-zinc-300 shrink-0 relative flex flex-col justify-between items-center select-none">
                          <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-80">
                            {[1,0,1,1,1,1,0,1,0,1,1,0,1,1,0,1].map((p, i) => (
                              <div key={i} className={`rounded-xs ${p === 1 ? 'bg-zinc-800' : 'bg-transparent'}`} style={{ width: "8px", height: "8px" }}></div>
                            ))}
                          </div>
                          {/* Inner scanner reticle */}
                          <div className="absolute inset-1 border border-emerald-500/40 pointer-events-none"></div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-800 uppercase tracking-tight">QR Scanner for Instant UPI Pay</p>
                          <p className="text-xxs text-zinc-500 max-w-[200px] leading-relaxed">Scan with GooglePay, PhonePe, Bhim, or Paytm at your gate to pay exact sum.</p>
                        </div>
                      </div>

                      <div className="mt-4 border-2 border-zinc-850 text-zinc-850 text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-md transform rotate-1">
                        ✔ PAID POS / COD OK
                      </div>

                      <p className="text-xxs text-zinc-400 text-center font-bold mt-3 uppercase tracking-wider">♥ Thank you for supporting QuickTown local stores! ♥</p>
                    </div>

                    {/* Zig Zag tear line at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-200 to-slate-200" style={{ backgroundImage: `linear-gradient(135deg, transparent 4px, #e2e8f0 4.5px, #faf9f4 5px), linear-gradient(-135deg, transparent 4px, #e2e8f0 4.5px, #faf9f4 5px)`, backgroundSize: "12px 6px", backgroundRepeat: "repeat-x" }}></div>
                  </div>
                </div>
              );
            })()
          )}

        </div>
      ) : (
        <div className="flex justify-center p-12">
          <p className="text-xs text-slate-400">Dispatch system is initializing maps...</p>
        </div>
      )}

    </div>
  );
}
