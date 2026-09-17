import { Navigate } from 'react-router-dom';
import { Result, Button, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { UserRole, TeacherStatus } from '@/types/user';

/**
 * 课程创建/编辑入口守卫：仅审核通过的教师可以进入。
 * 后端接口同样会拦截，这里只是避免未审核教师看到入口页面。
 */
export default function ApprovedTeacherGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== UserRole.TEACHER || user.teacherStatus !== TeacherStatus.APPROVED) {
    const pending = user?.role === UserRole.TEACHER && user.teacherStatus === TeacherStatus.PENDING;
    return (
      <Card>
        <Result
          status="403"
          title="暂无课程创建权限"
          subTitle={
            pending
              ? '您的教师资质正在审核中，审核通过后即可创建和发布课程。'
              : '仅审核通过的教师可以创建和发布课程，请先完成教师资质认证。'
          }
          extra={
            <Button type="primary" onClick={() => navigate('/my-courses')}>
              返回我的课程
            </Button>
          }
        />
      </Card>
    );
  }

  return <>{children}</>;
}
