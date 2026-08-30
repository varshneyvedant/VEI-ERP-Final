'use client';
import { toast } from 'sonner';

import { useState, useEffect } from 'react';
import { Banknote, Users, Truck, Check, Download, Trash2, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDateIST } from '@/lib/format';
import { exportToExcel } from '@/lib/export/excel';
import { exportToPDF } from '@/lib/export/pdf';

export default function PaymentsPage() {
  const [type, setType] = useState<'customer' | 'supplier'>('customer');
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    stakeholderId: '',
    amount: ''
  });
  const [multiplier, setMultiplier] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Recent payments state
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedStakeholder = stakeholders.find(s => s.id === formData.stakeholderId);

  const fetchStakeholders = () => {
    fetch(`/api/${type}s`)
      .then(res => res.json())
      .then(data => {
         const items = type === 'customer' ? data.customers : data.suppliers;
         if(items) {
           setStakeholders(items);
           if(items.length > 0) setFormData(prev => ({ ...prev, stakeholderId: items[0].id }));
         }
      });
  };

  const fetchRecentPayments = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/manager/payments');
      const data = await res.json();
      if (data.payments) {
        setRecentPayments(data.payments);
      }
    } catch (err) {
      console.error('Failed to fetch payments history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStakeholders();
  }, [type]);

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmAndRecord = async () => {
    setShowConfirmModal(false);
    const finalAmount = parseFloat(formData.amount) * multiplier;
    const idempotencyKey = crypto.randomUUID();

    try {
      const res = await fetch('/api/manager/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: type === 'customer' ? 'INCOMING' : 'OUTGOING',
          stakeholderId: formData.stakeholderId, 
          amount: finalAmount, 
          idempotencyKey 
        })
      });
      if (res.ok) {
        toast.success('Payment recorded successfully!');
        setFormData({ ...formData, amount: '' });
        fetchRecentPayments();
      } else {
        const errorData = await res.json();
        toast.error(`Failed to record payment: ${errorData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error occurred while recording payment.');
    }
  };

  const handleUndo = async (paymentId: string) => {
    if (!confirm('Are you absolutely sure you want to UNDO and delete this payment transaction? This will reverse all ledger impacts, decrement client credit balance, and mark invoices as unpaid accordingly.')) {
      return;
    }

    setDeletingId(paymentId);
    try {
      const res = await fetch(`/api/manager/payments?id=${paymentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Payment successfully undone and removed!');
        fetchRecentPayments();
      } else {
        const errorData = await res.json();
        alert(`Failed to undo payment: ${errorData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred while undoing payment.');
    } finally {
      setDeletingId(null);
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const data = recentPayments.map(p => ({
      'Date': formatDateIST(p.date),
      'Type': p.type === 'INCOMING' ? 'Customer Paid Us' : 'We Paid Supplier',
      'Stakeholder Name': p.customer?.name || p.supplier?.name || '-',
      'Amount (₹)': Number(p.amount),
      'Description': p.description || ''
    }));
    exportToExcel(data, 'Stakeholder_Payments_History');
  };

  const handleExportPDF = () => {
    const headers = ['Date & Time', 'Transaction Type', 'Stakeholder', 'Amount', 'Description'];
    const rows = recentPayments.map(p => [
      formatDateIST(p.date),
      p.type === 'INCOMING' ? 'Customer Paid Us' : 'We Paid Supplier',
      p.customer?.name || p.supplier?.name || '-',
      formatCurrency(Number(p.amount)),
      p.description || '-'
    ]);
    exportToPDF(headers, rows, 'Stakeholder Payments History Ledger');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="text-red-500">Record</span> Stakeholder Payment
        </h2>

        <div className="flex gap-4 mb-6">
           <button
             onClick={() => setType('customer')}
             className={`px-6 py-2 flex items-center gap-2 rounded font-bold transition-colors ${type === 'customer' ? 'bg-red-500 text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}
           >
             <Users size={16} /> Customers Paid Us
           </button>
           <button
             onClick={() => setType('supplier')}
             className={`px-6 py-2 flex items-center gap-2 rounded font-bold transition-colors ${type === 'supplier' ? 'bg-red-500 text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}
           >
             <Truck size={16} /> We Paid Supplier
           </button>
        </div>

        <form onSubmit={handleSubmit} className="card flex flex-col gap-6 border-t-4 border-t-red-500 bg-[#1a1a1a]">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
               Select {type === 'customer' ? 'Customer (Sender)' : 'Supplier (Recipient)'}
            </label>
            <select
              className="input-field"
              value={formData.stakeholderId}
              onChange={e => setFormData({...formData, stakeholderId: e.target.value})}
              required
            >
              {stakeholders.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.currentBalance !== undefined ? `(Bal: ₹${Number(s.currentBalance).toLocaleString('en-IN')})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Live Party Balance & Credit Info Card */}
          {selectedStakeholder && (
            <div className="p-3.5 bg-[#222] rounded-lg border border-[#333] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-semibold uppercase">
                  {type === 'customer' ? 'Current Customer Account Balance' : 'Current Supplier Account Balance'}
                </span>
                {type === 'customer' && selectedStakeholder.creditDays && (
                  <span className="text-[11px] text-gray-500">
                    Limit: ₹{Number(selectedStakeholder.creditLimit || 2500000).toLocaleString('en-IN')} ({selectedStakeholder.creditDays}d)
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300 font-medium">
                  {type === 'customer' ? 'Current Outstanding (They Owe Us):' : 'Current Pending (We Owe Them):'}
                </span>
                <span className={`text-base sm:text-lg font-black tabular-nums ${Number(selectedStakeholder.currentBalance || 0) > 0 ? (type === 'customer' ? 'text-red-400' : 'text-orange-400') : 'text-green-400'}`}>
                  {formatCurrency(Number(selectedStakeholder.currentBalance || 0))}
                </span>
              </div>

              {formData.amount && (
                <div className="pt-2 border-t border-[#333] flex justify-between items-center text-xs">
                  <span className="text-gray-400">Projected Balance After Payment:</span>
                  <span className="font-bold text-white tabular-nums">
                    {formatCurrency(Number(selectedStakeholder.currentBalance || 0) - (parseFloat(formData.amount || '0') * multiplier))}
                    {Number(selectedStakeholder.currentBalance || 0) - (parseFloat(formData.amount || '0') * multiplier) < 0 && (
                      <span className="ml-1 text-[10px] text-green-400 font-normal">(Advance / Excess)</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Lump-sum Amount Received/Paid</label>
            <div className="flex gap-2 items-center bg-[#222] border border-[#333] rounded-md focus-within:border-red-500 overflow-hidden">
              <span className="pl-4 text-gray-400 font-bold">₹</span>
              <input
                type="number" step="0.01" className="bg-transparent text-xl font-bold h-14 flex-1 outline-none px-2 text-white" required
                value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                placeholder="Enter amount..."
              />
              <div className="h-8 border-l border-[#444] mx-1"></div>
              <select
                className="bg-transparent text-sm text-gray-400 font-semibold h-14 px-3 outline-none cursor-pointer hover:text-white"
                value={multiplier}
                onChange={e => setMultiplier(Number(e.target.value))}
              >
                <option value="1" className="bg-[#222] text-white">Raw</option>
                <option value="1000" className="bg-[#222] text-white">Thousands</option>
                <option value="100000" className="bg-[#222] text-white">Lakhs</option>
                <option value="10000000" className="bg-[#222] text-white">Crores</option>
              </select>
            </div>
            {formData.amount && (
              <p className="text-sm text-gray-400 mt-2 text-right">
                Final: <span className="text-white font-bold">{formatCurrency(parseFloat(formData.amount) * multiplier)}</span>
              </p>
            )}
          </div>

          <div className="p-4 bg-[#2a2a2a] rounded border border-[#333] flex items-start gap-3">
             <Banknote className="text-gray-400 mt-1" />
             <p className="text-sm text-gray-400">
               <strong>Smart Distribution:</strong> This lump-sum payment will automatically be applied to the oldest unpaid invoices first, clearing them out sequentially until the payment amount is exhausted.
             </p>
          </div>

          <button type="submit" className="btn-primary py-3 text-lg font-bold">
             Record Transaction
          </button>
        </form>
      </div>

      {/* Transaction History Log section */}
      <div className="card border-t-2 border-t-purple-500 bg-[#1a1a1a]/80 backdrop-blur-md">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#333]">
           <div>
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <RotateCcw className="text-purple-400" size={20} /> Recent Payments Ledger
             </h3>
             <p className="text-xs text-gray-400 mt-1">Real-time audit log of recorded stakeholder payments</p>
           </div>
           
           <div className="flex gap-2">
             <button
               onClick={handleExportExcel}
               disabled={recentPayments.length === 0}
               className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-950/40 hover:bg-green-900/60 border border-green-500/20 text-green-400 rounded transition-colors"
             >
               <Download size={14} /> Excel
             </button>
             <button
               onClick={handleExportPDF}
               disabled={recentPayments.length === 0}
               className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-400 rounded transition-colors"
             >
               <Download size={14} /> PDF
             </button>
           </div>
         </div>

         {loadingHistory ? (
           <div className="text-gray-400 py-8 text-center text-sm">Loading recent payments ledger...</div>
         ) : recentPayments.length === 0 ? (
           <div className="text-gray-400 py-8 text-center text-sm italic">No recent stakeholder payments found.</div>
         ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead>
                 <tr className="border-b border-[#333] text-gray-400 text-xs uppercase font-black">
                   <th className="p-3">Date & Time</th>
                   <th className="p-3">Type</th>
                   <th className="p-3">Stakeholder</th>
                   <th className="p-3">Amount</th>
                   <th className="p-3">Description</th>
                   <th className="p-3 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {recentPayments.map((payment) => (
                   <tr key={payment.id} className="border-b border-[#333] last:border-0 hover:bg-[#252525] transition-colors">
                     <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{formatDateIST(payment.date)}</td>
                     <td className="p-3">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${payment.type === 'INCOMING' ? 'bg-green-950/40 text-green-400 border border-green-500/20' : 'bg-red-950/40 text-red-400 border border-red-500/20'}`}>
                         {payment.type === 'INCOMING' ? 'INCOMING' : 'OUTGOING'}
                       </span>
                     </td>
                     <td className="p-3 font-semibold text-white">
                       {payment.customer?.name || payment.supplier?.name || <span className="text-gray-400 italic">None</span>}
                     </td>
                     <td className={`p-3 font-bold text-base ${payment.type === 'INCOMING' ? 'text-green-400' : 'text-red-400'}`}>
                       {payment.type === 'INCOMING' ? '+' : '-'}{formatCurrency(Number(payment.amount))}
                     </td>
                     <td className="p-3 text-xs text-gray-400 max-w-xs truncate">{payment.description || '-'}</td>
                     <td className="p-3 text-right">
                       <button
                         disabled={deletingId !== null}
                         onClick={() => handleUndo(payment.id)}
                         className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black bg-red-950/20 hover:bg-red-900/40 text-red-500 border border-red-500/10 rounded transition-all disabled:opacity-50"
                       >
                         <Trash2 size={12} className={deletingId === payment.id ? "animate-spin" : ""} />
                         Undo
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 overflow-y-auto">
           <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-lg max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                 <Check className="text-green-500" /> Confirm Stakeholder Payment
              </h3>
               <p className="text-sm text-gray-400 mb-4 border-b border-[#333]/50 pb-2">
                  Please review the transaction and balance impacts before recording.
               </p>

               <div className="space-y-3 mb-6 text-sm text-gray-300">
                  <div className="flex justify-between">
                     <span className="text-gray-400">Transaction Type:</span>
                     <span className="font-bold text-white uppercase">{type === 'customer' ? 'Customer Paid Us' : 'We Paid Supplier'}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-400">Stakeholder:</span>
                     <span className="font-bold text-white">
                        {selectedStakeholder?.name || ''}
                     </span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-400">Current Balance Before:</span>
                     <span className="font-bold text-gray-300 tabular-nums">
                        {formatCurrency(Number(selectedStakeholder?.currentBalance || 0))}
                     </span>
                  </div>
                  <div className="flex justify-between border-t border-[#333]/40 pt-2">
                     <span className="text-gray-400">Payment Amount:</span>
                     <span className="font-black text-green-400 text-base tabular-nums">
                        {formatCurrency(parseFloat(formData.amount || '0') * multiplier)}
                     </span>
                  </div>
                  <div className="flex justify-between bg-[#222] p-2.5 rounded border border-[#333] text-xs">
                     <span className="text-gray-300 font-semibold">Net Balance After Payment:</span>
                     <span className="font-bold text-white tabular-nums">
                        {formatCurrency(Number(selectedStakeholder?.currentBalance || 0) - (parseFloat(formData.amount || '0') * multiplier))}
                     </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 pt-1">
                     <span>Application:</span>
                     <span className="italic">Auto-applies to oldest unpaid transactions first</span>
                  </div>
               </div>

               <div className="flex gap-3">
                  <button 
                     onClick={handleConfirmAndRecord}
                     className="btn-primary flex-1 bg-green-600 hover:bg-green-700 font-bold"
                  >
                     Confirm & Record
                  </button>
                  <button 
                     onClick={() => setShowConfirmModal(false)}
                     className="px-4 py-2 bg-[#2a2a2a] text-gray-300 hover:text-white rounded font-bold border border-[#333] text-sm"
                  >
                     Edit / Cancel
                  </button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
}
