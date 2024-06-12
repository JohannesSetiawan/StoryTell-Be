import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from "bcrypt";
import { sign } from 'jsonwebtoken';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const {where, orderBy } = params;
    const User = this.prisma.user.findFirst({
      where,
    });
    const password = (await User).password

  }

  async createUser(data: Prisma.UserCreateInput) {
    const salt = await bcrypt.genSalt()
    data.password = await bcrypt.hash(data.password, salt)
    const newUser = this.prisma.user.create({
      data,
    });
    const user = await newUser
    const token = sign(
      {username: user.username, id: user.id},
      process.env.SECRET_KEY,
      {expiresIn: "24h"}
    )
    return {"user": (await newUser).id, "token": token}
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}