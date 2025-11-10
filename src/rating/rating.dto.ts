import { ApiProperty } from "@nestjs/swagger";
import { Story } from "../story/story.dto";
import { User } from "../user/user.dto";

export class RatingDto {
  @ApiProperty({ default: 10 })
  rate: number;
};

export class Rating {
  @ApiProperty()
  id: string;
  @ApiProperty()
  rate: number;
  @ApiProperty({ type: () => User, required: false })
  author?: User;
  @ApiProperty()
  authorId: string;
  @ApiProperty({ type: () => Story, required: false })
  story?: Story;
  @ApiProperty()
  storyId: string;
};

export class StoryRatingResponseDto {
    @ApiProperty()
    _count: { rate: number };
    @ApiProperty()
    _avg: { rate: number };
    @ApiProperty()
    _sum: { rate: number };
}

export class UserRatingResponseDto {
    @ApiProperty({ nullable: true })
    id: string | null;
    @ApiProperty({ nullable: true })
    authorId: string | null;
    @ApiProperty({ nullable: true })
    storyId: string | null;
    @ApiProperty({ nullable: true })
    rate: number | null;
    @ApiProperty({ required: false })
    message?: string;
}
