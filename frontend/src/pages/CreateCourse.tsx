import CourseForm, { CourseFormValues } from '@/components/CourseForm';
import { courseApi } from '@/api/course';

export default function CreateCourse() {
  const handleSubmit = (values: CourseFormValues) =>
    courseApi.create(values);

  return (
    <CourseForm
      title="创建课程"
      submitText="创建课程"
      successMessage="课程创建成功（草稿），添加课时后即可上架"
      onSubmit={handleSubmit}
    />
  );
}
