Server README - Quickstart

1) Copy server/.env.example to server/.env and edit as needed.
2) Start services with docker-compose at repository root:
   docker-compose up --build
3) After server starts, run 'npx prisma generate' inside server to generate Prisma client.
4) Create MinIO bucket 'shanduko' via MinIO console (http://localhost:9001)
