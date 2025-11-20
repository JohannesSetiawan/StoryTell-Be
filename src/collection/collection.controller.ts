import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Put,
  Delete,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionDto, UpdateCollectionDto } from './collection.dto';
import { JwtGuard } from '../user/jwt.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('collection')
@Controller('collection')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('')
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiBody({ type: CreateCollectionDto })
  @ApiResponse({ status: 201, description: 'The collection has been successfully created.' })
  async createCollection(
    @Body() createCollectionDto: CreateCollectionDto,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    const collection = await this.collectionService.createCollection(userId, createCollectionDto);
    return response.status(201).json(collection);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('')
  @ApiOperation({ summary: 'Get user collections' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User collections retrieved successfully.' })
  async getUserCollections(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    const collections = await this.collectionService.getUserCollections(userId, page, perPage);
    return response.status(200).json(collections);
  }

  @Get('/discover')
  @ApiOperation({ summary: 'Discover public collections' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Public collections retrieved successfully.' })
  async getDiscoverCollections(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Res() response,
  ) {
    const collections = await this.collectionService.getDiscoverCollections(page, perPage);
    return response.status(200).json(collections);
  }

  @Get('/user/:username')
  @ApiOperation({ summary: 'Get user public collections' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User public collections retrieved successfully.' })
  async getUserPublicCollections(
    @Param('username') username: string,
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Res() response,
  ) {
    const collections = await this.collectionService.getUserPublicCollections(username, page, perPage);
    return response.status(200).json(collections);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('/:id')
  @ApiOperation({ summary: 'Get specific collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Collection retrieved successfully.' })
  async getCollection(
    @Param('id') id: string,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    const collection = await this.collectionService.getCollectionById(id, userId);
    return response.status(200).json(collection);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Put('/:id')
  @ApiOperation({ summary: 'Update collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiBody({ type: UpdateCollectionDto })
  @ApiResponse({ status: 200, description: 'Collection updated successfully.' })
  async updateCollection(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    const collection = await this.collectionService.updateCollection(id, userId, updateCollectionDto);
    return response.status(200).json(collection);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Collection deleted successfully.' })
  async deleteCollection(
    @Param('id') id: string,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    await this.collectionService.deleteCollection(id, userId);
    return response.status(200).json({ message: 'Collection deleted successfully' });
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('/:id/story/:storyId')
  @ApiOperation({ summary: 'Add story to collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 201, description: 'Story added to collection successfully.' })
  async addStoryToCollection(
    @Param('id') id: string,
    @Param('storyId') storyId: string,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    await this.collectionService.addStoryToCollection(id, storyId, userId);
    return response.status(201).json({ message: 'Story added to collection' });
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete('/:id/story/:storyId')
  @ApiOperation({ summary: 'Remove story from collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Story removed from collection successfully.' })
  async removeStoryFromCollection(
    @Param('id') id: string,
    @Param('storyId') storyId: string,
    @Req() request,
    @Res() response,
  ) {
    const userId = request.user.id;
    await this.collectionService.removeStoryFromCollection(id, storyId, userId);
    return response.status(200).json({ message: 'Story removed from collection' });
  }
}
