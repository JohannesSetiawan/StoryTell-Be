import { ApiProperty } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ default: false })
  isPublic?: boolean;

  @ApiProperty({ default: false })
  isCollaborative?: boolean;
}

export class UpdateCollectionDto {
  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  isPublic?: boolean;

  @ApiProperty({ required: false })
  isCollaborative?: boolean;
}

export class AddStoryToCollectionDto {
  @ApiProperty()
  storyId: string;
}

export class AddCollaboratorDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ default: false })
  canEdit?: boolean;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  isCollaborative: boolean;
  createdAt: Date;
  updatedAt: Date;
  storyCount?: number;
  stories?: any[];
  author?: { username: string };
}
