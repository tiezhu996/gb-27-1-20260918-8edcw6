/* eslint-disable */
// 临时验证脚本：用内存 mock 仓库跑通 CoursesService 的关键业务规则。
// 运行：npx ts-node scripts/verify-course-rules.ts （验证后可删除）
import { CoursesService } from '../src/modules/courses/courses.service';
import { Course, CourseType, CourseStatus } from '../src/common/entities/course.entity';
import { User, UserRole, TeacherStatus } from '../src/common/entities/user.entity';

const APPROVED_TEACHER: User = {
  id: 't1', role: UserRole.TEACHER, teacherStatus: TeacherStatus.APPROVED,
} as User;
const PENDING_TEACHER: User = {
  id: 't2', role: UserRole.TEACHER, teacherStatus: TeacherStatus.PENDING,
} as User;
const STUDENT: User = { id: 's1', role: UserRole.STUDENT } as User;

let users: Record<string, User> = { t1: APPROVED_TEACHER, t2: PENDING_TEACHER, s1: STUDENT };

let courseStore: Record<string, Course> = {};
let lessonStore: Record<string, { courseId: string }[]> = {};
let savedCount = 0;

function resetStores() {
  courseStore = {};
  lessonStore = {};
  savedCount = 0;
}

const userRepo = {
  findOne: async ({ where }: any) => users[where.id] ?? null,
};

const courseRepo = {
  create: (data: any) => ({ ...data } as Course),
  findOne: async ({ where }: any) => courseStore[where.id] ?? null,
  save: async (course: Course) => {
    savedCount++;
    if (!course.id) course.id = 'c' + savedCount;
    courseStore[course.id] = course;
    return course;
  },
};

const lessonRepo = {
  createQueryBuilder: () => ({
    where: () => ({ select: () => ({ getRawOne: async () => ({ max: null }) }) }),
  }),
  create: (data: any) => data,
  save: async (lesson: any) => {
    (lessonStore[lesson.courseId] ??= []).push(lesson);
    return lesson;
  },
};

const enrollmentRepo = {};

// 模拟 TypeORM 事务 + 悲观锁：抛错即回滚（不写入）
const dataSource: any = {
  async transaction<R>(cb: (manager: any) => Promise<R>): Promise<R> {
    let pendingCommit: null | (() => void) = null;
    const manager = {
      findOne: async (_entity: any, { where }: any) => {
        const c = courseStore[where.id];
        return c ? { ...c } : null;
      },
      create: (_entity: any, data: any) => ({ ...data }),
      count: async (_entity: any, { where: { courseId } }: any) =>
        (lessonStore[courseId] || []).length,
      save: async (_entity: any, course: Course) => {
        // 模拟真实事务：提交在回调成功后才生效
        pendingCommit = () => {
          courseStore[course.id] = { ...course };
        };
        return course;
      },
    };
    try {
      const result = await cb(manager);
      pendingCommit?.();
      return result;
    } catch (e) {
      // 回滚：丢弃待提交的保存
      pendingCommit = null;
      throw e;
    }
  },
};

const service = new CoursesService(
  courseRepo as any,
  lessonRepo as any,
  enrollmentRepo as any,
  userRepo as any,
  dataSource as any,
);

let pass = 0;
let fail = 0;
function assert(cond: boolean, name: string) {
  if (cond) { pass++; console.log('  ✅', name); }
  else { fail++; console.log('  ❌', name); }
}
async function expectReject(fn: () => Promise<any>, status: number, name: string) {
  try {
    await fn();
    assert(false, `${name}（应被拒绝但成功了）`);
  } catch (e: any) {
    assert(e?.status === status, `${name}（HTTP ${status}，实际 ${e?.status}）`);
    return e;
  }
}

