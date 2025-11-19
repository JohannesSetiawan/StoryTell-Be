import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import PDFDocument from 'pdfkit';
import archiver, { EntryData } from 'archiver';
import { PassThrough } from 'stream';
import { ExportFormat, BackupSection, BACKUP_SECTION_OPTIONS } from './export.dto';

interface StoryExportPayload {
  id: string;
  title: string;
  description: string | null;
  authorId: string;
  authorUsername?: string;
  storyStatus: string;
  dateCreated: Date;
  isprivate: boolean;
  tags: string[];
  chapters: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
  }>;
}

interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

@Injectable()
export class ExportService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async exportStory(
    storyId: string,
    format: ExportFormat,
    userId: string,
    chapterIds?: string[],
  ): Promise<ExportResult> {
    const story = await this.getStoryData(storyId, userId, chapterIds);

    switch (format) {
      case 'pdf':
        return {
          buffer: await this.generatePdf(story),
          filename: `${this.slugify(story.title)}.pdf`,
          mimeType: 'application/pdf',
        };
      case 'html':
        return {
          buffer: Buffer.from(this.generateHtml(story), 'utf8'),
          filename: `${this.slugify(story.title)}.html`,
          mimeType: 'text/html; charset=utf-8',
        };
      case 'txt':
        return {
          buffer: Buffer.from(this.generatePlainText(story), 'utf8'),
          filename: `${this.slugify(story.title)}.txt`,
          mimeType: 'text/plain; charset=utf-8',
        };
      case 'epub':
        return {
          buffer: await this.generateEpub(story),
          filename: `${this.slugify(story.title)}.epub`,
          mimeType: 'application/epub+zip',
        };
      default:
        throw new NotFoundException('Unsupported export format');
    }
  }

  async exportUserBackup(userId: string, sections?: BackupSection[]): Promise<ExportResult> {
    const sectionsToInclude = new Set(
      sections && sections.length > 0 ? sections : BACKUP_SECTION_OPTIONS,
    );

    const [user, stories, chapters, bookmarks, tags, ratings, followers, following, readHistory] =
      await Promise.all([
        this.dataSource.query(
          'SELECT id, username, description, "dateCreated", "isAdmin" FROM "User" WHERE id = $1',
          [userId],
        ),
        this.dataSource.query(
          'SELECT id, title, description, "dateCreated", "storyStatus", isprivate FROM "Story" WHERE "authorId" = $1 ORDER BY "dateCreated" DESC',
          [userId],
        ),
        this.dataSource.query(
          'SELECT id, title, content, "storyId", "order", "dateCreated" FROM "Chapter" WHERE "storyId" IN (SELECT id FROM "Story" WHERE "authorId" = $1)',
          [userId],
        ),
        this.dataSource.query(
          'SELECT b.id, b."storyId", s.title as "storyTitle", b."dateCreated" FROM "Bookmark" b JOIN "Story" s ON b."storyId" = s.id WHERE b."userId" = $1',
          [userId],
        ),
        this.dataSource.query(
          'SELECT t.id, t.name, t.category, ts."storyId" FROM "Tag" t JOIN "TagStory" ts ON t.id = ts."tagId" WHERE ts."storyId" IN (SELECT id FROM "Story" WHERE "authorId" = $1)',
          [userId],
        ),
        this.dataSource.query(
          'SELECT id, "storyId", rate, "dateCreated" FROM "Rating" WHERE "authorId" = $1',
          [userId],
        ),
        this.dataSource.query(
          'SELECT f.id, f."followerId", f."followingId", u.username as "followerUsername", f."dateCreated" FROM "Follow" f JOIN "User" u ON f."followerId" = u.id WHERE f."followingId" = $1',
          [userId],
        ),
        this.dataSource.query(
          'SELECT f.id, f."followerId", f."followingId", u.username as "followingUsername", f."dateCreated" FROM "Follow" f JOIN "User" u ON f."followingId" = u.id WHERE f."followerId" = $1',
          [userId],
        ),
        this.dataSource.query(
          'SELECT id, "storyId", "chapterId", date FROM "ReadHistory" WHERE "userId" = $1',
          [userId],
        ),
      ]);

    if (user.length === 0) {
      throw new NotFoundException('User not found');
    }

    const entries = [{ name: 'user.json', content: JSON.stringify(user[0], null, 2) }];

    if (sectionsToInclude.has('stories')) {
      entries.push({ name: 'stories.json', content: JSON.stringify(stories, null, 2) });
    }
    if (sectionsToInclude.has('chapters')) {
      entries.push({ name: 'chapters.json', content: JSON.stringify(chapters, null, 2) });
    }
    if (sectionsToInclude.has('bookmarks')) {
      entries.push({ name: 'bookmarks.json', content: JSON.stringify(bookmarks, null, 2) });
    }
    if (sectionsToInclude.has('tags')) {
      entries.push({ name: 'tags.json', content: JSON.stringify(tags, null, 2) });
    }
    if (sectionsToInclude.has('ratings')) {
      entries.push({ name: 'ratings.json', content: JSON.stringify(ratings, null, 2) });
    }
    if (sectionsToInclude.has('followers')) {
      entries.push({ name: 'followers.json', content: JSON.stringify(followers, null, 2) });
    }
    if (sectionsToInclude.has('following')) {
      entries.push({ name: 'following.json', content: JSON.stringify(following, null, 2) });
    }
    if (sectionsToInclude.has('read-history')) {
      entries.push({ name: 'read-history.json', content: JSON.stringify(readHistory, null, 2) });
    }

    const buffer = await this.createZipBuffer(entries);

    return {
      buffer,
      filename: `storytell-backup-${this.slugify(user[0].username)}-${Date.now()}.zip`,
      mimeType: 'application/zip',
    };
  }

  private async getStoryData(
    storyId: string,
    userId: string,
    chapterIds?: string[],
  ): Promise<StoryExportPayload> {
    const storyResult = await this.dataSource.query(
      `SELECT s.*, u.username as "authorUsername" FROM "Story" s LEFT JOIN "User" u ON s."authorId" = u.id WHERE s.id = $1`,
      [storyId],
    );

    if (storyResult.length === 0) {
      throw new NotFoundException('Story not found');
    }

    const story = storyResult[0];

    if (story.isprivate && story.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to export this private story');
    }

    const chapterParams: any[] = [storyId];
    let chapterWhere = '"storyId" = $1';
    if (chapterIds && chapterIds.length > 0) {
      chapterParams.push(chapterIds);
      chapterWhere += ` AND id = ANY($${chapterParams.length})`;
    }

    const chapters = await this.dataSource.query(
      `SELECT id, title, content, "order" FROM "Chapter" WHERE ${chapterWhere} ORDER BY "order" ASC`,
      chapterParams,
    );

    if (chapterIds && chapterIds.length > 0) {
      const foundIds = new Set(chapters.map((chapter) => chapter.id));
      const missing = chapterIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new NotFoundException('One or more chapters were not found for this story');
      }
    }

    const tags = await this.dataSource.query(
      `SELECT t.name FROM "Tag" t INNER JOIN "TagStory" ts ON t.id = ts."tagId" WHERE ts."storyId" = $1 ORDER BY t.category, t.name`,
      [storyId],
    );

    return {
      ...story,
      tags: tags.map((tag) => tag.name),
      chapters,
    };
  }

  private async generatePdf(story: StoryExportPayload): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(22).text(story.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Author: ${story.authorUsername || 'Unknown'}`);
      doc.text(`Status: ${story.storyStatus}`);
      doc.text(`Created: ${story.dateCreated ? new Date(story.dateCreated).toDateString() : 'Unknown'}`);
      if (story.tags.length > 0) {
        doc.text(`Tags: ${story.tags.join(', ')}`);
      }
      doc.moveDown();

      if (story.description) {
        doc.fontSize(12).text(story.description, { align: 'left' });
        doc.moveDown();
      }

      story.chapters.forEach((chapter, index) => {
        doc.addPage();
        doc.fontSize(18).text(`${chapter.order ?? index + 1}. ${chapter.title}`);
        doc.moveDown();
        doc.fontSize(12).text(chapter.content || 'No content', {
          align: 'left',
        });
      });

      doc.end();
    });
  }

  private generatePlainText(story: StoryExportPayload): string {
    const lines = [
      `${story.title}`,
      `Author: ${story.authorUsername || 'Unknown'}`,
      `Status: ${story.storyStatus}`,
    ];

    if (story.tags.length > 0) {
      lines.push(`Tags: ${story.tags.join(', ')}`);
    }

    if (story.description) {
      lines.push('', story.description);
    }

    story.chapters.forEach((chapter, index) => {
      lines.push('', `Chapter ${chapter.order ?? index + 1}: ${chapter.title}`, chapter.content || 'No content');
    });

    return lines.join('\n');
  }

  private generateHtml(story: StoryExportPayload): string {
    const chapterHtml = story.chapters
      .map(
        (chapter, index) => `
        <article>
          <h2>Chapter ${chapter.order ?? index + 1}: ${this.escapeHtml(chapter.title)}</h2>
          <pre style="white-space: pre-wrap; font-family: inherit;">
${this.escapeHtml(chapter.content || '')}
          </pre>
        </article>
      `,
      )
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHtml(story.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 24px; }
    h1 { text-align: center; }
    article { margin-bottom: 32px; }
    pre { background: #f7f7f7; padding: 16px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(story.title)}</h1>
  <p><strong>Author:</strong> ${this.escapeHtml(story.authorUsername || 'Unknown')}</p>
  <p><strong>Status:</strong> ${this.escapeHtml(story.storyStatus)}</p>
  ${story.tags.length ? `<p><strong>Tags:</strong> ${story.tags.map((tag) => this.escapeHtml(tag)).join(', ')}</p>` : ''}
  ${story.description ? `<section><h2>Description</h2><p>${this.escapeHtml(story.description)}</p></section>` : ''}
  ${chapterHtml}
</body>
</html>`;
  }

  private async generateEpub(story: StoryExportPayload): Promise<Buffer> {
    const xhtmlBody = story.chapters
      .map(
        (chapter, index) => `
        <section>
          <h2>Chapter ${chapter.order ?? index + 1}: ${this.escapeXml(chapter.title)}</h2>
          <p>${this.escapeXml(chapter.content || '').replace(/\n/g, '<br/>')}</p>
        </section>
      `,
      )
      .join('\n');

    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>${this.escapeXml(story.title)}</title>
  </head>
  <body>
    <h1>${this.escapeXml(story.title)}</h1>
    <p>Author: ${this.escapeXml(story.authorUsername || 'Unknown')}</p>
    ${xhtmlBody}
  </body>
</html>`;

    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${story.id}</dc:identifier>
    <dc:title>${this.escapeXml(story.title)}</dc:title>
    <dc:creator>${this.escapeXml(story.authorUsername || 'Unknown')}</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="story" href="story.xhtml" media-type="application/xhtml+xml" />
  </manifest>
  <spine>
    <itemref idref="story" />
  </spine>
</package>`;

    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>`;

    return this.createZipBuffer([
      { name: 'mimetype', content: 'application/epub+zip', options: { store: true } },
      { name: 'META-INF/container.xml', content: containerXml },
      { name: 'OEBPS/content.opf', content: contentOpf },
      { name: 'OEBPS/story.xhtml', content: xhtml },
    ]);
  }

  private async createZipBuffer(
    entries: Array<{ name: string; content: string | Buffer; options?: Record<string, any> }>,
  ): Promise<Buffer> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    return new Promise<Buffer>((resolve, reject) => {
      const stream = new PassThrough();
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
      archive.on('error', reject);

      archive.pipe(stream);
      entries.forEach((entry) => {
        archive.append(entry.content, {
          name: entry.name,
          ...(entry.options || {}),
        } as EntryData);
      });
      archive.finalize();
    });
  }

  private slugify(value: string): string {
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);
    return sanitized || 'story';
  }

  private escapeHtml(input: string): string {
    return input
      ? input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
      : '';
  }

  private escapeXml(input: string): string {
    return this.escapeHtml(input).trim();
  }
}
