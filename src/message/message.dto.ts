import { ApiProperty } from "@nestjs/swagger";

export class Message {
  @ApiProperty()
  id: string;
  @ApiProperty()
  senderId: string;
  @ApiProperty()
  receiverId: string;
  @ApiProperty()
  message: string;
  @ApiProperty()
  timeSent: Date;
  @ApiProperty()
  isRead: boolean;
  @ApiProperty({ required: false })
  timeRead?: Date;
  @ApiProperty()
  deletedBySender: boolean;
  @ApiProperty()
  deletedByReceiver: boolean;
}

export class SendMessageDto {
  @ApiProperty()
  receiverId: string;
  @ApiProperty()
  message: string;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  senderId: string;
  @ApiProperty()
  receiverId: string;
  @ApiProperty()
  message: string;
  @ApiProperty()
  timeSent: Date;
  @ApiProperty()
  isRead: boolean;
  @ApiProperty({ required: false })
  timeRead?: Date;
}

export class ConversationDto {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  username: string;
  @ApiProperty({ required: false })
  lastMessage?: string;
  @ApiProperty({ required: false })
  lastMessageTime?: Date;
  @ApiProperty()
  unreadCount: number;
}

export class ConversationListResponseDto {
  @ApiProperty({ type: [ConversationDto] })
  conversations: ConversationDto[];
}

export class MessageHistoryResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  messages: MessageResponseDto[];
}

export class UnreadCountResponseDto {
  @ApiProperty()
  unreadCount: number;
  @ApiProperty()
  hasUnread: boolean;
}

export class MarkAsReadDto {
  @ApiProperty()
  senderId: string;
}
