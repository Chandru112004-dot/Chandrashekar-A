import React, { useState } from 'react';
import { ClipboardList, Search, Eye, Navigation, CheckCircle, Package, Truck, AlertCircle, ShoppingBag } from 'lucide-react';
import { Order } from '../types';

interface UserOrdersProps {
  orders: Order[];
  onNavigateToTracking: (orderId: string) => void;
  onRefreshData: () => void;
}

export default function UserOrders({ orders, onNavigateToTracking, onRefreshData }: UserOrdersProps) {
  const [phoneNumberFilter, setPhoneNumberFilter] = useState('');
  const [typedNumber, setTypedNumber] = useState('');

  // Local storage lookup for phone number to prepopulate!
  React.useEffect(() => {
    const savedPhone = localStorage.getItem('qt_user_phone') || localStorage.getItem('address_phone');
    if (savedPhone) {
      setPhoneNumberFilter(savedPhone);
      setTypedNumber(savedPhone);
    }
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneNumberFilter(typedNumber.trim());
  };

  const handleClearFilter = () => {
    setPhoneNumberFilter('');
    setTypedNumber('');
  };

  // Filter orders by phone number (if specified) or show all
  const displayedOrders = phoneNumberFilter 
    ? orders.filter(o => o.customerPhone.replace(/[\s-+]/g, '').includes(phoneNumberFilter.replace(/[\s-+]/g, '')))
    : orders;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Placed':
        return { text: 'Ordered', color: 'bg-blue-50 text-blue-700 border-blue-150', icon: <ShoppingBag className="w-3 h-3" /> };
      case 'Packed':
        return { text: 'Packed', color: 'bg-yellow-50 text-yellow-750 border-yellow-150', icon: <Package className="w-3 h-3" /> };
      case 'Dispatched':
        return { text: 'Dispatched', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Truck className="w-3 h-3" /> };
      case 'Delivered':
        return { text: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle className="w-3 h-3" /> };
      default:
        return { text: status, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <AlertCircle className="w-3 h-3" /> };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            My Order Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search orders by your registered phone number or view recent dispatches.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshData}
          className="text-xxs font-extrabold uppercase bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          🔄 Refresh Orders
        </button>
      </div>

      {/* Lookup Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xxs mb-6">
        <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Filter by your 10-digit cellphone number (e.g. 9876543210)..."
              value={typedNumber}
              onChange={(e) => setTypedNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white border-0 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
            >
              Search
            </button>
            {phoneNumberFilter && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </form>
        {phoneNumberFilter && (
          <p className="text-[10px] text-emerald-700 font-bold mt-2.5">
            🔍 Currently filtering orders containing phone number: <span className="font-mono">{phoneNumberFilter}</span>
          </p>
        )}
      </div>

      {displayedOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-xxs">
          <span className="text-4xl">🛍️</span>
          <h3 className="text-sm font-black text-slate-800 mt-3">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            You haven't placed any orders with this phone number yet, or the filter is matching empty records.
          </p>
          <button
            type="button"
            onClick={handleClearFilter}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-extrabold uppercase rounded-xl transition-colors"
          >
            Show All Town Orders
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <div 
                key={order.id} 
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all shadow-xxs"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                      {order.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      Lodge Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg border flex items-center gap-1.5 ${badge.color}`}>
                    {badge.icon}
                    {badge.text}
                  </span>
                </div>

                {/* Items and Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2">
                    <div className="space-y-1">
                      {order.items.map((item, id) => (
                        <div key={id} className="text-xs text-slate-700 font-medium">
                          • {item.quantity} {item.unit} x <span className="font-bold text-slate-850">{item.name}</span>
                        </div>
                      ))}
                    </div>
                    {order.appliedCoupon && (
                      <p className="text-[10px] text-emerald-700 font-bold mt-2">
                        🏷️ Applied Promo Voucher discount {order.appliedCoupon} (-₹{order.discountAmount})
                      </p>
                    )}
                    <p className="text-xxs text-slate-500 font-medium mt-2">
                      📍 Deliver to: <span className="font-semibold text-slate-700">{order.customerName}</span> · {order.deliveryAddress}
                    </p>
                  </div>

                  <div className="text-left md:text-right flex flex-row md:flex-col justify-between items-center md:items-end gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Grand Paid Total</p>
                      <p className="text-base font-black text-slate-900">₹{order.totalAmount}</p>
                    </div>

                    {(order.status !== 'Delivered' && order.status !== 'Cancelled') ? (
                      <button
                        type="button"
                        onClick={() => onNavigateToTracking(order.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1 hover:scale-102"
                      >
                        <Navigation className="w-3.5 h-3.5 animate-pulse text-emerald-250" />
                        Live Map Track
                      </button>
                    ) : (
                      <span className="text-xxs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        ✓ Dispatched successfully!
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
