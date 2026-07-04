import React from 'react';
import { Transaction, Income, Investment, Product } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface DashboardOverviewProps {
  transactions: Transaction[];
  incomes: Income[];
  investments: Investment[];
  products: Product[];
}

export default function DashboardOverview({
  transactions,
  incomes,
  investments,
  products,
}: DashboardOverviewProps) {
  // 1. Calculations
  // Only operational expenses (exclude owner transfers)
  const opexTransactions = transactions.filter((t) => t.isOperating && t.accountClass === 'Expense');
  const totalOpexBDT = opexTransactions.reduce((sum, t) => sum + t.amountBDT, 0);

  const totalRealizedIncomeBDT = incomes
    .filter((i) => i.status === 'Realized')
    .reduce((sum, i) => sum + i.amountBDT, 0);

  const totalPendingIncomeBDT = incomes
    .filter((i) => i.status === 'Pending')
    .reduce((sum, i) => sum + i.amountBDT, 0);

  // MRR: latest monthly recurring subscription rate for each unique active client+product
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

  const totalInvestmentsBDT = investments.reduce((sum, i) => sum + i.amountBDT, 0);

  // EBITDA / Net Realized Profit
  const netRealizedProfit = totalRealizedIncomeBDT - totalOpexBDT;

  // 2. Monthly Chart Data (Aug 2025 to Jun 2026/Jul 2026)
  const monthsList = [
    '2025-08',
    '2025-09',
    '2025-10',
    '2025-11',
    '2025-12',
    '2026-01',
    '2026-02',
    '2026-03',
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
  ];

  const formatMonthShort = (mStr: string) => {
    const [year, m] = mStr.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1, 15);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const monthlyChartData = monthsList.map((month) => {
    const monthExpenses = opexTransactions
      .filter((t) => t.date.startsWith(month))
      .reduce((sum, t) => sum + t.amountBDT, 0);

    const monthIncomeRealized = incomes
      .filter((i) => i.date.startsWith(month) && i.status === 'Realized')
      .reduce((sum, i) => sum + i.amountBDT, 0);

    const monthIncomePending = incomes
      .filter((i) => i.date.startsWith(month) && i.status === 'Pending')
      .reduce((sum, i) => sum + i.amountBDT, 0);

    return {
      name: formatMonthShort(month),
      Expenses: Math.round(monthExpenses),
      RealizedIncome: Math.round(monthIncomeRealized),
      PendingInvoices: Math.round(monthIncomePending),
      TotalBillings: Math.round(monthIncomeRealized + monthIncomePending),
    };
  });

  const last6MonthsChartData = monthlyChartData.slice(-6);

  // 3. Expense Breakdown by Category for Pie Chart
  const categoryMap: { [cat: string]: number } = {};
  opexTransactions.forEach((tx) => {
    categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amountBDT;
  });

  const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#64748b'];

  const pieData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: Math.round(categoryMap[cat]),
  })).sort((a, b) => b.value - a.value);

  // 4. Product Revenue Mapping
  const productRevenue = products.map((prod) => {
    const prodIncomes = incomes.filter((i) => i.product === prod.name);
    const realized = prodIncomes.filter((i) => i.status === 'Realized').reduce((sum, i) => sum + i.amountBDT, 0);
    const pending = prodIncomes.filter((i) => i.status === 'Pending').reduce((sum, i) => sum + i.amountBDT, 0);
    const isSaaS = prodIncomes.some((i) => i.isRecurring);

    return {
      ...prod,
      realized,
      pending,
      isSaaS,
      clientsCount: Array.from(new Set(prodIncomes.map((i) => i.client))).length,
    };
  });

  return (
    <div className="space-y-6" id="dashboard-overview">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Realized Profit Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">EBITDA / Operating Profit</span>
            <span className={`p-1 rounded-md text-[10px] font-bold ${netRealizedProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {netRealizedProfit >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-black font-sans tracking-tight ${netRealizedProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              ৳{netRealizedProfit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
              <span>Realized Rev</span>
              <span className="text-emerald-600 font-bold">৳{totalRealizedIncomeBDT.toLocaleString()}</span>
              <span>- OPEX</span>
            </div>
          </div>
        </div>

        {/* MRR Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Recurring Revenue</span>
            <span className="bg-indigo-50 text-indigo-700 p-1 rounded-md text-[10px] font-bold">MRR</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-sans tracking-tight text-slate-900">
              ৳{activeMRR.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Active monthly subscription contracts in BDT
            </p>
          </div>
        </div>

        {/* Total OPEX Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Operating Expense</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-sans tracking-tight text-slate-900">
              ৳{totalOpexBDT.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Personnel, Cloud servers, workspace, domains
            </p>
          </div>
        </div>

        {/* Equity Reserves Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid-In Capital Reserves</span>
            <Briefcase className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-sans tracking-tight text-slate-900">
              ৳{totalInvestmentsBDT.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Owner capital injections & expenses borne directly
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">Income Billings vs Expense Progression</h3>
              <p className="text-[11px] text-slate-500 font-mono">Monthly BDT performance for Shaitrish</p>
            </div>
            <div className="flex gap-3 text-[10px] font-mono font-bold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Income Billings</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Operating OPEX</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBillings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOpex" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="TotalBillings" name="Total Income Invoiced" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBillings)" />
                <Area type="monotone" dataKey="Expenses" name="Operating Expenses" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorOpex)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">OPEX Cost Distribution</h3>
            <p className="text-[11px] text-slate-500 font-mono">Division-wise spending breakdown</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 font-mono">No data logged yet</p>
            )}
            <div className="absolute text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Total OPEX</span>
              <div className="text-sm font-black text-slate-900 font-mono">
                ৳{Math.round(totalOpexBDT / 1000)}K
              </div>
            </div>
          </div>

          {/* Pie Legend List */}
          <div className="space-y-1.5 grow overflow-y-auto max-h-36 pt-2">
            {pieData.slice(0, 5).map((entry, index) => {
              const percent = totalOpexBDT > 0 ? (entry.value / totalOpexBDT) * 100 : 0;
              return (
                <div key={entry.name} className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-slate-600 truncate">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>৳{entry.value.toLocaleString()}</span>
                    <span className="text-slate-400 text-[10px]">({percent.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OPEX 6-Month Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">Recent Monthly Expenses</h3>
            <p className="text-[11px] text-slate-500 font-mono">OPEX over the last 6 months</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6MonthsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '11px', color: '#f43f5e' }}
                />
                <Bar dataKey="Expenses" name="Operating Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Products Metrics Row */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Active Product Registry</h3>
          <p className="text-xs text-slate-500 font-mono">Live business modules under shaitrish.com</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {productRevenue.map((prod) => (
            <div key={prod.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 font-mono text-indigo-600">{prod.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 font-semibold rounded-md ${prod.isSaaS ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'}`}>
                  {prod.isSaaS ? 'SaaS / Recurring' : 'Consultancy'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-sans h-8 line-clamp-2 leading-relaxed">
                {prod.description || 'Core service suite'}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <div className="text-[10px] font-mono text-slate-400">Realized Cashflow</div>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">
                    ৳{prod.realized.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400">Clients</div>
                  <div className="font-bold text-slate-800 font-mono mt-0.5">
                    {prod.clientsCount} {prod.clientsCount === 1 ? 'firm' : 'firms'}
                  </div>
                </div>
              </div>

              {prod.pending > 0 && (
                <div className="mt-2 text-[10px] bg-amber-50 text-amber-800 font-mono px-2 py-0.5 rounded-md flex items-center justify-between border border-amber-100/30">
                  <span>Pending Invoice:</span>
                  <span className="font-bold">৳{prod.pending.toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Co-Founder Operational & Contributions Summary */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold font-sans tracking-tight">Co-Founder Operational Briefing</h3>
          </div>
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">
            Active Workspace Ledger Status
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Jahangir Hossain</span>
              <span className="text-[10px] font-mono bg-indigo-600/20 text-indigo-300 px-1.5 py-0.5 rounded font-normal">Full-Time</span>
            </div>
            <p className="leading-relaxed">
              Working <span className="text-white font-semibold">full-time</span> as primary Lead Developer & Ops Lead on the <span className="text-white font-semibold">Course37</span> project.
              Bears excess operating expenses directly out of pocket. Paid <span className="text-white font-semibold">Sumiya's June salary</span> (BDT 5,000) from pocket. Paid for Cloud server, AI API bills, and domain setups.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Mottasin Pahlovi</span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-normal">Capital & Ops Support</span>
            </div>
            <p className="leading-relaxed">
              Provides core financial & structural funding. Funded <span className="text-white font-semibold">Rasel's</span> salary (5 months) and <span className="text-white font-semibold">Sazzad's</span> salary (historic) directly.
              Contributed <span className="text-white font-semibold">BDT 42,000 in cash transfers</span> (BDT 10K & BDT 32K) which were fully utilized to cover early Cloud server and AI API bills.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex flex-wrap gap-x-6 gap-y-1">
          <div>
            <span className="text-indigo-300 font-bold">Personnel Status:</span> Sazzad has formally left the company. Rasel remains active. Sumiya is active.
          </div>
        </div>
      </div>
    </div>
  );
}
