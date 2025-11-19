import { Module } from '@nestjs/common';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';
import { DatabaseModule } from 'src/database/database.module';
import { FollowModule } from 'src/follow/follow.module';

@Module({
  controllers: [ChapterController],
  providers: [ChapterService],
  imports: [DatabaseModule, FollowModule],
})
export class ChapterModule {}
