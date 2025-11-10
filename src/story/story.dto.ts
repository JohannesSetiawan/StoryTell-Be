import { ApiProperty } from "@nestjs/swagger";
import { Chapter } from "../chapter/chapter.dto";
import { Rating } from "../rating/rating.dto";
import { ReadHistory } from "../read-history/read.history.dto";
import { StoryComment } from "../story-comment/story.comment.dto";
import { User } from "../user/user.dto";

export class StoryDto {
  @ApiProperty()
  title: string;
  @ApiProperty({ required: false })
  description: string;
  @ApiProperty({ default: false })
  isPrivate: boolean;
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
  isPrivate: boolean;
  @ApiProperty({ type: () => [StoryComment], required: false })
  storyComments?: StoryComment[];
  @ApiProperty({ type: () => [Rating], required: false })
  ratings?: Rating[];
  @ApiProperty({ type: () => [ReadHistory], required: false })
  storyReadHistory?: ReadHistory[];
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
