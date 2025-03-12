## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

# App Description
### Description
- An application for creating and sharing stories 

### Technologies used
- Typescript with NestJs framework
- PostgreSQl database. Using Primsa to connects it to NestJs

### API Docs (Kind of):
1. Auth
- `POST /register` = Create new user.
- `POST /login` = Login.
- `GET /user` = Get logged in user information.

2. Story
- `POST /stories` = Create new story.
- `GET /stories` = Get all created stories.
- `GET /stories/:userId` = Get all created stories by user with userId.
- `PUT /stories/:storyId` = Update story with storyId.
- `DELETE /stories/:storyId` = Delete story with storyId.

3. Chapters
- `POST /chapters` = Create new chapter for a stroy.
- `GET /chapter/?storyId=:storyId` = Get all created chapters for a story.
- `GET /chapter/:chapterId` = Get a chapter with chapterId.
- `PUT /chapter/:chapterId` = Update chapter with chapterId.
- `DELETE /chapter/:chapterId` = Delete chapter with chapterId.

4. Comments

5. Ratings

### Deployment with Docker
There's already a Dockerfile for deployments with Docker. Can be used with docker compose. Docker images will be available later.
