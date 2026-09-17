import { PartialType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';

/**
 * 课程编辑 DTO。
 * 注意：不允许通过通用编辑接口修改 status，上下架只能走发布流程，
 * ValidationPipe 的 whitelist 也会剥离请求体中多出的 status 字段。
 */
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
