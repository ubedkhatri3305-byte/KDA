# 🚀 K D A Deployment Guide (Render + Vercel)

This repository is configured for seamless deployment:
- **Backend**: NestJS REST API with Prisma & PostgreSQL on **Render**
- **Frontend**: Next.js 16 (React 19 + TailwindCSS) on **Vercel**
- **Database**: Serverless PostgreSQL on **Neon**

---

## 📋 Architecture & Connection Overview

```mermaid
graph LR
    User([User Browser]) -->|HTTPS| Vercel[Vercel: Next.js Frontend]
    Vercel -->|REST API with CORS| Render[Render: NestJS Backend]
    Render -->|Connection Pool| Neon[(Neon Serverless Postgres)]
    Render -->|Media CDN| Cloudinary[Cloudinary]
    Render -->|Payments| Razorpay[Razorpay Gateway]
```

---

## 1️⃣ Deploying the Backend on Render

You can deploy the backend using the Render Web Dashboard or the automated Blueprint (`render.yaml`).

### Option A: Manual Web Dashboard (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/ubedkhatri3305-byte/KDA`.
3. Configure service settings:
   - **Name**: `kda-backend` (or your preferred name)
   - **Region**: Choose the closest region to your database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: `Free` or `Starter`
4. Under **Advanced** settings:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes`
5. Add the **Environment Variables** listed below, then click **Create Web Service**.

> [!TIP]
> If you leave **Root Directory** blank/empty in Render, use:
> - **Build Command**: `npm run build`
> - **Start Command**: `npm run start:prod`

### Option B: Render Blueprint (`render.yaml`)
1. In Render Dashboard, click **New +** → **Blueprint**.
2. Select your `KDA` repository. Render will automatically detect `render.yaml`.
3. Fill in the required secret values prompted by Render.

---

### 🔑 Backend Environment Variables (Render)

Add these variables in Render under **Environment**:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `5000` | (Render sets this automatically, but safe to set) |
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/kda?sslmode=require` | Your Neon PostgreSQL connection string |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your deployed Vercel domain |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Comma-separated allowed origins (Vercel preview URLs are auto-supported) |
| `JWT_ACCESS_SECRET` | *(64-char random string)* | Secret for auth access tokens |
| `JWT_REFRESH_SECRET` | *(64-char random string)* | Secret for auth refresh tokens |
| `JWT_ACCESS_EXPIRES` | `15m` | Token expiry |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh token expiry |
| `CSRF_SECRET` | *(random 32-char string)* | CSRF encryption key |
| `SESSION_SECRET` | *(random 32-char string)* | Session encryption key |
| `CLOUDINARY_CLOUD_NAME` | `dti5ndr1j` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | `429759847618718` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `your-cloudinary-secret` | Cloudinary API Secret |
| `CLOUDINARY_UPLOAD_PRESET`| `fashionai_uploads` | Upload preset name |
| `RAZORPAY_KEY_ID` | `rzp_live_xxxxxxxx` (or test) | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | `your-razorpay-secret` | Razorpay Secret |
| `SMTP_HOST` | `smtp.gmail.com` | Email host |
| `SMTP_PORT` | `587` | Email port |
| `SMTP_USER` | `your-email@gmail.com` | Email username |
| `SMTP_PASS` | `your-app-password` | Gmail App Password (16 chars) |
| `FROM_EMAIL` | `noreply@kda-clothing.com` | Sender address |
| `FROM_NAME` | `K D A Clothing` | Sender name |
| `OPENAI_API_KEY` | `sk-...` | (Optional) OpenAI key for AI stylist/features |
| `GOOGLE_AI_API_KEY` | `AIzaSy...` | (Optional) Gemini key for AI descriptions |

---

## 2️⃣ Deploying the Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
2. Select your repository: `https://github.com/ubedkhatri3305-byte/KDA`.
3. In the project setup screen:
   - **Project Name**: `kda-frontend` (or `kda`)
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `frontend` *(CRITICAL: select `frontend`)*
   - Build and Output Settings: Leave as default (`next build`, `.next`)
4. Expand **Environment Variables** and add the following:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://kda-backend.onrender.com/api/v1` | URL of your Render backend ending in `/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`| `rzp_test_xxxx` or `rzp_live_xxxx` | Public Razorpay key |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`| `dti5ndr1j` | Cloudinary cloud name |

5. Click **Deploy**. Vercel will install dependencies, build the Next.js production bundle, and deploy to edge servers worldwide.

---

## 3️⃣ Synchronizing Frontend and Backend URLs

Once both deployments have generated their live URLs:
1. Copy your Vercel URL (e.g., `https://kda-clothing.vercel.app`).
2. Go to your **Render Backend** service → **Environment** tab:
   - Set `FRONTEND_URL` = `https://kda-clothing.vercel.app`
   - Set `ALLOWED_ORIGINS` = `https://kda-clothing.vercel.app`
   - Click **Save Changes** (Render will automatically redeploy).
3. Copy your Render Backend URL (e.g., `https://kda-backend.onrender.com`).
4. Go to your **Vercel Frontend** project → **Settings** → **Environment Variables**:
   - Set `NEXT_PUBLIC_API_URL` = `https://kda-backend.onrender.com/api/v1`
   - Trigger a new deployment (**Deployments** → **Redeploy**) so the updated API URL is bundled.

---

## 4️⃣ Database Schema Push & Initial Admin Setup

Once the database is connected, initialize tables and seed an admin:

### Option 1: Run locally targeting the remote Neon database
In your local terminal inside the `backend` directory:
```bash
# Push schema to database
npx prisma db push

# Create initial admin account
npx ts-node create-admin.ts
```

### Option 2: Run directly in Render Shell
1. Go to your backend service in Render.
2. Click **Shell** in the left menu.
3. Run:
```bash
npx prisma db push
node dist/create-admin.js
```

---

## 5️⃣ Verification & Health Checks

- **Backend Health Check**: Visit `https://your-backend.onrender.com/health`
  Expected response:
  ```json
  { "status": "ok", "uptime": 45.2, "timestamp": "2026-09-15T..." }
  ```
- **Backend API Info**: Visit `https://your-backend.onrender.com/`
- **Swagger Documentation**: In non-production or when enabled, visit `https://your-backend.onrender.com/api/docs`
- **Frontend Live Site**: Visit your Vercel URL and check that products, categories, search, and cart load smoothly.
