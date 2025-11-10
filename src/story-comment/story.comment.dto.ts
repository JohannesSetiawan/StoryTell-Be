import { ApiProperty } from "@nestjs/swagger";
import { Chapter } from "../chapter/chapter.dto";
import { Story } from "../story/story.dto";
import { User } from "../user/user.dto";

export class StoryCommentDto {
  @ApiProperty()
  content: string;
  @ApiProperty({ required: false })
  parentId?: string;
};

export class StoryComment {
  @ApiProperty()
  id: string;
  @ApiProperty({ type: () => User, required: false })
  author?: User;
  @ApiProperty()
  authorId: string;
  @ApiProperty({ type: () => Story, required: false })
  story?: Story;
  @ApiProperty()
  storyId: string;
  @ApiProperty({ type: () => Chapter, required: false })
  chapter?: Chapter;
  @ApiProperty({ required: false })
  chapterId?: string;
  @ApiProperty()
  dateCreated: Date;
  @ApiProperty()
  content: string;
  @ApiProperty({ required: false })
  parentId?: string;
  @ApiProperty({ type: () => StoryComment, required: false })
  parent?: StoryComment;
  @ApiProperty({ type: () => [StoryComment], required: false })
  childs?: StoryComment[];
};