(async () => {
  // 1. 未审核教师不能创建
  console.log('1) 教师审核门槛');
  await expectReject(
    () => service.create('t2', { name: 'x', type: CourseType.FREE } as any),
    403,
    '审核中的教师创建课程被拒绝',
  );
  await expectReject(
    () => service.create('s1', { name: 'x', type: CourseType.FREE } as any),
    403,
    '学生创建课程被拒绝',
  );
  const created = await service.create('t1', {
    name: '免费课', description: 'd', category: '数学',
    type: CourseType.FREE, price: 999, // 试图给免费课塞价格
  } as any);
  assert(courseStore[created.id].status === CourseStatus.DRAFT, '新建课程强制为草稿');
  assert(courseStore[created.id].price === 0, '免费课价格固定为 0（忽略客户端传 999）');

  await expectReject(
    () => service.create('t1', { name: 'p', type: CourseType.PAID, price: 0 } as any),
    400,
    '付费课价格为 0 创建被拒绝',
  );

  // 2. 绕过页面直接带 status=published 也无效
  console.log('2) 防绕过发布');
  const sneaky = await service.create('t1', {
    name: 's', type: CourseType.FREE, status: CourseStatus.PUBLISHED,
  } as any);
  assert(courseStore[sneaky.id].status === CourseStatus.DRAFT, '请求体携带 status=published 被剥离');
  await service.update('t1', sneaky.id, { status: CourseStatus.PUBLISHED } as any);
  assert(
    courseStore[sneaky.id].status === CourseStatus.DRAFT,
    '通过通用编辑接口携带 status 也无法上架（必须走发布校验）',
  );
  await expectReject(
    () => service.publish('t1', sneaky.id),
    400,
    '不满足售卖条件时走发布接口被拒绝',
  );

  // 3. 发布校验：无课时 / 付费 0 元
  console.log('3) 发布售卖条件');
  const paidDraft = await service.create('t1', {
    name: '付费课', description: 'd', cover: 'c', category: '编程',
    type: CourseType.PAID, price: 19.9,
  } as any);
  const e1 = await expectReject(() => service.publish('t1', paidDraft.id), 400, '无课时不能上架');
  assert(
    Array.isArray(e1.response.message) && e1.response.message.includes('课程至少需要包含 1 个课时'),
    '返回具体原因：至少 1 课时',
  );
  await service.createLesson('t1', paidDraft.id, { title: '第 1 节', duration: 30 } as any);
  // 把价格改成 0 再发布
  await expectReject(
    () => service.update('t1', paidDraft.id, { type: CourseType.PAID, price: 0 } as any).then(() => service.publish('t1', paidDraft.id)),
    400,
    '付费课改 0 元时保存即被拒绝',
  );
  const published = await service.publish('t1', paidDraft.id);
  assert(published.status === CourseStatus.PUBLISHED, '课时 + 合法价格后可上架');

  // 4. 已上架课程编辑不满足条件 → 原子拒绝，不留半更新
  console.log('4) 已上架课程原子拒绝');
  const snapshot = JSON.stringify(courseStore[paidDraft.id]);
  const e2: any = await expectReject(
    () =>
      service.update('t1', paidDraft.id, {
        name: '合法新名字',
        description: '', // 触发违规
        type: CourseType.PAID,
        price: 0, // 同时触发价格违规
      } as any),
    400,
    '已上架课程改成不满足售卖条件被拒绝',
  );
  assert(
    (e2.response.message as string[]).includes('课程简介不能为空') &&
      (e2.response.message as string[]).includes('付费课程价格必须大于 0'),
    '一次性返回全部具体原因',
  );
  assert(
    JSON.stringify(courseStore[paidDraft.id]) === snapshot,
    '拒绝后数据库内容与修改前完全一致（无下架、无半更新）',
  );

  // 删除最后一个课时后编辑已上架课程 → 也必须拒绝
  console.log('5) 课时被删光后保存已上架课程');
  delete lessonStore[paidDraft.id];
  await expectReject(
    () => service.update('t1', paidDraft.id, { name: '新名字' } as any),
    400,
    '已上架课程无课时时编辑被拒绝',
  );
  assert(courseStore[paidDraft.id].status === CourseStatus.PUBLISHED, '课程仍保持上架状态');

  // 6. 合法编辑成功
  await service.createLesson('t1', paidDraft.id, { title: '第 1 节', duration: 30 } as any);
  const updated = await service.update('t1', paidDraft.id, { name: '新名字且条件都满足' } as any);
  assert(updated.name === '新名字且条件都满足' && updated.status === CourseStatus.PUBLISHED, '满足条件时编辑成功且保持上架');

  // 7. 非本人教师不能操作
  console.log('6) 归属权');
  users['t3'] = { id: 't3', role: UserRole.TEACHER, teacherStatus: TeacherStatus.APPROVED } as User;
  await expectReject(
    () => service.publish('t3', sneaky.id),
    403,
    '其他教师不能发布别人的课程',
  );

  console.log(`\n结果：${pass} 通过，${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
})();
