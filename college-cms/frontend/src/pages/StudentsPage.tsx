import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Search, Filter, Plus, FileDown, Upload, User, ChevronRight } from 'lucide-react';
import { debounce } from 'lodash';

const StudentsPage = () => {
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
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });
      const { data } = await api.get(`/students?${params}`);
      return data;
    }
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      // In a real app, I'd have a courses endpoint
      return [];
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Directory</h1>
        <div className="flex items-center gap-3">
          <button className="bg-white dark:bg-gray-800 border dark:border-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <FileDown size={18} /> Export
          </button>
          <button className="bg-white dark:bg-gray-800 border dark:border-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <Upload size={18} /> Import
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-700">
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, enrollment no, phone..."
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
            <Filter size={18} /> Filters
          </button>
        </div>

        {/* Filter Panel (Simplified) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <select 
             className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 p-2 rounded-lg text-sm"
             onChange={(e) => setFilters(f => ({ ...f, courseId: e.target.value }))}
           >
             <option value="">All Courses</option>
             <option value="DPHARMA">D.Pharma</option>
             <option value="BPHARMA">B.Pharma</option>
           </select>
           <select 
             className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 p-2 rounded-lg text-sm"
             onChange={(e) => setFilters(f => ({ ...f, yearOfStudy: e.target.value }))}
           >
             <option value="">All Years</option>
             {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
           </select>
           <select 
             className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 p-2 rounded-lg text-sm"
             onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
           >
             <option value="">All Status</option>
             <option value="ACTIVE">Active</option>
             <option value="INACTIVE">Inactive</option>
             <option value="CANCELLED">Cancelled</option>
           </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border dark:border-gray-700">
        {isLoading ? (
          <div className="p-10 text-center text-gray-500">Loading students...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {studentsData?.data.map((student: any) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white uppercase">{student.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.enrollmentNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.course.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Year {student.yearOfStudy}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button className="text-gray-400 hover:text-blue-600">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentsPage;
