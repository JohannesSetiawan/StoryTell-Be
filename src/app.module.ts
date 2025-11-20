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
import { FollowModule } from './follow/follow.module';
import { CollectionModule } from './collection/collection.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ExportModule } from './export/export.module';

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
    FollowModule,
    CollectionModule,
    ExportModule,
    CacheModule.register({ 
      isGlobal: true, 
      ttl: 300000, // 5 minutes (300 seconds)
      max: 1000, // Store up to 1000 items
      // TODO: Consider implementing Redis for production for better cache performance
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute (reasonable for general API usage)
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
