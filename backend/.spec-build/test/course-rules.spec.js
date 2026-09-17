"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const course_entity_1 = require("../src/common/entities/course.entity");
const user_entity_1 = require("../src/common/entities/user.entity");
function validateSaleConditions(data, lessonCount, requireLessons) {
    const reasons = [];
    const normalizedPrice = data.type === course_entity_1.CourseType.FREE ? 0 : Number(data.price);
    if (data.type === course_entity_1.CourseType.PAID) {
        if (data.price === null || data.price === undefined || Number.isNaN(normalizedPrice)) {
            reasons.push('付费课程必须设置价格');
        }
        else if (normalizedPrice <= 0) {
            reasons.push('付费课程价格必须大于 0');
        }
    }
    else if (data.price !== null &&
        data.price !== undefined &&
        Number(data.price) !== 0) {
        reasons.push('免费课程价格必须为 0');
    }
    if (requireLessons && lessonCount < 1) {
        reasons.push('上架课程至少需要一个课时');
    }
    return { price: normalizedPrice, reasons };
}
function assert(cond, msg) {
    if (!cond)
        throw new Error('断言失败: ' + msg);
}
assert(validateSaleConditions({ type: course_entity_1.CourseType.PAID, price: 0 }, 1, true).reasons.includes('付费课程价格必须大于 0'), '付费课价格为 0 应被拒绝');
assert(validateSaleConditions({ type: course_entity_1.CourseType.PAID, price: -10 }, 1, true).reasons.includes('付费课程价格必须大于 0'), '付费课价格为负应被拒绝');
assert(validateSaleConditions({ type: course_entity_1.CourseType.PAID, price: 99 }, 1, true).reasons.length === 0, '付费课价格大于 0 且有课时应通过');
assert(validateSaleConditions({ type: course_entity_1.CourseType.FREE, price: 1 }, 1, true).reasons.includes('免费课程价格必须为 0'), '免费课价格非 0 应被拒绝');
const free = validateSaleConditions({ type: course_entity_1.CourseType.FREE, price: 0 }, 1, true);
assert(free.reasons.length === 0 && free.price === 0, '免费课价格为 0 应通过');
const multi = validateSaleConditions({ type: course_entity_1.CourseType.PAID, price: 0 }, 0, true);
assert(multi.reasons.length === 2, '无课时且付费价为 0 应给出两条具体原因');
assert(validateSaleConditions({ type: course_entity_1.CourseType.FREE, price: 0 }, 0, false).reasons.length === 0, '草稿免费课不要求课时');
const assertTeacher = (status, role) => {
    if (role !== user_entity_1.UserRole.TEACHER)
        return false;
    return status === user_entity_1.TeacherStatus.APPROVED;
};
assert(!assertTeacher(user_entity_1.TeacherStatus.PENDING, user_entity_1.UserRole.TEACHER), '待审核教师不能创建');
assert(!assertTeacher(user_entity_1.TeacherStatus.REJECTED, user_entity_1.UserRole.TEACHER), '已驳回教师不能创建');
assert(!assertTeacher(null, user_entity_1.UserRole.STUDENT), '学生不能创建');
assert(assertTeacher(user_entity_1.TeacherStatus.APPROVED, user_entity_1.UserRole.TEACHER), '审核通过教师可以创建');
console.log('全部规则校验通过 ✓');
//# sourceMappingURL=course-rules.spec.js.map