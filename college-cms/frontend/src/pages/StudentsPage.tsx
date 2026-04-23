import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, FileDown, Upload, User, ChevronRight, GraduationCap } from 'lucide-react';
import { debounce } from 'lodash';
import { studentService } from '../services/studentService';
import { TableSkeleton } from '../components/ui/Loaders';
import { usePageTitle } from '../hooks/usePageTitle';
import { clsx } from 'clsx';

const StudentsPage = () => {
  usePageTitle('Student Directory');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
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

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <GraduationCap className="text-indigo-600" size={32} />
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Student Directory</h1>
           </div>
           <p className="text-slate-500 font-medium ml-1">Managing {studentsData?.pagination?.total || 0} active institutional identities</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
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
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, enrollment, or phone..."
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-50 dark:border-slate-900 rounded-2xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 outline-none font-bold transition-all placeholder:text-slate-400"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-all border-2 border-transparent hover:border-indigo-100">
            <Filter size={18} /> Advanced Filters
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <select 
             className="bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 p-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all"
             onChange={(e) => setFilters(f => ({ ...f, courseId: e.target.value }))}
             value={filters.courseId}
           >
             <option value="">All Courses</option>
             {courses?.data?.map((c: any) => (
               <option key={c.id} value={c.id}>{c.name.replace(/_/g, '. ')}</option>
             ))}
           </select>

           <select 
             className="bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 p-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all"
             onChange={(e) => setFilters(f => ({ ...f, academicYearId: e.target.value }))}
             value={filters.academicYearId}
           >
             <option value="">All Academic Years</option>
             {academicYears?.data?.map((ay: any) => (
               <option key={ay.id} value={ay.id}>{ay.label}</option>
             ))}
           </select>

           <select 
             className="bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 p-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all"
             onChange={(e) => setFilters(f => ({ ...f, yearOfStudy: e.target.value }))}
             value={filters.yearOfStudy}
           >
             <option value="">All Years</option>
             {[1,2,3,4].map(y => <option key={y} value={y.toString()}>Year {y}</option>)}
           </select>

           <select 
             className="bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 p-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all"
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
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Identity</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment Node</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Curriculum</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">State</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900" />
                           <div className="space-y-2">
                              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-900 rounded" />
                              <div className="h-3 w-20 bg-slate-50 dark:bg-slate-900/50 rounded" />
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-900 rounded" /></td>
                     <td className="px-8 py-6"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-900 rounded" /></td>
                     <td className="px-8 py-6"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-900 rounded" /></td>
                     <td className="px-8 py-6"><div className="h-8 w-8 bg-slate-100 dark:bg-slate-900 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : (studentsData?.students || []).map((student: any) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer group transition-colors"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-slate-900 overflow-hidden flex items-center justify-center border-2 border-indigo-100 dark:border-slate-800 shadow-sm">
                         <span className="text-indigo-600 font-black text-xs">{student.name.substring(0,2).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{student.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.email || 'No digital node'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                     <span className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg tracking-tight border border-indigo-100 dark:border-indigo-900/50">
                        {student.enrollmentNo}
                     </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                     <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">{student.course?.name?.replace(/_/g, ' ')}</div>
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
                    <button className="w-10 h-10 bg-white dark:bg-slate-900 rounded-2xl text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-all flex items-center justify-center ml-auto border border-transparent group-hover:border-indigo-100 shadow-sm">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination (Stub) */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 p-4 border dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 border-dashed">
         <span>Showing {studentsData?.students?.length || 0} identities</span>
         <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition" disabled>Prev</button>
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition" disabled>Next</button>
         </div>
      </div>
    </div>
  );
};

export default StudentsPage;
