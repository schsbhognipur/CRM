import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { AlertCircle, FileSpreadsheet, Bell } from 'lucide-react';

const DefaultersPage = () => {
  const { data: defaulters, isLoading } = useQuery({
    queryKey: ['defaulters'],
    queryFn: async () => {
      const { data } = await api.get('/student-fees/defaulters');
      return data;
    }
  });

  if (isLoading) return <div className="p-8">Analyzing payment records...</div>;

  const allDefaulters = Object.values(defaulters || {}).flat();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            Fee Defaulters
          </h1>
          <p className="text-sm text-gray-500 mt-1">Students with outstanding balance past their due date.</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
          <FileSpreadsheet size={18} />
          Export List
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {Object.entries(defaulters || {}).map(([course, list]: any) => (
           <div key={course} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-red-500">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">{course}</h3>
              <p className="text-2xl font-bold">{list.length} <span className="text-sm font-normal text-gray-400">students</span></p>
           </div>
         ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course/Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {allDefaulters.map((fee: any) => (
              <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white uppercase">{fee.student.name}</div>
                  <div className="text-xs text-gray-500">{fee.student.enrollmentNo}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {fee.student.course.name} (Y{fee.student.yearOfStudy})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                   ₹{fee.balance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg ml-auto">
                    <Bell size={16} /> Remind
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DefaultersPage;
