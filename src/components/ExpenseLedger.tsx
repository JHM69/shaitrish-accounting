import { useState } from 'react';
import { Transaction } from '../types';
import { CreditCard, Calendar, Filter, FileText, Link } from 'lucide-react';
import InvoicePreviewer from './InvoicePreviewer';

interface ExpenseLedgerProps {
  transactions: Transaction[];
}

export default function ExpenseLedger({ transactions }: ExpenseLedgerProps) {
  // Preview State
  const [previewLink, setPreviewLink] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewAmount, setPreviewAmount] = useState<string>('');

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Extract unique lists for filters
  const categories = Array.from(new Set(transactions.map((t) => t.category)));
  const months = Array.from(new Set(transactions.map((t) => t.date.substring(0, 7)))).sort();

  // Filter logic
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.provider.toLowerCase().includes(search.toLowerCase()) ||
      tx.note.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
    const matchesCurrency = filterCurrency === 'all' || tx.currency === filterCurrency;
    const matchesMonth = filterMonth === 'all' || tx.date.startsWith(filterMonth);

    return matchesSearch && matchesCategory && matchesCurrency && matchesMonth;
  });

  // Totals of filtered items
  const totalFilteredBDT = filteredTransactions.reduce((sum, tx) => sum + tx.amountBDT, 0);
  const totalFilteredUSD = filteredTransactions
    .filter((tx) => tx.currency === 'USD')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Month formatter helper
  const formatMonthLabel = (monthStr: string) => {
    const [year, m] = monthStr.split('-');
    const d = new Date(parseInt(year), parseInt(m) - 1, 15);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6" id="expense-ledger">
      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-sans font-bold text-sm shrink-0">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filter Transactions ({filteredTransactions.length} items)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl">
            {/* Search Input */}
            <div>
              <input
                type="text"
                placeholder="Search note or provider..."
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:border-indigo-500 font-sans"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Select */}
            <div>
              <select
                className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-white focus:outline-hidden focus:border-indigo-500 font-mono"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Select */}
            <div>
              <select
                className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-white focus:outline-hidden focus:border-indigo-500 font-mono"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="all">All Months</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Select */}
            <div>
              <select
                className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-white focus:outline-hidden focus:border-indigo-500 font-mono"
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
              >
                <option value="all">All Currencies</option>
                <option value="USD">USD ($)</option>
                <option value="BDT">BDT (৳)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Totals Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-mono text-slate-500 justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <div>
            Showing BDT Sum:{' '}
            <span className="font-bold text-slate-900">
              ৳{totalFilteredBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {totalFilteredUSD > 0 && (
            <div>
              USD Portion Included:{' '}
              <span className="font-bold text-indigo-600">
                ${totalFilteredUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Table Panel - Now Full Width */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Ledger Journal Entries</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1.5 rounded-md font-mono font-bold">
              PAGE TOTAL BDT ৳{totalFilteredBDT.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Invoiced Amt</th>
                <th className="px-4 py-3 text-right">Amount (BDT)</th>
                <th className="px-4 py-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-mono">
                    No matching expenditures logged.
                  </td>
                </tr>
              ) : (
                [...filteredTransactions]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {tx.date}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.category === 'Transfer'
                              ? 'bg-indigo-100 text-indigo-700'
                              : tx.category === 'Salary'
                              ? 'bg-amber-100 text-amber-700'
                              : tx.category === 'Cloud Server'
                              ? 'bg-purple-100 text-purple-700'
                              : tx.category === 'Workspace'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {tx.provider}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-sans max-w-[180px] truncate" title={tx.note}>
                        {tx.note}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold font-mono text-slate-600 whitespace-nowrap">
                        {tx.currency === 'USD' ? '$' : '৳'}
                        {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold font-mono text-slate-900 whitespace-nowrap">
                        {tx.amountBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {tx.fileLink ? (
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setPreviewLink(tx.fileLink || '');
                                setPreviewTitle(`${tx.provider} - ${tx.category}`);
                                setPreviewAmount(`${tx.currency === 'USD' ? '$' : '৳'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                              title="Preview Invoice / Receipt inline"
                            >
                              <FileText className="w-3 h-3 text-indigo-500" />
                              <span>Preview</span>
                            </button>
                            <a
                              href={tx.fileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                              title="Open receipt in Google Drive"
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
          </table>
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
