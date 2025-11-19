import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Req,
  Res,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtGuard } from '../user/jwt.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetFeedQueryDto } from './follow.dto';

@ApiTags('follow')
@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('/:userId')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'userId', description: 'The ID of the user to follow', type: String })
  @ApiResponse({ status: 201, description: 'Successfully followed the user.' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot follow yourself.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 409, description: 'Already following this user.' })
  async followUser(@Param('userId') userId: string, @Req() request, @Res() response) {
    const followerId = request.user.id;
    if (!followerId) {
      throw new UnauthorizedException('You are not authenticated yet!');
    }
    const follow = await this.followService.followUser(followerId, userId);
    return response.status(201).json(follow);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete('/:userId')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'userId', description: 'The ID of the user to unfollow', type: String })
  @ApiResponse({ status: 200, description: 'Successfully unfollowed the user.' })
  @ApiResponse({ status: 404, description: 'Follow relationship not found.' })
  async unfollowUser(@Param('userId') userId: string, @Req() request, @Res() response) {
    const followerId = request.user.id;
    if (!followerId) {
      throw new UnauthorizedException('You are not authenticated yet!');
    }
    const result = await this.followService.unfollowUser(followerId, userId);
    return response.status(200).json(result);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('/followers')
  @ApiOperation({ summary: "Get current user's followers" })
  @ApiResponse({ status: 200, description: 'Successfully retrieved followers list.' })
  async getFollowers(@Req() request, @Res() response) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException('You are not authenticated yet!');
    }
    const followers = await this.followService.getFollowers(userId);
    return response.status(200).json(followers);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('/following')
  @ApiOperation({ summary: 'Get users the current user follows' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved following list.' })
  async getFollowing(@Req() request, @Res() response) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException('You are not authenticated yet!');
    }
    const following = await this.followService.getFollowing(userId);
    return response.status(200).json(following);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('/check/:userId')
  @ApiOperation({ summary: 'Check if the current user is following a specific user' })
  @ApiParam({ name: 'userId', description: 'The ID of the user to check', type: String })
  @ApiResponse({ status: 200, description: 'Successfully checked follow status.' })
  async checkIfFollowing(@Param('userId') userId: string, @Req() request, @Res() response) {
    const followerId = request.user.id;
    if (!followerId) {
      throw new UnauthorizedException('You are not authenticated yet!');
    }
    const result = await this.followService.checkIfFollowing(followerId, userId);
    return response.status(200).json(result);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('/stats/:userId')
  @ApiOperation({ summary: 'Get follower/following stats for a user' })
  @ApiParam({ name: 'userId', description: 'The ID of the user', type: String })
  @ApiResponse({ status: 200, description: 'Successfully retrieved follow stats.' })
  async getFollowStats(@Param('userId') userId: string, @Res() response) {
    const stats = await this.followService.getFollowStats(userId);
    return response.status(200).json(stats);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('/feed')
  @ApiOperation({ summary: 'Get activity feed from followed users' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved activity feed.' })
  async getActivityFeed(
    @Query() query: GetFeedQueryDto,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException('You are not authenticated yet!');
    }
    const feed = await this.followService.getActivityFeed(
      userId,
      query.page,
      query.perPage,
    );
    return response.status(200).json(feed);
  }
}
