import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users, bids, vehicles, shipments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

// Get payment details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const transactionId = params.id;

    // Fetch transaction
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    // Fetch user
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, transaction.userId))
      .limit(1);

    // Fetch bid and vehicle if exists
    let bid = null;
    let vehicle = null;
    if (transaction.bidId) {
      const [bidResult] = await db
        .select()
        .from(bids)
        .where(eq(bids.id, transaction.bidId))
        .limit(1);
      bid = bidResult;

      if (bid) {
        const [vehicleResult] = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, bid.vehicleId))
          .limit(1);
        vehicle = vehicleResult;
      }
    }

    return NextResponse.json({
      success: true,
      transaction,
      user,
      bid,
      vehicle,
    });
  } catch (error) {
    console.error('Admin payment detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment details' },
      { status: 500 }
    );
  }
}

// Update payment status (for manual verification)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const transactionId = params.id;
    const updates = await request.json();

    // Check if transaction exists
    const [existingTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!existingTransaction) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    const validStatuses = ['pending', 'paid', 'failed', 'refunded', 'partial'];
    if (updates.paymentStatus && !validStatuses.includes(updates.paymentStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid payment status' }, { status: 400 });
    }

    const sanitizedUpdates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (updates.paymentStatus) {
      sanitizedUpdates.paymentStatus = updates.paymentStatus;

      // Update paidAt if marking as paid
      if (updates.paymentStatus === 'paid' && !existingTransaction.paidAt) {
        sanitizedUpdates.paidAt = new Date();

        // If this payment is for a bid, update shipment status to payment_received
        if (existingTransaction.bidId) {
          const [shipment] = await db
            .select()
            .from(shipments)
            .where(eq(shipments.bidId, existingTransaction.bidId))
            .limit(1);

          if (shipment && shipment.status === 'auction_won') {
            const history = (shipment.trackingHistory as any[]) || [];
            history.push({
              status: 'payment_received',
              location: '',
              timestamp: new Date().toISOString(),
              notes: `Payment verified by admin`,
            });

            await db
              .update(shipments)
              .set({
                status: 'payment_received',
                trackingHistory: history,
                statusUpdatedBy: admin.id,
                statusUpdatedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(shipments.id, shipment.id));
          }
        }
      }
    }

    if (updates.notes) {
      // Store verification notes in gateway response
      const gatewayResponse = (existingTransaction.gatewayResponse as Record<string, any>) || {};
      gatewayResponse.adminNotes = gatewayResponse.adminNotes || [];
      gatewayResponse.adminNotes.push({
        note: updates.notes,
        adminId: admin.id,
        timestamp: new Date().toISOString(),
      });
      sanitizedUpdates.gatewayResponse = gatewayResponse;
    }

    await db
      .update(transactions)
      .set(sanitizedUpdates)
      .where(eq(transactions.id, transactionId));

    return NextResponse.json({
      success: true,
      message: 'Payment updated successfully',
    });
  } catch (error) {
    console.error('Admin payment update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
