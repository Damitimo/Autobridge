import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'support']);
export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'verified', 'rejected']);
export const vehicleConditionEnum = pgEnum('vehicle_condition', ['running', 'non_running', 'unknown']);
export const titleStatusEnum = pgEnum('title_status', ['clean', 'salvage', 'rebuilt', 'parts_only', 'unknown']);
export const auctionSourceEnum = pgEnum('auction_source', ['copart', 'iaai']);
export const bidStatusEnum = pgEnum('bid_status', ['pending', 'placed', 'won', 'lost', 'outbid']);
export const bidRequestStatusEnum = pgEnum('bid_request_status', ['pending', 'bid_placed', 'won', 'lost', 'rejected', 'withdrawn', 'outbidded']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded', 'partial']);
export const paymentMethodEnum = pgEnum('payment_method', ['bank_transfer', 'card', 'paystack', 'flutterwave', 'crypto']);
export const shipmentStatusEnum = pgEnum('shipment_status', [
  'auction_won',
  'payment_received',
  'pickup_scheduled',
  'in_transit_to_port',
  'at_us_port',
  'loaded_on_vessel',
  'vessel_departed',
  'vessel_in_transit',
  'vessel_arrived_nigeria',
  'customs_clearance',
  'customs_cleared',
  'ready_for_pickup',
  'in_transit_to_customer',
  'delivered'
]);
export const shippingMethodEnum = pgEnum('shipping_method', ['roro', 'container_shared', 'container_exclusive']);
export const walletTransactionTypeEnum = pgEnum('wallet_transaction_type', [
  'deposit', 'withdrawal', 'bid_lock', 'bid_unlock', 'bid_forfeit',
  'payment', 'towing_payment', 'shipping_payment', 'signup_fee', 'refund', 'vin_check'
]);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'reversed']);
export const invoiceTypeEnum = pgEnum('invoice_type', ['signup_fee', 'car_purchase', 'towing', 'shipping', 'relisting_fee']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['pending', 'paid', 'overdue', 'cancelled']);
export const conversationStatusEnum = pgEnum('conversation_status', ['open', 'closed']);

// Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  
  // KYC Information
  kycStatus: kycStatusEnum('kyc_status').default('pending').notNull(),
  nin: varchar('nin', { length: 11 }),
  bvn: varchar('bvn', { length: 11 }),
  businessName: varchar('business_name', { length: 255 }),
  businessRegNumber: varchar('business_reg_number', { length: 100 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }).default('Nigeria'),
  
  // Referral
  referralCode: varchar('referral_code', { length: 20 }).unique(),
  referredBy: text('referred_by'),
  
  // Signup Fee
  signupFeePaid: boolean('signup_fee_paid').default(false).notNull(),
  signupFeePaidAt: timestamp('signup_fee_paid_at'),
  signupFeeAmount: decimal('signup_fee_amount', { precision: 10, scale: 2 }),
  
  // KYC Review (Admin)
  kycReviewedBy: text('kyc_reviewed_by'),
  kycReviewedAt: timestamp('kyc_reviewed_at'),
  kycRejectionReason: text('kyc_rejection_reason'),

  // Metadata
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // User Preferences
  preferences: jsonb('preferences').$type<{
    defaultCurrency?: 'USD' | 'NGN';
    costIntelligence?: {
      showVehiclePrice?: boolean;
      showAuctionFee?: boolean;
      showTowing?: boolean;
      showShipping?: boolean;
      showInsurance?: boolean;
      showCustomsDuty?: boolean;
      showPortCharges?: boolean;
      showClearingFee?: boolean;
      showServiceFee?: boolean;
      showLocalDelivery?: boolean;
      showTotal?: boolean;
    };
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  }>(),
});

