import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { StoryModule } from './story/story.module';
import { ChapterModule } from './chapter/chapter.module';
import { StoryCommentModule } from './story-comment/story.comment.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    UserModule,
    StoryModule,
    ChapterModule,
    StoryCommentModule,
    CacheModule.register({ isGlobal: true, ttl: 60000, max: 10 }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
