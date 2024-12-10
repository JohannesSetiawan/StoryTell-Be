import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReadHistoryController } from './read.history.controller';
import { ReadHistoryService } from './read.history.service';

@Module({
  controllers: [ReadHistoryController],
  providers: [ReadHistoryService],
  imports: [PrismaModule],
})
export class HistoryModule {}