// Vehicles Table (Auction Inventory)
export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Auction Details
  auctionSource: auctionSourceEnum('auction_source').notNull(),
  lotNumber: varchar('lot_number', { length: 50 }).notNull(),
  vin: varchar('vin', { length: 17 }).notNull(),
  
  // Vehicle Information
  year: integer('year').notNull(),
  make: varchar('make', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  trim: varchar('trim', { length: 100 }),
  bodyStyle: varchar('body_style', { length: 50 }),
  color: varchar('color', { length: 50 }),
  
  // Condition
  condition: vehicleConditionEnum('condition').default('unknown'),
  titleStatus: titleStatusEnum('title_status').default('unknown'),
  primaryDamage: varchar('primary_damage', { length: 100 }),
  secondaryDamage: varchar('secondary_damage', { length: 100 }),
  odometer: integer('odometer'),
  odometerUnit: varchar('odometer_unit', { length: 10 }).default('miles'),
  
  // Pricing
  currentBid: decimal('current_bid', { precision: 10, scale: 2 }),
  buyNowPrice: decimal('buy_now_price', { precision: 10, scale: 2 }),
  estimatedRepairCost: decimal('estimated_repair_cost', { precision: 10, scale: 2 }),
  estimatedValue: decimal('estimated_value', { precision: 10, scale: 2 }),
  
  // Auction Details
  auctionDate: timestamp('auction_date'),
  auctionLocation: varchar('auction_location', { length: 255 }),
  auctionLocationState: varchar('auction_location_state', { length: 50 }),
  saleStatus: varchar('sale_status', { length: 50 }),
  
  // Media
  images: jsonb('images').$type<string[]>(),
  thumbnailUrl: text('thumbnail_url'),
  
  // Additional Data
  engineType: varchar('engine_type', { length: 100 }),
  transmission: varchar('transmission', { length: 50 }),
  driveType: varchar('drive_type', { length: 50 }),
  fuelType: varchar('fuel_type', { length: 50 }),
  cylinders: integer('cylinders'),
  
  // Keys & Documentation
  hasKeys: boolean('has_keys'),
  
  // Metadata
  lastSyncedAt: timestamp('last_synced_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bids Table
export const bids = pgTable('bids', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  
  maxBidAmount: decimal('max_bid_amount', { precision: 10, scale: 2 }).notNull(),
  currentBidAmount: decimal('current_bid_amount', { precision: 10, scale: 2 }),
  status: bidStatusEnum('status').default('pending').notNull(),
  
  // Auction Result
  finalBidAmount: decimal('final_bid_amount', { precision: 10, scale: 2 }),
  wonAt: timestamp('won_at'),
  
  // External Auction House Tracking (Copart/IAAI)
  externalBidId: varchar('external_bid_id', { length: 100 }), // Copart's bid ID
  externalSource: auctionSourceEnum('external_source'), // 'copart' or 'iaai'
  externalStatus: varchar('external_status', { length: 50 }), // Raw status from Copart
  lastSyncedAt: timestamp('last_synced_at'), // When we last checked with Copart
  
  // Deposit Management (10% rule)
  depositAmount: decimal('deposit_amount', { precision: 10, scale: 2 }),
  depositLocked: boolean('deposit_locked').default(false).notNull(),
  depositForfeitedAt: timestamp('deposit_forfeited_at'),
  
  // Notifications
  notificationsSent: jsonb('notifications_sent').$type<{type: string, sentAt: string}[]>().default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bid Requests Table (URL submissions from users)
export const bidRequests = pgTable('bid_requests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),

  // Auction URL submitted by user
  auctionLink: text('auction_link').notNull(),
  auctionSource: auctionSourceEnum('auction_source').notNull(), // 'copart' or 'iaai'

  // User's bid parameters
  maxBidAmount: decimal('max_bid_amount', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),

  // Status tracking
  status: bidRequestStatusEnum('status').default('pending').notNull(),

  // Admin review
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  adminNotes: text('admin_notes'),
  rejectionReason: text('rejection_reason'),

  // If approved and bid placed, link to the actual bid
  bidId: text('bid_id').references(() => bids.id),

  // Extracted vehicle info (populated by admin or scraper)
  vehicleYear: integer('vehicle_year'),
  vehicleMake: varchar('vehicle_make', { length: 100 }),
  vehicleModel: varchar('vehicle_model', { length: 100 }),
  vehicleVin: varchar('vehicle_vin', { length: 17 }),
  lotNumber: varchar('lot_number', { length: 50 }),
  vehicleImageUrl: text('vehicle_image_url'),
  vehicleLocation: varchar('vehicle_location', { length: 255 }),
  vehicleDamageType: varchar('vehicle_damage_type', { length: 100 }),
  currentBid: decimal('current_bid', { precision: 10, scale: 2 }),

  // Locked funds for this bid request
  lockedAmount: decimal('locked_amount', { precision: 10, scale: 2 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions Table
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  bidId: text('bid_id').references(() => bids.id),
  
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NGN').notNull(),
  
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  
  // Payment Gateway Details
  paymentReference: varchar('payment_reference', { length: 255 }).unique(),
  gatewayResponse: jsonb('gateway_response'),
  
  // Breakdown
  vehiclePrice: decimal('vehicle_price', { precision: 10, scale: 2 }),
  auctionFees: decimal('auction_fees', { precision: 10, scale: 2 }),
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
  customsDuty: decimal('customs_duty', { precision: 10, scale: 2 }),
  otherFees: decimal('other_fees', { precision: 10, scale: 2 }),
  
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Shipments Table
export const shipments = pgTable('shipments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  bidId: text('bid_id').notNull().references(() => bids.id),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  
  status: shipmentStatusEnum('status').default('auction_won').notNull(),
  shippingMethod: shippingMethodEnum('shipping_method'),
  
  // Pickup Details
  pickupScheduledAt: timestamp('pickup_scheduled_at'),
  pickedUpAt: timestamp('picked_up_at'),
  pickupLocation: varchar('pickup_location', { length: 255 }),
  
  // US Port/Warehouse
  usWarehouse: varchar('us_warehouse', { length: 255 }),
  arrivedAtWarehouseAt: timestamp('arrived_at_warehouse_at'),
  
  // Shipping Details
  vesselName: varchar('vessel_name', { length: 255 }),
  bookingNumber: varchar('booking_number', { length: 100 }),
  containerNumber: varchar('container_number', { length: 50 }),
  billOfLading: varchar('bill_of_lading', { length: 100 }),
  
  departurePort: varchar('departure_port', { length: 100 }),
  departedAt: timestamp('departed_at'),
  
  arrivalPort: varchar('arrival_port', { length: 100 }).default('Lagos'),
  estimatedArrivalAt: timestamp('estimated_arrival_at'),
  arrivedAt: timestamp('arrived_at'),
  
  // Customs
  customsClearedAt: timestamp('customs_cleared_at'),
  customsDocuments: jsonb('customs_documents').$type<{name: string, url: string}[]>(),
  
  // Delivery
  deliveryAddress: text('delivery_address'),
  deliveryCity: varchar('delivery_city', { length: 100 }),
  deliveryState: varchar('delivery_state', { length: 100 }),
  deliveredAt: timestamp('delivered_at'),
  
  // Tracking
  currentLocation: jsonb('current_location').$type<{lat: number, lng: number, address: string}>(),
  trackingHistory: jsonb('tracking_history').$type<{status: string, location: string, timestamp: string, notes?: string}[]>().default([]),
  
  // Costs
  towingCost: decimal('towing_cost', { precision: 10, scale: 2 }),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
  storageCost: decimal('storage_cost', { precision: 10, scale: 2 }),
  customsCost: decimal('customs_cost', { precision: 10, scale: 2 }),
  deliveryCost: decimal('delivery_cost', { precision: 10, scale: 2 }),
  
  // Documents
  documents: jsonb('documents').$type<{type: string, name: string, url: string, uploadedAt: string}[]>().default([]),
  
  // Notes
  notes: text('notes'),

  // Admin tracking
  statusUpdatedBy: text('status_updated_by'),
  statusUpdatedAt: timestamp('status_updated_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Saved Searches Table
export const savedSearches = pgTable('saved_searches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  
  name: varchar('name', { length: 255 }).notNull(),
  searchCriteria: jsonb('search_criteria').notNull().$type<{
    make?: string[];
    model?: string[];
    yearMin?: number;
    yearMax?: number;
    priceMin?: number;
    priceMax?: number;
    condition?: string[];
    titleStatus?: string[];
    auctionLocation?: string[];
  }>(),
  
  alertsEnabled: boolean('alerts_enabled').default(true).notNull(),
  lastAlertSentAt: timestamp('last_alert_sent_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Vehicle History Reports Table (VIN Check)
export const vehicleHistoryReports = pgTable('vehicle_history_reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  vehicleId: text('vehicle_id').references(() => vehicles.id), // Optional - may not exist yet
  vin: varchar('vin', { length: 17 }).notNull(),

  provider: varchar('provider', { length: 50 }).notNull(), // 'vinaudit', 'clearvin', 'nmvtis'
  reportData: jsonb('report_data').notNull(),
  reportUrl: text('report_url'),
  reportPdf: text('report_pdf'), // URL to PDF if available

  // Pricing
  costUsd: decimal('cost_usd', { precision: 6, scale: 2 }).notNull(),
  chargedAmount: decimal('charged_amount', { precision: 6, scale: 2 }).notNull(), // What user paid

  // Key report findings (for quick display)
  titleBrands: jsonb('title_brands').$type<string[]>(),
  totalLoss: boolean('total_loss'),
  odometer: integer('odometer'),
  odometerRollback: boolean('odometer_rollback'),
  accidentCount: integer('accident_count'),
  ownerCount: integer('owner_count'),

  // Transaction reference
  walletTransactionId: text('wallet_transaction_id'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cost Estimates Table
export const costEstimates = pgTable('cost_estimates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  vehicleId: text('vehicle_id').references(() => vehicles.id),
  
  // Input Parameters
  vehiclePrice: decimal('vehicle_price', { precision: 10, scale: 2 }).notNull(),
  auctionLocation: varchar('auction_location', { length: 255 }),
  destinationPort: varchar('destination_port', { length: 100 }).default('Lagos'),
  shippingMethod: shippingMethodEnum('shipping_method').default('roro'),
  vehicleCondition: vehicleConditionEnum('vehicle_condition').default('running'),
  
  // Cost Breakdown
  auctionBuyerFee: decimal('auction_buyer_fee', { precision: 10, scale: 2 }),
  usTowing: decimal('us_towing', { precision: 10, scale: 2 }),
  usStorage: decimal('us_storage', { precision: 10, scale: 2 }),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
  insurance: decimal('insurance', { precision: 10, scale: 2 }),
  nigerianCustomsDuty: decimal('nigerian_customs_duty', { precision: 10, scale: 2 }),
  nigerianPort: decimal('nigerian_port_charges', { precision: 10, scale: 2 }),
  clearingAgent: decimal('clearing_agent_fee', { precision: 10, scale: 2 }),
  localTransport: decimal('local_transport', { precision: 10, scale: 2 }),
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }),
  
  // Totals
  totalCostUSD: decimal('total_cost_usd', { precision: 12, scale: 2 }),
  totalCostNGN: decimal('total_cost_ngn', { precision: 12, scale: 2 }),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 2 }),
  
  // Market Analysis
  estimatedNigerianResaleValue: decimal('estimated_nigerian_resale_value', { precision: 12, scale: 2 }),
  estimatedProfitMargin: decimal('estimated_profit_margin', { precision: 10, scale: 2 }),
  
  // Timeline
  estimatedDaysToDelivery: integer('estimated_days_to_delivery'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications Table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  
  type: varchar('type', { length: 50 }).notNull(), // 'bid_won', 'payment_reminder', 'shipment_update', etc.
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // 'bid', 'shipment', 'vehicle'
  relatedEntityId: text('related_entity_id'),
  
  channels: jsonb('channels').$type<string[]>().default(['in_app']), // 'in_app', 'email', 'sms', 'whatsapp'
  
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Support Tickets Table
export const supportTickets = pgTable('support_tickets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'billing', 'technical', 'shipping', 'general'
  priority: varchar('priority', { length: 20 }).default('medium'), // 'low', 'medium', 'high', 'urgent'
  status: varchar('status', { length: 20 }).default('open'), // 'open', 'in_progress', 'resolved', 'closed'
  
  assignedTo: text('assigned_to').references(() => users.id),
  
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  relatedEntityId: text('related_entity_id'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

// Wallets Table
export const wallets = pgTable('wallets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique().references(() => users.id),
  
  // Balances (stored in USD)
  totalBalance: decimal('total_balance', { precision: 12, scale: 2 }).default('0').notNull(),
  availableBalance: decimal('available_balance', { precision: 12, scale: 2 }).default('0').notNull(),
  lockedBalance: decimal('locked_balance', { precision: 12, scale: 2 }).default('0').notNull(),
  
  // Metadata
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Wallet Transactions Table
export const walletTransactions = pgTable('wallet_transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  walletId: text('wallet_id').notNull().references(() => wallets.id),
  userId: text('user_id').notNull().references(() => users.id),
  
  type: walletTransactionTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  usdAmount: decimal('usd_amount', { precision: 12, scale: 2 }).notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }),
  
  // Balances after transaction
  balanceBefore: decimal('balance_before', { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 12, scale: 2 }).notNull(),
  
  // References
  bidId: text('bid_id').references(() => bids.id),
  invoiceId: text('invoice_id'),
  
  status: transactionStatusEnum('status').default('pending').notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Invoices Table
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  bidId: text('bid_id').references(() => bids.id),
  shipmentId: text('shipment_id').references(() => shipments.id),
  
  type: invoiceTypeEnum('type').notNull(),
  
  // Amounts
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  ngnEquivalent: decimal('ngn_equivalent', { precision: 12, scale: 2 }),
  
  // Payment
  status: invoiceStatusEnum('status').default('pending').notNull(),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  
  // Line items
  lineItems: jsonb('line_items').$type<{
    description: string;
    amount: number;
    currency: string;
  }[]>(),
  
  description: text('description'),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// KYC Documents Table
export const kycDocuments = pgTable('kyc_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),

  documentType: varchar('document_type', { length: 50 }).notNull(), // 'nin', 'passport', 'drivers_license', 'utility_bill', 'selfie', 'bvn_slip'
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),

  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'approved', 'rejected'
  rejectionReason: text('rejection_reason'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Shipment Photos Table
export const shipmentPhotos = pgTable('shipment_photos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shipmentId: text('shipment_id').notNull().references(() => shipments.id),

  stage: varchar('stage', { length: 50 }).notNull(), // 'auction_yard', 'towing', 'us_port', 'vessel_loading', 'apapa_arrival', 'customs', 'released'
  fileUrl: text('file_url').notNull(),
  caption: text('caption'),

  uploadedBy: text('uploaded_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Shipment Documents Table
export const shipmentDocuments = pgTable('shipment_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shipmentId: text('shipment_id').notNull().references(() => shipments.id),

  documentType: varchar('document_type', { length: 50 }).notNull(), // 'bill_of_lading', 'title', 'customs_declaration', 'import_duty_receipt', 'release_order'
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),

  uploadedBy: text('uploaded_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Conversations Table (for admin-customer messaging)
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),

  subject: varchar('subject', { length: 255 }),
  status: conversationStatusEnum('status').default('open').notNull(),

  // Related entity (optional - can be linked to a bid request, shipment, etc.)
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // 'bid_request', 'shipment', 'bid', 'general'
  relatedEntityId: text('related_entity_id'),

  // Tracking
  lastMessageAt: timestamp('last_message_at'),
  lastMessageBy: text('last_message_by'), // 'user' or 'admin'
  unreadByAdmin: integer('unread_by_admin').default(0).notNull(),
  unreadByUser: integer('unread_by_user').default(0).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages Table
export const messages = pgTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id').notNull().references(() => conversations.id),
  senderId: text('sender_id').notNull().references(() => users.id),

  content: text('content').notNull(),

  // Attachments (optional)
  attachments: jsonb('attachments').$type<{name: string, url: string, type: string}[]>(),

  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Vehicle Lookups History Table
export const vehicleLookups = pgTable('vehicle_lookups', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),

  // Vehicle Info
  lotNumber: varchar('lot_number', { length: 50 }).notNull(),
  source: auctionSourceEnum('source').notNull(),
  auctionUrl: text('auction_url').notNull(),

  // Vehicle Details (cached from scraper)
  title: varchar('title', { length: 255 }).notNull(),
  year: integer('year'),
  make: varchar('make', { length: 100 }),
  model: varchar('model', { length: 100 }),
  vin: varchar('vin', { length: 17 }),
  imageUrl: text('image_url'),
  images: jsonb('images').$type<string[]>(),

  // Auction Info
  currentBid: decimal('current_bid', { precision: 10, scale: 2 }),
  location: varchar('location', { length: 255 }),
  damageType: varchar('damage_type', { length: 100 }),
  odometer: varchar('odometer', { length: 50 }),
  titleStatus: varchar('title_status', { length: 100 }),
  auctionDate: varchar('auction_date', { length: 100 }),
  auctionDateTime: timestamp('auction_date_time'),

  // Full vehicle data (JSON for flexibility)
  vehicleData: jsonb('vehicle_data').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  bids: many(bids),
  transactions: many(transactions),
  shipments: many(shipments),
  savedSearches: many(savedSearches),
  notifications: many(notifications),
  supportTickets: many(supportTickets),
  wallet: one(wallets),
  walletTransactions: many(walletTransactions),
  invoices: many(invoices),
  referredUsers: many(users),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  bids: many(bids),
  shipments: many(shipments),
  historyReports: many(vehicleHistoryReports),
}));

export const bidsRelations = relations(bids, ({ one, many }) => ({
  user: one(users, {
    fields: [bids.userId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [bids.vehicleId],
    references: [vehicles.id],
  }),
  transactions: many(transactions),
  shipments: many(shipments),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  user: one(users, {
    fields: [shipments.userId],
    references: [users.id],
  }),
  bid: one(bids, {
    fields: [shipments.bidId],
    references: [bids.id],
  }),
  vehicle: one(vehicles, {
    fields: [shipments.vehicleId],
    references: [vehicles.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.id],
  }),
  user: one(users, {
    fields: [walletTransactions.userId],
    references: [users.id],
  }),
  bid: one(bids, {
    fields: [walletTransactions.bidId],
    references: [bids.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  bid: one(bids, {
    fields: [invoices.bidId],
    references: [bids.id],
  }),
  shipment: one(shipments, {
    fields: [invoices.shipmentId],
    references: [shipments.id],
  }),
}));

export const bidRequestsRelations = relations(bidRequests, ({ one }) => ({
  user: one(users, {
    fields: [bidRequests.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [bidRequests.reviewedBy],
    references: [users.id],
  }),
  bid: one(bids, {
    fields: [bidRequests.bidId],
    references: [bids.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Waitlist Table
export const waitlist = pgTable('waitlist', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  source: varchar('source', { length: 50 }).default('homepage'), // 'homepage', 'landing', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
