"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const courses_service_1 = require("../src/modules/courses/courses.service");
const course_entity_1 = require("../src/common/entities/course.entity");
const user_entity_1 = require("../src/common/entities/user.entity");
function makeService(opts) {
    const saves = [];
    const courseRepo = {
        create: (v) => v,
        save: async (v) => {
            saves.push('course:' + JSON.stringify(v));
            return v;
        },
        findOne: async () => (opts.existingCourse ? ({ ...opts.existingCourse }) : null),
        find: async () => [],
    };
    const lessonRepo = {
        create: (v) => v,
        save: async (v) => {
            saves.push('lesson');
            return v;
        },
        createQueryBuilder: () => ({
            where: () => ({ select: () => ({ getRawOne: async () => ({ max: 0 }) }) }),
        }),
    };
    const enrollmentRepo = { findOne: async () => null, create: (v) => v, save: async (v) => v };
    const userRepo = { findOne: async () => (opts.teacher ? ({ ...opts.teacher }) : null) };
    const manager = {
        findOne: async () => (opts.existingCourse ? ({ ...opts.existingCourse }) : null),
        count: async () => opts.lessonCount,
        create: (cls, v) => v,
        save: async (v) => {
            saves.push('tx-save:' + JSON.stringify(v));
            return v;
        },
    };
    const dataSource = {
        transaction: async (cb) => cb(manager),
    };
    const service = new courses_service_1.CoursesService(courseRepo, lessonRepo, enrollmentRepo, userRepo, dataSource);
    return { service, saves };
}
const approvedTeacher = {
    id: 't1',
    role: user_entity_1.UserRole.TEACHER,
    teacherStatus: user_entity_1.TeacherStatus.APPROVED,
};
const pendingTeacher = {
    id: 't2',
    role: user_entity_1.UserRole.TEACHER,
    teacherStatus: user_entity_1.TeacherStatus.PENDING,
};
(async () => {
    {
        const { service, saves } = makeService({ teacher: pendingTeacher, existingCourse: null, lessonCount: 0 });
        await assert.rejects(() => service.create('t2', { name: 'c', type: course_entity_1.CourseType.PAID, price: 10 }), (e) => e.status === 403, '待审核教师创建应被 403 拒绝');
        assert.strictEqual(saves.length, 0, '被拒绝时不应有任何写入');
    }
    {
        const { service, saves } = makeService({
            teacher: approvedTeacher,
            existingCourse: {
                id: 'c1',
                teacherId: 't1',
                type: course_entity_1.CourseType.PAID,
                price: 99,
                status: course_entity_1.CourseStatus.PUBLISHED,
            },
            lessonCount: 0,
        });
        const err = await service
            .update('t1', 'c1', { price: 0 })
            .then(() => null)
            .catch((e) => e);
        assert.ok(err, '应抛错');
        assert.strictEqual(err.status, 400, '应为 400');
        const reasons = err.getResponse().reasons;
        assert.ok(reasons.includes('付费课程价格必须大于 0'), '应含价格原因');
        assert.ok(reasons.includes('上架课程至少需要一个课时'), '应含课时原因');
        assert.strictEqual(saves.length, 0, '原子拒绝：事务内不应执行 save');
    }
    {
        const { service, saves } = makeService({
            teacher: approvedTeacher,
            existingCourse: {
                id: 'c2',
                teacherId: 't1',
                type: course_entity_1.CourseType.FREE,
                price: 0,
                status: course_entity_1.CourseStatus.PUBLISHED,
            },
            lessonCount: 2,
        });
        const saved = await service.update('t1', 'c2', { type: course_entity_1.CourseType.FREE, price: 0 });
        assert.strictEqual(Number(saved.price), 0, '免费课价格应为 0');
        assert.ok(saves.some((s) => s.startsWith('tx-save:')), '应在事务内保存');
    }
    {
        const { service, saves } = makeService({
            teacher: approvedTeacher,
            existingCourse: {
                id: 'c3',
                teacherId: 't1',
                type: course_entity_1.CourseType.PAID,
                price: 50,
                status: course_entity_1.CourseStatus.DRAFT,
            },
            lessonCount: 0,
        });
        const err = await service.publish('t1', 'c3').then(() => null).catch((e) => e);
        assert.ok(err && err.status === 400, '发布无课时应 400');
        assert.strictEqual(saves.length, 0, '发布失败不应保存');
    }
    {
        const { service, saves } = makeService({
            teacher: approvedTeacher,
            existingCourse: {
                id: 'c4',
                teacherId: 'other',
                type: course_entity_1.CourseType.FREE,
                price: 0,
                status: course_entity_1.CourseStatus.PUBLISHED,
            },
            lessonCount: 1,
        });
        await assert.rejects(() => service.update('t1', 'c4', { name: 'x' }), (e) => e.status === 403, '非本人应 403');
        assert.strictEqual(saves.length, 0, '非本人不应保存');
    }
    {
        const { service, saves } = makeService({
            teacher: approvedTeacher,
            existingCourse: {
                id: 'c5',
                teacherId: 't1',
                type: course_entity_1.CourseType.PAID,
                price: 10,
                status: course_entity_1.CourseStatus.DRAFT,
            },
            lessonCount: 1,
        });
        await assert.rejects(() => service.update('t1', 'c5', { status: course_entity_1.CourseStatus.PUBLISHED }), (e) => e.status === 400, '编辑接口不允许改状态');
        assert.strictEqual(saves.length, 0, '改状态被拒不应保存');
    }
    console.log('事务原子性与权限校验全部通过 ✓');
})();
//# sourceMappingURL=courses.service.spec.js.map