import { ApiProperty } from "@nestjs/swagger";
import { Chapter } from "../chapter/chapter.dto";
import { Story } from "../story/story.dto";
import { User } from "../user/user.dto";

export class ReadHistory {
  @ApiProperty()
  id: string;
  @ApiProperty({ type: () => User, required: false })
  user?: User;
  @ApiProperty()
  userId: string;
  @ApiProperty({ type: () => Story, required: false })
  story?: Story;
  @ApiProperty()
  storyId: string;
  @ApiProperty({ type: () => Chapter, required: false })
  chapter?: Chapter;
  @ApiProperty({ required: false })
  chapterId?: string;
  @ApiProperty()
  date: Date;
}

export class ReadHistoryResponseDto {
    @ApiProperty()
    id: string;
    @ApiProperty()
    userId: string;
    @ApiProperty()
    storyId: string;
    @ApiProperty({ required: false })
    chapterId?: string;
    @ApiProperty()
    date: Date;
    @ApiProperty()
    story: {
        title: string;
    }
    @ApiProperty({ required: false })
    chapter?: {
        title: string;
        order: number;
    }
}

export class SpecificReadHistoryResponseDto {
    @ApiProperty()
    id: string;
    @ApiProperty()
    userId: string;
    @ApiProperty()
    storyId: string;
    @ApiProperty({ required: false })
    chapterId?: string;
    @ApiProperty()
    date: Date;
    @ApiProperty()
    story: {
        title: string;
    }
    @ApiProperty()
    chapter: {
        title: string;
        order: number;
    }
}
