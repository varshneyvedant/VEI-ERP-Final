'use client';
import { toast } from 'sonner';


import { getCurrentISTInput, formatDateIST } from '@/lib/format';


import { useState, useEffect } from 'react';
import { Check, Download } from 'lucide-react';
import { exportToExcel } from '@/lib/export/excel';
import { exportToPDF } from '@/lib/export/pdf';

export default function ProductionPage() {
  const [formData, setFormData] = useState({
    rawCopperUsed: '',
    productCategory: 'CC Wires',
    brand: 'Poly Vansh',
    wireType: '1mm',
    wireProduced: '',
    date: getCurrentISTInput()
  });
  const [recentProductions, setRecentProductions] = useState<any[]>([]);
  const [copperStock, setCopperStock] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchRecentProductions = () => {
     fetch('/api/manager/production')
        .then(res => res.json())
        .then(data => {
           if (data.productions) setRecentProductions(data.productions);
        });
  };

  const fetchCopperStock = () => {
    fetch('/api/copper-cost')
      .then(res => res.json())
      .then(data => {
         if (typeof data.remainingStockTons === 'number') {
            setCopperStock(data.remainingStockTons);
         }
      });
  };

  useEffect(() => {
     fetchRecentProductions();
     fetchCopperStock();
  }, []);

  const getBrands = (category: string) => {
    if (category === 'CC Wires') return ['Poly Vansh', 'Poly Unnati', 'Poly Unique Plus', 'Poly Unique Plus Premium'];
    if (category === 'Submersible Winding Wire') return ['Poly Lifeline', 'Poly Life Plus'];
    return [];
  };

  const handleCategoryChange = (val: string) => {
    const brands = getBrands(val);
    setFormData({ ...formData, productCategory: val, brand: brands.length > 0 ? brands[0] : '' });
  };

  const raw = parseFloat(formData.rawCopperUsed) || 0;
  const prod = parseFloat(formData.wireProduced) || 0;
  const yieldPercent = raw > 0 ? ((prod / raw) * 100).toFixed(2) : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(formData.rawCopperUsed) || 0;
    const prodVal = parseFloat(formData.wireProduced) || 0;
    if (rawVal <= 0 || prodVal <= 0) {
      toast.error("Please enter valid quantities for raw copper and wire produced.");
      return;
    }
    if (prodVal > rawVal) {
      toast.error("Finished wire produced cannot be greater than raw copper used!");
      return;
    }
    if (copperStock !== null && rawVal > copperStock) {
      toast.error(`Cannot use ${rawVal.toFixed(2)}T of Raw Copper. Only ${copperStock.toFixed(2)}T available in warehouse stock!`);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmAndRecord = async () => {
    setShowConfirmModal(false);
    const res = await fetch('/api/manager/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      toast.error(data.error || 'Failed to record production');
      return;
    }
    toast.success('Production logged successfully!');
    setFormData({ rawCopperUsed: '', productCategory: 'CC Wires', brand: 'Poly Vansh', wireType: '1mm', wireProduced: '', date: getCurrentISTInput() });
    fetchRecentProductions();
    fetchCopperStock();
  };

  const handleUndo = async (id: string) => {
     if (!window.confirm('Are you sure you want to undo this production entry? This will reverse the stock addition and scrap generated.')) return;
     const res = await fetch(`/api/manager/production?id=${id}`, { method: 'DELETE' });
     const data = await res.json();
     if (!res.ok || data.error) {
        alert(data.error || 'Failed to undo production');
        return;
     }
     fetchRecentProductions();
     fetchCopperStock();
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="text-red-500">Log</span> Daily Production
      </h2>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-end mb-1">
               <label className="block text-sm text-gray-400">Raw Copper Used (Tons)</label>
               {copperStock !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${copperStock <= 0 ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                     Available Stock: {copperStock.toFixed(2)} Tons
                  </span>
               )}
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={copperStock ?? undefined}
              className={`input-field ${copperStock !== null && parseFloat(formData.rawCopperUsed || '0') > copperStock ? 'border-red-500 bg-red-950/40 text-red-300 ring-1 ring-red-500' : ''}`}
              value={formData.rawCopperUsed}
              onChange={e => setFormData({...formData, rawCopperUsed: e.target.value})}
              required
            />
            {copperStock !== null && parseFloat(formData.rawCopperUsed || '0') > copperStock && (
              <p className="text-xs text-red-400 font-bold mt-1">
                ⚠️ Exceeds stock (Max: {copperStock.toFixed(2)} Tons)
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Date of Record</label>
            <input
              type="datetime-local"
              className="input-field"
              min="2000-01-01"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Product Category</label>
          <select
            className="input-field"
            value={formData.productCategory}
            onChange={e => handleCategoryChange(e.target.value)}
          >
            <option value="CC Wires">CC Wires</option>
            <option value="Submersible Winding Wire">Submersible Winding Wire</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Brand</label>
          <select
            className="input-field"
            value={formData.brand}
            onChange={e => setFormData({...formData, brand: e.target.value})}
          >
            {getBrands(formData.productCategory).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Produced Wire Type / Size</label>
          <select
            className="input-field"
            value={formData.wireType}
            onChange={e => setFormData({...formData, wireType: e.target.value})}
          >
            <option value="1mm">1mm</option>
            <option value="2mm">2mm</option>
            <option value="3mm">3mm</option>
            <option value="4mm">4mm</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Finished Wire Produced (Tons)</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            value={formData.wireProduced}
            onChange={e => setFormData({...formData, wireProduced: e.target.value})}
            required
          />
        </div>

        <div className="p-4 bg-[#2a2a2a] rounded-md mt-2 flex justify-between items-center">
          <span className="text-gray-300">Production Yield:</span>
          <span className={`text-xl font-bold ${parseFloat(yieldPercent) < 95 ? 'text-red-500' : 'text-green-500'}`}>
            {yieldPercent}%
          </span>
        </div>

        <button type="submit" className="btn-primary mt-4">Record Production</button>
      </form>

      <div className="mt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-xl font-bold text-gray-300">Recent Production History</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                 const dataToExport = recentProductions.map((prod: any) => ({
                    Date: formatDateIST(prod.date),
                    RawCopperUsed: `${Number(prod.rawCopperUsed).toFixed(2)} Tons`,
                    WireProduced: `${Number(prod.wireProduced).toFixed(2)} Tons`,
                    ProductCategory: prod.productCategory,
                    Brand: prod.brand,
                    WireType: prod.wireType,
                    Yield: `${(Number(prod.wireProduced) / Number(prod.rawCopperUsed) * 100).toFixed(2)}%`
                 }));
                 exportToExcel(dataToExport, `Production_History_${new Date().toISOString().slice(0,10)}`);
              }}
              className="flex-1 sm:flex-initial bg-[#1f2937] hover:bg-gray-700 text-white font-bold py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Download size={14}/> Export Excel
            </button>
            <button
              onClick={() => {
                 const headers = ['Date', 'Raw Copper', 'Wire Produced', 'Category', 'Brand', 'Type', 'Yield'];
                 const rows = recentProductions.map((prod: any) => [
                    formatDateIST(prod.date),
                    `${Number(prod.rawCopperUsed).toFixed(2)} T`,
                    `${Number(prod.wireProduced).toFixed(2)} T`,
                    prod.productCategory,
                    prod.brand || '-',
                    prod.wireType,
                    `${(Number(prod.wireProduced) / Number(prod.rawCopperUsed) * 100).toFixed(2)}%`
                 ]);
                 exportToPDF(headers, rows, 'Recent Production History Report');
              }}
              className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Download size={14}/> Export PDF
            </button>
          </div>
        </div>

        {/* Mobile Production Cards (< 640px) */}
        <div className="sm:hidden space-y-3">
          {recentProductions.map((prod) => {
            const rawVal = Number(prod.rawCopperUsed);
            const prodVal = Number(prod.wireProduced);
            const yld = rawVal > 0 ? ((prodVal / rawVal) * 100).toFixed(1) : '0.0';
            return (
              <div key={prod.id} className="p-4 bg-[#1a1a1a] rounded-lg border border-[#333] space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {prod.productCategory === 'Raw Copper Bundle' ? 'Raw Copper' : `${prod.brand || ''} ${prod.wireType}`}
                    </h4>
                    <span className="text-xs text-gray-400">{formatDateIST(prod.date)}</span>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded border ${Number(yld) >= 95 ? 'bg-green-950/40 text-green-400 border-green-500/20' : 'bg-red-950/40 text-red-400 border-red-500/20'}`}>
                    Yield: {yld}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#222] p-2.5 rounded border border-[#333]/50">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Raw Used</span>
                    <span className="font-bold text-gray-200">{rawVal.toFixed(2)} Tons</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Produced</span>
                    <span className="font-bold text-green-400">{prodVal.toFixed(2)} Tons</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#333] flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => handleUndo(prod.id)} 
                    className="w-full py-1.5 text-center text-red-500 hover:text-red-400 text-xs font-bold bg-red-500/10 rounded border border-red-500/20 transition-colors"
                  >
                    Undo / Delete
                  </button>
                </div>
              </div>
            );
          })}
          {recentProductions.length === 0 && (
            <div className="p-6 text-center text-gray-400 card">No recent production records found.</div>
          )}
        </div>

        {/* Desktop/Tablet Table (>= 640px) */}
        <div className="hidden sm:block overflow-x-auto rounded-lg border border-[#333]">
          <table className="w-full text-left bg-[#1a1a1a]">
            <thead className="bg-[#222]">
              <tr className="border-b border-[#333] text-gray-400 text-sm">
                <th className="p-3">Date</th>
                <th className="p-3">Category/Brand</th>
                <th className="p-3">Raw Used</th>
                <th className="p-3">Produced</th>
                <th className="p-3">Yield</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentProductions.map((prod) => {
                const rawVal = Number(prod.rawCopperUsed);
                const prodVal = Number(prod.wireProduced);
                const yld = rawVal > 0 ? ((prodVal / rawVal) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={prod.id} className="border-b border-[#333] last:border-0 text-sm hover:bg-[#2a2a2a] transition-colors">
                    <td className="p-3 text-gray-300 whitespace-nowrap">{formatDateIST(prod.date)}</td>
                    <td className="p-3 text-white font-medium">
                      {prod.productCategory === 'Raw Copper Bundle' ? 'Raw Copper' : `${prod.brand || ''} ${prod.wireType}`}
                    </td>
                    <td className="p-3 text-gray-300 whitespace-nowrap">{rawVal.toFixed(2)} T</td>
                    <td className="p-3 font-bold text-green-400 whitespace-nowrap">{prodVal.toFixed(2)} T</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${Number(yld) >= 95 ? 'text-green-400 bg-green-950/40' : 'text-red-400 bg-red-950/40'}`}>
                        {yld}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button type="button" onClick={() => handleUndo(prod.id)} className="text-red-500 hover:text-red-400 text-xs font-bold px-2.5 py-1 bg-red-500/10 rounded border border-red-500/20 transition-colors">
                        Undo / Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {recentProductions.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">No recent production found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 overflow-y-auto">
           <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-lg max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                 <Check className="text-green-500" /> Confirm Production Log
              </h3>
              <p className="text-sm text-gray-400 mb-4 border-b border-[#333]/50 pb-2">
                 Please review the details below before recording the production.
              </p>

              <div className="space-y-3 mb-6 text-sm text-gray-300">
                 <div className="flex justify-between">
                    <span className="text-gray-400">Product Category:</span>
                    <span className="font-bold text-white">{formData.productCategory}</span>
                 </div>
                 {formData.productCategory !== 'Raw Copper Bundle' && (
                    <>
                       <div className="flex justify-between">
                          <span className="text-gray-400">Brand:</span>
                          <span className="font-bold text-white">{formData.brand}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-400">Wire Type / Size:</span>
                          <span className="font-bold text-white">{formData.wireType}</span>
                       </div>
                    </>
                 )}
                 <div className="flex justify-between border-t border-[#333]/30 pt-2">
                    <span className="text-gray-400">Raw Copper Used:</span>
                    <span className="font-bold text-white">{formData.rawCopperUsed} Tons</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400">Finished Wire Produced:</span>
                    <span className="font-bold text-green-400">{formData.wireProduced} Tons</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400">Scrap Generated:</span>
                    <span className="font-bold text-red-500">{(parseFloat(formData.rawCopperUsed) - parseFloat(formData.wireProduced)).toFixed(2)} Tons</span>
                 </div>
                 <div className="flex justify-between bg-red-950/10 border border-red-900/30 p-2 rounded">
                    <span className="text-gray-400">Production Yield:</span>
                    <span className="font-bold text-white">{yieldPercent}%</span>
                 </div>
                 <div className="flex justify-between border-t border-[#333]/30 pt-2 text-xs text-gray-400">
                    <span>Log Date:</span>
                    <span>{formData.date ? formatDateIST(formData.date) : 'Current Time'}</span>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button 
                    onClick={handleConfirmAndRecord}
                    className="btn-primary flex-1 bg-green-600 hover:bg-green-700 font-bold"
                 >
                    Confirm & Record
                 </button>
                 <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 bg-[#2a2a2a] text-gray-300 hover:text-white rounded font-bold border border-[#333]"
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
