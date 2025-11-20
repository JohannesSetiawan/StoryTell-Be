import { ApiProperty } from "@nestjs/swagger";
import { Rating } from "../rating/rating.dto";
import { ReadHistory } from "../read-history/read.history.dto";
import { Story } from "../story/story.dto";
import { StoryComment } from "../story-comment/story.comment.dto";

export class LoginDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  password?: string;
}

export class LoginResponseDto {
  @ApiProperty()
  token: string;
  @ApiProperty()
  user: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  isAdmin: boolean;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  dateCreated: Date;
  @ApiProperty()
  isAdmin: boolean;
}

export class User {
  @ApiProperty()
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty({ required: false })
  password?: string;
  @ApiProperty()
  dateCreated: Date;
  @ApiProperty({ required: false, default: false })
  isAdmin?: boolean;
  @ApiProperty({ type: () => [Story], required: false })
  stories?: Story[];
  @ApiProperty({ type: () => [Rating], required: false })
  ratings?: Rating[];
  @ApiProperty({ type: () => [StoryComment], required: false })
  storyComments?: StoryComment[];
  @ApiProperty({ type: () => [ReadHistory], required: false })
  readHistory?: ReadHistory[];
}

export class UserCreationData {
  @ApiProperty()
  username: string;
  @ApiProperty()
  password: string;
  @ApiProperty({ required: false })
  description?: string;
};

export class UserLoginData {
  @ApiProperty()
  username: string;
  @ApiProperty()
  password: string;
};


export class UpdateUserData {
  @ApiProperty({ required: false })
  username?: string;
  @ApiProperty({ required: false })
  password?: string;
  @ApiProperty({ required: false })
  description?: string;
};

export class UserTokenPayload { 
  @ApiProperty()
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  isAdmin: boolean
}

export class UserListItemDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty({ required: false })
  description?: string;
  @ApiProperty()
  dateCreated: Date;
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserListItemDto] })
  data: UserListItemDto[];
  @ApiProperty()
  total: number;
  @ApiProperty()
  page: number;
  @ApiProperty()
  perPage: number;
  @ApiProperty()
  totalPages: number;
}