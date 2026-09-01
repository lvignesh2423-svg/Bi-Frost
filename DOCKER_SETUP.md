# Docker Setup Guide for Bi-Frost

This guide covers deploying Bi-Frost using Docker for local testing, development, or production.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) installed and running
- [Docker Compose](https://docs.docker.com/compose/install/) (optional, for easier management)
- Your OpenRouter API key (get it from [https://openrouter.ai/](https://openrouter.ai/))

## Quick Start (5 minutes)

### 1. Create your `.env` file

```bash
cp .env.example .env
```

Edit `.env` and add your OpenRouter API key:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Build the Docker image

```bash
docker build -t bi-frost .
```

This will:
- Install Node.js and build the frontend (Vite + React)
- Install Python and backend dependencies
- Create a production-ready image (~800MB)

### 3. Run the container

**Option A: Using Docker (Simple)**
```bash
docker run -d \
  -p 8001:8001 \
  -e OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  --name bi-frost \
  bi-frost
```

**Option B: Using Docker Compose (Recommended)**
```bash
docker-compose up -d
```

### 4. Access the app

Open your browser and go to:
```
http://localhost:8001
```

## Common Docker Commands

### View running containers
```bash
docker ps
```

### View container logs
```bash
# Using Docker
docker logs bi-frost -f

# Using Docker Compose
docker-compose logs -f bi-frost
```

### Stop the container
```bash
# Using Docker
docker stop bi-frost
docker rm bi-frost

# Using Docker Compose
docker-compose down
```

### Rebuild the image
```bash
# Using Docker
docker build -t bi-frost .

# Using Docker Compose
docker-compose build --no-cache
docker-compose up -d
```

## Environment Variables

The following environment variables can be set in `.env`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | ✅ Yes | - | Your OpenRouter API key |
| `DATABASE_URL` | ❌ No | `sqlite:////app/data/skill_gap_analyzer.db` | Database connection string (stored in the persistent `bi-frost-data` Docker volume) |
| `LLM_MODEL` | ❌ No | `meta-llama/llama-3.1-70b-instruct` | LLM model to use |
| `OPENROUTER_BASE_URL` | ❌ No | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `JWT_SECRET` | ❌ No | built-in dev fallback | Secret used to sign auth tokens — set a strong random value in production |

### Using Groq (or any OpenAI-compatible provider) instead of OpenRouter

The LLM client uses the OpenAI SDK against a configurable base URL, so any
OpenAI-compatible provider works without code changes. For example, with a
Groq key (`gsk_...`), put this in `.env`:

```env
OPENROUTER_API_KEY=gsk_your_groq_key
OPENROUTER_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
```

Then run `docker compose up -d` to recreate the container with the new settings.

## Docker Compose Features

The `docker-compose.yml` includes:

- **Port mapping**: 8001:8001 (accessible locally)
- **Environment variables**: Auto-loaded from `.env`
- **Health checks**: Monitors `/api/health` every 30 seconds using the Python standard library (no extra dependencies)
- **Persistent storage**: Named volume `bi-frost-data` keeps the SQLite database across container rebuilds
- **Auto-restart**: Restarts container if it crashes

## Deployment to Cloud (Render, Railway, etc.)

### For Render.com:
1. Push your code to GitHub (with Dockerfile)
2. Sign up at [render.com](https://render.com)
3. Create a new Web Service
4. Select the repository and set Runtime to "Docker"
5. Add environment variable: `OPENROUTER_API_KEY`
6. Deploy!

### For Railway.app:
1. Push your code to GitHub (with Dockerfile)
2. Go to [railway.app](https://railway.app)
3. Create new project → Deploy from GitHub
4. Select your repository
5. Add environment variable: `OPENROUTER_API_KEY`
6. Deploy!

## Troubleshooting

### "Port 8001 is already in use"
```bash
# Find and kill the process using port 8001
lsof -i :8001          # macOS/Linux
netstat -ano | findstr :8001  # Windows
```

### "OPENROUTER_API_KEY is not set"
Make sure:
1. `.env` file exists in the project root
2. `OPENROUTER_API_KEY` is set correctly in `.env`
3. You've restarted the container after changing `.env`

### "Frontend not loading (404 errors)"
The frontend is built during Docker build. If you modify frontend files, rebuild:
```bash
docker build -t bi-frost . --no-cache
```

### Check container health
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Next Steps

- **Local development**: Use `docker-compose up -d` and edit files directly
- **Production deployment**: Push to Render/Railway/Fly.io
- **Scale up**: Use Kubernetes or container orchestration services
- **Monitoring**: Add logging and monitoring (Datadog, New Relic, etc.)

## Need Help?

Check the main [README.md](./README.md) for more information about the Bi-Frost project.
