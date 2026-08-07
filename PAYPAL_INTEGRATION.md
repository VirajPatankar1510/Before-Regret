# PayPal Integration Guide

## Overview

This document outlines the PayPal payment integration for BeforeRegret, enabling secure transactions for property reports ($14.99) and vendor subscriptions.

## Architecture

### Components

1. **Backend Services**
   - `src/server/paypalService.ts` - PayPal API client and utilities
   - Database transactions table for payment tracking
   - API endpoints for order creation, capture, and verification

2. **Frontend Components**
   - `src/components/PaymentProcessor.tsx` - Reusable payment component
   - `src/components/PaymentSuccess.tsx` - Payment confirmation page
   - `src/components/PaymentCancelled.tsx` - Payment cancellation page
   - `src/components/ReportGatingModal.tsx` - Updated to use PayPal

3. **Database**
   - `transactions` table stores all payment records
   - Tracks order status, amounts, user info, and error messages

## Environment Setup

### 1. Get PayPal Credentials

1. Create/log in to your PayPal Developer account: https://developer.paypal.com/dashboard
2. Create a Business/REST application
3. Copy your **Client ID** and **Secret** from the Sandbox/Live section

### 2. Update Environment Variables

Add to your `.env` file:

```env
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_MODE=sandbox  # Use 'sandbox' for testing, 'live' for production
APP_URL=http://localhost:3000  # or your production URL
```

### 3. Database Configuration

Ensure `DATABASE_URL` is set for transaction tracking:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

## Payment Flows

### Property Report Purchase

1. User clicks "Generate Report" when 1+ free report used
2. ReportGatingModal shows payment prompt
3. User clicks "Proceed to PayPal"
4. PaymentProcessor creates PayPal order
5. User redirected to PayPal checkout
6. On approval → redirected to `/payment-success?token=ORDER_ID`
7. Transaction verified and marked as "completed"
8. Report generation proceeds

### Vendor Subscriptions

The same PaymentProcessor component can be reused for:
- Monthly subscription ($X/month)
- Recurring billing setup
- Vendor placement upgrades

## API Endpoints

### POST `/api/paypal/orders`

Creates a PayPal order.

**Request:**
```json
{
  "amount": 14.99,
  "currency": "USD",
  "type": "report",
  "description": "Property Report for 123 Main St",
  "propertyAddress": "123 Main St, City, State",
  "userEmail": "user@example.com",
  "userId": "clerk_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "3LA00000000000001",
  "approvalUrl": "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=3LA00000000000001"
}
```

### POST `/api/paypal/orders/:orderId/capture`

Captures the payment after user approval.

**Request:**
```json
{
  "userId": "clerk_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "3LA00000000000001",
  "status": "COMPLETED",
  "captureId": "0EF45376M4461103N",
  "amount": "14.99",
  "currency": "USD"
}
```

### GET `/api/paypal/orders/:orderId`

Retrieves order status.

**Response:**
```json
{
  "success": true,
  "orderId": "3LA00000000000001",
  "status": "COMPLETED",
  "amount": "14.99",
  "currency": "USD"
}
```

### GET `/api/paypal/transaction/:orderId`

Retrieves transaction record from database.

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "user_id": "clerk_user_id",
    "user_email": "user@example.com",
    "paypal_order_id": "3LA00000000000001",
    "amount": "14.99",
    "currency": "USD",
    "type": "report",
    "status": "completed",
    "property_address": "123 Main St",
    "created_at": "2026-08-07T12:00:00Z"
  }
}
```

## Testing

### Sandbox Testing

1. Use `PAYPAL_MODE=sandbox` in your `.env`
2. Test PayPal account credentials:
   - Buyer email: sb-xxxxx@personal.example.com
   - Seller email: sb-xxxxx@business.example.com
   - Both available in your Developer Dashboard

### Test Scenarios

**Successful Payment:**
- Use any email on PayPal sandbox
- Payment will complete and redirect to `/payment-success`

**Cancelled Payment:**
- User can cancel on PayPal checkout
- Redirects to `/payment-cancelled`
- Transaction remains in "pending" status

### Webhook Testing (Optional)

For production, set up webhooks in PayPal Developer Dashboard:
- Event: `CHECKOUT.ORDER.COMPLETED`
- URL: `https://yourdomain.com/api/paypal/webhook`
- This allows asynchronous payment verification

## Database Schema

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  paypal_order_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT NOT NULL,  -- 'report' | 'vendor_subscription'
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'completed' | 'failed'
  property_address TEXT,
  vendor_id TEXT,
  paypal_capture_id TEXT,
  payer_name TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Security Considerations

1. **Credentials**: All PayPal credentials are server-side only
2. **SSL/TLS**: Use HTTPS in production
3. **Token Validation**: Always verify PayPal orders server-side before granting access
4. **Database**: Transaction records are PCI-DSS compliant (no full card numbers stored)
5. **Error Handling**: Never expose sensitive error details to users

## Troubleshooting

### "PayPal is not configured"
- Ensure `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set
- Check `.env` file for typos

### "Failed to obtain PayPal access token"
- Verify credentials are correct
- Check if sandbox/live mode matches your credentials
- Ensure `PAYPAL_MODE` env var is correct

### Payment appears to complete but database isn't updated
- Check if `DATABASE_URL` is configured
- Verify database connectivity
- Check server logs for SQL errors

### "No payment order ID found"
- Verify PayPal redirect URL is set correctly
- Check PayPal order ID in URL: `/payment-success?token=ORDER_ID`

## Production Deployment

1. **Get Live Credentials**
   - Request live credentials from PayPal Business Dashboard
   - Complete identity verification

2. **Switch to Live Mode**
   ```env
   PAYPAL_MODE=live
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_client_secret
   APP_URL=https://yourdomain.com  # Production URL
   ```

3. **Update Payment Amounts**
   - Currently hardcoded to $14.99 in ReportGatingModal
   - Move to database config for dynamic pricing

4. **Set Up Webhooks**
   - Configure PayPal webhooks for asynchronous verification
   - Implement webhook verification endpoint

5. **Test Payment Flows**
   - Test with real PayPal accounts
   - Verify email notifications
   - Confirm transaction records in database

## Future Enhancements

- [ ] Subscription management (upgrade/downgrade/cancel)
- [ ] Webhook handling for real-time payment updates
- [ ] Payment history dashboard for users
- [ ] Refund processing
- [ ] Multi-currency support
- [ ] Payment retry logic for failed transactions
- [ ] Invoice generation and email delivery

## Support

For PayPal API questions: https://developer.paypal.com/docs/
For integration issues: Check server logs and database transaction records
