# AutoBridge MVP Implementation Plan

## Current State Assessment

### Already Built (70% Complete)
| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Complete | JWT + Google OAuth |
| Database Schema | ✅ Complete | 13 tables, all relationships |
| Vehicle Browsing | ✅ Complete | Search, filters, detail pages |
| Bidding System | ✅ Complete | 10% deposit lock, status tracking |
| Wallet System | ✅ Complete | Balance, lock, unlock, forfeit |
| Signup Fee | ✅ Complete | ₦100,000 via Paystack |
| Cost Calculator | ✅ Complete | Full landed cost breakdown |
| Shipment Tracking | ✅ Complete | 13-stage model, UI built |
| Dashboard | ✅ Complete | Stats, quick actions |
| Public Pages | ✅ Complete | Home, How-to-buy, About, Help |
| Paystack Integration | ✅ Complete | NGN payments working |

### Gaps to Fill (30% Remaining)
| Feature | Priority | Effort |
|---------|----------|--------|
| Admin Portal | CRITICAL | 3-4 days |
| KYC Verification | CRITICAL | 2-3 days |
| SMS Notifications | HIGH | 1-2 days |
| Email Notifications | HIGH | 1-2 days |
| Document Uploads | HIGH | 2 days |
| Invoice Display | MEDIUM | 1 day |
| Carfax Integration | MEDIUM | 2 days |
| Photo Uploads (Trust Layer) | MEDIUM | 2 days |

---

## Implementation Phases

### Phase 1: Admin Portal (Days 1-4)
**Goal:** Enable ops team to manage shipments and verify KYC

#### 1.1 Admin Authentication & Layout
```
/admin/login          - Admin login page
/admin/layout.tsx     - Admin dashboard layout with sidebar
```

#### 1.2 Admin Dashboard
```
/admin                - Overview stats (pending KYC, active shipments, payments due)
/admin/users          - User management, KYC approval
/admin/shipments      - All shipments, status updates
/admin/bids           - Active bids, mark won/lost
/admin/payments       - Payment verification
```

#### 1.3 Key Admin Features
- [ ] View all users with KYC status filter
- [ ] Approve/reject KYC with notes
- [ ] Update shipment status (dropdown with 13 stages)
- [ ] Upload shipment documents (BOL, customs docs)
- [ ] Upload shipment photos (per stage)
- [ ] Mark bid as won/lost (manual override)
- [ ] View payment history, mark wire transfers received

#### 1.4 Database Changes
- Add `adminNotes` field to users table
- Add `kycReviewedAt`, `kycReviewedBy` fields
- Add `statusUpdatedBy`, `statusUpdatedAt` to shipments

---

### Phase 2: KYC Verification Flow (Days 5-7)
**Goal:** Customers can submit KYC, admins can verify

#### 2.1 Customer KYC Submission
```
/dashboard/kyc        - KYC submission form
```

