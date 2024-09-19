import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from "bcrypt";
import { sign } from 'jsonwebtoken';
import { UserLoginData } from './user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async user(
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
    });
    const {username, id, description} = user
    return {"username": username, "userId": id, "description": description }
  }

  async login(loginData: UserLoginData){
    const {username, password} = loginData
    const user =  await this.prisma.user.findFirst({
      where: {username: username}
    })

    if (user === null){
      throw new Error("You haven't registered yet!")
    }

    const hashed_password = user.password
    const is_password_matched = await bcrypt.compare(password, hashed_password)
    if (is_password_matched){
      const token = sign(
        {username: user.username, id: user.id},
        process.env.SECRET_KEY,
        {expiresIn: "30 days"}
      )
      return {"user": user.id, "token": token}
    } else{
      throw new Error("Username and password doesn't match!")
    }
  }

  async register(data: Prisma.UserCreateInput) {
    
    const User =  await this.prisma.user.findFirst({
      where: {username: data.username}
    })
    if (User){
      throw new Error("Username is already registered")
    }

    const salt = await bcrypt.genSalt()
    data.password = await bcrypt.hash(data.password, salt)
    const newUser = this.prisma.user.create({
      data,
    });

    const user = await newUser
    const token = sign(
      {username: user.username, id: user.id},
      process.env.SECRET_KEY,
      {expiresIn: "30 days"}
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