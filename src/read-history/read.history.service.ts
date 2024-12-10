import { Injectable, Inject, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
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
        orderBy:{
            date: "desc"
        }
    })
    return histories;
  }
}
