import React, { useState } from 'react';
import { Income, Product } from '../types';
import { Plus, DollarSign, Calendar, CheckCircle2, Clock, Trash2, ArrowUpRight, ShieldCheck, Tag, Link, FileText, X } from 'lucide-react';
import InvoicePreviewer from './InvoicePreviewer';

interface IncomeManagerProps {
  incomes: Income[];
  products: Product[];
  currentExchangeRates: { [month: string]: number };
  onAddIncome: (inc: Omit<Income, 'id'>) => void;
  onDeleteIncome: (id: string) => void;
  onMarkRealized: (id: string) => void;
}

export default function IncomeManager({
  incomes,
  products,
  currentExchangeRates,
  onAddIncome,
  onDeleteIncome,
  onMarkRealized,
}: IncomeManagerProps) {
  // Dialogue Open State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  const [client, setClient] = useState<string>('');
  const [product, setProduct] = useState<string>(products[0]?.name ?? 'course37');
  const [type, setType] = useState<Income['type']>('Monthly Subs');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('USD');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Realized' | 'Pending'>('Realized');
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const [fileLink, setFileLink] = useState<string>('');

  // Preview State
  const [previewLink, setPreviewLink] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewAmount, setPreviewAmount] = useState<string>('');

  // Filters
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || !client) return;

    // Get exchange rate for the transaction month (or fallback to latest known month)
    const monthKey = date.substring(0, 7); // YYYY-MM
    const months = Object.keys(currentExchangeRates).sort();
    const latestRate = currentExchangeRates[months[months.length - 1]] ?? 123.5;
    const rate = currentExchangeRates[monthKey] || latestRate;

    const amountBDT = currency === 'USD' ? amt * rate : amt;
    const mrrContribution = isRecurring && type === 'Monthly Subs' ? amountBDT : undefined;

    onAddIncome({
      date,
      client,
      product,
      type,
      amount: amt,
      currency,
      amountBDT,
      status,
      isRecurring,
      mrrContribution,
      fileLink: fileLink || undefined,
    });

    setClient('');
    setAmount('');
    setFileLink('');
  };

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

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Client Invoice</span>
        </button>
      </div>

      {/* Invoices List - Now Full Width */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Issued Invoices & Payments</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer border border-emerald-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Invoice</span>
            </button>

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
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-mono">
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
                          <button
                            onClick={() => onMarkRealized(inc.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/60 text-amber-800 hover:bg-emerald-100 hover:text-emerald-800 transition-colors cursor-pointer border border-amber-200/50"
                            title="Click to mark as paid (Realized)"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Pending (Collect)</span>
                          </button>
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
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => onDeleteIncome(inc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                  <td colSpan={3} className="px-4 py-3"></td>
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

      {/* Client Invoice Generator Dialogue Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center font-sans p-4" id="income-record-dialog">
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
                <Plus className="w-5 h-5 text-emerald-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">Generate Client Invoice</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Issue an invoice or record client revenue</p>
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
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Client / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. MegaPrep, Shikho BD"
                  className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Product Linkage</label>
                  <select
                    className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-hidden focus:border-indigo-500"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Payment Type</label>
                  <select
                    className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-hidden focus:border-indigo-500"
                    value={type}
                    onChange={(e) => {
                      const val = e.target.value as Income['type'];
                      setType(val);
                      setIsRecurring(val === 'Monthly Subs' || val === 'Subscription');
                    }}
                  >
                    <option value="Monthly Subs">Monthly Subs</option>
                    <option value="Subscription">Annual Subscription</option>
                    <option value="Setup Fee">One-time Setup Fee</option>
                    <option value="Milestone">Milestone Payout</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Billing Currency</label>
                  <select
                    className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-hidden focus:border-indigo-500 font-mono"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="BDT">BDT (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500"
                    className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-indigo-500 font-mono"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Invoice Date</label>
                  <input
                    type="date"
                    className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-indigo-500 font-mono"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Status</label>
                  <select
                    className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-hidden focus:border-indigo-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Realized">Realized (Paid)</option>
                    <option value="Pending">Pending (Unpaid)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Invoice File Link</label>
                <input
                  type="url"
                  placeholder="e.g. Google Drive link to invoice PDF"
                  className="mt-1 block w-full text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                  value={fileLink}
                  onChange={(e) => setFileLink(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Recurring SaaS Subscription</div>
                  <p className="text-[10px] text-slate-400">Contributes directly to MRR calculations</p>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue & Save Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
