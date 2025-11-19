import { ApiProperty } from '@nestjs/swagger';

export class FollowDto {
  @ApiProperty()
  followingId: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  followedAt: Date;
}

export interface FollowerWithUser {
  id: string;
  followerId: string;
  followingId: string;
  followedAt: Date;
  user: {
    id: string;
    username: string;
    description: string;
  };
}

export interface FollowingWithUser {
  id: string;
  followerId: string;
  followingId: string;
  followedAt: Date;
  user: {
    id: string;
    username: string;
    description: string;
  };
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export enum ActivityType {
  NEW_STORY = 'new_story',
  NEW_CHAPTER = 'new_chapter',
  STATUS_CHANGE = 'status_change',
}

export interface ActivityFeed {
  id: string;
  userId: string;
  activityType: ActivityType;
  storyId?: string;
  chapterId?: string;
  metadata?: any;
  createdAt: Date;
  user?: {
    id: string;
    username: string;
  };
  story?: {
    id: string;
    title: string;
  };
  chapter?: {
    id: string;
    title: string;
    order: number;
  };
}

export class GetFeedQueryDto {
  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  perPage?: number;
}