**Required Documents:**
- Valid ID (NIN, Passport, Driver's License)
- Proof of Address (Utility bill, Bank statement)
- Passport Photo
- BVN (for Nigerian customers)

#### 2.2 KYC API Endpoints
```
POST /api/kyc/submit          - Submit KYC documents
GET  /api/kyc/status          - Check KYC status
POST /api/admin/kyc/approve   - Admin approve KYC
POST /api/admin/kyc/reject    - Admin reject KYC with reason
```

#### 2.3 File Upload Infrastructure
- Use Cloudinary or AWS S3 for document storage
- Generate signed URLs for secure access
- Compress images before upload

#### 2.4 KYC States
```
not_started → pending_review → approved | rejected
```

---

### Phase 3: Notifications (Days 8-10)
**Goal:** SMS and Email notifications for key events

#### 3.1 SMS Integration (Termii)
```typescript
// lib/sms.ts
- sendSMS(phone, message)
- sendBidWonSMS(user, bid)
- sendBidLostSMS(user, bid)
- sendPaymentReminderSMS(user, invoice)
- sendShipmentUpdateSMS(user, shipment, stage)
```

**SMS Triggers:**
- Bid won
- Bid lost
- Outbid alert
- Payment due reminder (24h, 6h before deadline)
- Shipment status change
- Car arrived at port
- Car cleared customs
- Car ready for pickup

#### 3.2 Email Integration (SendGrid/Resend)
```typescript
// lib/email.ts
- sendEmail(to, subject, template, data)
- sendWelcomeEmail(user)
- sendBidWonEmail(user, bid, invoice)
- sendInvoiceEmail(user, invoice)
- sendShipmentUpdateEmail(user, shipment)
```

**Email Templates:**
- Welcome email
- KYC approved/rejected
- Bid confirmation
- Bid won (with invoice)
- Bid lost
- Payment receipt
- Shipment updates
- Weekly shipment summary

#### 3.3 Notification Preferences
```
/dashboard/settings   - User notification preferences
```
- Toggle SMS on/off
- Toggle Email on/off
- Toggle WhatsApp on/off (future)

---

### Phase 4: Document & Photo Management (Days 11-13)
**Goal:** Trust layer with documents and photos per shipment

#### 4.1 Document Types
```typescript
enum DocumentType {
  BILL_OF_LADING = 'bill_of_lading',
  TITLE = 'title',
  CUSTOMS_DECLARATION = 'customs_declaration',
  IMPORT_DUTY_RECEIPT = 'import_duty_receipt',
  RELEASE_ORDER = 'release_order',
  DELIVERY_RECEIPT = 'delivery_receipt'
}
```

#### 4.2 Photo Stages
```typescript
enum PhotoStage {
  AUCTION_YARD = 'auction_yard',        // Before towing
  TOWING = 'towing',                    // During transport
  US_PORT = 'us_port',                  // At US port
  VESSEL_LOADING = 'vessel_loading',    // Being loaded
  APAPA_ARRIVAL = 'apapa_arrival',      // Arrived Nigeria
  CUSTOMS_CLEARING = 'customs_clearing', // At customs
  RELEASED = 'released'                 // Ready for pickup
}
```

#### 4.3 UI Components
- Document list per shipment
- Photo gallery per shipment (grouped by stage)
- Admin upload interface
- Customer download for documents

#### 4.4 Database Schema Addition
```sql
CREATE TABLE shipment_documents (
  id, shipment_id, type, file_url, file_name, uploaded_by, uploaded_at
);

CREATE TABLE shipment_photos (
  id, shipment_id, stage, file_url, caption, uploaded_by, uploaded_at
);
```

---

### Phase 5: Invoice System (Days 14-15)
**Goal:** Clear invoice display with payment tracking

#### 5.1 Invoice Display Page
```
/dashboard/invoices           - List all invoices
/dashboard/invoices/[id]      - Invoice detail with payment button
```

#### 5.2 Invoice Line Items (per PRD)
- Deposit paid (credit)
- Auction hammer price
- Auction buyer fee
- Towing fee
- Ocean shipping fee
- Clearing coordination fee (optional)
- AutoBridge service fee ($200)
- **Total in USD**
- **Total in NGN (at live rate)**

#### 5.3 Invoice States
```
draft → sent → partially_paid → paid → overdue
```

#### 5.4 Payment Deadline
- Set to 1 day before auction deadline
- Countdown timer on invoice page
- Auto-forfeit deposit if missed

---

### Phase 6: Carfax Integration (Days 16-17)
**Goal:** Vehicle history reports accessible in-platform

#### 6.1 Carfax API Integration
```typescript
// lib/carfax.ts
- fetchCarfaxReport(vin: string)
- cacheReport(vin, report)
- getReportPrice()
```

#### 6.2 UI Integration
- "Get Carfax Report" button on vehicle detail page
- Report displayed inline (not redirect)
- Charge per report OR include free (per PRD decision)

#### 6.3 Alternative: AutoCheck Integration
- Backup if Carfax API not available
- Similar implementation pattern

---

### Phase 7: Polish & Testing (Days 18-21)
**Goal:** Bug fixes, edge cases, user testing

#### 7.1 Edge Case Handling
- [ ] What happens if payment fails mid-transaction?
- [ ] What if shipment is delayed > 60 days?
- [ ] What if car condition differs from auction photos?
- [ ] Refund flow for cancelled shipments

#### 7.2 Mobile Responsiveness
- [ ] Test all pages on mobile
- [ ] Fix responsive issues
- [ ] Optimize images for mobile

#### 7.3 Performance
- [ ] Add loading states everywhere
- [ ] Implement pagination properly
- [ ] Add caching for vehicle searches

#### 7.4 Security Audit
- [ ] Rate limiting on APIs
- [ ] Input validation
- [ ] SQL injection prevention (Drizzle handles)
- [ ] XSS prevention

---

## Database Schema Additions

```typescript
// Add to schema.ts

// KYC Documents
export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  documentType: text('document_type').notNull(), // 'nin', 'passport', 'drivers_license', 'utility_bill', 'selfie'
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  status: text('status').default('pending'), // 'pending', 'approved', 'rejected'
  rejectionReason: text('rejection_reason'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Shipment Documents
export const shipmentDocuments = pgTable('shipment_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id').references(() => shipments.id).notNull(),
  documentType: text('document_type').notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Shipment Photos
export const shipmentPhotos = pgTable('shipment_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id').references(() => shipments.id).notNull(),
  stage: text('stage').notNull(), // 'auction_yard', 'towing', 'us_port', etc.
  fileUrl: text('file_url').notNull(),
  caption: text('caption'),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Add admin fields to users
// kycReviewedAt: timestamp
// kycReviewedBy: uuid
// kycRejectionReason: text
// isAdmin: boolean
```

---

## API Endpoints to Build

### Admin APIs
```
POST   /api/admin/auth/login
GET    /api/admin/dashboard/stats
GET    /api/admin/users
POST   /api/admin/users/[id]/kyc/approve
POST   /api/admin/users/[id]/kyc/reject
GET    /api/admin/shipments
PUT    /api/admin/shipments/[id]/status
POST   /api/admin/shipments/[id]/documents
POST   /api/admin/shipments/[id]/photos
GET    /api/admin/bids
PUT    /api/admin/bids/[id]/status
GET    /api/admin/payments
POST   /api/admin/payments/[id]/confirm
```

### Customer APIs (New)
```
POST   /api/kyc/submit
GET    /api/kyc/status
GET    /api/invoices
GET    /api/invoices/[id]
POST   /api/invoices/[id]/pay
GET    /api/carfax/[vin]
PUT    /api/user/notification-preferences
```

---

## Environment Variables Needed

```env
# SMS (Termii)
TERMII_API_KEY=
TERMII_SENDER_ID=AutoBridge

# Email (SendGrid or Resend)
SENDGRID_API_KEY=
EMAIL_FROM=noreply@autobridge.com

# File Storage (Cloudinary or S3)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# OR S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=

# Carfax (if available)
CARFAX_API_KEY=
CARFAX_PARTNER_ID=
```

---

## Timeline Summary

| Phase | Days | Features |
|-------|------|----------|
| 1 | 1-4 | Admin Portal |
| 2 | 5-7 | KYC Verification |
| 3 | 8-10 | Notifications (SMS + Email) |
| 4 | 11-13 | Documents & Photos |
| 5 | 14-15 | Invoice System |
| 6 | 16-17 | Carfax Integration |
| 7 | 18-21 | Polish & Testing |

**Total: 21 working days (~4 weeks)**

---

## Success Criteria (MVP Launch)

- [ ] Admin can update shipment status
- [ ] Admin can approve/reject KYC
- [ ] Admin can upload documents and photos
- [ ] Customer receives SMS on bid won/lost
- [ ] Customer receives email with invoice
- [ ] Customer can view invoice with line items
- [ ] Customer can pay invoice via Paystack
- [ ] Customer can see shipment photos at each stage
- [ ] Customer can download shipment documents
- [ ] One full end-to-end test: Bid → Win → Pay → Track → Deliver

---

## Post-MVP Roadmap

### V1 (Month 2-3)
- WhatsApp notifications
- Live auction integration (if brokerage licence obtained)
- Customer analytics dashboard
- Saved searches with alerts

### V2 (Month 4-6)
- Mobile app (React Native)
- ML-based repair cost estimation
- Insurance product integration
- Multi-vehicle bulk bidding

---

## Questions to Resolve Before Building

1. **SMS Provider:** Termii or Africa's Talking?
2. **Email Provider:** SendGrid, Resend, or AWS SES?
3. **File Storage:** Cloudinary (easier) or S3 (cheaper)?
4. **Carfax:** Is API access confirmed? Pricing model?
5. **Admin Users:** How many? Email addresses for initial setup?
6. **Deposit %:** Is 10% confirmed or should it be configurable?
7. **Service Fee:** Is $200 flat confirmed?

---

## Next Steps

1. Review and approve this plan
2. Set up external service accounts (SMS, Email, Storage)
3. Start Phase 1: Admin Portal
4. Daily progress check-ins

Ready to start building when you are.
