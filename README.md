# FashionAI - AI-Powered Clothing E-Commerce Platform

> 🤖 India's first **production-ready AI-powered** clothing e-commerce platform built with Next.js, NestJS, PostgreSQL, and Google Gemini AI.

## 🌟 Features

### 🛍️ Customer Features
- Registration & Login with JWT + Refresh Tokens
- OTP Email Verification & Forgot Password
- Profile & Address Management
- Shopping Cart with real-time updates
- Wishlist Management
- Razorpay Checkout (UPI, Cards, NetBanking, Wallets)
- Order Tracking & History
- Invoice Download
- Product Reviews & Ratings
- Natural Language AI Search
- AI Product Recommendations
- AI Outfit Suggestions
- AI Chat Support (24/7)
- Push Notifications
- Mobile-First Responsive Design

### 🤖 AI Features
- **AI Model Photo Generation**: Auto-generate front/side/back/lifestyle/studio photos for all clothing types
- **AI Product Descriptions**: Auto-generate titles, descriptions, highlights, specs, SEO tags
- **AI Search**: Natural language search ("red wedding saree", "office shirt for men")
- **AI Recommendations**: Personalized, trending, similar, frequently bought together
- **AI Chatbot**: 24/7 customer support powered by Google Gemini AI

### 👑 Admin Panel
- Analytics Dashboard with revenue, orders, customers, conversion rate
- Product Management with AI-assisted content generation
- Order Management with status tracking
- Customer Management
- Coupon Management (%, fixed, festival, first-order)
- Inventory Management
- AI Management panel
- Banner Management
- Blog Management
- Return & Refund Management

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui |
| State | Zustand |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | JWT + Refresh Tokens + Argon2 |
| Storage | Cloudinary |
| Payments | Razorpay |
| AI | Google Gemini AI + OpenAI |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |
| CDN/Security | Cloudflare |

## 📁 Project Structure

```
K D A/
├── frontend/          # Next.js 15 App
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   │   ├── (auth)/        # Auth pages
│   │   │   ├── (shop)/        # Shop pages  
│   │   │   └── admin/         # Admin panel
│   │   ├── components/        # React components
│   │   │   ├── layout/        # Navbar, Footer
│   │   │   ├── product/       # Product cards
│   │   │   ├── cart/          # Cart drawer
│   │   │   ├── ai/            # AI chat widget
│   │   │   └── providers/     # React Query, Theme
│   │   ├── store/             # Zustand stores
│   │   ├── services/          # API client
│   │   ├── hooks/             # Custom hooks
│   │   └── types/             # TypeScript types
│
└── backend/           # NestJS API
    ├── src/
    │   ├── modules/   # Feature modules
    │   │   ├── auth/          # JWT Auth + OTP
    │   │   ├── products/      # Product CRUD
    │   │   ├── categories/    # Categories
    │   │   ├── brands/        # Brands
    │   │   ├── cart/          # Shopping cart
    │   │   ├── wishlist/      # Wishlist
    │   │   ├── orders/        # Order management
    │   │   ├── payments/      # Razorpay
    │   │   ├── ai/            # AI features
    │   │   ├── admin/         # Admin APIs
    │   │   └── ...
    │   ├── prisma/    # Database service
    │   ├── cloudinary/ # Image upload
    │   ├── mail/      # Email service
    │   ├── common/    # Guards, decorators, filters
    │   └── config/    # App configuration
    └── prisma/
        └── schema.prisma  # Complete DB schema
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL database (Neon recommended)
- Cloudinary account
- Razorpay account
- Google AI / OpenAI API key

### 1. Clone and Install

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies  
cd ../backend
npm install
```

### 2. Configure Environment

```bash
# Backend
cp .env.example .env
# Edit .env with your credentials

# Frontend
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### 3. Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed  # Optional: seed sample data
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger Docs: http://localhost:5000/api/docs

## 🔐 Security Features

- ✅ Argon2id Password Hashing
- ✅ JWT Access + Refresh Token Rotation
- ✅ HTTP-only Secure Cookies
- ✅ CORS with allowlist
- ✅ Helmet security headers
- ✅ Rate limiting (3 req/s, 20 req/10s, 100 req/min)
- ✅ Input validation with class-validator
- ✅ Prisma ORM (SQL injection protection)
- ✅ Razorpay webhook signature verification
- ✅ RBAC (Customer, Admin, Super Admin)
- ✅ Request logging & audit trail

## 🤖 AI Integration

### Model Photo Generation
Admin uploads product images → AI automatically:
1. Detects clothing type & category
2. Removes background (remove.bg API)
3. Selects appropriate model
4. Generates 5 views (front/side/back/lifestyle/studio)
5. Saves to Cloudinary, adds to product gallery

### AI Description Generation
Input: Category, Type, Color, Material, Occasion  
Output: Title, Description, Highlights, Features, Specs, Tags, SEO Meta

### AI Search Enhancement
Input: "red wedding saree"  
Output: Structured filters {category: "sarees", color: "red", occasion: "wedding"}

### AI Chatbot
Powered by Google Gemini 1.5 Flash with full conversation history

## 📊 Database Schema

Complete schema with 25+ tables including:
- Users, Sessions, RefreshTokens, OtpTokens
- Products, Variants, Images, Videos
- Categories (hierarchical), Brands
- Cart, CartItems, Wishlist, WishlistItems
- Orders, OrderItems, OrderTimeline
- Payments, Returns
- Coupons, Reviews
- Notifications, AuditLogs
- AiAssets, AiDescriptionJobs, ChatMessages
- Banners, Blogs, ShippingZones, InventoryLogs

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npx vercel --prod
```

### Backend (Railway)
```bash
cd backend
railway up
```

### Database (Neon PostgreSQL)
1. Create project at neon.tech
2. Copy connection string to DATABASE_URL

## 📈 Scalability Strategy

- Stateless API → horizontal scaling ready
- Redis caching for hot data (product catalog, sessions)
- Cloudinary CDN for images
- Cloudflare CDN + DDoS protection
- Database indexing on all query fields
- Lazy loading + image optimization
- Rate limiting to prevent abuse

## 🛣️ Development Roadmap

### Phase 1 (Current)
- ✅ Core e-commerce features
- ✅ JWT Authentication
- ✅ AI chatbot
- ✅ Razorpay payments

### Phase 2
- [ ] Real-time notifications (WebSockets)
- [ ] Advanced AI recommendations with embeddings
- [ ] Social login (Google, Facebook)
- [ ] PWA support

### Phase 3
- [ ] Mobile app (React Native)
- [ ] Live chat with sellers
- [ ] AR try-on feature
- [ ] Advanced analytics

## 📝 License

MIT License - Free to use for personal and commercial projects.

---

Built with ❤️ using Next.js, NestJS, and Google Gemini AI
