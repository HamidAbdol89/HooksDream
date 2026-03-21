# HooksDream

[![Build Status](https://img.shields.io/travis/HamidAbdol89/HooksDream.svg?style=flat-square)](https://travis-ci.org/HamidAbdol89/HooksDream)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/github/v/release/HamidAbdol89/HooksDream?style=flat-square)](https://github.com/HamidAbdol89/HooksDream/releases)

## Description

HooksDream is a project developed using TypeScript and a variety of other technologies. This repository contains the backend services for a dynamic application, featuring functionalities such as user authentication, post management, social interactions like following and liking, and real-time features like chat and notifications.

## Features

*   **User Authentication:** Secure registration and login, including Google authentication.
*   **Post Management:** Create, retrieve, update, and delete posts.
*   **Social Interactions:** Follow users, like posts, and discover potential friends.
*   **Real-time Communication:** Chat functionality for instant messaging and push notifications for timely updates.
*   **Content Management:** Support for story creation and file uploads.
*   **Search Functionality:** Efficiently search for users and content with history tracking.
*   **Scalable Architecture:** Designed with a modular backend structure for maintainability and scalability.

## Installation

To set up HooksDream locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/HamidAbdol89/HooksDream.git
    cd HooksDream
    ```

2.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Configure environment variables:**
    Create a `.env` file in the `backend` directory by copying the example:
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file and fill in your specific environment variables, such as database credentials, API keys, and JWT secrets.

5.  **Database Setup:**
    Ensure your database is running and accessible. The application expects a MongoDB database by default. Update the `MONGO_URI` in your `.env` file accordingly.

6.  **Run the server:**
    ```bash
    npm start
    ```
    The server will typically run on `http://localhost:3000` or a port specified in your `.env` file.

## Usage

Once the server is running, you can interact with the API endpoints. Below are examples of common operations.

### User Registration

**Endpoint:** `POST /api/auth/register`

**Request Body Example:**

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

### Create a Post

**Endpoint:** `POST /api/posts`

**Request Body Example:**

```json
{
  "content": "This is my first post!",
  "imageUrl": "http://example.com/image.jpg"
}
```

### Follow a User

**Endpoint:** `POST /api/users/:userId/follow`

**Example:** To follow user with ID `60c72b2f9b1e8a001f8e4c8a`:
```bash
curl -X POST \
  http://localhost:3000/api/users/60c72b2f9b1e8a001f8e4c8a/follow \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN'
```

## API Documentation

The HooksDream backend exposes a RESTful API. Below is a summary of key endpoints. For a comprehensive list and detailed request/response schemas, please refer to the generated API documentation within the project (if available, e.g., Swagger UI).

### Authentication (`/api/auth`)

*   `POST /register`: Register a new user.
*   `POST /login`: Log in an existing user.
*   `POST /google`: Authenticate using Google OAuth.

### Users (`/api/users`)

*   `GET /`: Get a list of all users.
*   `GET /:userId`: Get details for a specific user.
*   `PUT /:userId`: Update user profile.
*   `POST /:userId/follow`: Follow a user.
*   `DELETE /:userId/follow`: Unfollow a user.
*   `GET /me`: Get the authenticated user's profile.

### Posts (`/api/posts`)

*   `POST /`: Create a new post.
*   `GET /`: Get all posts (feed).
*   `GET /:postId`: Get a specific post.
*   `PUT /:postId`: Update a post.
*   `DELETE /:postId`: Delete a post.
*   `POST /:postId/like`: Like a post.
*   `DELETE /:postId/like`: Unlike a post.

### Comments (`/api/comments`)

*   `POST /:postId`: Add a comment to a post.
*   `GET /:postId`: Get comments for a post.
*   `DELETE /:commentId`: Delete a comment.

### Stories (`/api/stories`)

*   `POST /`: Create a new story.
*   `GET /`: Get all stories.
*   `DELETE /:storyId`: Delete a story.

### Chat (`/api/chat`)

*   `POST /conversations`: Create or get a conversation.
*   `GET /conversations`: Get user's conversations.
*   `POST /messages`: Send a message.
*   `GET /messages/:conversationId`: Get messages for a conversation.

### Notifications (`/api/notifications`)

*   `GET /`: Get user's notifications.
*   `PUT /:notificationId/read`: Mark a notification as read.

### Search (`/api/search`)

*   `GET /users?q=<query>`: Search for users.
*   `GET /posts?q=<query>`: Search for posts.

## Configuration

The application's behavior can be customized through environment variables. These variables should be defined in the `.env` file located in the `backend` directory.

### Essential Environment Variables

*   `NODE_ENV`: The environment the application is running in (e.g., `development`, `production`).
*   `PORT`: The port number the server will listen on.
*   `JWT_SECRET`: A secret key used for signing JSON Web Tokens.
*   `MONGO_URI`: The connection string for your MongoDB database.
*   `CLOUD_NAME`: Cloudinary cloud name for image storage.
*   `CLOUD_API_KEY`: Cloudinary API key.
*   `CLOUD_API_SECRET`: Cloudinary API secret.
*   `GOOGLE_CLIENT_ID`: Google OAuth client ID.
*   `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.

## Contributing

Contributions are welcome! Please follow these guidelines:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix.
3.  **Make your changes** and ensure they are well-documented.
4.  **Write tests** for your changes.
5.  **Commit your changes** with clear and concise messages.
6.  **Push to the branch** and open a Pull Request.

Please ensure your code adheres to the project's coding style and conventions.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.


---

<p align="center">
  <a href="https://readmeforge.app?utm_source=badge">
    <img src="https://readmeforge.app/badge.svg" alt="Made with ReadmeForge" height="20">
  </a>
</p>