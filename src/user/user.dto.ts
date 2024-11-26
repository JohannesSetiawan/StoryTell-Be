export type UserCreationData = {
  username: string;
  password: string;
};

export type UserLoginData = {
  username: string;
  password: string;
};


export type UpdateUserData = {
  username: string;
  password: string;
};

export type UserTokenPayload = { 
  userId: string, 
  username: string, 
  isAdmin: boolean
}