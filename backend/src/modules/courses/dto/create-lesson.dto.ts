import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  coursewareUrl?: string;

  @IsOptional()
  @IsBoolean()
  isLive?: boolean;

  @IsOptional()
  @IsDateString()
  liveStartTime?: Date;

  @IsOptional()
  @IsDateString()
  liveEndTime?: Date;
}
