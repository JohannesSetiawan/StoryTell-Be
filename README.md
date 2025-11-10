# StoryTell Backend

## Description

This is the backend for StoryTell, a platform for creating and sharing stories. It is built with the [Nest](https://github.com/nestjs/nest) framework and TypeScript.

## Installation

```bash
$ npm install
```

## Environment Variables

Create a `.env` file in the root of the `/be` directory with the following variables:

```
DATABASE_URL="YourDbConnectionString"
SECRET_KEY = "YourSecret"
```

## Database Management

This project uses `node-pg-migrate` for database migrations and `pg` for database access.

### Migrations
```bash
# Create a new migration file
$ npm run db:migrate:create your-migration-name

# Run all pending migrations
$ npm run db:migrate:up

# Roll back the last migration
$ npm run db:migrate:down
```

### Seeding
To populate the database with initial data, run:
```bash
$ npm run db:seed
```

## Running the app

```bash
# development watch mode
$ npm run dev

# production mode
$ npm run prod
```

## API Documentation
This application uses Swagger for API documentation. Once the application is running in development mode, you can access the API documentation at [http://localhost:3000/api](http://localhost:3000/api).

The API is structured as follows:

### Auth & User
- `POST /user/register`: Create a new user.
- `POST /user/login`: Login and receive a JWT token.
- `GET /user`: Get the logged-in user's information. (Requires Bearer Token)
- `PUT /user`: Update the logged-in user's profile. (Requires Bearer Token)

### Story
- `POST /story`: Create a new story. (Requires Bearer Token)
- `GET /story`: Get all stories (paginated).
- `GET /story/:storyId`: Get details of a specific story.
- `GET /story/user/:userId`: Get all stories by a specific user.
- `PUT /story/:storyId`: Update a story. (Requires Bearer Token)
- `DELETE /story/:storyId`: Delete a story. (Requires Bearer Token)

### Chapter
- `POST /chapter/:storyId`: Create a new chapter for a story. (Requires Bearer Token)
- `GET /chapter/story/:storyId`: Get all chapters for a story.
- `GET /chapter/:chapterId`: Get a specific chapter.
- `PUT /chapter/:id`: Update a chapter. (Requires Bearer Token)
- `DELETE /chapter/:id`: Delete a chapter. (Requires Bearer Token)

### Story Comment
- `POST /comment/:storyId`: Add a comment to a story. (Requires Bearer Token)
- `POST /comment/:storyId/:chapterId`: Add a comment to a chapter. (Requires Bearer Token)
- `GET /comment/story/:storyId`: Get all comments for a story.
- `GET /comment/chapter/:chapterId`: Get all comments for a chapter.
- `PUT /comment/:id`: Update a comment. (Requires Bearer Token)
- `DELETE /comment/:id`: Delete a comment. (Requires Bearer Token)

### Rating
- `POST /rating/:storyId`: Create or update a rating for a story. (Requires Bearer Token)
- `GET /rating/story/:storyId`: Get all ratings for a story.
- `GET /rating/:storyId`: Get the current user's rating for a story. (Requires Bearer Token)
- `PUT /rating/:id`: Update a rating. (Requires Bearer Token)
- `DELETE /rating/:id`: Delete a rating. (Requires Bearer Token)

### Read History
- `GET /history`: Get the current user's read history. (Requires Bearer Token)
- `GET /history/:storyId`: Get the user's read history for a specific story. (Requires Bearer Token)

## Deployment with Docker
There's already a Dockerfile for deployments with Docker. Create the `.env` file as described above before running `docker build`.
