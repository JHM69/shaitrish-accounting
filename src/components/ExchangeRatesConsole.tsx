import React, { useState } from 'react';
import { ExchangeRate } from '../types';
import { RefreshCw, TrendingUp, Save, Undo } from 'lucide-react';

interface ExchangeRatesConsoleProps {
  rates: ExchangeRate[];
  onUpdateRate: (month: string, newRate: number) => void;
  onResetRates: () => void;
}

export default function ExchangeRatesConsole({ rates, onUpdateRate, onResetRates }: ExchangeRatesConsoleProps) {
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<string>('');

  const startEdit = (rateObj: ExchangeRate) => {
    setEditingMonth(rateObj.month);
    setTempRate(rateObj.rate.toString());
  };

  const saveEdit = (month: string) => {
    const val = parseFloat(tempRate);
    if (!isNaN(val) && val > 0) {
      onUpdateRate(month, val);
      setEditingMonth(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, month: string) => {
    if (e.key === 'Enter') {
      saveEdit(month);
    } else if (e.key === 'Escape') {
      setEditingMonth(null);
    }
  };

  // Format month label like "Aug 2025" from "2025-08"
  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 15);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6" id="exchange-rates-console">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 font-sans tracking-tight">Monthly Exchange Rates</h2>
            <p className="text-xs text-slate-500 font-mono">Convert USD transactions to BDT</p>
          </div>
        </div>

        <button
          onClick={onResetRates}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <Undo className="w-3.5 h-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {rates.map((rateObj) => {
          const isEditing = editingMonth === rateObj.month;

          return (
            <div
              key={rateObj.month}
              className={`p-3.5 rounded-xl border transition-all ${
                isEditing
                  ? 'border-indigo-500 bg-indigo-50/20 shadow-xs'
                  : 'border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-semibold text-slate-500">{formatMonthLabel(rateObj.month)}</div>
              <div className="mt-2 flex items-center justify-between">
                {isEditing ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="number"
                      step="0.1"
                      className="w-full text-sm font-semibold font-mono text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:outline-hidden focus:border-indigo-500"
                      value={tempRate}
                      onChange={(e) => setTempRate(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rateObj.month)}
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(rateObj.month)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => startEdit(rateObj)}
                    className="flex items-center justify-between w-full cursor-pointer group"
                  >
                    <span className="text-sm font-bold font-mono text-slate-800">
                      {rateObj.rate.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono group-hover:text-indigo-600">
                      BDT
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-slate-400 font-mono flex items-center gap-1 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
        <RefreshCw className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Click on any exchange rate card above to inline-edit the USD conversion rate for that month.</span>
      </p>
    </div>
  );
}
