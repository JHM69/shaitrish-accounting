import { Investment } from '../types';
import { Users, DollarSign, Award, Calendar } from 'lucide-react';

interface EquityTrackerProps {
  investments: Investment[];
}

export default function EquityTracker({ investments }: EquityTrackerProps) {
  // Calculate stats
  const totalJahangir = investments
    .filter((i) => i.owner === 'Jahangir Hossain')
    .reduce((sum, i) => sum + i.amountBDT, 0);

  const totalPahlovi = investments
    .filter((i) => i.owner === 'Mottasin Pahlovi')
    .reduce((sum, i) => sum + i.amountBDT, 0);

  const grandTotal = totalJahangir + totalPahlovi;

  const jahangirPercent = grandTotal > 0 ? (totalJahangir / grandTotal) * 100 : 50;
  const pahloviPercent = grandTotal > 0 ? (totalPahlovi / grandTotal) * 100 : 50;

  return (
    <div className="space-y-6" id="equity-tracker">
      {/* Top Visual Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Contributed Capital */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Contributed Capital</h4>
              <p className="text-2xl font-black text-slate-950 font-sans mt-1">
                BDT {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Individual Breakdowns */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-3">
          <div className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-indigo-50/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span className="text-xs font-medium text-slate-700">Jahangir Hossain</span>
            </div>
            <span className="text-xs font-bold font-mono text-slate-900">
              BDT {totalJahangir.toLocaleString('en-US')} ({jahangirPercent.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-amber-50/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-slate-700">Mottasin Pahlovi</span>
            </div>
            <span className="text-xs font-bold font-mono text-slate-900">
              BDT {totalPahlovi.toLocaleString('en-US')} ({pahloviPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Split Indicator Progress */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-center space-y-3">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Jahangir Split ({jahangirPercent.toFixed(1)}%)</span>
            <span>Mottasin Split ({pahloviPercent.toFixed(1)}%)</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${jahangirPercent}%` }}
              className="bg-indigo-600 h-full transition-all duration-500"
              title={`Jahangir Hossain: ${jahangirPercent.toFixed(1)}%`}
            />
            <div
              style={{ width: `${pahloviPercent}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Mottasin Pahlovi: ${pahloviPercent.toFixed(1)}%`}
            />
          </div>
        </div>
      </div>

      {/* Ledger Table - Full Width */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Investment & Transfer Ledger</h3>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {investments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-mono">
                    No contributions logged yet.
                  </td>
                </tr>
              ) : (
                [...investments]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {inv.date}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              inv.owner === 'Jahangir Hossain' ? 'bg-indigo-600' : 'bg-amber-500'
                            }`}
                          />
                          {inv.owner}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.type === 'Cash Injection'
                              ? 'bg-indigo-100/50 text-indigo-700'
                              : 'bg-purple-100/50 text-purple-700'
                          }`}
                        >
                          {inv.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-sans max-w-xs truncate" title={inv.note}>
                        {inv.note}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold font-mono text-slate-900 whitespace-nowrap">
                        {inv.amountBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-xl flex gap-2.5">
          <Award className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-indigo-800 leading-relaxed">
            Jahangir Hossain bears early operational costs directly to keep server, domain, and workspace pipelines active. These are accounted for as co-founder loans or equity additions.
          </p>
        </div>
      </div>

    </div>
  );
}
