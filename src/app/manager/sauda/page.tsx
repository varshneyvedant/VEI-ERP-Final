'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Lock, Plus, Calendar, FileText, CheckCircle2, 
  Clock, AlertCircle, ArrowUpRight, Search, Download, Trash2
} from 'lucide-react';
import { formatCurrency, formatDateIST } from '@/lib/format';
import { exportToExcel } from '@/lib/export/excel';
import { exportToPDF } from '@/lib/export/pdf';

export default function SaudaBookingPage() {
  const queryClient = useQueryClient();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [formData, setFormData] = useState({
    customerId: '',
    ratePerKg: '',
    totalQtyTons: '',
    expiryDate: '',
    notes: '',
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => fetch('/api/customers').then(res => res.json())
  });
  const customers = customersData?.customers || [];

  const { data: saudaData, isLoading } = useQuery({
    queryKey: ['saudaContracts'],
    queryFn: () => fetch('/api/manager/sauda').then(res => res.json())
  });
  const contracts: any[] = saudaData?.contracts || [];

  const { data: marketData } = useQuery({
    queryKey: ['copperCost'],
    queryFn: () => fetch('/api/copper-cost').then(res => res.json())
  });
  const currentCostPerKg = (marketData?.costPerTon || 0) / 1000;

  useEffect(() => {
    if (customers.length > 0 && !formData.customerId) {
      setFormData(prev => ({ ...prev, customerId: customers[0].id }));
    }
  }, [customers, formData.customerId]);

  const bookMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/manager/sauda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book Sauda');
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sauda Contract ${data.contract.contractNo} locked successfully!`);
      setShowBookingModal(false);
      setFormData({
        customerId: customers[0]?.id || '',
        ratePerKg: '',
        totalQtyTons: '',
        expiryDate: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['saudaContracts'] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/manager/sauda?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel contract');
      return data;
    },
    onSuccess: () => {
      toast.success('Sauda contract marked as Cancelled');
      queryClient.invalidateQueries({ queryKey: ['saudaContracts'] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookMutation.mutate(formData);
  };

  const handleCancel = (id: string, contractNo: string) => {
    if (!window.confirm(`Are you sure you want to cancel Sauda Contract ${contractNo}? Remaining quota will be closed.`)) return;
    cancelMutation.mutate(id);
  };

  // Calculations for KPI Cards
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
  const totalBookedTons = activeContracts.reduce((acc, c) => acc + Number(c.totalQtyTons), 0);
  const totalRemainingTons = activeContracts.reduce((acc, c) => acc + Number(c.remainingQty), 0);
  const totalDispatchedTons = totalBookedTons - totalRemainingTons;
  const avgBookedRate = activeContracts.length > 0
    ? activeContracts.reduce((acc, c) => acc + Number(c.ratePerKg) * Number(c.totalQtyTons), 0) / (totalBookedTons || 1)
    : 0;

  // Filtered List
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.contractNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Lock className="text-red-500" /> Copper Rate Booking <span className="text-red-500 font-extrabold">(Sauda)</span>
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Lock advance copper prices for customers. Dispatches automatically draw from booked quota.
          </p>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2 font-bold text-sm w-full sm:w-auto"
        >
          <Plus size={16} /> Book New Sauda Rate
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card border-l-4 border-l-red-500 bg-[#1a1a1a]">
          <span className="text-gray-400 text-xs font-semibold uppercase">Active Booked Quota</span>
          <div className="text-2xl font-black text-white mt-1 tabular-nums">
            {totalBookedTons.toFixed(2)} <span className="text-xs font-normal text-gray-400">Tons</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">{activeContracts.length} Active Contracts</p>
        </div>

        <div className="card border-l-4 border-l-orange-500 bg-[#1a1a1a]">
          <span className="text-gray-400 text-xs font-semibold uppercase">Pending Dispatch</span>
          <div className="text-2xl font-black text-orange-400 mt-1 tabular-nums">
            {totalRemainingTons.toFixed(2)} <span className="text-xs font-normal text-gray-400">Tons</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Yet to be lifted by buyers</p>
        </div>

        <div className="card border-l-4 border-l-green-500 bg-[#1a1a1a]">
          <span className="text-gray-400 text-xs font-semibold uppercase">Dispatched Quota</span>
          <div className="text-2xl font-black text-green-400 mt-1 tabular-nums">
            {totalDispatchedTons.toFixed(2)} <span className="text-xs font-normal text-gray-400">Tons</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Fulfilled through invoices</p>
        </div>

        <div className="card border-l-4 border-l-blue-500 bg-[#1a1a1a]">
          <span className="text-gray-400 text-xs font-semibold uppercase">Avg Booked Copper Rate</span>
          <div className="text-2xl font-black text-blue-400 mt-1 tabular-nums">
            ₹{avgBookedRate.toFixed(2)} <span className="text-xs font-normal text-gray-400">/Kg</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Current FIFO Cost: ₹{currentCostPerKg.toFixed(2)}/Kg</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card bg-[#1a1a1a] p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Contract No, Customer Name, or Notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-red-500 text-white shadow'
                  : 'bg-[#222] text-gray-400 hover:text-white border border-[#333]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts List / Cards */}
      <div className="space-y-4">
        {filteredContracts.map((contract) => {
          const totalTons = Number(contract.totalQtyTons);
          const remTons = Number(contract.remainingQty);
          const fulfilledTons = totalTons - remTons;
          const progressPercent = Math.min(100, Math.max(0, (fulfilledTons / (totalTons || 1)) * 100));

          return (
            <div
              key={contract.id}
              className={`card p-4 sm:p-5 border transition-all ${
                contract.status === 'ACTIVE'
                  ? 'border-[#333] hover:border-red-500/40 bg-[#1a1a1a]'
                  : contract.status === 'COMPLETED'
                  ? 'border-green-500/20 bg-[#161d16]/30'
                  : 'border-[#2a2a2a] bg-[#141414] opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#333]/50 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-white bg-[#222] px-2.5 py-1 rounded border border-[#333]">
                    {contract.contractNo}
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base">{contract.customer.name}</h3>
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Calendar size={12} /> Booked on: {formatDateIST(contract.bookingDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-black uppercase border ${
                      contract.status === 'ACTIVE'
                        ? 'bg-yellow-950/40 text-yellow-400 border-yellow-500/30'
                        : contract.status === 'COMPLETED'
                        ? 'bg-green-950/40 text-green-400 border-green-500/30'
                        : 'bg-gray-800 text-gray-400 border-gray-700'
                    }`}
                  >
                    {contract.status}
                  </span>
                  {contract.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleCancel(contract.id, contract.contractNo)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Cancel Contract"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress and Numbers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3 text-xs">
                <div className="p-2.5 bg-[#222] rounded border border-[#333]/50">
                  <span className="text-gray-400 block mb-0.5">Booked Rate</span>
                  <span className="text-base font-black text-white tabular-nums">₹{Number(contract.ratePerKg).toFixed(2)}/Kg</span>
                </div>
                <div className="p-2.5 bg-[#222] rounded border border-[#333]/50">
                  <span className="text-gray-400 block mb-0.5">Total Booked</span>
                  <span className="text-base font-black text-white tabular-nums">{totalTons.toFixed(2)} Tons</span>
                </div>
                <div className="p-2.5 bg-[#222] rounded border border-[#333]/50">
                  <span className="text-gray-400 block mb-0.5">Dispatched So Far</span>
                  <span className="text-base font-black text-green-400 tabular-nums">{fulfilledTons.toFixed(2)} Tons</span>
                </div>
                <div className="p-2.5 bg-[#222] rounded border border-[#333]/50">
                  <span className="text-gray-400 block mb-0.5">Remaining Quota</span>
                  <span className="text-base font-black text-orange-400 tabular-nums">{remTons.toFixed(2)} Tons</span>
                </div>
              </div>

              {/* Visual Quota Fill Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-400 font-semibold">
                  <span>Quota Lifted: {progressPercent.toFixed(1)}%</span>
                  <span>{remTons.toFixed(2)}T left to lift</span>
                </div>
                <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden border border-[#333]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      progressPercent >= 100 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {contract.notes && (
                <div className="mt-3 text-xs text-gray-400 italic bg-[#1f1f1f] p-2 rounded border border-[#333]/30">
                  📝 {contract.notes}
                </div>
              )}
            </div>
          );
        })}

        {filteredContracts.length === 0 && !isLoading && (
          <div className="card text-center py-12 text-gray-400">
            No Sauda Rate Booking contracts found. Click &quot;Book New Sauda Rate&quot; to lock a price contract.
          </div>
        )}
      </div>

      {/* Book New Sauda Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1a1a1a] border border-[#333] p-5 sm:p-6 rounded-xl max-w-lg w-full shadow-2xl space-y-4">
            <div className="border-b border-[#333] pb-3 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="text-red-500" /> Book Copper Rate (Sauda)
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Select Customer</label>
                <select
                  className="input-field text-sm"
                  value={formData.customerId}
                  onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                  required
                >
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-semibold text-gray-400">Booked Rate (₹/Kg)</label>
                    <span className="text-[10px] text-orange-400">Cost: ₹{currentCostPerKg.toFixed(2)}/Kg</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 845.00"
                    className="input-field text-sm font-bold"
                    value={formData.ratePerKg}
                    onChange={e => setFormData({ ...formData, ratePerKg: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Quantity (Tons)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5.00"
                    className="input-field text-sm font-bold"
                    value={formData.totalQtyTons}
                    onChange={e => setFormData({ ...formData, totalQtyTons: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Total Contract Estimated Value Preview */}
              {Number(formData.ratePerKg) > 0 && Number(formData.totalQtyTons) > 0 && (
                <div className="p-3 bg-red-950/20 rounded-lg border border-red-900/40 flex justify-between items-center text-sm">
                  <span className="text-gray-300 font-medium">Total Contract Value:</span>
                  <span className="text-xl font-black text-white tabular-nums">
                    ₹{(Number(formData.ratePerKg) * Number(formData.totalQtyTons) * 1000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Valid Until / Expiry Date (Optional)</label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={formData.expiryDate}
                  onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Sauda Terms / Notes (e.g. 3 Staggered dispatches in 15 days)</label>
                <textarea
                  rows={2}
                  className="input-field text-sm"
                  placeholder="e.g. Rate booked on phone for 3 equal lots delivery by end of month"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={bookMutation.isPending}
                  className="btn-primary flex-1 bg-red-600 hover:bg-red-700 font-bold"
                >
                  {bookMutation.isPending ? 'Locking Contract...' : 'Lock Sauda Contract'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg hover:text-white font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
