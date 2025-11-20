import { ApiProperty } from "@nestjs/swagger";
import { Chapter } from "../chapter/chapter.dto";
import { Rating } from "../rating/rating.dto";
import { ReadHistory } from "../read-history/read.history.dto";
import { StoryComment } from "../story-comment/story.comment.dto";
import { User } from "../user/user.dto";

export type StoryStatus = 'Ongoing' | 'Cancelled' | 'Dropped' | 'Completed';

export class StoryDto {
  @ApiProperty()
  title: string;
  @ApiProperty({ required: false })
  description: string;
  @ApiProperty({ default: false })
  isprivate: boolean;
  @ApiProperty({ 
    type: [String], 
    required: false,
    description: 'Array of tag IDs to assign to the story' 
  })
  tagIds?: string[];
  @ApiProperty({ 
    enum: ['Ongoing', 'Cancelled', 'Dropped', 'Completed'],
    default: 'Ongoing',
    required: false,
    description: 'Story status' 
  })
  storyStatus?: StoryStatus;
};

export class Story {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty({ required: false, default: "No description" })
  description: string | null;
  @ApiProperty()
  dateCreated: Date;
  @ApiProperty({ type: () => User, required: false })
  author?: User;
  @ApiProperty()
  authorId: string;
  @ApiProperty({ type: () => [Chapter], required: false })
  chapters?: Chapter[];
  @ApiProperty({ default: false })
  isprivate: boolean;
  @ApiProperty({ type: () => [StoryComment], required: false })
  storyComments?: StoryComment[];
  @ApiProperty({ type: () => [Rating], required: false })
  ratings?: Rating[];
  @ApiProperty({ type: () => [ReadHistory], required: false })
  storyReadHistory?: ReadHistory[];
  @ApiProperty({ type: [String], required: false })
  tags?: string[];
  @ApiProperty({ enum: ['Ongoing', 'Cancelled', 'Dropped', 'Completed'], default: 'Ongoing' })
  storyStatus: StoryStatus;
};

export class PaginatedStoryResponseDto {
  @ApiProperty({ type: [StoryDto] })
  stories: StoryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  perPage: number;

  @ApiProperty()
  totalPages: number;
}
