import crypto from 'crypto';
import { base32Encode } from '../src/server/adminAuth';

// One-time setup helper for the /admin/seo 2FA gate (see src/server/adminAuth.ts). Deliberately a
// script you run locally rather than an endpoint on the live app -- an endpoint that can (re)issue
// the 2FA secret would let anyone who reaches it re-enroll their own authenticator app in place of
// yours, which defeats the point of the second factor. Run this once, put the secret in your
// hosting environment as ADMIN_TOTP_SECRET, and enter it into your authenticator app manually.
//
// Usage: npx tsx scripts/generate-admin-totp-secret.ts

const secret = base32Encode(crypto.randomBytes(20)); // 160 bits, same size Google Authenticator itself issues

console.log('');
console.log('Generated a new TOTP secret for the admin 2FA gate.');
console.log('');
console.log('1. Add this to your hosting environment (e.g. Vercel project settings) and redeploy:');
console.log('');
console.log(`   ADMIN_TOTP_SECRET="${secret}"`);
console.log('');
console.log('2. In Google Authenticator (or Authy, 1Password, etc.), add an account manually');
console.log('   ("Enter a setup key" / "Manual entry" -- not the QR-scan option) with:');
console.log('');
console.log('   Account name:  BeforeRegret Admin');
console.log(`   Key:           ${secret}`);
console.log('   Type:          Time based');
console.log('');
console.log('This secret is only shown once, right here. It is never displayed anywhere in the');
console.log('deployed app -- if you lose it, generate a new one and update the env var again.');
console.log('');
