# AutoBridge - U.S. Auto Auction Platform for Nigerian Importers

AutoBridge is a comprehensive digital platform that streamlines the entire vehicle importation process for Nigerian car importers, from U.S. auction bidding through customs clearance and final delivery in Nigeria.

## 🚀 Features

### MVP (Phase 1)
- ✅ **User Authentication & KYC**: Secure registration, login, and verification system
- ✅ **Vehicle Inventory Browse**: Search and filter 100,000+ vehicles from Copart & IAAI
- ✅ **AI-Powered Cost Calculator**: Real-time landed cost estimation in Nigeria
- ✅ **Bidding System**: Proxy bidding on behalf of users
- ✅ **Real-Time Tracking**: Track vehicles from auction to delivery
- ✅ **Multi-Channel Notifications**: Email, SMS, WhatsApp, and in-app notifications
- ✅ **Payment Processing**: Naira and USD payment support with escrow

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Query

**Backend:**
- Next.js API Routes
- Node.js
- PostgreSQL (via Drizzle ORM)
- Redis (caching & sessions)
- Bull (job queues)

**Infrastructure:**
- Docker support (coming soon)
- AWS/GCP compatible
- CDN ready

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/autobridge.git
   cd autobridge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your configuration:
   ```env
   DATABASE_URL=postgresql://localhost:5432/autobridge
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-super-secret-jwt-key
   # ... add other variables
   ```

4. **Set up the database:**
   ```bash
   # Create database
   createdb autobridge
   
   # Run migrations
   npm run db:generate
   npm run db:migrate
   
   # (Optional) Seed with sample data
   npm run db:seed
   ```

5. **Start Redis:**
   ```bash
   redis-server
   ```

6. **Run the development server:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
autobridge/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── vehicles/      # Vehicle endpoints
│   │   │   ├── bids/          # Bidding endpoints
│   │   │   └── shipments/     # Shipment tracking
│   │   ├── auth/              # Auth pages (login, register)
│   │   ├── dashboard/         # User dashboard
│   │   ├── vehicles/          # Vehicle browsing & detail
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── ui/                # UI primitives
│   │   ├── Navbar.tsx         # Navigation
│   │   └── VehicleCard.tsx    # Vehicle display card
│   ├── db/                    # Database
│   │   ├── schema.ts          # Drizzle ORM schema
│   │   ├── index.ts           # DB connection
│   │   └── migrate.ts         # Migration runner
│   └── lib/                   # Utilities & business logic
│       ├── auth.ts            # Auth helpers
│       ├── cost-calculator.ts # Cost calculation engine
│       ├── notifications.ts   # Multi-channel notifications
│       ├── redis.ts           # Redis utilities
│       └── utils.ts           # Common utilities
├── .env.example               # Environment template
├── drizzle.config.ts          # Drizzle configuration
├── package.json               # Dependencies
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

## 🔑 Key Features Explained

### Cost Calculator
The AI-powered cost calculator provides accurate estimates including:
- Auction price + buyer fees
- U.S. towing and storage
- Ocean freight (RoRo/Container)
- Nigerian customs duty (age-dependent)
- Port charges & clearing agent fees
- Platform fee
- **Total landed cost in NGN**
- Estimated Nigerian resale value
- Profit margin projection

### Bidding System
- Proxy bidding: System bids up to user's maximum
- Real-time auction updates
- Win/loss notifications via multiple channels
- KYC verification required before bidding

### Shipment Tracking
11-stage tracking from auction to delivery:
1. Auction Won
2. Payment Received
3. Pickup Scheduled
4. In Transit to Port
5. At U.S. Port
6. Vessel Departed
7. Ocean Transit
8. Arrived Nigeria
9. Customs Clearance
10. Ready for Pickup
11. Delivered

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Vehicles
- `GET /api/vehicles` - List/search vehicles
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles/:id/estimate` - Calculate cost estimate

### Bids
- `POST /api/bids` - Place a bid
- `GET /api/bids` - Get user's bids

### Shipments
- `GET /api/shipments` - Get user's shipments
- `GET /api/shipments/:id` - Get shipment details

## 🗃️ Database Schema

Key tables:
- **users**: User accounts with KYC info
- **vehicles**: Auction inventory (Copart/IAAI)
- **bids**: User bids and auction results
- **transactions**: Payment records
- **shipments**: Tracking from U.S. to Nigeria
- **notifications**: Multi-channel notifications
- **cost_estimates**: Saved cost calculations

## 🚢 Deployment

### Using Vercel (Recommended for Next.js)
```bash
npm install -g vercel
vercel
```

### Using Docker
```bash
# Build image
docker build -t autobridge .

# Run container
docker run -p 3000:3000 autobridge
```

### Environment Variables for Production
Ensure these are set in your production environment:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Strong secret key
- `PAYSTACK_SECRET_KEY` - Payment gateway
- `SENDGRID_API_KEY` - Email notifications
- `TERMII_API_KEY` - SMS notifications

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## 📈 Roadmap

### Phase 2 (Q2 2025)
- [ ] Nigerian market intelligence
- [ ] Financing partnerships
- [ ] Insurance integration
- [ ] Bulk import management
- [ ] Advanced analytics dashboard

### Phase 3 (Q3-Q4 2025)
- [ ] Mobile app (iOS/Android)
- [ ] Expansion to Ghana, Kenya
- [ ] Marketplace features
- [ ] White-label solution

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

- **Email**: support@autobridge.ng
- **WhatsApp**: +234 800 AUTO BRIDGE
- **Documentation**: [docs.autobridge.ng](https://docs.autobridge.ng)

## 👥 Team

Built by the AutoBridge Team with ❤️ for Nigerian importers

---

**Note**: This is MVP Phase 1. Features are continuously being added. Check the [project board](https://github.com/yourusername/autobridge/projects) for current status.

