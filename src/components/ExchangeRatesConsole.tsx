import { ExchangeRate } from '../types';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface ExchangeRatesConsoleProps {
  rates: ExchangeRate[];
}

export default function ExchangeRatesConsole({ rates }: ExchangeRatesConsoleProps) {
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {rates.map((rateObj) => (
          <div
            key={rateObj.month}
            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40"
          >
            <div className="text-xs font-semibold text-slate-500">{formatMonthLabel(rateObj.month)}</div>
            <div className="mt-2 flex items-center justify-between w-full">
              <span className="text-sm font-bold font-mono text-slate-800">
                {rateObj.rate.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">BDT</span>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-slate-400 font-mono flex items-center gap-1 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
        <RefreshCw className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Monthly USD→BDT reference rates used to convert all foreign-currency transactions.</span>
      </p>
    </div>
  );
}
