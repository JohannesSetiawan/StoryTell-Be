import { ApiProperty } from '@nestjs/swagger';

export class CreateBookmarkDto {
  @ApiProperty()
  storyId: string;
}

export class DeleteBookmarkDto {
  @ApiProperty()
  storyId: string;
}

export class BookmarkItem {
  @ApiProperty()
  storyId: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  authorName: string;
  @ApiProperty()
  storyStatus: string;
  @ApiProperty()
  latestChapter: string | null;
}

export class PaginatedBookmarkResponse {
  @ApiProperty({ type: [BookmarkItem] })
  data: BookmarkItem[];
  @ApiProperty()
  meta: {
    total: number;
    lastPage: number;
    currentPage: number;
    perPage: number;
    prev: number | null;
    next: number | null;
  };
}
