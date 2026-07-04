import React, { useState } from 'react';
import { Investment } from '../types';
import { Users, Plus, DollarSign, Award, Calendar, Trash2, X } from 'lucide-react';

interface EquityTrackerProps {
  investments: Investment[];
  onAddInvestment: (inv: Omit<Investment, 'id'>) => void;
  onDeleteInvestment: (id: string) => void;
}

export default function EquityTracker({ investments, onAddInvestment, onDeleteInvestment }: EquityTrackerProps) {
  // Dialogue Open State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  const [owner, setOwner] = useState<'Jahangir Hossain' | 'Mottasin Pahlovi'>('Jahangir Hossain');
  const [type, setType] = useState<'Cash Injection' | 'Operating Expense Borne' | 'Sweat Equity (Salary)'>('Cash Injection');
  const [amountBDT, setAmountBDT] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountBDT);
    if (isNaN(amt) || amt <= 0 || !note) return;

    onAddInvestment({
      date,
      owner,
      type,
      amountBDT: amt,
      note,
    });

    setAmountBDT('');
    setNote('');
  };

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

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Capital Injection</span>
        </button>
      </div>

      {/* Ledger Table - Full Width */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Investment & Transfer Ledger</h3>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer border border-indigo-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Entry</span>
          </button>
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
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {investments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-mono">
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
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => onDeleteInvestment(inv.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

      {/* Record Capital Injection Dialogue Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center font-sans p-4" id="equity-record-dialog">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsFormOpen(false)}
          />

          {/* Dialog Panel */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">Record Capital Injection</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Log new capital contributions or expenses borne directly</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                handleSubmit(e);
                setIsFormOpen(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Co-Founder / Owner</label>
                <select
                  className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:border-indigo-500"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value as any)}
                >
                  <option value="Jahangir Hossain">Jahangir Hossain</option>
                  <option value="Mottasin Pahlovi">Mottasin Pahlovi</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Contribution Type</label>
                <select
                  className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:border-indigo-500"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="Cash Injection">Direct Cash Injection</option>
                  <option value="Operating Expense Borne">Operating Expense Borne Directly</option>
                  <option value="Sweat Equity (Salary)">Sweat Equity (Unpaid Salary)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">Amount (BDT)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:border-indigo-500 font-mono"
                    value={amountBDT}
                    onChange={(e) => setAmountBDT(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">Date</label>
                  <input
                    type="date"
                    className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-indigo-500 font-mono"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Note / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Paid Server Invoice directly or cash transfer"
                  className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Contribution Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
