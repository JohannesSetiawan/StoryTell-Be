import { Module } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { BookmarkController } from './bookmark.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [BookmarkController],
  providers: [BookmarkService],
  imports: [DatabaseModule],
})
export class BookmarkModule {}
