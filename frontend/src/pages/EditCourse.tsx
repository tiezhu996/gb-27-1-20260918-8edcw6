import { Card, Button, Result, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CourseForm, { CourseFormValues } from '@/components/CourseForm';
import { courseApi } from '@/api/course';
import { Course } from '@/types/course';
import { useAuthStore } from '@/store/auth';
import { getErrorMessage } from '@/utils/error';

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    courseApi
      .get(id)
      .then((data) => {
        if (data.teacherId !== user?.id) {
          setError('无权修改此课程');
        } else {
          setCourse(data);
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  const handleSubmit = (values: CourseFormValues) => {
    if (!id) return Promise.reject(new Error('课程不存在'));
    // 已上架课程若不满足售卖条件，后端会在同一事务中原子拒绝，前端保留原值并展示原因
    return courseApi.update(id, values);
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (error || !course) {
    return (
      <Result
        status="warning"
        title={error || '课程不存在'}
        extra={
          <Button type="primary" onClick={() => navigate('/my-courses')}>
            返回我的课程
          </Button>
        }
      />
    );
  }

  return (
    <CourseForm
      title="编辑课程"
      submitText="保存修改"
      successMessage="课程已保存"
      initialCourse={course}
      onSubmit={handleSubmit}
    />
  );
}
