import React, { useState, useEffect } from 'react';
import { Transaction, Income, Investment, ExchangeRate, Product } from './types';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_INCOMES,
  INITIAL_INVESTMENTS,
  INITIAL_EXCHANGE_RATES,
  INITIAL_PRODUCTS,
} from './initialData';
import DashboardOverview from './components/DashboardOverview';
import ExpenseLedger from './components/ExpenseLedger';
import IncomeManager from './components/IncomeManager';
import EquityTracker from './components/EquityTracker';
import AccountingLedger from './components/AccountingLedger';
import ExchangeRatesConsole from './components/ExchangeRatesConsole';
import TaxCompliancePanel from './components/TaxCompliancePanel';
import {
  TrendingUp,
  Users,
  TrendingDown,
  BookOpen,
  Calendar,
  Layers,
  ShieldCheck,
  Download,
  Upload,
} from 'lucide-react';

const STORAGE_KEYS = {
  transactions: 'shaitrish_transactions_v11',
  incomes: 'shaitrish_incomes_v11',
  investments: 'shaitrish_investments_v11',
  exchangeRates: 'shaitrish_exchange_rates_v11',
} as const;

const TABS = [
  { id: 'overview', label: 'Overview Dashboard', icon: Layers },
  { id: 'expenses', label: 'Expenses Ledger', icon: TrendingDown },
  { id: 'incomes', label: 'Incomes & Invoices', icon: TrendingUp },
  { id: 'equity', label: 'Founder Equity', icon: Users },
  { id: 'accounting', label: 'Double-Entry Journal', icon: BookOpen },
  { id: 'rates', label: 'Exchange Rates', icon: Calendar },
  { id: 'tax', label: 'Tax Compliance', icon: ShieldCheck },
] as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  // 1. Core States with local persistence
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.transactions, INITIAL_TRANSACTIONS)
  );

  const [incomes, setIncomes] = useState<Income[]>(() =>
    // Migrate legacy product ids to course37
    loadFromStorage(STORAGE_KEYS.incomes, INITIAL_INCOMES).map((inc) =>
      ['course27', 'megaprep.org', 'shaitrish.com'].includes(inc.product)
        ? { ...inc, product: 'course37' }
        : inc
    )
  );

  const [investments, setInvestments] = useState<Investment[]>(() =>
    loadFromStorage(STORAGE_KEYS.investments, INITIAL_INVESTMENTS)
  );

  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(() =>
    loadFromStorage(STORAGE_KEYS.exchangeRates, INITIAL_EXCHANGE_RATES)
  );

  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Sync to local storage when state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.incomes, JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.investments, JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.exchangeRates, JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  // Map exchange rates to a key-value dictionary for fast lookup
  const ratesMap = React.useMemo(() => {
    const map: { [month: string]: number } = {};
    exchangeRates.forEach((r) => {
      map[r.month] = r.rate;
    });
    return map;
  }, [exchangeRates]);

  // Latest known monthly rate — fallback for months without an explicit entry
  const latestRate = React.useMemo(() => {
    const sorted = [...exchangeRates].sort((a, b) => b.month.localeCompare(a.month));
    return sorted[0]?.rate ?? 123.5;
  }, [exchangeRates]);

  // 2. Action Handlers
  // Add Expense Transaction
  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'amountBDT'>) => {
    const id = `tx_${Date.now()}`;
    const monthKey = newTx.date.substring(0, 7); // YYYY-MM
    const currentRate = ratesMap[monthKey] || latestRate;

    const calculatedBDT = newTx.currency === 'USD' ? newTx.amount * currentRate : newTx.amount;

    const transaction: Transaction = {
      ...newTx,
      id,
      amountBDT: calculatedBDT,
    };

    setTransactions((prev) => [transaction, ...prev]);
  };

  // Delete Expense Transaction
  const handleDeleteTransaction = (id: string) => {
    if (confirm('Are you sure you want to delete this expense transaction?')) {
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    }
  };

  // Add Client Invoiced Income
  const handleAddIncome = (newInc: Omit<Income, 'id'>) => {
    const id = `inc_${Date.now()}`;
    const income: Income = {
      ...newInc,
      id,
    };
    setIncomes((prev) => [income, ...prev]);
  };

  // Delete Income
  const handleDeleteIncome = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice record?')) {
      setIncomes((prev) => prev.filter((inc) => inc.id !== id));
    }
  };

  // Mark pending invoice as realized (paid)
  const handleMarkRealized = (id: string) => {
    setIncomes((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          return { ...inc, status: 'Realized' };
        }
        return inc;
      })
    );
  };

  // Add Founder Investment/Contribution
  const handleAddInvestment = (newInv: Omit<Investment, 'id'>) => {
    const id = `inv_${Date.now()}`;
    const investment: Investment = {
      ...newInv,
      id,
    };
    setInvestments((prev) => [investment, ...prev]);
  };

  // Delete Investment
  const handleDeleteInvestment = (id: string) => {
    if (confirm('Are you sure you want to delete this founder contribution?')) {
      setInvestments((prev) => prev.filter((inv) => inv.id !== id));
    }
  };

  // Update Exchange rate of a month & cascade update all USD amounts of that month in BDT!
  const handleUpdateRate = (month: string, newRate: number) => {
    // 1. Update the rate in rates list
    setExchangeRates((prev) =>
      prev.map((rateObj) => (rateObj.month === month ? { ...rateObj, rate: newRate } : rateObj))
    );

    // 2. Cascade update BDT amounts in Expense Transactions
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.currency === 'USD' && tx.date.startsWith(month)) {
          return { ...tx, amountBDT: tx.amount * newRate };
        }
        return tx;
      })
    );

    // 3. Cascade update BDT amounts in Client Incomes
    setIncomes((prev) =>
      prev.map((inc) => {
        if (inc.currency === 'USD' && inc.date.startsWith(month)) {
          const updatedBDT = inc.amount * newRate;
          return {
            ...inc,
            amountBDT: updatedBDT,
            mrrContribution: inc.isRecurring && inc.type === 'Monthly Subs' ? updatedBDT : undefined,
          };
        }
        return inc;
      })
    );
  };



  // Backup: download all ledger data as a JSON file
  const handleExportBackup = () => {
    const backup = { version: 11, exportedAt: new Date().toISOString(), transactions, incomes, investments, exchangeRates };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shaitrish-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore: replace all ledger data from a backup file
  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data.transactions) || !Array.isArray(data.incomes)) {
          throw new Error('Missing ledger arrays');
        }
        if (!confirm('Replace ALL current data with this backup? Current data will be overwritten.')) return;
        setTransactions(data.transactions);
        setIncomes(data.incomes);
        setInvestments(Array.isArray(data.investments) ? data.investments : []);
        setExchangeRates(Array.isArray(data.exchangeRates) ? data.exchangeRates : INITIAL_EXCHANGE_RATES);
      } catch {
        alert('Invalid backup file — expected a JSON export from this app.');
      }
    };
    reader.readAsText(file);
  };

  // 3. Quick Global Aggregates
  const totalInvoicedRealized = incomes
    .filter((i) => i.status === 'Realized')
    .reduce((sum, i) => sum + i.amountBDT, 0);

  const totalOpex = transactions
    .filter((t) => t.isOperating && t.accountClass === 'Expense')
    .reduce((sum, t) => sum + t.amountBDT, 0);

  const activeMRR = (() => {
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

  const avgMRE = (() => {
    const opexTxs = transactions.filter((t) => t.isOperating && t.accountClass === 'Expense');
    if (opexTxs.length === 0) return 0;

    const monthMap: Record<string, number> = {};
    opexTxs.forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      monthMap[month] = (monthMap[month] || 0) + t.amountBDT;
    });

    const sortedMonths = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));
    const last3Months = sortedMonths.slice(0, 3);
    if (last3Months.length === 0) return 0;

    const total = last3Months.reduce((sum, m) => sum + monthMap[m], 0);
    return Math.round(total / last3Months.length);
  })();

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased" id="shaitrish-tracker-root">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <img
              src="https://www.shaitrish.com/logo-black.svg"
              alt="Shaitrish Logo"
              className="h-10 w-auto object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 font-sans tracking-tight">Shaitrish</h1>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm uppercase font-bold">
                  Accounting 
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Financial Ledger & Operational Dashboard</p>
            </div>
          </div>

          {/* Quick Stats Summary Banner */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-mono border-l border-slate-100 pl-6">
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Active MRR</span>
              <span className="font-bold text-indigo-600">৳{activeMRR.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Avg 3Mo Expense</span>
              <span className="font-bold text-rose-600">৳{avgMRE.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Realized EBITDA</span>
              <span className={`font-bold ${totalInvoicedRealized - totalOpex >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ৳{(totalInvoicedRealized - totalOpex).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Inward Rmt (Realized)</span>
              <span className="font-bold text-slate-900">৳{totalInvoicedRealized.toLocaleString()}</span>
            </div>
          </div>

          {/* Data Backup Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
              title="Download all ledger data as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>
            <label
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
              title="Restore ledger data from a backup JSON file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore</span>
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportBackup(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200/60 pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="transition-all duration-350">
          {activeTab === 'overview' && (
            <DashboardOverview
              transactions={transactions}
              incomes={incomes}
              investments={investments}
              products={products}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseLedger
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'incomes' && (
            <IncomeManager
              incomes={incomes}
              products={products}
              currentExchangeRates={ratesMap}
              onAddIncome={handleAddIncome}
              onDeleteIncome={handleDeleteIncome}
              onMarkRealized={handleMarkRealized}
            />
          )}

          {activeTab === 'equity' && (
            <EquityTracker
              investments={investments}
              onAddInvestment={handleAddInvestment}
              onDeleteInvestment={handleDeleteInvestment}
            />
          )}

          {activeTab === 'accounting' && (
            <AccountingLedger
              transactions={transactions}
              incomes={incomes}
              investments={investments}
            />
          )}

          {activeTab === 'rates' && (
            <ExchangeRatesConsole
              rates={exchangeRates}
              onUpdateRate={handleUpdateRate}
              onResetRates={() => {
                if (confirm('Reset exchange rates back to historic reference averages?')) {
                  // This will trigger cascade update automatically on all transactions
                  INITIAL_EXCHANGE_RATES.forEach((r) => handleUpdateRate(r.month, r.rate));
                }
              }}
            />
          )}

          {activeTab === 'tax' && <TaxCompliancePanel />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span>© 2026 Shaitrish (shaitrish.com). All rights reserved.</span>
          <span>Designed with GAAP accounting integrity & National Board of Revenue compliance standards.</span>
        </div>
      </footer>
    </div>
  );
}
