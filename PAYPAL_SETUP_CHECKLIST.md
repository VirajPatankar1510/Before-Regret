# PayPal Integration Setup Checklist

## What Was Implemented ✓

### Backend Services
- [x] PayPal API service (`src/server/paypalService.ts`)
  - Order creation
  - Order capture
  - Order status retrieval
  - OAuth token management
  
- [x] Database Layer (`src/server/db.ts`)
  - Transactions table schema
  - Transaction CRUD operations
  - Index optimization for queries

- [x] API Endpoints (`server.ts`)
  - `POST /api/paypal/orders` - Create PayPal order
  - `POST /api/paypal/orders/:orderId/capture` - Capture payment
  - `GET /api/paypal/orders/:orderId` - Get order status
  - `GET /api/paypal/transaction/:orderId` - Get transaction record

### Frontend Components
- [x] PaymentProcessor (`src/components/PaymentProcessor.tsx`)
  - Handles order creation and PayPal redirection
  - Loading and error states
  - Reusable for multiple payment types

- [x] Payment Success Page (`src/components/PaymentSuccess.tsx`)
  - Verifies payment completion
  - Displays transaction ID
  - Confirmation UI

- [x] Payment Cancelled Page (`src/components/PaymentCancelled.tsx`)
  - Handles cancelled payments gracefully
  - Allows retry or return to home

- [x] Updated ReportGatingModal (`src/components/ReportGatingModal.tsx`)
  - Replaced card form with PayPal integration
  - Routes to PaymentProcessor for paid reports

### Routing & Navigation
- [x] Added `/payment-success` route
- [x] Added `/payment-cancelled` route
- [x] Updated App.tsx route types and handlers

### Dependencies
- [x] Installed `@paypal/paypal-server-sdk` v2.4.0
- [x] Uses native Fetch API for PayPal endpoints (no heavy SDK)

---

## Next Steps

### 1. Get PayPal Credentials
- [ ] Go to https://developer.paypal.com/dashboard
- [ ] Sign in or create account
- [ ] Create a REST application
- [ ] Copy **Client ID** and **Secret** for Sandbox

### 2. Configure Environment Variables
- [ ] Copy `.env.example` to `.env` (if not exists)
- [ ] Add PayPal credentials:
  ```env
  PAYPAL_CLIENT_ID=your_sandbox_client_id
  PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
  PAYPAL_MODE=sandbox
  APP_URL=http://localhost:3000
  ```

### 3. Set Up Database
- [ ] Ensure `DATABASE_URL` is configured in `.env`
- [ ] Run `npm run dev` - database schema auto-creates on first run
- [ ] Verify `transactions` table is created

### 4. Test Payment Flow
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to the app: http://localhost:3000
- [ ] Search for a property
- [ ] Click "Generate Report"
- [ ] After first free report, click again to trigger payment
- [ ] You should see PayPal payment prompt
- [ ] Proceed to PayPal (sandbox)
- [ ] Use test buyer account: `sb-xxxxx@personal.example.com` (from Dashboard)
- [ ] Approve payment
- [ ] Should redirect to `/payment-success`

### 5. Verify Database Records
- [ ] Check your database for records in `transactions` table
- [ ] Verify fields populated correctly:
  - `status` = "completed"
  - `paypal_capture_id` populated
  - `amount` = 14.99
  - `type` = "report"

### 6. Testing Scenarios

**Test Successful Payment:**
- Complete the full flow above
- Verify redirect to success page
- Check database for completed transaction

**Test Cancelled Payment:**
- Start payment flow
- Cancel on PayPal checkout
- Should redirect to `/payment-cancelled`
- Transaction should remain "pending"

**Test Error Handling:**
- Disconnect from internet during payment (simulates error)
- App should show error message and allow retry

---

## File Structure

```
Before-Regret/
├── src/
│   ├── server/
│   │   ├── paypalService.ts          [NEW] PayPal API client
│   │   ├── db.ts                     [UPDATED] Added transactions table
│   │   └── adminAuth.ts              (existing)
│   ├── components/
│   │   ├── PaymentProcessor.tsx       [NEW] Reusable payment component
│   │   ├── PaymentSuccess.tsx         [NEW] Success page
│   │   ├── PaymentCancelled.tsx       [NEW] Cancelled page
│   │   ├── ReportGatingModal.tsx      [UPDATED] Uses PayPal now
│   │   └── ...other components
│   └── App.tsx                        [UPDATED] Added payment routes
├── server.ts                          [UPDATED] Added PayPal endpoints
├── .env.example                       [UPDATED] PayPal env vars
├── PAYPAL_INTEGRATION.md              [NEW] Full integration guide
└── PAYPAL_SETUP_CHECKLIST.md         [THIS FILE]
```

---

## Troubleshooting

### Issue: "PayPal is not configured"
**Solution:** Ensure both env vars are set:
```bash
echo $PAYPAL_CLIENT_ID
echo $PAYPAL_CLIENT_SECRET
```

### Issue: Database errors
**Solution:** Verify `DATABASE_URL` is set and accessible:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: Payment button appears but nothing happens
**Solution:** Check browser console for errors
- Open DevTools → Console tab
- Look for network/API errors
- Check server logs: `npm run dev`

### Issue: Redirect loops or 404 on success page
**Solution:** Verify routing is configured:
- Check `App.tsx` has `paymentSuccess` in pseoRoute type
- Verify `/payment-success` route is handled
- Browser URL should be: `http://localhost:3000/payment-success?token=ORDER_ID`

---

## Important Notes

⚠️ **Sandbox vs Production**
- Development: Use `PAYPAL_MODE=sandbox`
- Production: Switch to `PAYPAL_MODE=live` and get live credentials
- Never mix sandbox and live credentials

⚠️ **Hardcoded Amounts**
- Property reports: $14.99 (hardcoded in ReportGatingModal.tsx:150)
- Move to database config for dynamic pricing

⚠️ **Email Notifications**
- Currently no email sent on payment
- Resend was removed from the project (was only used for cold vendor outreach, which violated
  Resend's Acceptable Use Policy -- see docs/VENDOR_INSTAGRAM_OUTREACH_PLAYBOOK.md). A purchase
  receipt to a customer who just paid is a genuinely different, compliant use case (transactional,
  not cold), so any ESP is fine here, Resend included if you want it back for this narrower purpose
- Send from hello@beforeregret.com
- Email should confirm receipt and provide transaction details

---

## Next Phase Features (Optional)

- [ ] Vendor subscription monthly billing
- [ ] Webhook handling for real-time updates
- [ ] User payment history dashboard
- [ ] Refund processing UI
- [ ] Email receipt generation
- [ ] Multi-currency support
- [ ] Subscription management portal

---

## Questions or Issues?

Refer to:
1. `PAYPAL_INTEGRATION.md` - Full technical documentation
2. PayPal Developer Docs: https://developer.paypal.com/docs/
3. Server logs: `npm run dev` shows all API calls
4. Database: Check `transactions` table for payment records

**Happy selling! 🚀**
