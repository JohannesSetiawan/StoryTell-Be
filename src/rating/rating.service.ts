import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RatingDto } from './rating.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RatingService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async createRating(data: RatingDto, userId: string, storyId: string) {

    const story = await this.prisma.story.findFirst({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found!');
    }

    const rating = await this.prisma.rating.findFirst({
      where: { storyId, authorId: userId },
    });

    if (rating) {
      throw new BadRequestException('You already rate the story!');
    }

    if(data.rate > 10 || data.rate < 0){
      throw new BadRequestException("Invalid ratings")
    }

    const newRating = await this.prisma.rating.create({
      data: {...data, storyId, authorId: userId}
    });

    await this.cacheService.del('story-' + storyId.toString());

    return newRating;
  }

  async getAllRatingForStory(storyId: string) {
    const groupedRatings = await this.prisma.rating.groupBy({
      by: ['storyId'], 
      where: {
        storyId: { in: [storyId] }, // Filter by specific story IDs
      },
      _avg: {
        rate: true, 
      },
      _count: {
        rate: true, 
      },
      _sum: {
        rate: true, 
      },
    });

    return groupedRatings[0];
  }

  async getUserRatingForStory(storyId: string, userId: string) {
    const rating = await this.prisma.rating.findFirst({
      where: { storyId, authorId: userId },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found!');
    }
    return rating;
  }

  async updateRating(id: string, userId: string, data: RatingDto) {

    const rating = await this.prisma.rating.findFirst({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException('Story not found!');
    }

    if (rating.authorId !== userId) {
      throw new ForbiddenException(
        "You don't have permission to update this rating!",
      );
    }

    if(data.rate > 10 || data.rate < 0){
      throw new BadRequestException("Invalid ratings")
    }

    const updatedRating = await this.prisma.rating.update({
      data,
      where: { id },
    });

    return updatedRating;
  }

  async deleteRating(ratingId: string, userId: string) {
    const rating = await this.prisma.rating.findFirst({
      where: { id: ratingId, authorId: userId },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found!');
    }

    const deletedRating = await this.prisma.rating.delete({
      where: { id: ratingId },
    });

    return deletedRating;
  }
}
