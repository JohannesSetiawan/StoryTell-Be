import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ReadHistoryController } from './read.history.controller';
import { ReadHistoryService } from './read.history.service';

@Module({
  controllers: [ReadHistoryController],
  providers: [ReadHistoryService],
  imports: [DatabaseModule],
})
export class HistoryModule {}
