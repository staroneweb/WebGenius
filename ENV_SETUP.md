# Environment Variables Setup Guide

This guide explains how to set up environment variables for both frontend and backend.

## Quick Start

1. **Backend**: Copy `backend/env.example` to `backend/.env` and fill in your values
2. **Frontend**: Copy `frontend/env.example` to `frontend/.env` and fill in your values

## Backend Environment Variables

### Required Variables

#### Database
```env
MONGODB_URI=mongodb://localhost:27017/webgenius
```
- **Local MongoDB**: `mongodb://localhost:27017/webgenius`
- **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/webgenius`

#### JWT Authentication
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
```
- Generate a secure JWT secret: `openssl rand -base64 32`
- Expiration format: `7d`, `24h`, `1h`, etc.

#### OpenAI API
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```
- Get from: https://platform.openai.com/api-keys
- Required for website generation feature

#### Server Configuration
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
```
- `PORT`: Backend server port
- `FRONTEND_URL`: Frontend URL for CORS (change for production)

#### Session Security
```env
SESSION_SECRET=your-session-secret-key-change-this-in-production
```
- Generate a secure session secret: `openssl rand -base64 32`

### Optional Variables (OAuth)

#### Google OAuth
```env
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```
- Setup: https://console.cloud.google.com/apis/credentials
- Add redirect URI: `http://localhost:3000/auth/google/callback`

#### GitHub OAuth
```env
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```
- Setup: https://github.com/settings/developers
- Add callback URL: `http://localhost:3000/auth/github/callback`

**Note**: OAuth is optional. You can use email/password authentication without OAuth.

## Frontend Environment Variables

### Required Variables

#### API Configuration
```env
VITE_API_URL=http://localhost:3000
```
- Backend API URL
- Development: `http://localhost:3000`
- Production: `https://api.yourdomain.com`

### Optional Variables

#### OAuth Client IDs
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
VITE_GITHUB_CLIENT_ID=your-github-client-id-here
```
- Used for OAuth button display
- Same values as backend OAuth client IDs

## Example Configurations

### Development Setup

**backend/.env**
```env
MONGODB_URI=mongodb://localhost:27017/webgenius
JWT_SECRET=dev-secret-key-min-32-characters-long
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-your-openai-key
PORT=3000
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=dev-session-secret
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:3000
```

### Production Setup

**backend/.env**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/webgenius
JWT_SECRET=super-secure-production-secret-min-32-chars
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=prod-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod-google-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback
GITHUB_CLIENT_ID=prod-github-client-id
GITHUB_CLIENT_SECRET=prod-github-secret
GITHUB_CALLBACK_URL=https://api.yourdomain.com/auth/github/callback
OPENAI_API_KEY=sk-prod-openai-key
PORT=3000
FRONTEND_URL=https://yourdomain.com
SESSION_SECRET=super-secure-production-session-secret
```

**frontend/.env**
```env
VITE_API_URL=https://api.yourdomain.com
VITE_GOOGLE_CLIENT_ID=prod-google-client-id.apps.googleusercontent.com
VITE_GITHUB_CLIENT_ID=prod-github-client-id
```

## Getting API Keys

### MongoDB
1. **Local**: Install MongoDB locally or use Docker
2. **Atlas**: Sign up at https://www.mongodb.com/cloud/atlas
   - Create cluster
   - Get connection string
   - Replace `<password>` with your password

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and paste into `OPENAI_API_KEY`
4. Ensure you have credits and GPT-4 access

### Google OAuth
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Secret

### GitHub OAuth
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Copy Client ID and generate Client Secret

## Security Notes

⚠️ **Important**:
- Never commit `.env` files to git (they're in `.gitignore`)
- Use strong, random secrets in production
- Rotate secrets regularly
- Use environment-specific values
- Keep API keys secure and never expose them

## Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongod` or MongoDB service
- Verify `MONGODB_URI` is correct
- Ensure all required variables are set

### CORS errors
- Verify `FRONTEND_URL` matches your frontend URL exactly
- Check for trailing slashes
- Ensure backend CORS is enabled

### OAuth not working
- Verify callback URLs match exactly
- Check client IDs and secrets are correct
- Ensure OAuth app is configured properly

### OpenAI errors
- Verify API key is valid
- Check you have credits
- Ensure GPT-4 access is enabled

