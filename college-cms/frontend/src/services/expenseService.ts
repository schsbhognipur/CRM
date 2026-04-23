import api from '../api/axios';

export const expenseService = {
  getExpenses: async (params: any) => {
    const response = await api.get('/transactions', { params: { subType: 'EXPENSE', ...params } });
    return response.data;
  },

  createExpense: async (data: any) => {
    const response = await api.post('/transactions/expense', data);
    return response.data;
  },

  updateExpense: async (id: string, data: any) => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: string, reason: string) => {
    const response = await api.delete(`/transactions/${id}`, { params: { reason } });
    return response.data;
  },

  getExpenseSummary: async (params?: any) => {
    const response = await api.get('/transactions/expense-summary', { params });
    return response.data;
  },

  getCategories: async (all = false) => {
    const response = await api.get('/expense-categories', { params: { all } });
    return response.data;
  },

  createCategory: async (data: any) => {
    const response = await api.post('/expense-categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: any) => {
    const response = await api.put(`/expense-categories/${id}`, data);
    return response.data;
  },

  downloadVoucher: async (transactionId: string) => {
    const response = await api.get(`/transactions/${transactionId}/voucher-pdf`, {
      responseType: 'blob'
    });
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // We don't have the exact voucher no here easily without an extra look up, but we can default it.
    link.setAttribute('download', `Voucher-${transactionId}.pdf`); 
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
