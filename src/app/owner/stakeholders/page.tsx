'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/format';
import { 
  Users, AlertTriangle, CheckCircle, Clock, 
  ShieldAlert, ArrowUpRight, TrendingDown 
} from 'lucide-react';

export default function StakeholdersDashboard() {
  const router = useRouter();
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [agingSummary, setAgingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch('/api/owner/stakeholders');
        const json = await res.json();
        if (isMounted) {
          setStakeholders(json.stakeholders || []);
          setAgingSummary(json.agingSummary || null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="text-gray-400">Loading ledger and credit risk data...</div>;

  const customers = stakeholders.filter(s => s.type === 'Customer');
  const suppliers = stakeholders.filter(s => s.type === 'Supplier');

  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-white">
            <Users className="text-red-500" /> Stakeholder Ledgers & <span className="text-red-500">Aging Risk</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Real-time receivables aging (18-day credit policy), credit limit monitoring, and supplier payables.
          </p>
        </div>
      </div>

      {/* Receivables Aging Analysis Cards */}
      {agingSummary && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} className="text-orange-400" /> Accounts Receivable Aging Analysis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="card border-l-4 border-l-green-500 bg-[#1a1a1a]">
              <span className="text-gray-400 text-xs font-semibold">0 - 15 Days (Current / Safe)</span>
              <div className="text-2xl font-black text-green-400 mt-1 tabular-nums">
                {formatCurrency(agingSummary.bucket0_15)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Within standard credit cycle</p>
            </div>

            <div className="card border-l-4 border-l-yellow-500 bg-[#1a1a1a]">
              <span className="text-gray-400 text-xs font-semibold">16 - 30 Days (Due / Overdue)</span>
              <div className="text-2xl font-black text-yellow-400 mt-1 tabular-nums">
                {formatCurrency(agingSummary.bucket16_30)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">18-day policy limit exceeded</p>
            </div>

            <div className="card border-l-4 border-l-orange-500 bg-[#1a1a1a]">
              <span className="text-gray-400 text-xs font-semibold">31 - 60 Days (Moderate Risk)</span>
              <div className="text-2xl font-black text-orange-400 mt-1 tabular-nums">
                {formatCurrency(agingSummary.bucket31_60)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Dispatch lock applied</p>
            </div>

            <div className="card border-l-4 border-l-red-600 bg-red-950/20">
              <span className="text-red-400 text-xs font-semibold flex items-center gap-1">
                <ShieldAlert size={14} /> 60+ Days (Critical / Default)
              </span>
              <div className="text-2xl font-black text-red-500 mt-1 tabular-nums">
                {formatCurrency(agingSummary.bucket60Plus)}
              </div>
              <p className="text-[11px] text-red-400/80 mt-1">Immediate recovery needed</p>
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="card bg-[#1a1a1a] p-4 sm:p-5">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>Customer Accounts & Credit Health</span>
          <span className="text-xs text-gray-400 font-normal">{customers.length} Parties</span>
        </h3>
        <div className="overflow-x-auto rounded-lg border border-[#333]">
          <table className="w-full text-left">
            <thead className="bg-[#222]">
              <tr className="border-b border-[#333] text-gray-400 text-xs uppercase">
                <th className="p-3">Customer Name</th>
                <th className="p-3 text-right">Credit Limit</th>
                <th className="p-3 text-right">Pending Balance</th>
                <th className="p-3 text-center">Overdue Days</th>
                <th className="p-3 text-center">Dispatch Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#333] last:border-0 hover:bg-[#2a2a2a] transition-colors cursor-pointer text-sm"
                  onClick={() => router.push(`/owner/stakeholders/customer/${item.id}`)}
                >
                  <td className="p-3">
                    <span className="font-bold text-blue-400 hover:underline">{item.name}</span>
                    {item.contact && <span className="block text-xs text-gray-500">{item.contact}</span>}
                  </td>
                  <td className="p-3 text-right font-medium text-gray-300 tabular-nums">
                    {formatCurrency(item.creditLimit)}
                  </td>
                  <td className={`p-3 text-right font-bold tabular-nums ${item.pendingAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(Math.abs(item.pendingAmount))}
                  </td>
                  <td className="p-3 text-center tabular-nums font-bold">
                    {item.maxOverdueDays > 0 ? (
                      <span className={`${item.maxOverdueDays > 18 ? 'text-red-500' : 'text-yellow-400'}`}>
                        {item.maxOverdueDays} Days
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">On Time</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.isOverdue || item.isLimitExceeded ? (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-red-950/40 text-red-400 border border-red-500/30">
                        🔒 LOCKED ({item.isOverdue ? 'Overdue' : 'Limit Exceeded'})
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-green-950/40 text-green-400 border border-green-500/30">
                        ✓ APPROVED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-gray-400">No customer accounts recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card bg-[#1a1a1a] p-4 sm:p-5">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>Supplier Accounts (Payables)</span>
          <span className="text-xs text-gray-400 font-normal">{suppliers.length} Suppliers</span>
        </h3>
        <div className="overflow-x-auto rounded-lg border border-[#333]">
          <table className="w-full text-left">
            <thead className="bg-[#222]">
              <tr className="border-b border-[#333] text-gray-400 text-xs uppercase">
                <th className="p-3">Supplier Name</th>
                <th className="p-3 text-right">Lifetime Volume (Tons)</th>
                <th className="p-3 text-right">Total Billed</th>
                <th className="p-3 text-right text-red-400">We Owe Them</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#333] last:border-0 hover:bg-[#2a2a2a] transition-colors cursor-pointer text-sm"
                  onClick={() => router.push(`/owner/stakeholders/supplier/${item.id}`)}
                >
                  <td className="p-3 font-bold text-blue-400 hover:underline">{item.name}</td>
                  <td className="p-3 text-right text-gray-300 tabular-nums">{Number(item.totalVolume).toFixed(2)}</td>
                  <td className="p-3 text-right text-gray-300 tabular-nums">{formatCurrency(item.totalBilled)}</td>
                  <td className="p-3 text-right font-bold text-red-400 tabular-nums">
                    {formatCurrency(Math.max(0, item.pendingAmount))}
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-center text-gray-400">No supplier accounts recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
