import { Module } from '@nestjs/common';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ChapterController],
  providers: [ChapterService],
  imports: [PrismaModule],
})
export class ChapterModule {}
