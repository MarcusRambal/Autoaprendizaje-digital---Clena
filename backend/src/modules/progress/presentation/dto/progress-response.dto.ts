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

  @ApiProperty({ type: () => [ProgressActivityDto] })
  activities!: ProgressActivityDto[];
}

export class ProgressActivityDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  completed!: boolean;
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
    activities: section.activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      completed: activity.completed,
    })),
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
