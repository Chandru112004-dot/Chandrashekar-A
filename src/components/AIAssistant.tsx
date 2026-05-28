import React, { useState } from 'react';
import { Sparkles, ShoppingBag, CheckCircle2, ChevronRight, Mic, AlertCircle, RefreshCw } from 'lucide-react';
import { Product } from '../types';

interface AIAssistantProps {
  onAddProductsToCart: (items: { product: Product; quantity: number }[]) => void;
}

export default function AIAssistant({ onAddProductsToCart }: AIAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorInput, setErrorInput] = useState<string | null>(null);
  const [matchedResults, setMatchedResults] = useState<{
    product: Product;
    quantity: number;
  }[]>([]);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Common quick prompt suggestions for local users
  const suggestions = [
    { label: "🥛 Doodh & Tamatar", text: "ek doodh and do tamatar" },
    { label: "🧅 Aloo Pyaz Pack", text: "2kg aloo, 1kg pyaz and namak" },
    { label: "💊 Fever emergency", text: "crocin strip and cough syrup" },
    { label: "🍪 Tea Snack Combo", text: "parle-g, chips packet, and thums up" }
  ];

  // Simulated Voice Dictation (to support no-typing user-friendliness in small-towns)
  const startSimulatedVoice = () => {
    setIsListening(true);
    setInputText("Listening to voice input...");
    
    // Choose a random voice list phrase
    const voicePhrases = [
      "doodh, dahi, bread and chips packet",
      "ek amul butter, seb and ande",
      "teen parle-g biscuits and cold drink",
      "1kg pyaz and ek crocin ki goli"
    ];
    
    const chosen = voicePhrases[Math.floor(Math.random() * voicePhrases.length)];
    
    setTimeout(() => {
      setInputText(chosen);
      setIsListening(false);
    }, 2000);
  };

  const handleParseList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setErrorInput("Please type your items, select a suggestion, or tap the microphone!");
      return;
    }

    setLoading(true);
    setErrorInput(null);
    setMatchedResults([]);
    setDisclaimer(null);

    try {
      const response = await fetch('/api/ai/instant-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textList: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach AI parsing server.');
      }

      const data = await response.json();
      if (data.success && data.matchedProducts && data.matchedProducts.length > 0) {
        setMatchedResults(data.matchedProducts);
        setDisclaimer(data.disclaimer);
      } else {
        setErrorInput("Could not find any matching products. Try typing basic names like pyaz, aloo, milk, cold drink, or crocin.");
      }
    } catch (err: any) {
      setErrorInput("Server connection issues. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToCart = () => {
    if (matchedResults.length === 0) return;
    onAddProductsToCart(matchedResults);
    // Clear out
    setInputText('');
    setMatchedResults([]);
    setDisclaimer(null);
  };

  return (
    <div id="ai-assistant-container" className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm max-w-2xl mx-auto my-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl text-white shadow-sm shadow-teal-100">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Smart AI Order Assistant</h2>
          <p className="text-xs text-slate-500">Just write or speak in mixed languages (Hinglish/Local terms).</p>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setInputText(s.text)}
            className="text-xs bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-600 hover:text-teal-700 px-3 py-1.5 rounded-full transition-colors font-medium cursor-pointer"
          >
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleParseList} className="space-y-3">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. 1kg pyaz, do packet doodh, dahi packet, and 1 strip cup syrup..."
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all resize-none"
          />
          <button
            type="button"
            onClick={startSimulatedVoice}
            className={`absolute right-3 top-3 p-2.5 rounded-full transition-colors cursor-pointer ${
              isListening 
                ? 'bg-red-500 text-white animate-bounce' 
                : 'bg-teal-50 hover:bg-teal-100 text-teal-600 hover:text-teal-700'
            }`}
            title="Tap to Speak (Hyperlocal Voice Assistance)"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        {isListening && (
          <div className="flex items-center justify-center gap-2 py-1 text-xs text-red-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            Speak, our smart speaker is listening...
          </div>
        )}

        {errorInput && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorInput}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {inputText && (
            <button
              type="button"
              onClick={() => setInputText('')}
              className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs hover:bg-slate-50 transition-colors uppercase font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-slate-900 border border-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors inline-flex items-center gap-2 uppercase tracking-wide cursor-pointer disabled:bg-slate-300 disabled:border-slate-300"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Parsing List...
              </>
            ) : (
              <>
                Compile Cart
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Matched Products Card Container */}
      {matchedResults.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-5 animate-fade-in">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-800 mb-0.5 uppercase tracking-wide">AI Extraction Complete!</h4>
                <p className="text-xs text-emerald-700 font-medium">{disclaimer}</p>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wider">Detected items in warehouse inventory:</p>
          <div className="space-y-2 max-h-56 overflow-y-auto mb-4 pr-1">
            {matchedResults.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  {result.product.image && (result.product.image.startsWith('http://') || result.product.image.startsWith('https://')) ? (
                    <img
                      src={result.product.image}
                      alt={result.product.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-200"
                    />
                  ) : (
                    <span className="text-2xl select-none shrink-0">{result.product.image}</span>
                  )}
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">{result.product.localName}</h5>
                    <p className="text-xs text-slate-500 font-medium">{result.product.unit} · ₹{result.product.price} each</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-teal-50 text-teal-700 font-extrabold px-3 py-1 rounded-full border border-teal-100">
                    Qty: {result.quantity}
                  </span>
                  <p className="text-xs text-slate-600 font-bold mt-1">₹{result.product.price * result.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleApplyToCart}
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-sm rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md shadow-teal-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Add All {matchedResults.length} Items directly to Cart
          </button>
        </div>
      )}
    </div>
  );
}
