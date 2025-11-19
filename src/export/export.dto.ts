import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ExportFormat = 'pdf' | 'epub' | 'html' | 'txt';
export const EXPORT_FORMAT_OPTIONS: readonly ExportFormat[] = [
  'pdf',
  'epub',
  'html',
  'txt',
] as const;

export type BackupSection =
  | 'stories'
  | 'chapters'
  | 'bookmarks'
  | 'tags'
  | 'ratings'
  | 'followers'
  | 'following'
  | 'read-history';

export const BACKUP_SECTION_OPTIONS: readonly BackupSection[] = [
  'stories',
  'chapters',
  'bookmarks',
  'tags',
  'ratings',
  'followers',
  'following',
  'read-history',
] as const;

export class ExportQueryDto {
  @ApiPropertyOptional({
    description:
      'Optional list of chapter IDs. Accepts comma separated values or repeated query params. Leave empty to export all chapters.',
    type: [String],
    example: ['chapter-id-1', 'chapter-id-2'],
  })
  chapterIds?: string[] | string;
}

export class BackupQueryDto {
  @ApiPropertyOptional({
    description:
      'Optional list of dataset buckets to include in the backup archive. Leave empty to include everything.',
    enum: BACKUP_SECTION_OPTIONS,
    isArray: true,
    example: ['stories', 'chapters', 'bookmarks'],
  })
  include?: BackupSection[] | BackupSection | string;
}

export class BackupFileMetaDto {
  @ApiProperty({ description: 'Suggested filename for the generated backup file' })
  filename: string;

  @ApiProperty({ description: 'Content-type for the backup response' })
  mimeType: string;
}
