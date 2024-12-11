import {
    Controller,
    Get,
    UseGuards,
    Req,
    Res,
    Param,
} from '@nestjs/common';
import { JwtGuard } from 'src/user/jwt.guard';
import { ReadHistoryService } from './read.history.service';

@Controller('history')
export class ReadHistoryController {
    constructor(private readonly readHistoryService: ReadHistoryService) {}

    @UseGuards(JwtGuard)
    @Get('')
    async getAllHistories(@Req() request, @Res() response) {
        const userId = request.user.userId
        const stories = await this.readHistoryService.getHistories(userId);
        return response.status(200).json(stories);
    }

    @UseGuards(JwtGuard)
    @Get('/:storyId')
    async getHistoryForSpecificStory(@Req() request, @Res() response, @Param() param ) {
        const userId = request.user.userId
        const storyId = param.storyId
        const stories = await this.readHistoryService.getHistoriesForSpecificStory(userId, storyId);
        return response.status(200).json(stories);
    }
}
  