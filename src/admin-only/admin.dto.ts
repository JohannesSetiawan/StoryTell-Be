import { ApiProperty } from "@nestjs/swagger";
import { Chapter } from "../chapter/chapter.dto";
import { StoryComment } from "../story-comment/story.comment.dto";
import { UserResponseDto } from "../user/user.dto";

export class PaginationQueryDto {
    @ApiProperty({ required: false, default: 1, minimum: 1, description: 'Page number' })
    page?: number;

    @ApiProperty({ required: false, default: 10, minimum: 1, maximum: 100, description: 'Items per page' })
    limit?: number;
}

export class UserFilterDto extends PaginationQueryDto {
    @ApiProperty({ required: false, description: 'Filter by username (partial match)' })
    username?: string;

    @ApiProperty({ required: false, description: 'Filter by admin role (true/false)' })
    isAdmin?: boolean;
}

export class StoryFilterDto extends PaginationQueryDto {
    @ApiProperty({ required: false, description: 'Filter by story title (partial match)' })
    title?: string;

    @ApiProperty({ required: false, description: 'Filter by author username (partial match)' })
    author?: string;

    @ApiProperty({ required: false, description: 'Filter by privacy status (true/false)' })
    isPrivate?: boolean;
}

export class ChapterFilterDto extends PaginationQueryDto {
    @ApiProperty({ required: false, description: 'Filter by story title (partial match)' })
    story?: string;

    @ApiProperty({ required: false, description: 'Filter by author username (partial match)' })
    author?: string;

    @ApiProperty({ required: false, description: 'Filter by content (partial match)' })
    content?: string;
}

export class CommentFilterDto extends PaginationQueryDto {
    @ApiProperty({ required: false, description: 'Filter by comment content (partial match)' })
    content?: string;

    @ApiProperty({ required: false, description: 'Filter by author username (partial match)' })
    author?: string;

    @ApiProperty({ required: false, description: 'Filter by story title (partial match)' })
    story?: string;

    @ApiProperty({ required: false, description: 'Filter by chapter title (partial match)' })
    chapter?: string;
}

export class PaginatedResponseDto<T> {
    @ApiProperty()
    data: T[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    totalPages: number;

    @ApiProperty()
    hasNextPage: boolean;

    @ApiProperty()
    hasPrevPage: boolean;
}

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
    @ApiProperty({ type: [String], required: false })
    tags?: string[];
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
