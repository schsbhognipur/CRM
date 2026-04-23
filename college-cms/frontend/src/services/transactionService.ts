import api from '../api/axios';

export interface FeePaymentData {
  studentFeeId: string;
  amount: number;
  paymentMode: 'CASH' | 'CHEQUE' | 'UPI' | 'BANK_TRANSFER' | 'DD';
  referenceNo?: string;
  transactionDate?: string;
  remarks?: string;
}

export const transactionService = {
  getTransactions: async (params: any) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  searchStudents: async (q: string) => {
    const response = await api.get(`/students/search?q=${q}`);
    return response.data;
  },

  getStudentFees: async (studentId: string, all = false) => {
    const response = await api.get(`/student-fees/by-student/${studentId}${all ? '?all=true' : ''}`);
    return response.data;
  },

  recordFeePayment: async (data: FeePaymentData) => {
    const response = await api.post('/transactions/fee-payment', data);
    return response.data;
  },

  getReceiptPdf: async (transactionId: string) => {
    const response = await api.get(`/transactions/${transactionId}/receipt-pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  downloadReceipt: (blob: Blob, receiptNo: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Receipt-${receiptNo}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
