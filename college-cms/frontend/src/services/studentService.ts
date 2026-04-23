import api from '../api/axios';

export interface StudentData {
  name: string;
  fatherName: string;
  motherName?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  city: string;
  state: string;
  pinCode: string;
  courseId: string;
  academicYearId: string;
  yearOfStudy: number;
  batchYear: number;
  aadharNo?: string;
}

export const studentService = {
  createStudent: async (data: StudentData) => {
    const response = await api.post('/students', data);
    return response.data;
  },

  getStudents: async (params: any) => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  getCourses: async () => {
    const response = await api.get('/courses');
    return response.data;
  },

  getAcademicYears: async () => {
    const response = await api.get('/academic-years');
    return response.data;
  }
};
