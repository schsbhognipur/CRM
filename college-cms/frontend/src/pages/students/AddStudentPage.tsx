import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import { clsx } from 'clsx';
import { usePageTitle } from '../../hooks/usePageTitle';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().optional(),
  phone: z.string().length(10, "Phone must be 10 digits"),
  alternatePhone: z.string().length(10, "Phone must be 10 digits").optional().or(z.literal('')),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  dob: z.string().min(1, "Date of Birth is required"),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pinCode: z.string().length(6, "Pin Code must be 6 digits"),
  courseId: z.string().min(1, "Course is required"),
  academicYearId: z.string().min(1, "Academic Year is required"),
  yearOfStudy: z.number().min(1).max(4),
  batchYear: z.number().int().min(2000).max(new Date().getFullYear()),
  aadharNo: z.string().length(12, "Aadhar must be 12 digits").optional().or(z.literal('')),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

const FormField = React.forwardRef<HTMLInputElement, any>(
  ({ label, required, error, onChange, ...props }, ref) => {
    return (
      <div className="space-y-1 relative">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">
          {label} {required && '*'}
        </label>
        <input
          ref={ref}
          onChange={onChange}
          className={clsx(
            "w-full pt-2 pb-2 bg-transparent text-sm font-bold outline-none border-[1.5px] border-transparent border-b-slate-200 dark:border-b-slate-700/50 transition-all rounded-none appearance-none px-0",
            error ? "!border-b-rose-500 transition-none" : "focus:!border-b-indigo-600 focus:text-indigo-900 dark:focus:text-indigo-100 placeholder:text-slate-200 dark:placeholder:text-slate-700"
          )}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1.5 mt-2 text-rose-500 absolute -bottom-5 left-0">
             <AlertCircle size={10} />
             <p className="text-[10px] font-bold uppercase tracking-tighter">{error}</p>
          </div>
        )}
      </div>
    );
  }
);

