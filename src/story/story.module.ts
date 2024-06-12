import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    controllers:[StoryController],
    providers:[StoryService],
    imports:[PrismaModule]
})
export class StoryModule {}
