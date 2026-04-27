import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, FileDown, Upload, User, ChevronRight, GraduationCap, UserMinus, UserCheck, Loader2, Zap, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { studentService } from '../services/studentService';
import api from '../api/axios';
import { TableSkeleton } from '../components/ui/Loaders';
import { usePageTitle } from '../hooks/usePageTitle';
import { clsx } from 'clsx';

const ImportStudentsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return toast.error("Please select an Excel file");
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Import failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Bulk Import</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Pulse Onboarding</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="relative p-6 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center text-center group hover:border-indigo-400 transition-all">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-slate-100 group-hover:scale-110 transition-transform text-indigo-600">
              <Upload size={32} />
            </div>
            <p className="text-sm font-black text-slate-700 uppercase">Select Institutional Dataset</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Excel (.xlsx, .csv) files only</p>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <div className="mt-4 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black text-indigo-600">
                {file.name}
              </div>
            )}
          </div>

          <div className="space-y-3">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Headings:</p>
             <div className="flex flex-wrap gap-2">
                {['Name', 'Phone', 'DOB', 'Course', 'Batch Year'].map(h => (
                  <span key={h} className="px-2 py-1 bg-slate-100 rounded-lg text-[9px] font-bold text-slate-500">{h}</span>
                ))}
                <span className="px-2 py-1 bg-indigo-50 rounded-lg text-[9px] font-bold text-indigo-600">...and more</span>
             </div>
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Synchronizing Pulse...
              </>
            ) : (
              <>
                <Zap size={20} />
                Commence Registry Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentsPage = () => {
  usePageTitle('Student Directory');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    courseId: '',
    yearOfStudy: '',
    status: '',
    academicYearId: ''
  });

  const debouncedSearch = useMemo(
    () => debounce((val: string) => setSearchTerm(val), 300),
    []
  );

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', searchTerm, filters],
    queryFn: () => studentService.getStudents({
      search: searchTerm,
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
    }),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: studentService.getCourses
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: studentService.getAcademicYears
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return studentService.updateStudent(id, { status: status as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success("Institutional status synchronized");
    },
    onError: () => {
      toast.error("Failed to establish status update");
    }
  });

  const toggleStatus = (e: React.MouseEvent, student: any) => {
    e.stopPropagation();
    const nextStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    statusMutation.mutate({ id: student.id, status: nextStatus });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <GraduationCap className="text-indigo-600" size={32} />
              <h1 className="text-3xl font-black text-slate-900  tracking-tight uppercase">Student Directory</h1>
           </div>
           <p className="text-slate-500 font-medium ml-1">Managing {studentsData?.pagination?.total || 0} active institutional identities</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white border px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
          >
            <Upload size={18} /> Import
          </button>
          <button className="bg-white border px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
            <FileDown size={18} /> Export
          </button>
          <button 
            onClick={() => navigate('/students/new')}
            className="bg-indigo-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Filter Control Center */}
      <div className="bg-white  p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50  border  space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, enrollment, or phone..."
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-50  rounded-2xl bg-slate-50  focus:bg-white  focus:border-indigo-600 outline-none font-bold transition-all placeholder:text-slate-400"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-4 bg-slate-50  rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-all border-2 border-transparent hover:border-indigo-100">
            <Filter size={18} /> Advanced Filters
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <select 
             className="bg-slate-50  border-2 border-transparent focus:border-indigo-600 p-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all"
             onChange={(e) => setFilters(f => ({ ...f, courseId: e.target.value }))}
             value={filters.courseId}
           >
             <option value="">All Courses</option>
             {courses?.data?.map((c: any) => (
               <option key={c.id} value={c.id}>{c.name.replace(/_/g, '. ')}</option>
             ))}
           </select>

           <select 
             className="bg-slate-50  border-2 border-transparent focus:border-indigo-600 p-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all"
             onChange={(e) => setFilters(f => ({ ...f, academicYearId: e.target.value }))}
             value={filters.academicYearId}
           >
             <option value="">All Academic Years</option>
             {academicYears?.data?.map((ay: any) => (
               <option key={ay.id} value={ay.id}>{ay.label}</option>
             ))}
           </select>

           <select 
             className="bg-slate-50  border-2 border-transparent focus:border-indigo-600 p-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all"
             onChange={(e) => setFilters(f => ({ ...f, yearOfStudy: e.target.value }))}
             value={filters.yearOfStudy}
           >
             <option value="">All Years</option>
             {[1,2,3,4].map(y => <option key={y} value={y.toString()}>Year {y}</option>)}
           </select>

           <select 
             className="bg-slate-50  border-2 border-transparent focus:border-indigo-600 p-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all"
             onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
             value={filters.status}
           >
             <option value="">All Status</option>
             {['ACTIVE', 'INACTIVE', 'CANCELLED', 'PASSED_OUT'].map(s => (
               <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white  rounded-[2.5rem] shadow-xl shadow-slate-200/50  border  overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50  border-b ">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Identity</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment Node</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Curriculum</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">State</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 ">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-slate-100 " />
                           <div className="space-y-2">
                              <div className="h-4 w-32 bg-slate-100  rounded" />
                              <div className="h-3 w-20 bg-slate-50  rounded" />
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6"><div className="h-4 w-24 bg-slate-100  rounded" /></td>
                     <td className="px-8 py-6"><div className="h-4 w-24 bg-slate-100  rounded" /></td>
                     <td className="px-8 py-6"><div className="h-4 w-16 bg-slate-100  rounded" /></td>
                     <td className="px-8 py-6"><div className="h-8 w-8 bg-slate-100  rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : (studentsData?.students || []).map((student: any) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-slate-50  cursor-pointer group transition-colors"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50  overflow-hidden flex items-center justify-center border-2 border-indigo-100  shadow-sm">
                         <span className="text-indigo-600 font-black text-xs">{student.name.substring(0,2).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900  uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{student.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.email || 'No digital node'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                     <span className="text-xs font-black text-indigo-600 bg-indigo-50  px-3 py-1.5 rounded-lg tracking-tight border border-indigo-100 ">
                        {student.enrollmentNo}
                     </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                     <div className="text-xs font-black text-slate-700  uppercase">{student.course?.name?.replace(/_/g, ' ')}</div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Year {student.yearOfStudy} • {student.batchYear}</div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={clsx(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                      student.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    )}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={(e) => toggleStatus(e, student)}
                         disabled={statusMutation.isPending && statusMutation.variables?.id === student.id}
                         title={student.status === 'ACTIVE' ? 'Mark Inactive' : 'Mark Active'}
                         className={clsx(
                           "w-10 h-10 rounded-2xl transition-all flex items-center justify-center border shadow-sm",
                           student.status === 'ACTIVE' 
                             ? "bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 border-rose-100" 
                             : "bg-emerald-50 text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600 border-emerald-100"
                         )}
                       >
                          {statusMutation.isPending && statusMutation.variables?.id === student.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : student.status === 'ACTIVE' ? (
                            <UserMinus size={18} />
                          ) : (
                            <UserCheck size={18} />
                          )}
                       </button>
                       <button className="w-10 h-10 bg-white  rounded-2xl text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50  transition-all flex items-center justify-center border border-transparent group-hover:border-indigo-100 shadow-sm">
                         <ChevronRight size={20} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination (Stub) */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 p-4 border  rounded-2xl bg-white  border-dashed">
         <span>Showing {studentsData?.students?.length || 0} identities</span>
         <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-100  rounded-lg hover:bg-slate-200  transition" disabled>Prev</button>
            <button className="px-4 py-2 bg-slate-100  rounded-lg hover:bg-slate-200  transition" disabled>Next</button>
         </div>
      </div>
      <ImportStudentsModal 
         isOpen={isImportModalOpen} 
         onClose={() => setIsImportModalOpen(false)} 
      />
    </div>
  );
};

export default StudentsPage;
