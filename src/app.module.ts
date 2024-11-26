import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { StoryModule } from './story/story.module';
import { ChapterModule } from './chapter/chapter.module';
import { StoryCommentModule } from './story-comment/story.comment.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RatingModule } from './rating/rating.module';
import { AdminModule } from './admin-only/admin.module';

@Module({
  imports: [
    UserModule,
    StoryModule,
    ChapterModule,
    StoryCommentModule,
    RatingModule,
    AdminModule,
    CacheModule.register({ isGlobal: true, ttl: 60000, max: 10 }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
