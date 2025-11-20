import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  Res,
  Param,
  Sse,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { SendMessageDto, MessageResponseDto, ConversationListResponseDto, MessageHistoryResponseDto, UnreadCountResponseDto, MarkAsReadDto } from './message.dto';
import { JwtGuard } from '../user/jwt.guard';
import { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable, map, filter } from 'rxjs';

@ApiTags('message')
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('send')
  @ApiOperation({ summary: 'Send a direct message to another user' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent successfully.', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async sendMessage(@Body() data: SendMessageDto, @Req() request, @Res() response) {
    try {
      const senderId = request.user.id;
      const result = await this.messageService.sendMessage(senderId, data);
      return response.status(201).json(result);
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for the current user' })
  @ApiResponse({ status: 200, description: 'List of conversations.', type: ConversationListResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async getConversations(@Req() request, @Res() response) {
    try {
      const userId = request.user.id;
      const conversations = await this.messageService.getConversations(userId);
      return response.status(200).json({ conversations });
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('history/:otherUserId')
  @ApiOperation({ summary: 'Get message history with another user' })
  @ApiParam({ name: 'otherUserId', description: 'The ID of the other user' })
  @ApiResponse({ status: 200, description: 'Message history.', type: MessageHistoryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async getMessageHistory(@Param('otherUserId') otherUserId: string, @Req() request, @Res() response) {
    try {
      const userId = request.user.id;
      const messages = await this.messageService.getMessageHistory(userId, otherUserId);
      return response.status(200).json({ messages });
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('mark-read')
  @ApiOperation({ summary: 'Mark messages from a sender as read' })
  @ApiBody({ type: MarkAsReadDto })
  @ApiResponse({ status: 200, description: 'Messages marked as read.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async markAsRead(@Body() data: MarkAsReadDto, @Req() request, @Res() response) {
    try {
      const receiverId = request.user.id;
      await this.messageService.markAsRead(receiverId, data.senderId);
      return response.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete('conversation/:otherUserId')
  @ApiOperation({ summary: 'Delete conversation history with another user' })
  @ApiParam({ name: 'otherUserId', description: 'The ID of the other user' })
  @ApiResponse({ status: 200, description: 'Conversation deleted.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async deleteConversation(@Param('otherUserId') otherUserId: string, @Req() request, @Res() response) {
    try {
      const userId = request.user.id;
      await this.messageService.deleteConversation(userId, otherUserId);
      return response.status(200).json({ message: 'Conversation deleted' });
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count for current user' })
  @ApiResponse({ status: 200, description: 'Unread message count.', type: UnreadCountResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async getUnreadCount(@Req() request, @Res() response) {
    try {
      const userId = request.user.id;
      const result = await this.messageService.getUnreadCount(userId);
      return response.status(200).json(result);
    } catch (error) {
      return response.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Sse('stream')
  @ApiOperation({ summary: 'Server-Sent Events stream for real-time messages' })
  @ApiResponse({ status: 200, description: 'SSE connection established.' })
  messageStream(@Req() request): Observable<MessageEvent> {
    const userId = request.user.id;
    
    return this.messageService.getMessageStream().pipe(
      filter((event) => event.userId === userId),
      map((event) => ({
        data: JSON.stringify(event.message),
      } as MessageEvent)),
    );
  }
}
