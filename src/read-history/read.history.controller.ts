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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReadHistoryResponseDto, SpecificReadHistoryResponseDto } from './read.history.dto';

@ApiTags('read-history')
@Controller('history')
export class ReadHistoryController {
    constructor(private readonly readHistoryService: ReadHistoryService) {}

    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @Get('')
    @ApiOperation({ summary: 'Get all read histories for a user' })
    @ApiResponse({ status: 200, description: 'The read histories have been successfully retrieved.', type: [ReadHistoryResponseDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getAllHistories(@Req() request, @Res() response) {
        const userId = request.user.id
        const stories = await this.readHistoryService.getHistories(userId);
        return response.status(200).json(stories);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @Get('/:storyId')
    @ApiOperation({ summary: 'Get read history for a specific story' })
    @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
    @ApiResponse({ status: 200, description: 'The read history has been successfully retrieved.', type: SpecificReadHistoryResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getHistoryForSpecificStory(@Req() request, @Res() response, @Param() param ) {
        const userId = request.user.id
        const storyId = param.storyId
        const stories = await this.readHistoryService.getHistoriesForSpecificStory(userId, storyId);
        return response.status(200).json(stories);
    }
}
  