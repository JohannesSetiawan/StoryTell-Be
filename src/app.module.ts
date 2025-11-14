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
import { HistoryModule } from './read-history/read.history.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { TagModule } from './tag/tag.module';
import { BookmarkModule } from './bookmark/bookmark.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UserModule,
    StoryModule,
    ChapterModule,
    StoryCommentModule,
    RatingModule,
    AdminModule,
    HistoryModule,
    TagModule,
    BookmarkModule,
    CacheModule.register({ isGlobal: true, ttl: 60000, max: 10 }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
