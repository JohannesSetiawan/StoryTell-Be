import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { DatabaseModule } from 'src/database/database.module';
import { FollowModule } from 'src/follow/follow.module';

@Module({
  controllers: [StoryController],
  providers: [StoryService],
  imports: [DatabaseModule, FollowModule],
})
export class StoryModule {}
