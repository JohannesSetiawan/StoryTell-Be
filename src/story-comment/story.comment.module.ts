import { Module } from '@nestjs/common';
import { StoryCommentController } from './story.comment.controller';
import { StoryCommentService } from './story.comment.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [StoryCommentController],
  providers: [StoryCommentService],
  imports: [DatabaseModule],
})
export class StoryCommentModule {}
