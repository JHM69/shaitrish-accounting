import { useState } from 'react';
import { Income, Product } from '../types';
import { DollarSign, Calendar, CheckCircle2, Clock, ArrowUpRight, ShieldCheck, Tag, Link, FileText } from 'lucide-react';
import InvoicePreviewer from './InvoicePreviewer';

interface IncomeManagerProps {
  incomes: Income[];
  products: Product[];
}

export default function IncomeManager({ incomes, products }: IncomeManagerProps) {
  // Preview State
  const [previewLink, setPreviewLink] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewAmount, setPreviewAmount] = useState<string>('');

  // Filters
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Get list of unique clients for filtering
  const uniqueClients = Array.from(new Set(incomes.map((i) => i.client)));

  // Filtered list
  const filteredIncomes = incomes.filter((inc) => {
    if (filterClient !== 'all' && inc.client !== filterClient) return false;
    if (filterProduct !== 'all' && inc.product !== filterProduct) return false;
    if (filterStatus !== 'all' && inc.status !== filterStatus) return false;
    return true;
  });

  // Calculations
  const totalRealizedBDT = incomes
    .filter((i) => i.status === 'Realized')
    .reduce((sum, i) => sum + i.amountBDT, 0);

  const totalPendingBDT = incomes
    .filter((i) => i.status === 'Pending')
    .reduce((sum, i) => sum + i.amountBDT, 0);

  const calculatedMRR = (() => {
    const latestSubsMap: { [key: string]: { date: string; amountBDT: number } } = {};
    incomes.forEach((i) => {
      if (i.isRecurring && i.type === 'Monthly Subs') {
        const key = `${i.client}-${i.product}`;
        const existing = latestSubsMap[key];
        if (!existing || i.date > existing.date) {
          latestSubsMap[key] = { date: i.date, amountBDT: i.amountBDT };
        }
      }
    });
    return Object.values(latestSubsMap).reduce((sum, item) => sum + item.amountBDT, 0);
  })();

  const totalShownBDT = filteredIncomes.reduce((sum, inc) => sum + inc.amountBDT, 0);

  const totalShownUSD = filteredIncomes
    .filter((inc) => inc.currency === 'USD')
    .reduce((sum, inc) => sum + inc.amount, 0);

  const totalShownOnlyBDT = filteredIncomes
    .filter((inc) => inc.currency === 'BDT')
    .reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="space-y-6" id="income-manager">
      {/* Top Stat Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Realized Income */}
        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100/50 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Realized Revenue</div>
            <div className="text-2xl font-black text-emerald-950 font-sans mt-1">
              BDT {totalRealizedBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-emerald-700 mt-1 font-mono">Inward remittances & payments received</p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-amber-50/40 rounded-2xl border border-amber-100/50 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending / Unrealized</div>
            <div className="text-2xl font-black text-amber-950 font-sans mt-1">
              BDT {totalPendingBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-amber-700 mt-1 font-mono">Issued invoices awaiting settlement</p>
          </div>
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Active MRR */}
        <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100/50 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Monthly Recurring (MRR)</div>
            <div className="text-2xl font-black text-indigo-950 font-sans mt-1">
              BDT {calculatedMRR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-indigo-700 mt-1 font-mono">From active monthly subscriptions</p>
          </div>
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Invoices List - Now Full Width */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Issued Invoices & Payments</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtering Controls */}
            <div className="flex flex-wrap gap-1.5">
              <select
                className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-600 font-mono"
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
              >
                <option value="all">All Clients</option>
                {uniqueClients.map((cl) => (
                  <option key={cl} value={cl}>
                    {cl}
                  </option>
                ))}
              </select>

              <select
                className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-600 font-mono"
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
              >
                <option value="all">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-600 font-mono"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Realized">Realized</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Invoiced Amt</th>
                <th className="px-4 py-3 text-right">Amount (BDT)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-mono">
                    No matching invoices or payments found.
                  </td>
                </tr>
              ) : (
                [...filteredIncomes]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {inc.date}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {inc.client}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {inc.product}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="flex flex-col">
                          <span className="font-semibold text-slate-700">{inc.type}</span>
                          {inc.isRecurring && (
                            <span className="text-[9px] text-emerald-600 font-mono">Recurring SaaS</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold font-mono text-slate-700 whitespace-nowrap">
                        {inc.currency === 'USD' ? '$' : '৳'}
                        {inc.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold font-mono text-slate-900 whitespace-nowrap">
                        {inc.amountBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {inc.status === 'Realized' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Realized</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/60 text-amber-800 border border-amber-200/50">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {inc.fileLink ? (
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setPreviewLink(inc.fileLink || '');
                                setPreviewTitle(`${inc.client} - ${inc.product}`);
                                setPreviewAmount(`${inc.currency === 'USD' ? '$' : '৳'}${inc.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                              title="Preview Invoice inline"
                            >
                              <FileText className="w-3 h-3 text-emerald-600" />
                              <span>Preview</span>
                            </button>
                            <a
                              href={inc.fileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-emerald-700 rounded-md transition-colors cursor-pointer"
                              title="Open invoice in Google Drive"
                            >
                              <Link className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
            {filteredIncomes.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/80 border-t border-slate-200 font-bold text-xs text-slate-900 font-mono">
                  <td colSpan={4} className="px-4 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total Shown ({filteredIncomes.length}):
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 whitespace-nowrap">
                    {totalShownUSD > 0 && (
                      <span className="block">${totalShownUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    )}
                    {totalShownOnlyBDT > 0 && (
                      <span className="block">৳{totalShownOnlyBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    )}
                    {totalShownUSD === 0 && totalShownOnlyBDT === 0 && (
                      <span>-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-950 whitespace-nowrap border-l border-slate-100">
                    ৳{totalShownBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} className="px-4 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="p-3 bg-emerald-50/40 border border-emerald-100/50 rounded-xl flex gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            <strong>Audit tip:</strong> Realized invoices are classified as cash inflow and matched in the general ledger. Pending invoices are tracked in Accounts Receivable to satisfy standard IFRS accrual accounting guidelines.
          </p>
        </div>
      </div>

      {/* Inline Google Drive Previewer Drawer */}
      <InvoicePreviewer
        isOpen={!!previewLink}
        fileLink={previewLink}
        title={previewTitle}
        amountLabel={previewAmount}
        onClose={() => setPreviewLink('')}
      />
    </div>
  );
}
