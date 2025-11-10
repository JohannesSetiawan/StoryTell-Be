import { ApiProperty } from "@nestjs/swagger";
import { Chapter } from "../chapter/chapter.dto";
import { StoryComment } from "../story-comment/story.comment.dto";
import { UserResponseDto } from "../user/user.dto";

export class AdminAllUserResponseDto extends UserResponseDto {}

export class AdminAllStoryResponseDto {
    @ApiProperty()
    id: string;
    @ApiProperty()
    title: string;
    @ApiProperty({ required: false, default: "No description" })
    description: string | null;
    @ApiProperty()
    dateCreated: Date;
    @ApiProperty()
    authorId: string;
    @ApiProperty({ default: false })
    isPrivate: boolean;
    @ApiProperty({ type: () => [Chapter] })
    chapters: Chapter[];
    @ApiProperty()
    author: {
        username: string;
    }
}

export class AdminAllChapterResponseDto {
    @ApiProperty()
    id: string;
    @ApiProperty()
    title: string;
    @ApiProperty()
    content: string;
    @ApiProperty()
    dateCreated: Date;
    @ApiProperty()
    storyId: string;
    @ApiProperty({ required: false })
    order: number;
    @ApiProperty()
    story: {
        title: string;
        author: {
            username: string;
            id: string;
        }
    }
}

export class AdminAllCommentResponseDto extends StoryComment {}
