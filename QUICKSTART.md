# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB running (local or Atlas)
- OpenAI API key

## Setup Steps

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and OpenAI API key
npm run start:dev
```

Backend runs on `http://localhost:3000`

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. Environment Variables

**Backend `.env`:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `OPENAI_API_KEY` - Your OpenAI API key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth (optional)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - For GitHub OAuth (optional)

**Frontend `.env`:**
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000)

### 4. First Run

1. Start MongoDB
2. Start backend: `cd backend && npm run start:dev`
3. Start frontend: `cd frontend && npm run dev`
4. Open `http://localhost:5173`
5. Sign up or login
6. Start generating websites!

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in backend `.env`
- For Atlas, use: `mongodb+srv://user:pass@cluster.mongodb.net/webgenius`

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
- Default: `http://localhost:5173`

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is set correctly
- Check API key has sufficient credits
- Ensure API key has access to GPT-4

### OAuth Not Working
- OAuth is optional - you can use email/password login
- To enable OAuth, configure credentials in backend `.env`
- Set callback URLs correctly in OAuth provider settings

## Next Steps

- Customize subscription plans
- Add payment integration (Stripe/Razorpay)
- Deploy to production
- Add more AI models

