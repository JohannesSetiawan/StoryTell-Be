import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { StoryModule } from './story/story.module';
import { ChapterModule } from './chapter/chapter.module';
import { StoryCommentModule } from './story-comment/story.comment.module';

@Module({
  imports: [UserModule, StoryModule, ChapterModule, StoryCommentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
