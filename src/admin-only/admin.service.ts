import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getAllUser(){
    return await this.prisma.user.findMany({})
  }

  async getAllStories(){
    return await this.prisma.story.findMany({
      where: { isprivate: false },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        chapters: {
          orderBy: {
            order: 'desc',
          },
        },
      },
    });
  }

  async getAllChapters(){
    return await this.prisma.chapter.findMany({
      include:{
        story: {
          include: {
            author: {
              select:{
                username: true,
                id: true
              }
            }
          }
        }
      }
    })
  }

  async getAllComments(){
    return await this.prisma.storyComment.findMany({

    })
  }
}
