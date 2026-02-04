# WebGenius API - Backend

NestJS backend for WebGenius platform with MongoDB, TypeORM, and v0 API integration for production-ready website generation.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/webgenius
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-v0-api-key
# Note: OPENAI_API_KEY stores your v0 API key (from https://v0.app)
# ... see .env.example for all variables
```

3. Start MongoDB (if running locally):
```bash
mongod
```

4. Run the server:
```bash
npm run start:dev
```

## Project Structure

```
src/
├── entities/          # TypeORM entities
├── auth/             # Authentication module
├── user/             # User management
├── prompt/           # Prompt history
├── website/          # Website generation
├── subscription/     # Subscription plans
└── role/             # Role management
```

## API Documentation

See main README.md for API endpoints.

