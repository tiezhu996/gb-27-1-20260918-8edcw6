import { Row, Col, Card, Typography, Tag, Button, Space, Descriptions, List, Avatar, message, Modal } from 'antd';
import { PlayCircleOutlined, BookOutlined, EditOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { courseApi } from '@/api/course';
import { Course, CourseType, CourseStatus, CourseLesson } from '@/types/course';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types/user';
import { getErrorReasons } from '@/utils/error';

const { Title, Text, Paragraph } = Typography;

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (id) {
      loadCourse();
    }
  }, [id]);

  const loadCourse = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await courseApi.get(id);
      setCourse(data);
      if (isAuthenticated) {
        const enrollment = await courseApi.getEnrollment(id);
        setEnrolled(!!enrollment);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    if (!id) return;
    
    Modal.confirm({
      title: '确认报名',
      content: course?.type === CourseType.PAID
        ? `确定支付 ¥${course.price} 报名该课程？`
        : '确定报名该免费课程？',
      onOk: async () => {
        try {
          await courseApi.enroll(id);
          setEnrolled(true);
          message.success('报名成功');
        } catch (error: any) {
          message.error(error.response?.data?.message || '报名失败');
        }
      },
    });
  };

  const handlePlayLesson = (lesson: CourseLesson) => {
    if (lesson.isLive) {
      navigate(`/live/${lesson.id}`);
    } else if (lesson.videoUrl) {
      message.info('播放视频');
    } else {
      message.info('暂无视频');
    }
  };

  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    try {
      await courseApi.publish(id);
      message.success('课程已上架');
      await loadCourse();
    } catch (error) {
      const reasons = getErrorReasons(error);
      Modal.error({
        title: '上架失败，课程仍为草稿状态',
        content: (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ),
      });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <Card><div style={{ textAlign: 'center', padding: 50 }}>加载中...</div></Card>;
  }

  if (!course) {
    return <Card><div style={{ textAlign: 'center', padding: 50 }}>课程不存在</div></Card>;
  }

  const isTeacher = user?.id === course.teacherId;

  return (
    <div>
      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Row gutter={24}>
              <Col span={10}>
                <img
                  src={course.cover}
                  alt={course.name}
                  style={{ width: '100%', borderRadius: 8 }}
                  onError={(e: any) => {
                    e.target.src = `https://picsum.photos/seed/course${course.id}/400/300`;
                  }}
                />
              </Col>
              <Col span={14}>
                <Title level={2}>{course.name}</Title>
                <Space wrap style={{ marginBottom: 16 }}>
                  <Tag color={course.type === CourseType.PAID ? 'gold' : 'green'}>
                    {course.type === CourseType.PAID ? `¥${course.price}` : '免费'}
                  </Tag>
                  <Tag>{course.category}</Tag>
                  {course.tags?.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
                <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  {course.description}
                </Paragraph>
                <Space>
                  <Avatar icon={<BookOutlined />} />
                  <Text>{course.teacher?.name || '未知教师'}</Text>
                </Space>
                <div style={{ marginTop: 24 }}>
                  {isTeacher ? (
                    <Space wrap>
                      {course.status === CourseStatus.DRAFT && (
                        <Tag color="orange">草稿（未上架）</Tag>
                      )}
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/courses/${course.id}/edit`)}
                      >
                        编辑课程
                      </Button>
                      {course.status === CourseStatus.DRAFT && (
                        <Button
                          type="primary"
                          ghost
                          icon={<CloudUploadOutlined />}
                          loading={publishing}
                          onClick={handlePublish}
                        >
                          上架课程
                        </Button>
                      )}
                    </Space>
                  ) : enrolled ? (
                    <Button type="primary" size="large">
                      已报名
                    </Button>
                  ) : (
                    <Button type="primary" size="large" onClick={handleEnroll}>
                      立即报名
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="课程简介">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="分类">{course.category}</Descriptions.Item>
              <Descriptions.Item label="课时数">
                {course.lessons?.length || 0} 课时
              </Descriptions.Item>
              <Descriptions.Item label="课程类型">
                {course.type === CourseType.PAID ? '付费' : '免费'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card title="课程目录" style={{ marginTop: 24 }}>
        <List
          itemLayout="horizontal"
          dataSource={course.lessons || []}
          locale={{ emptyText: '暂无课时' }}
          renderItem={(lesson, index) => (
            <List.Item
              actions={
                enrolled || isTeacher
                  ? [
                      <Button
                        type="link"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handlePlayLesson(lesson)}
                      >
                        {lesson.isLive ? '进入直播' : '观看视频'}
                      </Button>,
                    ]
                  : []
              }
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ background: '#1890ff' }}>
                    {index + 1}
                  </Avatar>
                }
                title={
                  <Space>
                    {lesson.title}
                    {lesson.isLive && <Tag color="red">直播</Tag>}
                  </Space>
                }
                description={`${lesson.duration} 分钟`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
