import { Module } from '@nestjs/common';
import { StoryCommentController } from './story.comment.controller';
import { StoryCommentService } from './story.comment.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    controllers:[StoryCommentController],
    providers:[StoryCommentService],
    imports:[PrismaModule]
})
export class StoryCommentModule {}
