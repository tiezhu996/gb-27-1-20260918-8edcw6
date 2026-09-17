import { Card, Form, Input, Select, InputNumber, Button, Space, Typography, Alert, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CourseType, Course } from '@/types/course';
import { getErrorReasons } from '@/utils/error';

const { Title } = Typography;

const categories = ['数学', '语文', '英语', '物理', '化学', '编程', '职业技能', '其他'];
const tagsOptions = ['基础', '进阶', '入门', '高级', '实战', '理论'];

export interface CourseFormValues {
  name: string;
  description: string;
  cover?: string;
  category: string;
  tags?: string[];
  type: CourseType;
  price?: number;
}

interface CourseFormProps {
  title: string;
  submitText: string;
  /** 已有课程（编辑模式），用于表单回填 */
  initialCourse?: Course;
  /** 提交逻辑由调用方决定（创建 / 更新），返回需要跳转的课程 id */
  onSubmit: (values: CourseFormValues) => Promise<{ id: string }>;
  successMessage: string;
}

export default function CourseForm({
  title,
  submitText,
  initialCourse,
  onSubmit,
  successMessage,
}: CourseFormProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);

  const initialValues: Partial<CourseFormValues> = initialCourse
    ? {
        name: initialCourse.name,
        description: initialCourse.description,
        cover: initialCourse.cover,
        category: initialCourse.category,
        tags: initialCourse.tags || [],
        type: initialCourse.type,
        price: Number(initialCourse.price),
      }
    : { type: CourseType.FREE, price: 0 };

  const handleFinish = async (values: CourseFormValues) => {
    setReasons([]);
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        cover:
          values.cover ||
          `https://picsum.photos/seed/${initialCourse?.id ?? Date.now()}/400/300`,
        tags: values.tags || [],
        price: values.type === CourseType.PAID ? values.price : 0,
      };
      const result = await onSubmit(payload);
      message.success(successMessage);
      navigate(`/courses/${result.id}`);
    } catch (error) {
      setReasons(getErrorReasons(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Title level={2}>{title}</Title>
      <Card>
        {reasons.length > 0 && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message="保存失败，课程未做任何修改"
            description={
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            }
          />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={initialValues}
        >
          <Form.Item name="name" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
            <Input placeholder="请输入课程名称" />
          </Form.Item>

          <Form.Item name="description" label="课程简介" rules={[{ required: true, message: '请输入课程简介' }]}>
            <Input.TextArea rows={4} placeholder="请输入课程简介" />
          </Form.Item>

          <Form.Item name="cover" label="课程封面 URL">
            <Input placeholder="请输入封面图片 URL (可选)" />
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

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
            {({ getFieldValue }) =>
              getFieldValue('type') === CourseType.PAID ? (
                <Form.Item
                  name="price"
                  label="课程价格"
                  rules={[
                    { required: true, message: '请输入课程价格' },
                    {
                      validator: (_, value) =>
                        value !== undefined && value !== null && Number(value) > 0
                          ? Promise.resolve()
                          : Promise.reject(new Error('付费课程价格必须大于 0')),
                    },
                  ]}
                >
                  <InputNumber
                    min={0.01}
                    step={0.01}
                    precision={2}
                    style={{ width: 200 }}
                    placeholder="请输入大于 0 的价格"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" size="large" loading={submitting}>
                {submitText}
              </Button>
              <Button size="large" onClick={() => navigate('/my-courses')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
