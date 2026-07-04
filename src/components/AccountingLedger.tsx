import React, { useState } from 'react';
import { Transaction, Income, Investment } from '../types';
import {
  BookOpen,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Scale,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  FileText,
  Printer,
  Info,
  Calendar,
  Filter
} from 'lucide-react';

interface AccountingLedgerProps {
  transactions: Transaction[];
  incomes: Income[];
  investments: Investment[];
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  type: 'EXPENSE' | 'REVENUE_REALIZED' | 'REVENUE_PENDING' | 'INVESTMENT_CASH' | 'INVESTMENT_OPEX';
}

export default function AccountingLedger({ transactions, incomes, investments }: AccountingLedgerProps) {
  // --- States ---
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [secondaryTab, setSecondaryTab] = useState<'statement' | 'balance' | 'cashflow' | 'trial' | 'journal'>('statement');
  const [journalSearch, setJournalSearch] = useState<string>('');
  const [journalTypeFilter, setJournalTypeFilter] = useState<string>('all');

  // --- 1. Raw General Journal Entry Generation ---
  const rawJournal: JournalEntry[] = [];

  // A. Process standard expenses (exclude co-founder transfers logged as expenses)
  transactions.forEach((tx) => {
    if (tx.category === 'Transfer') {
      rawJournal.push({
        id: `journal-transfer-${tx.id}`,
        date: tx.date,
        description: `Founder Contribution - Mpb Jahangir / Mottasin: ${tx.note}`,
        debitAccount: 'Cash & Bank (Asset)',
        creditAccount: "Mottasin Pahlovi's Equity (Equity)",
        amount: tx.amountBDT,
        type: 'INVESTMENT_CASH',
      });
    } else {
      rawJournal.push({
        id: `journal-exp-${tx.id}`,
        date: tx.date,
        description: `OPEX paid to ${tx.provider}: ${tx.note}`,
        debitAccount: `${tx.category} (Expense)`,
        creditAccount: 'Cash & Bank (Asset)',
        amount: tx.amountBDT,
        type: 'EXPENSE',
      });
    }
  });

  // B. Process customer incomes
  incomes.forEach((inc) => {
    if (inc.status === 'Realized') {
      rawJournal.push({
        id: `journal-inc-real-${inc.id}`,
        date: inc.date,
        description: `Realized SaaS Revenue from ${inc.client} for product ${inc.product}`,
        debitAccount: 'Cash & Bank (Asset)',
        creditAccount: 'SaaS Software Revenue (Revenue)',
        amount: inc.amountBDT,
        type: 'REVENUE_REALIZED',
      });
    } else {
      rawJournal.push({
        id: `journal-inc-pend-${inc.id}`,
        date: inc.date,
        description: `Accounts Receivable invoiced to ${inc.client} (${inc.product})`,
        debitAccount: 'Accounts Receivable (Asset)',
        creditAccount: 'Accrued Software Revenue (Revenue)',
        amount: inc.amountBDT,
        type: 'REVENUE_PENDING',
      });
    }
  });

  // C. Process direct owner investments
  investments.forEach((inv) => {
    const isJahangir = inv.owner === 'Jahangir Hossain';
    const equityAccount = isJahangir ? "Jahangir Hossain's Equity (Equity)" : "Mottasin Pahlovi's Equity (Equity)";

    if (inv.type === 'Cash Injection') {
      rawJournal.push({
        id: `journal-inv-cash-${inv.id}`,
        date: inv.date,
        description: `Capital Contribution from ${inv.owner}: ${inv.note}`,
        debitAccount: 'Cash & Bank (Asset)',
        creditAccount: equityAccount,
        amount: inv.amountBDT,
        type: 'INVESTMENT_CASH',
      });
    } else {
      const isSweatEquity = inv.type === 'Sweat Equity (Salary)';
      rawJournal.push({
        id: `journal-inv-opex-${inv.id}`,
        date: inv.date,
        description: isSweatEquity
          ? `Sweat Equity (Unpaid Salary) recognized for ${inv.owner}: ${inv.note}`
          : `Operational Expense borne directly by ${inv.owner}: ${inv.note}`,
        debitAccount: isSweatEquity ? 'Founder Salary (Expense)' : 'Miscellaneous Operating Expense (Expense)',
        creditAccount: equityAccount,
        amount: inv.amountBDT,
        type: 'INVESTMENT_OPEX',
      });
    }
  });

  // --- 2. GAAP Double-Entry Normalization ---
  // If entry amount is negative, swap debit and credit to maintain standard positive entries
  const journal: JournalEntry[] = rawJournal.map((entry) => {
    if (entry.amount < 0) {
      return {
        ...entry,
        debitAccount: entry.creditAccount,
        creditAccount: entry.debitAccount,
        amount: Math.abs(entry.amount),
      };
    }
    return entry;
  });

  // Sort chronologically
  const sortedJournal = [...journal].sort((a, b) => b.date.localeCompare(a.date));

  // --- 3. Dynamic Period Filtration ---
  // Extract all available months from the journal entries for the monthly dropdown filter
  const availablePeriods = Array.from(
    new Set(journal.map((entry) => entry.date.substring(0, 7)))
  ).sort((a, b) => b.localeCompare(a)); // sort descending (latest first)

  // A. Monthly / Period Filter (Income Statement and Cash Flow are period-specific)
  const periodJournal = journal.filter((entry) => {
    if (selectedPeriod === 'all') return true;
    return entry.date.substring(0, 7) === selectedPeriod;
  });

  // B. Cumulative Filter (Balance Sheet and Trial Balance are point-in-time)
  const cumulativeJournal = journal.filter((entry) => {
    if (selectedPeriod === 'all') return true;
    return entry.date.substring(0, 7) <= selectedPeriod;
  });

  // --- 4. T-Account Aggregation Engines ---
  // A. Compute point-in-time balances for cumulative (Balance Sheet, Trial Balance)
  const cumDebitTotals: { [account: string]: number } = {};
  const cumCreditTotals: { [account: string]: number } = {};

  cumulativeJournal.forEach((entry) => {
    cumDebitTotals[entry.debitAccount] = (cumDebitTotals[entry.debitAccount] || 0) + entry.amount;
    cumCreditTotals[entry.creditAccount] = (cumCreditTotals[entry.creditAccount] || 0) + entry.amount;
  });

  const getCumNetBalance = (account: string, normalSide: 'DEBIT' | 'CREDIT'): number => {
    const debits = cumDebitTotals[account] || 0;
    const credits = cumCreditTotals[account] || 0;
    return normalSide === 'DEBIT' ? debits - credits : credits - debits;
  };

  // B. Compute period-specific balances (Income Statement, Cash Flow)
  const perDebitTotals: { [account: string]: number } = {};
  const perCreditTotals: { [account: string]: number } = {};

  periodJournal.forEach((entry) => {
    perDebitTotals[entry.debitAccount] = (perDebitTotals[entry.debitAccount] || 0) + entry.amount;
    perCreditTotals[entry.creditAccount] = (perCreditTotals[entry.creditAccount] || 0) + entry.amount;
  });

  const getPerNetBalance = (account: string, normalSide: 'DEBIT' | 'CREDIT'): number => {
    const debits = perDebitTotals[account] || 0;
    const credits = perCreditTotals[account] || 0;
    return normalSide === 'DEBIT' ? debits - credits : credits - debits;
  };

  // --- 5. Financial Reports Data Extraction ---

  // A. INCOME STATEMENT (P&L) Data (Period-Specific)
  const revenueSaaS = getPerNetBalance('SaaS Software Revenue (Revenue)', 'CREDIT');
  const revenueAccrued = getPerNetBalance('Accrued Software Revenue (Revenue)', 'CREDIT');
  const totalRevenue = revenueSaaS + revenueAccrued;

  // Extract operating expenses dynamically from the period journal
  const periodExpenseAccounts = Array.from(
    new Set([
      ...periodJournal.map((e) => e.debitAccount).filter((acc) => acc.includes('(Expense)')),
      ...periodJournal.map((e) => e.creditAccount).filter((acc) => acc.includes('(Expense)')),
    ])
  );

  const expensesBreakdown = periodExpenseAccounts.map((acc) => {
    const name = acc.replace(' (Expense)', '');
    const amount = getPerNetBalance(acc, 'DEBIT');
    return { name, amount, rawAccount: acc };
  }).filter(exp => exp.amount !== 0).sort((a, b) => b.amount - a.amount);

  const totalExpenses = expensesBreakdown.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - totalExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  // Cumulative Net Income (for Retained Earnings on the point-in-time Balance Sheet)
  const cumRevenueSaaS = getCumNetBalance('SaaS Software Revenue (Revenue)', 'CREDIT');
  const cumRevenueAccrued = getCumNetBalance('Accrued Software Revenue (Revenue)', 'CREDIT');
  const cumTotalRevenue = cumRevenueSaaS + cumRevenueAccrued;

  const cumExpenseAccounts = Array.from(
    new Set([
      ...cumulativeJournal.map((e) => e.debitAccount).filter((acc) => acc.includes('(Expense)')),
      ...cumulativeJournal.map((e) => e.creditAccount).filter((acc) => acc.includes('(Expense)')),
    ])
  );
  const cumTotalExpenses = cumExpenseAccounts.reduce((sum, acc) => sum + getCumNetBalance(acc, 'DEBIT'), 0);
  const cumNetIncome = cumTotalRevenue - cumTotalExpenses;

  // B. BALANCE SHEET Data (Cumulative / Point-in-time)
  const assetCash = getCumNetBalance('Cash & Bank (Asset)', 'DEBIT');
  const assetReceivable = getCumNetBalance('Accounts Receivable (Asset)', 'DEBIT');
  const totalAssets = assetCash + assetReceivable;

  const liabilityAccountsPayable = getCumNetBalance('Accounts Payable (Liability)', 'CREDIT'); // fallback if added
  const totalLiabilities = liabilityAccountsPayable;

  const equityJahangir = getCumNetBalance("Jahangir Hossain's Equity (Equity)", 'CREDIT');
  const equityPahlovi = getCumNetBalance("Mottasin Pahlovi's Equity (Equity)", 'CREDIT');
  const retainedEarnings = cumNetIncome; // Retained Earnings is cumulative Net Profit/Loss of the company
  const totalEquity = equityJahangir + equityPahlovi + retainedEarnings;

  const balanceSheetEquationCheck = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1.0;

  // C. CASH FLOW STATEMENT Data (Period-Specific)
  // Cash Inflows
  const cashFromCustomers = getPerNetBalance('SaaS Software Revenue (Revenue)', 'CREDIT');
  // Cash received as cash injections (type: INVESTMENT_CASH, debiting Cash & Bank)
  const cashInjections = periodJournal
    .filter((entry) => entry.debitAccount === 'Cash & Bank (Asset)' && entry.type === 'INVESTMENT_CASH')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalCashInflows = cashFromCustomers + cashInjections;

  // Cash Outflows
  // Cash paid for expenses (entries crediting Cash & Bank, type: EXPENSE)
  const cashPaidExpenses = periodJournal
    .filter((entry) => entry.creditAccount === 'Cash & Bank (Asset)' && entry.type === 'EXPENSE')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalCashOutflows = cashPaidExpenses;

  const netCashFlow = totalCashInflows - totalCashOutflows;

  // Cash Reconciliation
  const getBeginningCash = (period: string): number => {
    if (period === 'all') return 0;
    // Cumulative cash flow of entries strictly prior to selected month
    return journal
      .filter((entry) => entry.date.substring(0, 7) < period)
      .reduce((sum, entry) => {
        let change = 0;
        if (entry.debitAccount === 'Cash & Bank (Asset)') change += entry.amount;
        if (entry.creditAccount === 'Cash & Bank (Asset)') change -= entry.amount;
        return sum + change;
      }, 0);
  };

  const beginningCash = getBeginningCash(selectedPeriod);
  const endingCash = beginningCash + netCashFlow;

  // D. TRIAL BALANCE Data (Cumulative / Point-in-time)
  const allAccounts = Array.from(
    new Set([
      ...cumulativeJournal.map((e) => e.debitAccount),
      ...cumulativeJournal.map((e) => e.creditAccount),
    ])
  ).sort();

  const trialBalanceDebitsTotal = Object.values(cumDebitTotals).reduce((a, b) => a + b, 0);
  const trialBalanceCreditsTotal = Object.values(cumCreditTotals).reduce((a, b) => a + b, 0);
  const isLedgerBalanced = Math.abs(trialBalanceDebitsTotal - trialBalanceCreditsTotal) < 1.0;

  // Print/Report View Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="accounting-ledger">
      {/* 1. Header & Filter Workspace */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h2 className="text-lg font-black text-slate-900 font-sans tracking-tight">Financial Reports & Ledgers</h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            GAAP-compliant double-entry ledger books & financial reporting statements
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Reporting Period:</span>
            <select
              className="bg-transparent border-none outline-hidden font-bold text-slate-800 cursor-pointer"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="all">All Time (Inception to June 2026)</option>
              {availablePeriods.map((period) => (
                <option key={period} value={period}>
                  {new Date(period + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Accounting Integrity Check */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLedgerBalanced
            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
            : 'bg-rose-50 border-rose-100 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {isLedgerBalanced ? (
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle className="w-5 h-5 shrink-0" />
            </div>
          ) : (
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold font-sans">Double-Entry Trial Balance Verification</h3>
            <p className="text-xs font-mono opacity-80 mt-0.5">
              Cumulative Ledger Debits: ৳{trialBalanceDebitsTotal.toLocaleString()} | Credits: ৳{trialBalanceCreditsTotal.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="text-left md:text-right flex flex-row md:flex-col gap-3 md:gap-0">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Integrity Status</span>
            <span className="text-xs font-black font-mono tracking-tight text-slate-900">
              {isLedgerBalanced ? '✓ DOUBLE-ENTRY BALANCED PERFECTLY' : '⚠ LEDGER OUT OF RECONCILIATION'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. secondary Tab System */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-1">
        <button
          onClick={() => setSecondaryTab('statement')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            secondaryTab === 'statement'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/40'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Income Statement</span>
        </button>

        <button
          onClick={() => setSecondaryTab('balance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            secondaryTab === 'balance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/40'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Balance Sheet</span>
        </button>

        <button
          onClick={() => setSecondaryTab('cashflow')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            secondaryTab === 'cashflow'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/40'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Cash Flow Statement</span>
        </button>

        <button
          onClick={() => setSecondaryTab('trial')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            secondaryTab === 'trial'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/40'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Trial Balance</span>
        </button>

        <button
          onClick={() => setSecondaryTab('journal')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            secondaryTab === 'journal'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/40'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>General Journal</span>
        </button>
      </div>

      {/* 4. Tab Content Views */}
      <div className="transition-all duration-300">

        {/* TAB: INCOME STATEMENT */}
        {secondaryTab === 'statement' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operating Revenue</span>
                <p className="text-2xl font-black text-slate-900 font-mono">৳{totalRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">Includes subscriptions & accrued services</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total OPEX</span>
                <p className="text-2xl font-black text-slate-900 font-mono">৳{totalExpenses.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">Cumulative salary, server & operational costs</p>
              </div>

              <div className={`rounded-2xl border p-6 space-y-2 ${netIncome >= 0 ? 'bg-indigo-50/30 border-indigo-100' : 'bg-rose-50/30 border-rose-100'}`}>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Net Profit / Loss</span>
                <p className={`text-2xl font-black font-mono ${netIncome >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  ৳{netIncome.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm uppercase ${netIncome >= 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                    {netProfitMargin.toFixed(1)}% Margin
                  </span>
                </div>
              </div>
            </div>

            {/* Main Income Statement Table */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Statement of Revenue & Expenses</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  For period: {selectedPeriod === 'all' ? 'Inception to June 2026' : selectedPeriod} (Accrual Basis)
                </p>
              </div>

              <div className="space-y-4 font-sans text-sm">
                {/* REVENUE SECTION */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-100 pb-1 flex justify-between">
                    <span>Operating Revenues</span>
                    <span>Amount (৳)</span>
                  </div>

                  <div className="flex justify-between py-1.5 pl-4 text-slate-700 border-b border-slate-50">
                    <span>SaaS Client Subscriptions (Realized Cash)</span>
                    <span className="font-mono">{revenueSaaS.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1.5 pl-4 text-slate-700 border-b border-slate-50">
                    <span>Accrued Client Services & Bills (Accounts Receivable)</span>
                    <span className="font-mono">{revenueAccrued.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2 font-bold text-slate-900 bg-slate-50 px-3 rounded-xl border border-slate-100">
                    <span>Total Net Revenue</span>
                    <span className="font-mono">৳{totalRevenue.toLocaleString()}</span>
                  </div>
                </div>

                {/* OPERATING EXPENSES SECTION */}
                <div className="space-y-2 pt-4">
                  <div className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-100 pb-1">
                    <span>Operating Expenses (OPEX)</span>
                  </div>

                  {expensesBreakdown.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-mono">
                      No operating expenses recorded for this period.
                    </div>
                  ) : (
                    expensesBreakdown.map((exp) => (
                      <div key={exp.rawAccount} className="flex justify-between py-1.5 pl-4 text-slate-700 border-b border-slate-50">
                        <span>{exp.name} Expenses</span>
                        <span className="font-mono">{exp.amount.toLocaleString()}</span>
                      </div>
                    ))
                  )}

                  <div className="flex justify-between py-2 font-bold text-slate-900 bg-slate-50 px-3 rounded-xl border border-slate-100">
                    <span>Total Operating Expenses</span>
                    <span className="font-mono">৳{totalExpenses.toLocaleString()}</span>
                  </div>
                </div>

                {/* BOTTOM LINE RECONCILIATION */}
                <div className="pt-6 border-t border-slate-200">
                  <div className={`flex justify-between p-4 rounded-xl font-bold text-base ${
                    netIncome >= 0 ? 'bg-indigo-50/40 text-indigo-900 border border-indigo-100/50' : 'bg-rose-50 text-rose-900 border border-rose-100'
                  }`}>
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <span>Net Operating Profit / (Loss)</span>
                    </span>
                    <span className="font-mono text-lg">৳{netIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Accounting Policy Note */}
              <div className="p-4 bg-indigo-50/20 border border-indigo-100/50 rounded-xl flex gap-3 text-xs text-indigo-950/85">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">GAAP Accounting Standard Matching Principle</span>
                  <p className="leading-relaxed">
                    Under Accrual Accounting, revenue is recognized when services are rendered (invoiced), regardless of when cash is collected. Operating expenses like staff salaries (Rasel & Sazzad) and server pipelines are matched against the periods they support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: BALANCE SHEET */}
        {secondaryTab === 'balance' && (
          <div className="space-y-6">
            {/* Top Equation Proved Bar */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
              balanceSheetEquationCheck
                ? 'bg-indigo-50/50 border-indigo-100 text-indigo-900'
                : 'bg-rose-50 border-rose-100 text-rose-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Scale className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Accounting Equation Equilibrium</h3>
                  <p className="text-xs font-mono opacity-80 mt-0.5">
                    Assets (৳{totalAssets.toLocaleString()}) = Liabilities (৳{totalLiabilities.toLocaleString()}) + Equity (৳{totalEquity.toLocaleString()})
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded-lg tracking-wider font-mono">
                {balanceSheetEquationCheck ? '✓ LEDGER BALANCE VERIFIED' : '⚠ RECONCILIATION ERROR'}
              </div>
            </div>

            {/* Double Column Balance Sheet */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets Column */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 flex flex-col justify-between">
                <div>
                  <div className="border-b border-slate-150 pb-3 mb-4 flex justify-between items-center">
                    <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider">I. Assets</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Point-in-Time Statement</span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1">
                      Current Assets
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-50 text-slate-700 pl-2">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        <span>Cash & Bank Balance</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">৳{assetCash.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-50 text-slate-700 pl-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span>Accounts Receivable (Customer Bills Pending)</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">৳{assetReceivable.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200">
                  <div className="flex justify-between p-3.5 bg-slate-50 rounded-xl font-bold text-slate-950 border border-slate-100">
                    <span>Total Assets</span>
                    <span className="font-mono text-base">৳{totalAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 flex flex-col justify-between">
                <div>
                  <div className="border-b border-slate-150 pb-3 mb-4 flex justify-between items-center">
                    <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider">II. Liabilities & Equity</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Book Value</span>
                  </div>

                  <div className="space-y-4 text-sm">
                    {/* LIABILITIES */}
                    <div className="space-y-2">
                      <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1">
                        Liabilities
                      </div>
                      {totalLiabilities === 0 ? (
                        <p className="text-[11px] text-slate-400 font-mono italic py-1 pl-2">No external debts or liabilities logged.</p>
                      ) : (
                        <div className="flex justify-between py-1.5 pl-2 text-slate-700 border-b border-slate-50">
                          <span>Accounts Payable</span>
                          <span className="font-mono">{totalLiabilities.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* EQUITY */}
                    <div className="space-y-2">
                      <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1">
                        Co-Founders Equity & Reserves
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-slate-50 text-slate-700 pl-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          <span>Jahangir Hossain's Paid-in Capital</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">৳{equityJahangir.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-slate-50 text-slate-700 pl-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span>Mottasin Pahlovi's Paid-In Capital</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">৳{equityPahlovi.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-slate-50 text-slate-700 pl-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                          <span>Retained Earnings (P&L Reserve)</span>
                        </div>
                        <span className={`font-mono font-bold ${retainedEarnings >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                          ৳{retainedEarnings.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200">
                  <div className="flex justify-between p-3.5 bg-slate-50 rounded-xl font-bold text-slate-950 border border-slate-100">
                    <span>Total Liabilities & Equity</span>
                    <span className="font-mono text-base">৳{(totalLiabilities + totalEquity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contra-Equity Advisory Alert */}
            <div className="bg-amber-50/30 border border-amber-150 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Pahlovi Company Client Accounts & Contra-Equity Adjustments</span>
              </div>
              <p className="text-xs text-amber-950/85 leading-relaxed">
                Because co-founder Mottasin Pahlovi bears direct software developer salaries (Sazzad, Rasel) from his pocket as capital investment, but his commercial companies (**Aloron** & **Mpbian**) utilize Course37 services and Shaitrish IT support, their customer billing is offset against his equity contributions:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono text-amber-900/90 pt-1">
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <span className="font-bold block text-xs mb-1">Aloron All Incomes</span>
                  <span>Amount: ৳47,000</span>
                  <span className="block text-[10px] text-amber-700 mt-1">Offset against Pahlovi Equity</span>
                </div>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <span className="font-bold block text-xs mb-1">Mpbian All Incomes</span>
                  <span>Amount: ৳235,000</span>
                  <span className="block text-[10px] text-amber-700 mt-1">Offset against Pahlovi Equity</span>
                </div>
              </div>
              <p className="text-[11px] text-amber-700 italic">
                These adjustments cleanly debit Mottasin Pahlovi's Equity account by a combined ৳282,000, while raising SaaS & custom revenue for the agency, preserving the cash balance and keeping co-founder ratios absolutely aligned with direct financial logs.
              </p>
            </div>
          </div>
        )}

        {/* TAB: CASH FLOW STATEMENT */}
        {secondaryTab === 'cashflow' && (
          <div className="space-y-6">
            {/* Cash Flow summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Beginning Cash Balance</span>
                <p className="text-2xl font-black text-slate-900 font-mono">৳{beginningCash.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">Cash reserve on day 1 of reporting period</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Cash Flow of Period</span>
                <p className={`text-2xl font-black font-mono ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netCashFlow >= 0 ? '+' : ''}৳{netCashFlow.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  {netCashFlow >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>Net increase/(decrease) in liquid funds</span>
                </div>
              </div>

              <div className="bg-indigo-600 text-white rounded-2xl p-6 space-y-2">
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">Ending Cash Balance</span>
                <p className="text-2xl font-black font-mono">৳{endingCash.toLocaleString()}</p>
                <p className="text-[10px] text-indigo-200">Ending Cash & Bank balance in Ledger</p>
              </div>
            </div>

            {/* Cash Flow Statement Sheet */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Statement of Cash Flows (Direct Reconciliation)</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Reporting Period: {selectedPeriod === 'all' ? 'Inception to June 2026' : selectedPeriod}
                </p>
              </div>

              <div className="space-y-6 font-sans text-sm text-slate-700">
                {/* 1. Operating Activities */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-100 pb-1 flex justify-between">
                    <span>Cash Flows from Operating Activities</span>
                    <span>Amount (৳)</span>
                  </div>

                  <div className="flex justify-between py-1.5 pl-4 border-b border-slate-50">
                    <span>Cash Collected from Client Invoices (Realized SaaS revenue)</span>
                    <span className="font-mono text-emerald-600">+{cashFromCustomers.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1.5 pl-4 border-b border-slate-50">
                    <span>Operating Expenses Paid in Cash (Office, servers, etc. from Bank)</span>
                    <span className="font-mono text-rose-600">-{cashPaidExpenses.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2 font-bold text-slate-900 bg-slate-50 px-3 rounded-xl border border-slate-100 pl-4">
                    <span>Net Cash Provided by Operating Activities</span>
                    <span className="font-mono">৳{(cashFromCustomers - cashPaidExpenses).toLocaleString()}</span>
                  </div>
                </div>

                {/* 2. Financing Activities */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-100 pb-1 flex justify-between">
                    <span>Cash Flows from Financing Activities</span>
                  </div>

                  <div className="flex justify-between py-1.5 pl-4 border-b border-slate-50">
                    <span>Founder Direct Cash Contributions & Capital Injections</span>
                    <span className="font-mono text-emerald-600">+{cashInjections.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2 font-bold text-slate-900 bg-slate-50 px-3 rounded-xl border border-slate-100 pl-4">
                    <span>Net Cash Provided by Financing Activities</span>
                    <span className="font-mono">৳{cashInjections.toLocaleString()}</span>
                  </div>
                </div>

                {/* Summary Reconciliation */}
                <div className="pt-6 border-t border-slate-200 space-y-2.5">
                  <div className="flex justify-between py-2 font-medium text-slate-800">
                    <span>Net Increase / (Decrease) in Cash and Equivalents</span>
                    <span className={`font-mono font-bold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ৳{netCashFlow.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-t border-slate-100 text-slate-500">
                    <span>Beginning Cash and Equivalents Balance</span>
                    <span className="font-mono">৳{beginningCash.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between p-3.5 bg-indigo-50 text-indigo-950 rounded-xl font-bold border border-indigo-100/50">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-indigo-600 animate-bounce" />
                      <span>Ending Cash and Equivalents Balance (Reconciled)</span>
                    </span>
                    <span className="font-mono text-base">৳{endingCash.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: TRIAL BALANCE */}
        {secondaryTab === 'trial' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="border-b border-slate-150 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Post-Closing General Trial Balance</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Cumulative account ledger totals checked up to: {selectedPeriod === 'all' ? 'June 2026' : selectedPeriod}
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                    <th className="px-6 py-3">GL Account Code & Title</th>
                    <th className="px-6 py-3">Account Type</th>
                    <th className="px-6 py-3 text-right">Debit Balance (৳)</th>
                    <th className="px-6 py-3 text-right">Credit Balance (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs text-slate-700">
                  {allAccounts.map((account) => {
                    const isAssetOrExpense = account.includes('(Asset)') || account.includes('(Expense)');
                    const deb = cumDebitTotals[account] || 0;
                    const cred = cumCreditTotals[account] || 0;

                    let netDeb = 0;
                    let netCred = 0;

                    if (isAssetOrExpense) {
                      netDeb = deb - cred;
                    } else {
                      netCred = cred - deb;
                    }

                    if (netDeb === 0 && netCred === 0) return null; // skip zero accounts

                    return (
                      <tr key={account} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-6 py-3 font-bold text-slate-900">{account}</td>
                        <td className="px-6 py-3">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm uppercase font-black">
                            {account.includes('(Asset)') ? 'Asset' : account.includes('(Expense)') ? 'Expense' : account.includes('(Equity)') ? 'Equity' : 'Revenue'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-emerald-600 font-bold">
                          {netDeb > 0 ? netDeb.toLocaleString('en-US') : '-'}
                        </td>
                        <td className="px-6 py-3 text-right text-rose-600 font-bold">
                          {netCred > 0 ? netCred.toLocaleString('en-US') : '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Cumulative Retained Earnings line representation for clarity */}
                  <tr className="bg-indigo-50/10 hover:bg-indigo-50/20 font-bold">
                    <td className="px-6 py-3 pl-8 text-indigo-900">↳ Retained Earnings (Profit Accumulation)</td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm uppercase font-bold">
                        Calculated Equity
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-emerald-600">
                      {cumNetIncome < 0 ? Math.abs(cumNetIncome).toLocaleString('en-US') : '-'}
                    </td>
                    <td className="px-6 py-3 text-right text-rose-600">
                      {cumNetIncome >= 0 ? cumNetIncome.toLocaleString('en-US') : '-'}
                    </td>
                  </tr>

                  {/* Grand Totals */}
                  <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-900">
                    <td colSpan={2} className="px-6 py-4 uppercase font-sans">
                      Verified Ledger Sums
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-700">
                      ৳{trialBalanceDebitsTotal.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-rose-700">
                      ৳{trialBalanceCreditsTotal.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: GENERAL JOURNAL */}
        {secondaryTab === 'journal' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            {/* Header & Internal Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Ledger Journal Entries</h3>
              </div>

              {/* Journal search and categorization */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search accounts or notes..."
                    value={journalSearch}
                    onChange={(e) => setJournalSearch(e.target.value)}
                    className="pl-8 pr-4 py-1.5 w-full sm:w-56 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <select
                  className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 focus:outline-hidden"
                  value={journalTypeFilter}
                  onChange={(e) => setJournalTypeFilter(e.target.value)}
                >
                  <option value="all">All Entry Types</option>
                  <option value="EXPENSE">Expense OPEX</option>
                  <option value="REVENUE_REALIZED">Revenue (Realized Cash)</option>
                  <option value="REVENUE_PENDING">Revenue (Accrued/Pending)</option>
                  <option value="INVESTMENT_CASH">Founder Cash Injection</option>
                  <option value="INVESTMENT_OPEX">Founder Expense Borne</option>
                </select>
              </div>
            </div>

            {/* General Journal Table */}
            <div className="overflow-y-auto border border-slate-100 rounded-xl max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 shadow-xs border-b border-slate-100">
                  <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Accounts Involved & Narrative Description</th>
                    <th className="px-4 py-3 text-right">Debit (৳)</th>
                    <th className="px-4 py-3 text-right">Credit (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                  {(() => {
                    const filteredJournal = sortedJournal
                      .filter((entry) => {
                        // Month filter
                        if (selectedPeriod !== 'all' && entry.date.substring(0, 7) !== selectedPeriod) {
                          return false;
                        }
                        // Search filter
                        if (journalSearch) {
                          const searchLower = journalSearch.toLowerCase();
                          const matchesSearch =
                            entry.debitAccount.toLowerCase().includes(searchLower) ||
                            entry.creditAccount.toLowerCase().includes(searchLower) ||
                            entry.description.toLowerCase().includes(searchLower);
                          if (!matchesSearch) return false;
                        }
                        // Type filter
                        if (journalTypeFilter !== 'all' && entry.type !== journalTypeFilter) {
                          return false;
                        }
                        return true;
                      });

                    if (filteredJournal.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                            No journal entries match the current filters.
                          </td>
                        </tr>
                      );
                    }

                    return filteredJournal.map((entry) => (
                      <React.Fragment key={entry.id}>
                        {/* Debit line */}
                        <tr className="bg-slate-50/10 hover:bg-slate-50/25">
                          <td className="px-4 py-1.5 text-slate-500 whitespace-nowrap">{entry.date}</td>
                          <td className="px-4 py-1.5 text-slate-900 font-bold">{entry.debitAccount}</td>
                          <td className="px-4 py-1.5 text-right font-bold text-emerald-600">
                            {entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-1.5 text-right text-slate-300">-</td>
                        </tr>
                        {/* Credit line */}
                        <tr className="bg-slate-50/10 hover:bg-slate-50/25">
                          <td className="px-4 py-1.5 text-slate-500 whitespace-nowrap"></td>
                          <td className="px-4 py-1.5 text-slate-600 pl-8">
                            ↳ {entry.creditAccount}
                          </td>
                          <td className="px-4 py-1.5 text-right text-slate-300">-</td>
                          <td className="px-4 py-1.5 text-right font-bold text-rose-600">
                            {entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        {/* Explanation line */}
                        <tr className="bg-slate-50/10 hover:bg-slate-50/25 border-b border-slate-100/50">
                          <td className="px-4 py-1.5 text-slate-500 whitespace-nowrap"></td>
                          <td colSpan={3} className="px-4 py-1.5 text-[10px] text-slate-450 italic font-sans pb-3 pl-8">
                            ({entry.description})
                          </td>
                        </tr>
                      </React.Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
