/**
 * CoursesService 事务行为验证（无需数据库）。
 * 用内存假的 DataSource/manager 模拟事务，验证：
 *  - 未审核通过教师：创建/编辑/发布均 403，且不发生任何写入
 *  - 已上架课程编辑后不满足条件：抛 400 并带具体原因，save 不被调用（原子拒绝，无半更新）
 *  - 满足条件：保存成功，免费课价格归一化为 0
 */
import * as assert from 'assert';
import { CoursesService } from '../src/modules/courses/courses.service';
import { Course, CourseType, CourseStatus } from '../src/common/entities/course.entity';
import { User, UserRole, TeacherStatus } from '../src/common/entities/user.entity';

function makeService(opts: {
  teacher: Partial<User> | null;
  existingCourse: Partial<Course> | null;
  lessonCount: number;
}) {
  const saves: string[] = [];

  const courseRepo = {
    create: (v: any) => v,
    save: async (v: any) => {
      saves.push('course:' + JSON.stringify(v));
      return v;
    },
    findOne: async () => (opts.existingCourse ? ({ ...opts.existingCourse }) as Course : null),
    find: async () => [],
  };
  const lessonRepo = {
    create: (v: any) => v,
    save: async (v: any) => {
      saves.push('lesson');
      return v;
    },
    createQueryBuilder: () => ({
      where: () => ({ select: () => ({ getRawOne: async () => ({ max: 0 }) }) }),
    }),
  };
  const enrollmentRepo = { findOne: async () => null, create: (v: any) => v, save: async (v: any) => v };
  const userRepo = { findOne: async () => (opts.teacher ? ({ ...opts.teacher }) as User : null) };

  const manager = {
    findOne: async () => (opts.existingCourse ? ({ ...opts.existingCourse }) as Course : null),
    count: async () => opts.lessonCount,
    create: (cls: any, v: any) => v,
    save: async (v: any) => {
      saves.push('tx-save:' + JSON.stringify(v));
      return v;
    },
  };
  const dataSource: any = {
    transaction: async (cb: (m: typeof manager) => Promise<any>) => cb(manager),
  };

  const service = new CoursesService(
    courseRepo as any,
    lessonRepo as any,
    enrollmentRepo as any,
    userRepo as any,
    dataSource,
  );
  return { service, saves };
}

const approvedTeacher = {
  id: 't1',
  role: UserRole.TEACHER,
  teacherStatus: TeacherStatus.APPROVED,
} as User;
const pendingTeacher = {
  id: 't2',
  role: UserRole.TEACHER,
  teacherStatus: TeacherStatus.PENDING,
} as User;

(async () => {
  // 1. 待审核教师创建 -> 403，无写入
  {
    const { service, saves } = makeService({ teacher: pendingTeacher, existingCourse: null, lessonCount: 0 });
    await assert.rejects(
      () => service.create('t2', { name: 'c', type: CourseType.PAID, price: 10 } as any),
      (e: any) => e.status === 403,
      '待审核教师创建应被 403 拒绝',
    );
    assert.strictEqual(saves.length, 0, '被拒绝时不应有任何写入');
  }

  // 2. 已上架课程改成价格 0 的付费课 + 无课时 -> 400 带两条原因，tx-save 不调用
  {
    const { service, saves } = makeService({
      teacher: approvedTeacher,
      existingCourse: {
        id: 'c1',
        teacherId: 't1',
        type: CourseType.PAID,
        price: 99,
        status: CourseStatus.PUBLISHED,
      },
      lessonCount: 0,
    });
    const err = await service
      .update('t1', 'c1', { price: 0 } as any)
      .then(() => null)
      .catch((e) => e);
    assert.ok(err, '应抛错');
    assert.strictEqual(err.status, 400, '应为 400');
    const reasons: string[] = err.getResponse().reasons;
    assert.ok(reasons.includes('付费课程价格必须大于 0'), '应含价格原因');
    assert.ok(reasons.includes('上架课程至少需要一个课时'), '应含课时原因');
    assert.strictEqual(saves.length, 0, '原子拒绝：事务内不应执行 save');
  }

  // 3. 已上架课程编辑合法 -> 保存，免费课价格归一化为 0
  {
    const { service, saves } = makeService({
      teacher: approvedTeacher,
      existingCourse: {
        id: 'c2',
        teacherId: 't1',
        type: CourseType.FREE,
        price: 0,
        status: CourseStatus.PUBLISHED,
      },
      lessonCount: 2,
    });
    const saved: any = await service.update('t1', 'c2', { type: CourseType.FREE, price: 0 } as any);
    assert.strictEqual(Number(saved.price), 0, '免费课价格应为 0');
    assert.ok(saves.some((s) => s.startsWith('tx-save:')), '应在事务内保存');
  }

  // 4. 发布无课时付费课 -> 400，无保存
  {
    const { service, saves } = makeService({
      teacher: approvedTeacher,
      existingCourse: {
        id: 'c3',
        teacherId: 't1',
        type: CourseType.PAID,
        price: 50,
        status: CourseStatus.DRAFT,
      },
      lessonCount: 0,
    });
    const err = await service.publish('t1', 'c3').then(() => null).catch((e) => e);
    assert.ok(err && err.status === 400, '发布无课时应 400');
    assert.strictEqual(saves.length, 0, '发布失败不应保存');
  }

  // 5. 非本人编辑 -> 403，无保存
  {
    const { service, saves } = makeService({
      teacher: approvedTeacher,
      existingCourse: {
        id: 'c4',
        teacherId: 'other',
        type: CourseType.FREE,
        price: 0,
        status: CourseStatus.PUBLISHED,
      },
      lessonCount: 1,
    });
    await assert.rejects(
      () => service.update('t1', 'c4', { name: 'x' } as any),
      (e: any) => e.status === 403,
      '非本人应 403',
    );
    assert.strictEqual(saves.length, 0, '非本人不应保存');
  }

  // 6. 绕过页面在编辑体里塞 status -> 被拒绝
  {
    const { service, saves } = makeService({
      teacher: approvedTeacher,
      existingCourse: {
        id: 'c5',
        teacherId: 't1',
        type: CourseType.PAID,
        price: 10,
        status: CourseStatus.DRAFT,
      },
      lessonCount: 1,
    });
    await assert.rejects(
      () => service.update('t1', 'c5', { status: CourseStatus.PUBLISHED } as any),
      (e: any) => e.status === 400,
      '编辑接口不允许改状态',
    );
    assert.strictEqual(saves.length, 0, '改状态被拒不应保存');
  }

  console.log('事务原子性与权限校验全部通过 ✓');
})();
