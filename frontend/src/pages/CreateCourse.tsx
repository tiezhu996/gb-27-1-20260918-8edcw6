import { Card, Form, Input, Select, InputNumber, Button, message, Space, Typography, Alert, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { courseApi } from '@/api/course';
import { Course, CourseType, CourseStatus } from '@/types/course';
import { getErrorMessages } from '@/utils/error';

const { Title, Text } = Typography;

const categories = ['数学', '语文', '英语', '物理', '化学', '编程', '职业技能', '其他'];
const tagsOptions = ['基础', '进阶', '入门', '高级', '实战', '理论'];

export default function CreateCourse() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [courseStatus, setCourseStatus] = useState<CourseStatus | null>(null);
  const [submitting, setSubmitting] = useState<'' | 'draft' | 'publish'>('');
  const [reasons, setReasons] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    courseApi
      .get(id)
      .then((data: Course) => {
        setCourseStatus(data.status);
        form.setFieldsValue({
          name: data.name,
          description: data.description,
          cover: data.cover,
          category: data.category,
          tags: data.tags || [],
          type: data.type,
          price: Number(data.price),
        });
      })
      .catch(() => {
        message.error('课程加载失败');
        navigate('/my-courses');
      });
  }, [id, form, navigate]);

  const buildPayload = (values: any) => ({
    name: values.name?.trim(),
    description: values.description?.trim(),
    cover: values.cover?.trim() || undefined,
    category: values.category,
    tags: values.tags || [],
    type: values.type,
    // 免费课价格固定为 0，付费课必须大于 0（表单项已限制）
    price: values.type === CourseType.PAID ? Number(values.price) : 0,
  });

  const onFinish = async (values: any, publishAfterSave: boolean) => {
    setReasons([]);
    setSubmitting(publishAfterSave ? 'publish' : 'draft');
    try {
      const payload = buildPayload(values);
      let courseId = id;

      if (!courseId) {
        const course = await courseApi.create(payload);
        courseId = course.id;
      } else {
        await courseApi.update(courseId, payload);
      }

      if (publishAfterSave) {
        try {
          await courseApi.publish(courseId);
          message.success('课程已上架');
          navigate(`/courses/${courseId}`);
        } catch (publishError) {
          // 课程信息已存为草稿/保持原样，但上架条件不满足：展示全部原因并留在本页
          setCourseStatus(CourseStatus.DRAFT);
          setReasons(getErrorMessages(publishError, '上架失败'));
          message.error('上架失败，请根据提示修改后重试');
          navigate(`/courses/${courseId}/edit`, { replace: !id });
        }
        return;
      }

      message.success(isEdit ? '课程信息已保存' : '草稿已保存');
      navigate(`/courses/${courseId}`);
    } catch (error) {
      // 创建/保存本身被拒绝（如编辑已上架课程不满足售卖条件，原子拒绝）
      setReasons(getErrorMessages(error, '保存失败'));
    } finally {
      setSubmitting('');
    }
  };

  const isPublished = courseStatus === CourseStatus.PUBLISHED;

  return (
    <div>
      <Title level={2}>{isEdit ? '编辑课程' : '创建课程'}</Title>

      {isPublished && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="该课程已上架，修改后仍须满足全部售卖条件（付费课价格大于 0、至少 1 个课时），否则本次保存会被整体拒绝，课程保持原样。"
        />
      )}

      {reasons.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={isPublished ? '保存被拒绝，课程内容未变更' : '课程暂不能上架，已保留草稿内容'}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          }
        />
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => onFinish(values, false)}
          initialValues={{ type: CourseType.FREE, price: 0 }}
        >
          <Form.Item name="name" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
            <Input placeholder="请输入课程名称" />
          </Form.Item>

          <Form.Item name="description" label="课程简介" rules={[{ required: true, message: '请输入课程简介' }]}>
            <Input.TextArea rows={4} placeholder="请输入课程简介" />
          </Form.Item>

          <Form.Item name="cover" label="课程封面 URL">
            <Input placeholder="请输入封面图片 URL (可选，留空将使用默认封面)" />
          </Form.Item>

          <Form.Item name="category" label="课程分类" rules={[{ required: true, message: '请选择课程分类' }]}>
            <Select placeholder="请选择课程分类">
              {categories.map((cat) => (
                <Select.Option key={cat} value={cat}>
                  {cat}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="tags" label="课程标签">
            <Select mode="tags" placeholder="请输入或选择标签" allowClear>
              {tagsOptions.map((tag) => (
                <Select.Option key={tag} value={tag}>
                  {tag}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="type" label="课程类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value={CourseType.FREE}>免费</Select.Option>
              <Select.Option value={CourseType.PAID}>付费</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.type !== curr.type}
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === CourseType.PAID ? (
                <Form.Item
                  name="price"
                  label="课程价格（元）"
                  rules={[
                    { required: true, message: '请输入课程价格' },
                    {
                      validator: (_rule, value) =>
                        Number(value) > 0
                          ? Promise.resolve()
                          : Promise.reject(new Error('付费课程价格必须大于 0')),
                    },
                  ]}
                >
                  <InputNumber
                    min={0.01}
                    precision={2}
                    step={0.01}
                    style={{ width: 200 }}
                    placeholder="请输入大于 0 的价格"
                  />
                </Form.Item>
              ) : (
                <Text type="secondary">免费课程价格固定为 ¥0.00</Text>
              )
            }
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              {isPublished ? (
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={submitting === 'draft'}
                >
                  保存修改
                </Button>
              ) : (
                <>
                  <Button
                    size="large"
                    htmlType="submit"
                    loading={submitting === 'draft'}
                  >
                    保存草稿
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={submitting === 'publish'}
                    onClick={() => {
                      setReasons([]);
                      form.validateFields().then((values) => onFinish(values, true));
                    }}
                  >
                    保存并上架
                  </Button>
                </>
              )}
              <Button size="large" onClick={() => navigate(id ? `/courses/${id}` : '/my-courses')}>
                取消
              </Button>
            </Space>
            {!isPublished && (
              <div style={{ marginTop: 8 }}>
                <Tag color="default">草稿</Tag>
                <Text type="secondary">上架要求：信息完整、付费课价格大于 0，且至少包含 1 个课时</Text>
              </div>
            )}
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
