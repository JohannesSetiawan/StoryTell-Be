import { ApiProperty } from "@nestjs/swagger";

export class CreateTagDto {
  @ApiProperty({ example: 'Horror', description: 'Tag name' })
  name: string;
  
  @ApiProperty({ example: 'genre', description: 'Tag category (e.g., genre, language)' })
  category: string;
}

export class UpdateTagDto {
  @ApiProperty({ example: 'Horror', description: 'Tag name', required: false })
  name?: string;
  
  @ApiProperty({ example: 'genre', description: 'Tag category', required: false })
  category?: string;
}

export class Tag {
  @ApiProperty()
  id: string;
  
  @ApiProperty()
  name: string;
  
  @ApiProperty()
  category: string;
  
  @ApiProperty()
  dateCreated: Date;
}

export class AssignTagsDto {
  @ApiProperty({ 
    type: [String], 
    example: ['tag-uuid-1', 'tag-uuid-2'],
    description: 'Array of tag IDs to assign to the story' 
  })
  tagIds: string[];
}

export class TagFilterDto {
  @ApiProperty({ required: false, description: 'Page number' })
  page?: number;
  
  @ApiProperty({ required: false, description: 'Items per page' })
  limit?: number;
  
  @ApiProperty({ required: false, description: 'Filter by tag name (partial match)' })
  name?: string;
  
  @ApiProperty({ required: false, description: 'Filter by category' })
  category?: string;
}

export interface PaginatedTagResponse {
  data: Tag[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
