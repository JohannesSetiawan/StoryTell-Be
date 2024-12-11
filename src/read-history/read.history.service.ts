import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReadHistoryService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getHistories(userId: string) {
    const histories = await this.prisma.readHistory.findMany({
        where: {
            userId
        },
        include: {
          story:{
            select:{
              title: true,
            }
          }
        },
        orderBy:{
            date: "desc"
        }
    })
    return histories;
  }

  async getHistoriesForSpecificStory(userId: string, storyId: string){
    const history = await this.prisma.readHistory.findUnique({
        where: {
            storyId_userId: {userId, storyId}
        },
        include: {
          story:{
            select:{
              title: true,
            }
          },
          chapter: {
            select: {
              title: true,
              order: true
            }
          }
        },
    })
    return history;
  }
}
