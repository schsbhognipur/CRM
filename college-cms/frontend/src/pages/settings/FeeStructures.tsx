import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
import { Layers, Copy, Save, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const FeeStructures = () => {
  const queryClient = useQueryClient();
  const [selectedYearId, setSelectedYearId] = useState('');
  
  // Matrix state: { "courseId_year": { "componentId": amount } }
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Copy state
  const [copyTargetYear, setCopyTargetYear] = useState('');
  const [showCopyModal, setShowCopyModal] = useState(false);

  // PREFETCHED DATA
  const { data: coursesData } = useQuery({ queryKey: ['courses'], queryFn: settingsService.getCourses });
  const courses = coursesData?.data || [];

  const { data: activeYearData } = useQuery({ queryKey: ['active-academic-year'], queryFn: settingsService.getActiveAcademicYear });
  
  const { data: yearsData } = useQuery({ queryKey: ['academic-years'], queryFn: settingsService.getAcademicYears });
  const academicYears = yearsData?.data || [];

  useEffect(() => {
     if (!selectedYearId && activeYearData?.data?.id) setSelectedYearId(activeYearData.data.id);
  }, [selectedYearId, activeYearData]);

  const { data: componentsData } = useQuery({ queryKey: ['fee-components'], queryFn: settingsService.getFeeComponents });
  const allComponents = (componentsData?.data || []).filter((c:any) => c.isActive);

  // Fetch structures for selected year
  const { data: structuresData, isLoading } = useQuery({
    queryKey: ['fee-structures', selectedYearId],
    queryFn: () => settingsService.getFeeStructures({ academicYearId: selectedYearId }),
    enabled: !!selectedYearId
  });

  const structures = structuresData?.data || [];

  // Populate Matrix
  useEffect(() => {
     if (courses.length > 0 && allComponents.length > 0) {
        const newMatrix: any = {};
        courses.forEach((course: any) => {
           for(let y=1; y<=course.durationYears; y++) {
              const key = `${course.id}_${y}`;
              newMatrix[key] = {};
              allComponents.forEach((c: any) => {
                 newMatrix[key][c.id] = 0;
              });
              
              const struct = structures.find((s:any) => s.courseId === course.id && s.yearOfStudy === y);
              if (struct) {
                 struct.components.forEach((sc: any) => {
                    newMatrix[key][sc.feeComponentId] = Number(sc.amount);
                 });
              }
           }
        });
        setMatrix(newMatrix);
     }
  }, [structures, courses, allComponents, selectedYearId]);

  const handleCommitMatrix = async () => {
     setIsSaving(true);
     try {
        await Promise.all(Object.keys(matrix).map(async (rowKey) => {
           const [courseId, yearStr] = rowKey.split('_');
           const yearOfStudy = parseInt(yearStr);
           const struct = structures.find((s:any) => s.courseId === courseId && s.yearOfStudy === yearOfStudy);
           
           const components = Object.entries(matrix[rowKey]).filter(([_, amt]) => amt > 0).map(([id, amount]) => ({ feeComponentId: id, amount }));
           
           if (struct) {
              await settingsService.updateFeeStructure(struct.id, { components });
           } else {
              if (components.length > 0) {
                 await settingsService.createFeeStructure({
                    courseId, academicYearId: selectedYearId, yearOfStudy, components
                 });
              }
           }
        }));
        
        toast.success('Omni-Matrix synced and ledgers committed globally');
        queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
     } catch (err: any) {
        toast.error('Matrix sync failed. Verify input channels.');
     } finally {
        setIsSaving(false);
     }
  };

  const handleCopyStruct = async () => {
     // A bit hacky, but we can copy the first structure of this year, and the backend replicates ALL structures for that year if we script it, OR our backend takes a specific structure. Wait, our settingsService.copyFeeStructure takes a specific structId. Let's just avoid implementing full timeline copy here unless needed, or we copy a single one. 
     // Wait, maybe we just omit cross-timeline copying for now, or just let them use the backend API if implemented. Actually, the user asked to make it editable from a single page without scrolling. We can just focus on the massive editor.
     toast.error('Target-level replication disabled in Matrix View. Sync directly instead.');
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-[1800px] mx-auto pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Layers className="text-indigo-600" size={32} />
             <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Omni-Matrix Operations</h1>
          </div>
          <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest pl-1">Dense Spreadsheet Financial Architecture</p>
        </div>
        
        <div className="flex gap-4">
           <select 
              value={selectedYearId}
              onChange={e => setSelectedYearId(e.target.value)}
              className="px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700/50 focus:border-indigo-600 rounded-2xl font-black uppercase tracking-widest outline-none text-slate-700 dark:text-white min-w-[250px] shadow-sm cursor-pointer transition-all"
           >
              <option value="" disabled>Select Timeline</option>
              {academicYears.map((ay: any) => <option key={ay.id} value={ay.id}>{ay.label} {ay.isActive ? '(Active)' : ''}</option>)}
           </select>
           
           <button 
              onClick={handleCommitMatrix}
              disabled={isSaving || !selectedYearId}
              className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
           >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Commit Matrix Updates
           </button>
        </div>
      </div>

      {(!selectedYearId || isLoading) ? (
         <div className="p-16 mt-8 text-center bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
            {isLoading ? <Loader2 size={32} className="animate-spin mx-auto text-indigo-600" /> : <p className="text-xs font-black uppercase tracking-widest text-slate-400">Awaiting Timeline Selection</p>}
         </div>
      ) : (
         <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden mt-6">
            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 bg-opacity-80 backdrop-blur-md">
                        <th className="px-6 py-5 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-100 dark:border-slate-800">
                           Vector Node
                        </th>
                        {allComponents.map((c: any) => (
                           <th key={c.id} className="px-6 py-5 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-100 dark:border-slate-800 text-center">
                              {c.name}
                           </th>
                        ))}
                        <th className="px-6 py-5 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-indigo-500 text-right">
                           Sum Total
                        </th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {courses.map((course: any) => {
                        return Array.from({ length: course.durationYears }).map((_, i) => {
                           const y = i + 1;
                           const rowKey = `${course.id}_${y}`;
                           const rowData = matrix[rowKey] || {};
                           const total = Object.values(rowData).reduce((a, b) => a + Number(b), 0);
                           
                           return (
                              <tr key={rowKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                                 <td className="px-6 py-4 whitespace-nowrap border-r border-slate-50 dark:border-slate-800/50 w-64 bg-slate-50/30 dark:bg-slate-900/10">
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{course.name.replace(/_/g, '. ')}</p>
                                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Year {y} Matrix</p>
                                 </td>

                                 {allComponents.map((c: any) => (
                                    <td key={c.id} className="p-2 border-r border-slate-50 dark:border-slate-800/50 min-w-[140px] focus-within:bg-indigo-50/30 dark:focus-within:bg-indigo-900/10 transition-colors">
                                       <div className="relative flex items-center">
                                          <span className="absolute left-3 text-slate-400 font-black text-[11px]">₹</span>
                                          <input 
                                             type="number"
                                             min="0"
                                             value={rowData[c.id] === 0 ? '' : rowData[c.id]}
                                             placeholder="0"
                                             onChange={(e) => setMatrix(prev => ({ ...prev, [rowKey]: { ...prev[rowKey], [c.id]: Number(e.target.value) || 0 } }))}
                                             className="w-full bg-transparent pl-8 pr-3 py-3 border-2 border-transparent focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-slate-700"
                                          />
                                       </div>
                                    </td>
                                 ))}

                                 <td className="px-6 py-4 whitespace-nowrap text-right bg-slate-50/30 dark:bg-slate-900/10">
                                    <p className="text-sm font-black text-indigo-600">₹{total.toLocaleString()}</p>
                                 </td>
                              </tr>
                           );
                        });
                     })}
                  </tbody>
               </table>
            </div>
         </div>
      )}
    </div>
  );
};

export default FeeStructures;
