import { ApiProperty } from '@nestjs/swagger';
import {
  MyProgress,
  ProgressSection,
} from '../../application/get-my-progress.use-case';

export class ProgressSectionDto {
  @ApiProperty({ minimum: 0 })
  completed!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  percentage!: number;
}

export class MyProgressResponseDto {
  @ApiProperty({ type: ProgressSectionDto })
  guides!: ProgressSectionDto;

  @ApiProperty({ type: ProgressSectionDto })
  lessons!: ProgressSectionDto;
}

function toSectionDto(section: ProgressSection): ProgressSectionDto {
  return {
    completed: section.completed,
    total: section.total,
    percentage: section.percentage,
  };
}

export function toMyProgressResponse(
  progress: MyProgress,
): MyProgressResponseDto {
  return {
    guides: toSectionDto(progress.guides),
    lessons: toSectionDto(progress.lessons),
  };
}
