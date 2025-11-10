import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { LoginResponseDto, UserCreationData, UserLoginData, UpdateUserData, UserResponseDto, UserTokenPayload } from './user.dto';

@Injectable()
export class UserService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async user(userId: string): Promise<UserResponseDto> {
    const result = await this.pool.query(
      'SELECT id, username, description, "dateCreated", "isAdmin" FROM "User" WHERE id = $1',
      [userId],
    );
    const user = result.rows[0];
    if (!user) {
      return null;
    }
    return user;
  }

  async login(loginData: UserLoginData): Promise<LoginResponseDto> {
    const { username, password } = loginData;
    const result = await this.pool.query(
      'SELECT * FROM "User" WHERE username = $1',
      [username],
    );
    const user = result.rows[0];

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
      return { token: token, user: user.id };
    } else {
      throw new Error("Username and password doesn't match!");
    }
  }

  async register(data: UserCreationData): Promise<LoginResponseDto> {
    const userResult = await this.pool.query(
      'SELECT * FROM "User" WHERE username = $1',
      [data.username],
    );
    if (userResult.rows.length > 0) {
      throw new Error('Username is already registered');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);
    
    const newUserResult = await this.pool.query(
      'INSERT INTO "User" (username, password, description) VALUES ($1, $2, $3) RETURNING id, username, description, "isAdmin"',
      [data.username, hashedPassword],
    );
    
    const user = newUserResult.rows[0];
    const token = sign(
      { username: user.username, id: user.id, isAdmin: user.isAdmin },
      process.env.SECRET_KEY,
      { expiresIn: '30 days' },
    );
    return { 
      token: token, user: user.id };
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

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteUser(userId: string): Promise<UserResponseDto> {
    const result = await this.pool.query('DELETE FROM "User" WHERE id = $1 RETURNING id, username, description, "dateCreated", "isAdmin"', [userId]);
    return result.rows[0];
  }
}
