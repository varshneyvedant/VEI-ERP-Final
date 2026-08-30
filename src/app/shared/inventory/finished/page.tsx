'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ChevronRight, Box, Tag } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function FinishedGoodsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const role = (session?.user as any)?.role;

  useEffect(() => {
    fetch('/api/shared/inventory/finished')
      .then(res => res.json())
      .then(json => {
         if (json.success) setData(json.tree);
         setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-gray-400">Loading finished goods inventory...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <span className="text-red-500">Finished Goods</span> Inventory
      </h2>
      <p className="text-gray-400 mb-8">
         Real-time physical stock currently sitting in the warehouse. Click on any specific size to view its exact production history log.
      </p>

      {data.length === 0 && (
         <div className="card text-center text-gray-400 py-12">
            No finished goods are currently in stock.
         </div>
      )}

      {data.map((category: any) => (
          <div key={category.name} className="mb-8 sm:mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-1.5 border-b-2 border-red-500/50 pb-2 mb-4 sm:mb-6">
               <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Package className="text-red-500" /> {category.name}
               </h3>
               <div className="text-sm sm:text-base font-bold text-gray-400">
                  Total Category Stock: <span className="text-white tabular-nums">{Number(category.totalStock).toFixed(2)} Tons</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
               {category.brands.map((brand: any) => (
                  <div key={brand.name} className="card bg-[#1a1a1a] border border-[#333]">
                     <div className="flex justify-between items-center mb-3 sm:mb-4 border-b border-[#333] pb-2.5 sm:pb-3">
                        <h4 className="text-lg sm:text-xl font-bold text-gray-200 flex items-center gap-2">
                           <Tag size={16} className="text-blue-400" /> {brand.name}
                        </h4>
                        <div className="font-bold text-blue-400 bg-blue-950/30 px-2.5 py-1 rounded text-xs sm:text-sm tabular-nums">
                           {Number(brand.totalStock).toFixed(2)} Tons
                        </div>
                     </div>

                     <div className="flex flex-col gap-2">
                        {brand.sizes.map((size: any) => (
                           <div
                              key={size.size}
                              onClick={() => router.push(`/shared/inventory/finished/detail?category=${encodeURIComponent(category.name)}&brand=${encodeURIComponent(brand.name)}&size=${encodeURIComponent(size.size)}`)}
                              className="flex justify-between items-center p-3 bg-[#222] rounded-lg hover:bg-[#2a2a2a] cursor-pointer transition-colors group min-h-[44px]"
                           >
                              <div className="flex items-center gap-3">
                                 <Box size={16} className="text-gray-400 group-hover:text-green-400 transition-colors" />
                                 <div>
                                    <span className="font-semibold text-gray-300 text-sm block">{size.size}</span>
                                    {Number(size.available) < 0.50 && (
                                       <span className="text-[10px] text-orange-400 bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-500/30 font-bold">
                                          ⚠️ Low Stock (&lt; 500 Kg)
                                       </span>
                                    )}
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="text-right">
                                    <span className={`font-bold text-base sm:text-lg tabular-nums ${Number(size.available) < 0.50 ? 'text-orange-400' : 'text-white'}`}>
                                       {Number(size.available).toFixed(2)} T
                                    </span>
                                 </div>
                                 <ChevronRight size={16} className="text-gray-500 group-hover:text-white" />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
          </div>
      ))}
    </div>
  );
}
