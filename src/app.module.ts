import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { StoryModule } from './story/story.module';
import { ChapterModule } from './chapter/chapter.module';

@Module({
  imports: [UserModule, StoryModule, ChapterModule, ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
