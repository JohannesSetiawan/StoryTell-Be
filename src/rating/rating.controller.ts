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
} from '@nestjs/common';
import { JwtGuard } from 'src/user/jwt.guard';
import { RatingService } from './rating.service';
import { RatingDto } from './rating.dto';
import { AuthenticationError } from '../Exceptions/AuthenticationError';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @UseGuards(JwtGuard)
  @Post('/:storyId')
  async createRating(
    @Body() createRatingData: RatingDto,
    @Req() request,
    @Res() response,
    @Param() param
  ) {
    try {
      const authorId = request.user.userId;
      const storyId = param.storyId

      if (!authorId) {
        throw new AuthenticationError('You are not authenticated yet!');
      }

      const chapter = await this.ratingService.createRating(
        createRatingData,
        authorId,
        storyId
      );
      return response.status(201).json(chapter);
    } catch (error) {
      if (typeof error.status !== 'undefined') {
        return response.status(error.status).json({ message: error.message });
      }
      return response.status(400).json({ message: error.message });
    }
  }

  @Get('/story/:storyId')
  async getAllRatingsForStory(
    @Res() response,
    @Param() param
  ) {
    try {
      const storyId = param.storyId
      const chapters = await this.ratingService.getAllRatingForStory(storyId);
      return response.status(200).json(chapters);
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @Get('/:storyId')
  async getSpecificUserRatingForStory(@Param() param, @Req() request, @Res() response) {
    try {
      const authorId = request.user.userId;
      const storyId = param.storyId

      if (!authorId) {
        throw new AuthenticationError('You are not authenticated yet!');
      }
      const chapter = await this.ratingService.getUserRatingForStory(storyId, authorId);
      return response.status(200).json(chapter);
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @Put('/:id')
  async updateRating(
    @Param() param,
    @Body() data: RatingDto,
    @Req() request,
    @Res() response,
  ) {
    try {
      const authorId = request.user.userId;
      const updatedChapter = await this.ratingService.updateRating(
        param.id,
        authorId,
        data,
      );
      return response.status(200).json(updatedChapter);
    } catch (error) {
      if (typeof error.status !== 'undefined') {
        return response.status(error.status).json({ message: error.message });
      }
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @Delete('/:id')
  async deleteChapter(@Param() param, @Req() request, @Res() response) {
    try {
      const authorId = request.user.userId;
      await this.ratingService.deleteRating(param.id, authorId);
      return response.status(200).json({ message: 'Deleted successfully!' });
    } catch (error) {
      if (typeof error.status !== 'undefined') {
        return response.status(error.status).json({ message: error.message });
      }
      return response.status(400).json({ message: error.message });
    }
  }
}
