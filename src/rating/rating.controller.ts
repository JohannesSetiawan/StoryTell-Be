import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Put,
  Delete,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtGuard } from 'src/user/jwt.guard';
import { RatingService } from './rating.service';
import { RatingDto, Rating, StoryRatingResponseDto, UserRatingResponseDto } from './rating.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('rating')
@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('/:storyId')
  @ApiOperation({ summary: 'Create a new rating for a story' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story to rate', type: String })
  @ApiBody({ type: RatingDto })
  @ApiResponse({ status: 201, description: 'The rating has been successfully created.', type: Rating })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createRating(
    @Body() createRatingData: RatingDto,
    @Req() request,
    @Res() response,
    @Param() param
  ) {
      const authorId = request.user.id;
      const storyId = param.storyId

      if (!authorId) {
        throw new UnauthorizedException('You are not authenticated yet!');
      }

      const chapter = await this.ratingService.createRating(
        createRatingData,
        authorId,
        storyId
      );
      return response.status(201).json(chapter);
  }

  @Get('/story/:storyId')
  @ApiOperation({ summary: 'Get all ratings for a story' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
  @ApiResponse({ status: 200, description: 'The ratings have been successfully retrieved.', type: StoryRatingResponseDto })
  async getAllRatingsForStory(
    @Res() response,
    @Param() param
  ) {
      const storyId = param.storyId
      const chapters = await this.ratingService.getAllRatingForStory(storyId);
      return response.status(200).json(chapters);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('/:storyId')
  @ApiOperation({ summary: 'Get a specific user rating for a story' })
  @ApiParam({ name: 'storyId', description: 'The ID of the story', type: String })
  @ApiResponse({ status: 200, description: 'The rating has been successfully retrieved.', type: UserRatingResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getSpecificUserRatingForStory(@Param() param, @Req() request, @Res() response) {
      const authorId = request.user.id;
      const storyId = param.storyId

      if (!authorId) {
        throw new UnauthorizedException('You are not authenticated yet!');
      }
      const chapter = await this.ratingService.getUserRatingForStory(storyId, authorId);
      return response.status(200).json(chapter);
  
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Put('/:id')
  @ApiOperation({ summary: 'Update a rating' })
  @ApiParam({ name: 'id', description: 'The ID of the rating to update', type: String })
  @ApiBody({ type: RatingDto })
  @ApiResponse({ status: 200, description: 'The rating has been successfully updated.', type: Rating })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateRating(
    @Param() param,
    @Body() data: RatingDto,
    @Req() request,
    @Res() response,
  ) {
      const authorId = request.user.id;
      const updatedChapter = await this.ratingService.updateRating(
        param.id,
        authorId,
        data,
      );
      return response.status(200).json(updatedChapter);
  
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a rating' })
  @ApiParam({ name: 'id', description: 'The ID of the rating to delete', type: String })
  @ApiResponse({ status: 200, description: 'The rating has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteChapter(@Param() param, @Req() request, @Res() response) {
      const authorId = request.user.id;
      await this.ratingService.deleteRating(param.id, authorId);
      return response.status(200).json({ message: 'Deleted successfully!' });
  
  }
}
