import {
    Controller,
    Get,
    UseGuards,
    Req,
    Res,
} from '@nestjs/common';
import { JwtGuard } from 'src/user/jwt.guard';
import { ReadHistoryService } from './read.history.service';

@Controller('history')
export class ReadHistoryController {
    constructor(private readonly readHistoryService: ReadHistoryService) {}

    @UseGuards(JwtGuard)
    @Get('')
    async getAllStories(@Req() request, @Res() response) {
        const userId = request.user.userId
        const stories = await this.readHistoryService.getHistories(userId);
        return response.status(200).json(stories);
    }
}
  