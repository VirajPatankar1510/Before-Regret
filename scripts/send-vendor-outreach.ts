// Manually-triggered outreach sender -- not a cron job, not wired into server.ts. Run with:
//   npx tsx scripts/send-vendor-outreach.ts            (dry run -- prints what would be sent)
//   SEND=true npx tsx scripts/send-vendor-outreach.ts  (actually sends)
//
// Dry-run by default on purpose: this sends real email to real business prospects, which is
// exactly the kind of external-facing, hard-to-reverse action that deserves an explicit,
// deliberate opt-in rather than running by default. The message hasn't been validated by a human
// reply yet either -- see the "hand-write and send the first 15-20 yourself" plan. This script
// automates the mechanics of sending, not the judgment of whether the message works.
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { VENDOR_PROSPECTS, OUTREACH_ELIGIBLE_TRADES } from '../src/data/vendorProspects';
import { buildOutreachEmail } from '../src/emails/vendorOutreachTemplates';
import { sendEmailViaResend } from '../src/emails/resendClient';

dotenv.config();

const FROM_ADDRESS = 'BeforeRegret <hello@beforeregret.com>';
const LOG_PATH = path.join(process.cwd(), 'scripts', 'outreach-log.json');

interface LogEntry {
  id: string;
  businessName: string;
  email: string;
  tradeCategory: string;
  zipCode: string;
  success: boolean;
  resendId?: string;
  error?: string;
  sentAt: string;
}

function appendToLog(entries: LogEntry[]) {
  const existing: LogEntry[] = fs.existsSync(LOG_PATH)
    ? JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'))
    : [];
  fs.writeFileSync(LOG_PATH, JSON.stringify([...existing, ...entries], null, 2), 'utf8');
}

async function run() {
  const isDryRun = process.env.SEND !== 'true';
  const notContacted = VENDOR_PROSPECTS.filter((p) => p.status === 'not_contacted');

  const ineligible = notContacted.filter(
    (p) => !(OUTREACH_ELIGIBLE_TRADES as readonly string[]).includes(p.tradeCategory)
  );
  if (ineligible.length > 0) {
    console.error(
      `Refusing to run: ${ineligible.length} prospect(s) have a trade category with no real placement in the report yet (Real Estate Attorney / Moving Company). Remove or recategorize them in vendorProspects.ts first.`
    );
    process.exit(1);
  }

  if (notContacted.length === 0) {
    console.log('No prospects with status "not_contacted" in vendorProspects.ts. Nothing to do.');
    return;
  }

  if (isDryRun) {
    console.log(`DRY RUN -- would send ${notContacted.length} email(s). Re-run with SEND=true to actually send.\n`);
  } else {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set. Add it to .env (locally) or your environment before sending for real.');
      process.exit(1);
    }
    console.log(`SENDING ${notContacted.length} email(s) for real via Resend.\n`);
  }

  const logEntries: LogEntry[] = [];

  for (const prospect of notContacted) {
    let email;
    try {
      email = buildOutreachEmail(prospect);
    } catch (err: any) {
      console.error(`[SKIP] ${prospect.businessName} (${prospect.id}): ${err.message}`);
      continue;
    }

    if (isDryRun) {
      console.log(`--- ${prospect.businessName} <${prospect.email}> (${prospect.tradeCategory}, ${prospect.zipCode}) ---`);
      console.log(`Subject: ${email.subject}`);
      console.log(email.text);
      console.log('');
      continue;
    }

    const result = await sendEmailViaResend({
      from: FROM_ADDRESS,
      to: prospect.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: 'hello@beforeregret.com',
    });

    const entry: LogEntry = {
      id: prospect.id,
      businessName: prospect.businessName,
      email: prospect.email,
      tradeCategory: prospect.tradeCategory,
      zipCode: prospect.zipCode,
      success: result.success,
      resendId: result.id,
      error: result.error,
      sentAt: new Date().toISOString(),
    };
    logEntries.push(entry);

    if (result.success) {
      console.log(`[SENT] ${prospect.businessName} <${prospect.email}> -- Resend id ${result.id}`);
    } else {
      console.error(`[FAILED] ${prospect.businessName} <${prospect.email}> -- ${result.error}`);
    }
  }

  if (!isDryRun && logEntries.length > 0) {
    appendToLog(logEntries);
    console.log(`\nWrote ${logEntries.length} result(s) to ${LOG_PATH}.`);
    console.log('This script does not edit vendorProspects.ts -- update each prospect\'s status by hand based on the log above.');
  }
}

run().catch((err) => {
  console.error('Vendor outreach script failed:', err);
  process.exit(1);
});
