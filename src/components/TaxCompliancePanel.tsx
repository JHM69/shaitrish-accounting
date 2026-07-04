import React from 'react';
import { ShieldCheck, Info, FileText, AlertTriangle } from 'lucide-react';

export default function TaxCompliancePanel() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6" id="tax-compliance-panel">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 font-sans tracking-tight">Bangladesh Tax & VAT Compliance</h2>
          <p className="text-xs text-slate-500 font-mono">NBR Guidelines for Software & ITES (Shaitrish Ltd)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tax Exempt Info */}
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 flex gap-3">
          <div className="text-emerald-600 mt-1 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-800">Software & ITES Tax Exemption</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              In Bangladesh, Income from Software Development and IT-Enabled Services (ITES) is tax-exempt or subject to a heavily reduced corporate tax rate, provided that a valid ITES Tax Exemption Certificate is renewed annually from the NBR.
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100/50 text-emerald-700 text-[10px] font-mono rounded-md">
              <span>Current Status: Exempt under Income Tax Act 2023</span>
            </div>
          </div>
        </div>

        {/* VAT Info */}
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 flex gap-3">
          <div className="text-sky-600 mt-1 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-800">Value Added Tax (VAT)</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Software purchases and local custom development attract a **5% VAT rate** instead of the standard 15% standard rate in Bangladesh. Exported services (earning USD from abroad) enjoy a **0% VAT rating** as service exports.
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-sky-100/50 text-sky-700 text-[10px] font-mono rounded-md">
              <span>MegaPrep Setup Fee: 0% VAT (Export Service)</span>
            </div>
          </div>
        </div>

        {/* Salary TDS Info */}
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 flex gap-3">
          <div className="text-amber-600 mt-1 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-800">Salary TDS (Tax Deducted at Source)</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Employers must deduct tax at source on salaries exceeding **BDT 350,000 annually** (for male individuals) or BDT 400,000 (for female/senior individuals).
            </p>
            <div className="mt-2 text-[11px] text-slate-500 font-mono">
              <div>• Sazzad SWE: BDT 35K/mo = BDT 420K/yr (TDS applicable)</div>
              <div>• Rasel: BDT 37.5K/mo = BDT 450K/yr (TDS applicable)</div>
            </div>
          </div>
        </div>

        {/* Auditing and GAAP Checklist */}
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 flex gap-3">
          <div className="text-indigo-600 mt-1 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-800">GAAP & Audit Readiness</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              To remain compliant with Bangladesh Bank and NBR, Shaitrish must:
            </p>
            <ul className="text-[11px] text-slate-500 mt-1.5 list-disc pl-4 space-y-0.5">
              <li>Keep real-time bank statements matching the Google Workspace invoices.</li>
              <li>Collect C-Form from local banks for all incoming foreign inward remittances (USD).</li>
              <li>Separate operational expenses from capital/equity investment accounts.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
