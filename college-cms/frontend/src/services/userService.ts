import api from '../api/axios';

export const userService = {
  getUsers: async (params: any) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  createUser: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: string) => {
    const response = await api.put(`/users/${id}/toggle-active`);
    return response.data;
  },

  resetPassword: async (id: string, newPassword?: string) => {
    const response = await api.put(`/users/${id}/reset-password`, newPassword ? { newPassword } : {});
    return response.data;
  }
};
