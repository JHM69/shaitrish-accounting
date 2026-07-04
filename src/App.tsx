import { useState } from 'react';
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
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview Dashboard', icon: Layers },
  { id: 'expenses', label: 'Expenses Ledger', icon: TrendingDown },
  { id: 'incomes', label: 'Incomes & Invoices', icon: TrendingUp },
  { id: 'equity', label: 'Founder Equity', icon: Users },
  { id: 'accounting', label: 'Double-Entry Journal', icon: BookOpen },
  { id: 'rates', label: 'Exchange Rates', icon: Calendar },
  { id: 'tax', label: 'Tax Compliance', icon: ShieldCheck },
] as const;

export default function App() {
  // Static, read-only data sourced directly from version-controlled initialData.ts.
  // This app is a presentation layer only — edit initialData.ts to change any figures.
  const transactions = INITIAL_TRANSACTIONS;
  const incomes = INITIAL_INCOMES;
  const investments = INITIAL_INVESTMENTS;
  const exchangeRates = INITIAL_EXCHANGE_RATES;
  const products = INITIAL_PRODUCTS;

  const [activeTab, setActiveTab] = useState<string>('overview');

  // Quick Global Aggregates
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
            <ExpenseLedger transactions={transactions} />
          )}

          {activeTab === 'incomes' && (
            <IncomeManager incomes={incomes} products={products} />
          )}

          {activeTab === 'equity' && (
            <EquityTracker investments={investments} />
          )}

          {activeTab === 'accounting' && (
            <AccountingLedger
              transactions={transactions}
              incomes={incomes}
              investments={investments}
            />
          )}

          {activeTab === 'rates' && <ExchangeRatesConsole rates={exchangeRates} />}

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