const AddStudentPage = () => {
  usePageTitle('Add New Student');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: studentService.getCourses });
  const { data: academicYears } = useQuery({ queryKey: ['academic-years'], queryFn: studentService.getAcademicYears });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    setError
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      gender: 'MALE',
      yearOfStudy: 1,
      batchYear: new Date().getFullYear(),
      state: 'Uttar Pradesh'
    }
  });

  const selectedCourseId = watch('courseId');
  const selectedCourse = courses?.data?.find((c: any) => c.id === selectedCourseId);

  useEffect(() => {
    if (selectedCourse) {
      const maxYears = selectedCourse.durationYears || (selectedCourse.name.includes('D_PHARMA') ? 2 : 4);
      const currentYear = watch('yearOfStudy');
      if (currentYear > maxYears) {
        setValue('yearOfStudy', 1);
      }
    }
  }, [selectedCourseId, selectedCourse, watch, setValue]);

  useEffect(() => {
    if (academicYears?.data && academicYears.data.length > 0) {
      const activeYear = academicYears.data.find((ay: any) => ay.isActive);
      if (activeYear) {
        setValue('academicYearId', activeYear.id);
      }
    }
  }, [academicYears, setValue]);

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm("Discard changes? Your progress will be lost.")) {
        navigate('/students');
      }
    } else {
      navigate('/students');
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await studentService.createStudent(data);
      if (response.success) {
        toast.success(`Student enrolled — ${response.data.student.enrollmentNo}`, {
          duration: 4000
        });
        if (response.data.warning) {
          toast.warning(response.data.warning, { duration: 6000 });
        }
        queryClient.invalidateQueries({ queryKey: ['students'] });
        navigate(`/students/${response.data.student.id}`);
      }
    } catch (error: any) {
      const apiError = error.response?.data;
      if (apiError?.errors) {
        apiError.errors.forEach((err: any) => {
          setError(err.field as any, { message: err.message });
        });
      }
      toast.error(apiError?.message || "Failed to add student. Please check input.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white dark:bg-slate-950 z-[100] flex flex-col overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="fixed top-0 w-full h-[90px] bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex flex-col">
          <h1 className="text-[24px] font-black text-slate-900 dark:text-white uppercase leading-tight tracking-tight">Add New Student</h1>
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Enrollment Intelligence Matrix</p>
        </div>
        <button 
          onClick={handleClose}
          className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95"
        >
          <X size={24} className="text-slate-400 dark:text-slate-500" />
        </button>
      </div>

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto mt-[90px] mb-[80px] px-6 md:px-12 py-12 custom-scrollbar">
        <form id="add-student-form" onSubmit={handleSubmit(onSubmit)} className="w-full">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* SECTION 01 */}
            <section className="space-y-10">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-black text-[10px] tracking-widest">01</span>
                <h3 className="font-bold text-indigo-900 dark:text-indigo-400 uppercase text-[11px] tracking-[0.15em]">Personal Identification</h3>
              </div>
              <div className="space-y-8">
                <FormField label="Full Name" required error={errors.name?.message} {...register('name')} placeholder="First Last" />
                <FormField label="Father's Name" required error={errors.fatherName?.message} {...register('fatherName')} placeholder="Father's Name" />
                <FormField label="Mother's Name" error={errors.motherName?.message} {...register('motherName')} placeholder="Mother's Name" />
                <FormField label="Date of Birth" required type="date" error={errors.dob?.message} {...register('dob')} />
                
                <div className="space-y-3 pb-2 border-b-[1.5px] border-slate-200 dark:border-slate-700/50">
                   <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">
                     Gender *
                   </label>
                   <div className="flex gap-6">
                      {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                        <label key={g} className="flex items-center gap-2 cursor-pointer group">
                           <input 
                             type="radio" 
                             value={g} 
                             {...register('gender')} 
                             className="w-[14px] h-[14px] text-indigo-600 border-slate-300 focus:ring-indigo-600 dark:bg-slate-900 dark:border-slate-700" 
                           />
                           <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{g}</span>
                        </label>
                      ))}
                   </div>
                </div>
                
                <FormField 
                  label="Aadhar Number" 
                  maxLength={12} 
                  error={errors.aadharNo?.message} 
                  {...register('aadharNo')} 
                  onInput={(e: any) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                  placeholder="000000000000"
                />
              </div>
            </section>

            {/* SECTION 02 */}
            <section className="space-y-10">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-teal-100/50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-black text-[10px] tracking-widest">02</span>
                <h3 className="font-bold text-teal-900 dark:text-teal-400 uppercase text-[11px] tracking-[0.15em]">Contact & Logistics</h3>
              </div>
              <div className="space-y-8">
                <FormField label="Phone Number" required maxLength={10} error={errors.phone?.message} {...register('phone')} placeholder="9999999999" />
                <FormField label="Alternate Phone" maxLength={10} error={errors.alternatePhone?.message} {...register('alternatePhone')} placeholder="9999999999" />
                <FormField label="Email Address" type="email" error={errors.email?.message} {...register('email')} placeholder="student@example.com" />
                
                <div className="space-y-1 relative">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">
                    Address *
                  </label>
                  <textarea 
                    rows={3}
                    className={clsx(
                      "w-full pt-3 pb-2 bg-transparent text-sm font-bold outline-none border-[1.5px] border-transparent border-b-slate-200 dark:border-b-slate-700/50 transition-all rounded-none appearance-none px-0 resize-none",
                      errors.address ? "!border-b-rose-500 transition-none" : "focus:!border-b-indigo-600 focus:text-indigo-900 dark:focus:text-indigo-100 placeholder:text-slate-200 dark:placeholder:text-slate-700"
                    )}
                    placeholder="Street Address..."
                    {...register('address')}
                  />
                  {errors.address && (
                    <div className="flex items-center gap-1.5 mt-2 text-rose-500 absolute -bottom-5 left-0">
                       <AlertCircle size={10} />
                       <p className="text-[10px] font-bold uppercase tracking-tighter">{errors.address.message}</p>
                    </div>
                  )}
                </div>

                <FormField label="City" required error={errors.city?.message} {...register('city')} placeholder="City Name" />
                
                <div className="space-y-1 relative">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">
                    State *
                  </label>
                  <select 
                    className={clsx(
                      "w-full pt-3 pb-2 bg-transparent text-sm font-bold outline-none border-[1.5px] border-transparent border-b-slate-200 dark:border-b-slate-700/50 transition-all rounded-none cursor-pointer px-0",
                      errors.state ? "!border-b-rose-500" : "focus:!border-b-indigo-600 focus:text-indigo-900 dark:focus:text-indigo-100"
                    )}
                    {...register('state')}
                  >
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <FormField label="Pin Code" required maxLength={6} error={errors.pinCode?.message} {...register('pinCode')} placeholder="000000" />
              </div>
            </section>

            {/* SECTION 03 */}
            <section className="space-y-10">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-black text-[10px] tracking-widest">03</span>
                <h3 className="font-bold text-amber-900 dark:text-amber-400 uppercase text-[11px] tracking-[0.15em]">Academic Credentials</h3>
              </div>
              <div className="space-y-8">
                
                <div className="space-y-1 relative">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">
                    Course *
                  </label>
                  <select 
                    className={clsx(
                      "w-full pt-3 pb-2 bg-transparent text-sm font-bold outline-none border-[1.5px] border-transparent border-b-slate-200 dark:border-b-slate-700/50 transition-all rounded-none cursor-pointer px-0",
                      errors.courseId ? "!border-b-rose-500" : "focus:!border-b-indigo-600 focus:text-indigo-900 dark:focus:text-indigo-100"
                    )}
                    {...register('courseId')}
                  >
                    <option value="" disabled>Select Course</option>
                    {courses?.data?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name.replace(/_/g, '. ')}</option>
                    ))}
                  </select>
                  {errors.courseId && (
                    <div className="flex items-center gap-1.5 mt-2 text-rose-500 absolute -bottom-5 left-0">
                       <AlertCircle size={10} />
                       <p className="text-[10px] font-bold uppercase tracking-tighter">{errors.courseId.message}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">
                    Academic Year *
                  </label>
                  <select 
                    className={clsx(
                      "w-full pt-3 pb-2 bg-transparent text-sm font-bold outline-none border-[1.5px] border-transparent border-b-slate-200 dark:border-b-slate-700/50 transition-all rounded-none cursor-pointer px-0",
                      errors.academicYearId ? "!border-b-rose-500" : "focus:!border-b-indigo-600 focus:text-indigo-900 dark:focus:text-indigo-100"
                    )}
                    {...register('academicYearId')}
                  >
                    <option value="" disabled>Select Year</option>
                    {academicYears?.data?.map((ay: any) => (
                      <option key={ay.id} value={ay.id}>{ay.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">
                    Year of Study *
                  </label>
                  <select 
                    className={clsx(
                      "w-full pt-3 pb-2 bg-transparent text-sm font-bold outline-none border-[1.5px] border-transparent border-b-slate-200 dark:border-b-slate-700/50 transition-all rounded-none cursor-pointer px-0",
                      errors.yearOfStudy ? "!border-b-rose-500" : "focus:!border-b-indigo-600 focus:text-indigo-900 dark:focus:text-indigo-100"
                    )}
                    {...register('yearOfStudy', { valueAsNumber: true })}
                  >
                    {[1, 2, 3, 4].filter(y => {
                      if (!selectedCourse) return true;
                      const max = selectedCourse.durationYears || (selectedCourse.name.includes('D_PHARMA') ? 2 : 4);
                      return y <= max;
                    }).map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>

                <FormField label="Batch Year" required type="number" error={errors.batchYear?.message} {...register('batchYear', { valueAsNumber: true })} placeholder="YYYY" />
                
              </div>
            </section>

          </div>
        </form>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 w-full h-[80px] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-50 flex items-center px-6 md:px-12">
        <div className="w-full flex gap-4">
          <button 
            type="button"
            onClick={handleClose}
            className="flex-1 py-4 border-[1.5px] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold text-xs uppercase tracking-[0.1em] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
          >
            Cancel Action
          </button>
          <button 
            type="submit"
            form="add-student-form"
            disabled={isSubmitting}
            className="flex-1 py-4 bg-[#4F46E5] text-white rounded font-bold text-xs uppercase tracking-[0.1em] hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enrolling...
              </>
            ) : (
              'Commit Enrollment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentPage;
