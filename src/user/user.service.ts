import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { LoginResponseDto, UserCreationData, UserLoginData, UpdateUserData, UserResponseDto, UserTokenPayload } from './user.dto';

@Injectable()
export class UserService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async user(userId: string): Promise<UserResponseDto> {
    const result = await this.dataSource.query(
      'SELECT id, username, description, "dateCreated", "isAdmin" FROM "User" WHERE id = $1',
      [userId],
    );
    const user = result[0];
    if (!user) {
      return null;
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<UserResponseDto> {
    const result = await this.dataSource.query(
      'SELECT id, username, description, "dateCreated", "isAdmin" FROM "User" WHERE username = $1',
      [username],
    );
    const user = result[0];
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async login(loginData: UserLoginData): Promise<LoginResponseDto> {
    const { username, password } = loginData;
    const result = await this.dataSource.query(
      'SELECT id, username, password, "isAdmin" FROM "User" WHERE username = $1',
      [username],
    );
    const user = result[0];

    if (!user) {
      throw new Error("You haven't registered yet!");
    }

    const hashed_password = user.password;
    const is_password_matched = await bcrypt.compare(password, hashed_password);
    if (is_password_matched) {
      const token = sign(
        { username: user.username, id: user.id, isAdmin: user.isAdmin },
        process.env.SECRET_KEY,
        { expiresIn: '30 days' },
      );
      return { token: token, user: user.id, username: user.username, isAdmin: user.isAdmin };
    } else {
      throw new Error("Username and password doesn't match!");
    }
  }

  async register(data: UserCreationData): Promise<LoginResponseDto> {
    const userResult = await this.dataSource.query(
      'SELECT id FROM "User" WHERE username = $1',
      [data.username],
    );
    if (userResult.length > 0) {
      throw new Error('Username is already registered');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);
    
    const newUserResult = await this.dataSource.query(
      'INSERT INTO "User" (username, password, description) VALUES ($1, $2, $3) RETURNING id, username, description, "isAdmin"',
      [data.username, hashedPassword],
    );
    
    const user = newUserResult[0];
    const token = sign(
      { username: user.username, id: user.id, isAdmin: user.isAdmin },
      process.env.SECRET_KEY,
      { expiresIn: '30 days' },
    );
    return { 
      token: token, user: user.id, username: user.username, isAdmin: user.isAdmin };
  }

  async updateUser(userId: string, data: UpdateUserData, updatingUser: UserTokenPayload): Promise<UserResponseDto> {
    if (!updatingUser.isAdmin && !(updatingUser.id === userId)) {
      throw new ForbiddenException("You don't have access to do this action!");
    }

    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (data.username) {
      updates.push(`username = $${valueIndex++}`);
      values.push(data.username);
    }

    if (data.password) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(data.password, salt);
      updates.push(`password = $${valueIndex++}`);
      values.push(hashedPassword);
    }

    if (data.description) {
      updates.push(`description = $${valueIndex++}`);
      values.push(data.description);
    }
    
    if (updates.length === 0) {
      // Nothing to update
      return this.user(userId);
    }

    values.push(userId);
    const query = `UPDATE "User" SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING id, username, description, "dateCreated", "isAdmin"`;

    const result = await this.dataSource.query(query, values);
    return result[0];
  }

  async deleteUser(userId: string): Promise<UserResponseDto> {
    const result = await this.dataSource.query('DELETE FROM "User" WHERE id = $1 RETURNING id, username, description, "dateCreated", "isAdmin"', [userId]);
    return result[0];
  }

  async getUserList(page: number = 1, perPage: number = 20, username?: string) {
    const offset = (page - 1) * perPage;
    
    let query = 'SELECT id, username, description, "dateCreated" FROM "User"';
    let countQuery = 'SELECT COUNT(*) as total FROM "User"';
    const params: any[] = [];
    const countParams: any[] = [];
    
    if (username && username.trim() !== '') {
      query += ' WHERE username ILIKE $1';
      countQuery += ' WHERE username ILIKE $1';
      params.push(`%${username}%`);
      countParams.push(`%${username}%`);
    }
    
    query += ` ORDER BY "dateCreated" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(perPage, offset);
    
    const [users, countResult] = await Promise.all([
      this.dataSource.query(query, params),
      this.dataSource.query(countQuery, countParams),
    ]);
    
    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / perPage);
    
    return {
      data: users,
      total,
      page,
      perPage,
      totalPages,
    };
  }
}
