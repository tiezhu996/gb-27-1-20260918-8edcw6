/**
 * 课程发布/编辑规则验证脚本（无需数据库）。
 * 通过复刻 CoursesService 中的售卖条件校验与教师资质判定，验证关键分支。
 * 运行：npx ts-node 若不可用，则用 node 配合 ts 编译后的等价 JS 执行。
 */
import { CourseType } from '../src/common/entities/course.entity';
import { TeacherStatus, UserRole } from '../src/common/entities/user.entity';

// 与 courses.service.ts 保持一致的纯函数逻辑
function validateSaleConditions(
  data: { type: CourseType; price: number },
  lessonCount: number,
  requireLessons: boolean,
): { price: number; reasons: string[] } {
  const reasons: string[] = [];
  const normalizedPrice = data.type === CourseType.FREE ? 0 : Number(data.price);

  if (data.type === CourseType.PAID) {
    if (data.price === null || data.price === undefined || Number.isNaN(normalizedPrice)) {
      reasons.push('付费课程必须设置价格');
    } else if (normalizedPrice <= 0) {
      reasons.push('付费课程价格必须大于 0');
    }
  } else if (
    data.price !== null &&
    data.price !== undefined &&
    Number(data.price) !== 0
  ) {
    reasons.push('免费课程价格必须为 0');
  }

  if (requireLessons && lessonCount < 1) {
    reasons.push('上架课程至少需要一个课时');
  }

  return { price: normalizedPrice, reasons };
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error('断言失败: ' + msg);
}

// 1. 付费课价格必须大于 0
assert(
  validateSaleConditions({ type: CourseType.PAID, price: 0 }, 1, true).reasons.includes(
    '付费课程价格必须大于 0',
  ),
  '付费课价格为 0 应被拒绝',
);
assert(
  validateSaleConditions({ type: CourseType.PAID, price: -10 }, 1, true).reasons.includes(
    '付费课程价格必须大于 0',
  ),
  '付费课价格为负应被拒绝',
);
assert(
  validateSaleConditions({ type: CourseType.PAID, price: 99 }, 1, true).reasons.length === 0,
  '付费课价格大于 0 且有课时应通过',
);

// 2. 免费课价格固定为 0
assert(
  validateSaleConditions({ type: CourseType.FREE, price: 1 }, 1, true).reasons.includes(
    '免费课程价格必须为 0',
  ),
  '免费课价格非 0 应被拒绝',
);
const free = validateSaleConditions({ type: CourseType.FREE, price: 0 }, 1, true);
assert(free.reasons.length === 0 && free.price === 0, '免费课价格为 0 应通过');

// 3. 上架必须至少一个课时（同时违反应给出两条原因）
const multi = validateSaleConditions({ type: CourseType.PAID, price: 0 }, 0, true);
assert(multi.reasons.length === 2, '无课时且付费价为 0 应给出两条具体原因');
assert(
  validateSaleConditions({ type: CourseType.FREE, price: 0 }, 0, false).reasons.length === 0,
  '草稿免费课不要求课时',
);

// 4. 教师资质门禁
const assertTeacher = (status: TeacherStatus | null, role: UserRole) => {
  if (role !== UserRole.TEACHER) return false;
  return status === TeacherStatus.APPROVED;
};
assert(!assertTeacher(TeacherStatus.PENDING, UserRole.TEACHER), '待审核教师不能创建');
assert(!assertTeacher(TeacherStatus.REJECTED, UserRole.TEACHER), '已驳回教师不能创建');
assert(!assertTeacher(null, UserRole.STUDENT), '学生不能创建');
assert(assertTeacher(TeacherStatus.APPROVED, UserRole.TEACHER), '审核通过教师可以创建');

console.log('全部规则校验通过 ✓');
