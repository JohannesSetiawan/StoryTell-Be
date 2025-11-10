import { ApiProperty } from "@nestjs/swagger";
import { ReadHistory } from "../read-history/read.history.dto";
import { Story } from "../story/story.dto";
import { StoryComment } from "../story-comment/story.comment.dto";

export class ChapterDto {
  @ApiProperty()
  title: string;
  @ApiProperty()
  content: string;
  @ApiProperty()
  storyId: string;
  @ApiProperty({ required: false })
  order: number;
};

export class Chapter {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  content: string;
  @ApiProperty()
  dateCreated: Date;
  @ApiProperty({ type: () => Story, required: false })
  story?: Story;
  @ApiProperty()
  storyId: string;
  @ApiProperty({ type: () => [StoryComment], required: false })
  chapterComments?: StoryComment[];
  @ApiProperty({ type: () => [ReadHistory], required: false })
  chapterReadHistory?: ReadHistory[];
  @ApiProperty({ required: false })
  order: number;
};
