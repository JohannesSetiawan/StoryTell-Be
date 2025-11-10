import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [StoryController],
  providers: [StoryService],
  imports: [DatabaseModule],
})
export class StoryModule {}
