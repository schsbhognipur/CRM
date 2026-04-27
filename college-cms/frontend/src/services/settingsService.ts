import api from '../api/axios';

export const settingsService = {
  // Courses
  getCourses: async () => {
    const res = await api.get('/courses');
    return res.data;
  },

  // Academic Years
  getAcademicYears: async () => {
    const res = await api.get('/academic-years');
    return res.data;
  },
  getActiveAcademicYear: async () => {
    const res = await api.get('/academic-years/active');
    return res.data;
  },
  createAcademicYear: async (data: any) => {
    const res = await api.post('/academic-years', data);
    return res.data;
  },
  updateAcademicYear: async (id: string, data: any) => {
    const res = await api.put(`/academic-years/${id}`, data);
    return res.data;
  },
  activateAcademicYear: async (id: string) => {
    const res = await api.put(`/academic-years/${id}/activate`);
    return res.data;
  },

  // Fee Components
  getFeeComponents: async () => {
    const res = await api.get('/fee-components');
    return res.data;
  },
  createFeeComponent: async (data: any) => {
    const res = await api.post('/fee-components', data);
    return res.data;
  },
  updateFeeComponent: async (id: string, data: any) => {
    const res = await api.put(`/fee-components/${id}`, data);
    return res.data;
  },

  // Fee Structures
  getFeeStructures: async (params?: any) => {
    const res = await api.get('/fee-structures', { params });
    return res.data;
  },
  createFeeStructure: async (data: any) => {
    const res = await api.post('/fee-structures', data);
    return res.data;
  },
  updateFeeStructure: async (id: string, data: any) => {
    const res = await api.put(`/fee-structures/${id}`, data);
    return res.data;
  },
  bulkUpdateFeeStructures: async (data: any) => {
    const res = await api.post('/fee-structures/bulk', data);
    return res.data;
  },
  copyFeeStructure: async (id: string, targetAcademicYearId: string) => {
    const res = await api.post(`/fee-structures/${id}/copy`, { targetAcademicYearId });
    return res.data;
  },
  deleteFeeStructure: async (id: string) => {
    const res = await api.delete(`/fee-structures/${id}`);
    return res.data;
  }
};
