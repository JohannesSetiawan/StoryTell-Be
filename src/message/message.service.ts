import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SendMessageDto, MessageResponseDto, ConversationDto, UnreadCountResponseDto } from './message.dto';
import { Subject } from 'rxjs';

interface MessageEvent {
  userId: string;
  message: MessageResponseDto;
}

@Injectable()
export class MessageService {
  private messageSubject = new Subject<MessageEvent>();

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  getMessageStream() {
    return this.messageSubject.asObservable();
  }

  async sendMessage(senderId: string, data: SendMessageDto): Promise<MessageResponseDto> {
    const result = await this.dataSource.query(
      `INSERT INTO "Message" ("senderId", "receiverId", message, "timeSent")
       VALUES ($1, $2, $3, NOW())
       RETURNING id, "senderId", "receiverId", message, "timeSent", "isRead", "timeRead"`,
      [senderId, data.receiverId, data.message],
    );

    const message = result[0];

    // Emit message to SSE stream for the receiver
    this.messageSubject.next({
      userId: data.receiverId,
      message: message,
    });

    return message;
  }

  async getConversations(userId: string): Promise<ConversationDto[]> {
    const result = await this.dataSource.query(
      `WITH user_conversations AS (
        SELECT DISTINCT
          CASE
            WHEN "senderId" = $1 THEN "receiverId"
            ELSE "senderId"
          END AS "otherUserId"
        FROM "Message"
        WHERE ("senderId" = $1 OR "receiverId" = $1)
          AND (
            ("senderId" = $1 AND "deletedBySender" = false) OR
            ("receiverId" = $1 AND "deletedByReceiver" = false)
          )
      ),
      latest_messages AS (
        SELECT DISTINCT ON ("otherUserId")
          uc."otherUserId",
          m.message AS "lastMessage",
          m."timeSent" AS "lastMessageTime"
        FROM user_conversations uc
        LEFT JOIN "Message" m ON (
          (m."senderId" = $1 AND m."receiverId" = uc."otherUserId" AND m."deletedBySender" = false) OR
          (m."senderId" = uc."otherUserId" AND m."receiverId" = $1 AND m."deletedByReceiver" = false)
        )
        ORDER BY uc."otherUserId", m."timeSent" DESC
      ),
      unread_counts AS (
        SELECT
          "senderId" AS "otherUserId",
          COUNT(*) AS "unreadCount"
        FROM "Message"
        WHERE "receiverId" = $1 AND "isRead" = false AND "deletedByReceiver" = false
        GROUP BY "senderId"
      )
      SELECT
        u.id AS "userId",
        u.username,
        lm."lastMessage",
        lm."lastMessageTime",
        COALESCE(unr."unreadCount", 0)::int AS "unreadCount"
      FROM user_conversations uc
      JOIN "User" u ON u.id = uc."otherUserId"
      LEFT JOIN latest_messages lm ON lm."otherUserId" = uc."otherUserId"
      LEFT JOIN unread_counts unr ON unr."otherUserId" = uc."otherUserId"
      ORDER BY lm."lastMessageTime" DESC NULLS LAST`,
      [userId],
    );

    return result;
  }

  async getMessageHistory(userId: string, otherUserId: string): Promise<MessageResponseDto[]> {
    const result = await this.dataSource.query(
      `SELECT id, "senderId", "receiverId", message, "timeSent", "isRead", "timeRead"
       FROM "Message"
       WHERE (("senderId" = $1 AND "receiverId" = $2) OR ("senderId" = $2 AND "receiverId" = $1))
         AND (
           ("senderId" = $1 AND "deletedBySender" = false) OR
           ("receiverId" = $1 AND "deletedByReceiver" = false)
         )
       ORDER BY "timeSent" ASC`,
      [userId, otherUserId],
    );

    return result;
  }

  async markAsRead(receiverId: string, senderId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE "Message"
       SET "isRead" = true, "timeRead" = NOW()
       WHERE "receiverId" = $1 AND "senderId" = $2 AND "isRead" = false AND "deletedByReceiver" = false`,
      [receiverId, senderId],
    );
  }

  async deleteConversation(userId: string, otherUserId: string): Promise<void> {
    // Mark messages as deleted only for the user who requested deletion
    await this.dataSource.query(
      `UPDATE "Message"
       SET "deletedBySender" = CASE WHEN "senderId" = $1 THEN true ELSE "deletedBySender" END,
           "deletedByReceiver" = CASE WHEN "receiverId" = $1 THEN true ELSE "deletedByReceiver" END
       WHERE ("senderId" = $1 AND "receiverId" = $2) OR ("senderId" = $2 AND "receiverId" = $1)`,
      [userId, otherUserId],
    );
  }

  async getUnreadCount(userId: string): Promise<UnreadCountResponseDto> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*)::int AS "unreadCount"
       FROM "Message"
       WHERE "receiverId" = $1 AND "isRead" = false AND "deletedByReceiver" = false`,
      [userId],
    );

    const unreadCount = result[0].unreadCount;
    return {
      unreadCount,
      hasUnread: unreadCount > 0,
    };
  }
}
