import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CourseType } from '../../../common/entities/course.entity';

export class CreateCourseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsString()
  description: string;

  @IsEnum(CourseType)
  type: CourseType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
