import React, { useState } from 'react';
import { CircleHelp, ArrowRight, PhoneCall, HelpCircle, ShieldAlert, Sparkles, MessageSquareHeart } from 'lucide-react';

export default function UserHelp() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is grocery delivery really guaranteed within 10 minutes?",
      a: "Yes! QuickTown establishes micro-fulfillment warehouses (dark stores) directly inside local small-town sector limits. Because our distance coordinates never exceed 2.2 kilometers, our riders can safely dispatch items on electronic bicycles within 10 minutes without traffic stress."
    },
    {
      q: "How does the AI Multilingual voice search function?",
      a: "Our AI assistant uses generative models configured via Google's Gemini technologies. Simply type or say what you need in conversational colloquial terms (e.g., 'aloo', 'taaza doodh', 'kapre khichne ka dahi') and it will automatically map your request to correct available commodities in our warehouse stock!"
    },
    {
      q: "Can I cancel my orders post lodge?",
      a: "Orders can be canceled directly from the dispatch dashboard while the dispatch state remains under 'Placed' or 'Packed'. Once the Rider leaves the dark store ('Dispatched'), cancellation is locked to avoid transit waste."
    },
    {
      q: "What payment structures are allowed?",
      a: "We support cash on delivery (COD), Google Pay, PhonePe, and major local UPI payments directly upon rider physical arrival."
    },
    {
      q: "What regions are presently serviceable?",
      a: "Our coverage spans Sikar, Madhubani Towns, Hajipur, Sasaram, Motihari, Alwar Cantonment, and Moradabad. We are dynamically expanding to 50 more tier-3 towns this term!"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <CircleHelp className="w-5 h-5 text-emerald-600" />
          Interactive Help &amp; Support Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Have an inquiry about delivery dispatches, refunds, or voice assistance? Find responses or dial support line.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* FAQs Collapsible list */}
        <div className="md:col-span-2 space-y-3">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xxs">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Frequently Asked Queries</h3>
            
            <div className="space-y-3.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="border-b border-slate-100 last:border-b-0 pb-3 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors py-1 cursor-pointer focus:outline-none"
                    >
                      <span className="flex items-start gap-2 pr-4">
                        <span className="text-emerald-600">Q.</span>
                        <span>{faq.q}</span>
                      </span>
                      <span className="text-slate-400 font-bold select-none shrink-0">
                        {isOpen ? '▲' : '▼'}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-xxs font-medium text-slate-500 pl-6 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100/30">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Support Sidebar panels */}
        <div className="space-y-4">
          
          {/* Support Line */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 relative overflow-hidden shadow-md">
            <div className="absolute top-[-20px] right-[-20px] bg-emerald-500/10 w-24 h-24 rounded-full select-none" />
            <PhoneCall className="w-8 h-8 text-emerald-400 mb-3" />
            
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Contact Town Manager</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Facing issues with delivery cycles? Dial our toll-free regional operation hotline directly:
            </p>
            <p className="text-sm font-black text-emerald-400 font-mono mt-3">
              1800-419-8080
            </p>
            <p className="text-[9px] text-slate-500 font-bold block mt-1 tracking-wider uppercase">
              Operational 24/7 for Small Towns
            </p>
          </div>

          {/* AI Guide */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 shadow-xxs">
            <h4 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              Voice Guide Accent Hints
            </h4>
            <p className="text-xxs text-slate-500 leading-normal">
              You can search in different local dialects! Try typing these exact phrases directly in the AI Helper prompt box:
            </p>
            <div className="space-y-1.5 font-mono text-3xs text-slate-700 font-bold">
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100/50">
                🗣️ "Mujhe do kilo aloo aur dahi chahiye"
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100/50">
                🗣️ "Accha sa amul butter aur doodh do packet"
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100/50">
                🗣️ "soap for bathing or cold drinks"
              </div>
            </div>
          </div>

          {/* Quality badge pledge */}
          <div className="bg-emerald-50/50 border border-emerald-150 rounded-2xl p-4 flex items-start gap-3">
            <MessageSquareHeart className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-3xs font-black uppercase tracking-wider text-emerald-800">100% Satisfaction Guarantee</h5>
              <p className="text-3xs text-emerald-700 font-medium leading-relaxed mt-1">
                If items suffer damage during bike dispatch, or if delivery times exceed 15-min without pre-advised alert, we will issue instant refunds plus ₹100 cash voucher code!
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
