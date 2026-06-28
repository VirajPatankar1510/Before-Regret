/**
 * BeforeRegret - Compliance and Safety Input Validation Utility
 * Enforces strict anonymity and safety regulations by blocking:
 * 1. Links / URLs (e.g., http, https, www, domain names)
 * 2. Phone Numbers (e.g., formats with 7+ digits, area codes, country prefixes)
 * 3. Email Addresses (e.g., contact@domain.com)
 * 4. @handles / Social IDs (e.g., @username, @handle)
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateInputText(text: string, fieldName: string = "Input"): ValidationResult {
  if (!text) return { isValid: true };

  // 1. Self-Harm/Crisis safety check to show immediate supportive helpline resources
  const selfHarmRegex = /\b(suicide|suicid(al|e)|kill\s+myself|end\s+my\s+life|slitting|self\s+harm)\b/i;
  if (selfHarmRegex.test(text)) {
    return {
      isValid: false,
      error: `For safety and supportive care, our filters flagged mentions related to self-harm. If you or someone you know is experiencing thoughts of self-harm, severe trauma, or domestic crisis, please reach out immediately to a certified professional. You can call or text the Suicide & Crisis Lifeline at 988 (US/Canada), contact the National Domestic Violence Hotline at 1-800-799-7233, or contact your local emergency services. You do not have to walk through this alone.`
    };
  }

  // 2. Severe Profanity & Explicit/Adult Content UGC validation (for Google AdSense compliance)
  const explicitRegex = /\b(fuck|fucking|fucker|fuckers|cunt|dick|pussy|asshole|motherfucker|slut|sluts|whore|whores|porn|pornography|prostitute|escort|onlyfans|erotic|naked|nudity|rape|raped|rapist|incest|cocaine|heroin|methamphetamine|shit|shitty|bitch|bitches|bastard|fag|faggot|nigger|kike|chink|gook|retard|retarded)\b/i;
  if (explicitRegex.test(text)) {
    return {
      isValid: false,
      error: `${fieldName} contains language that does not comply with our safety guidelines. To keep BeforeRegret a civil, supportive, and AdSense-compliant environment, please avoid using highly offensive words, slurs, profanity, or sexually explicit/adult descriptions.`
    };
  }

  // 3. Email validation
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(text)) {
    return {
      isValid: false,
      error: `${fieldName} contains an email address. For safety, sharing email addresses is strictly prohibited.`
    };
  }

  // 2. @handles or IDs validation (e.g. @username)
  // Match any word starting with @ that is not followed by purely space
  const handleRegex = /@\w+/g;
  if (handleRegex.test(text)) {
    return {
      isValid: false,
      error: `${fieldName} contains a social media handle/username (@...). To protect identity, social handles are strictly prohibited.`
    };
  }

  // 3. Links / URLs validation
  // Captures http://, https://, www., or standalone domain-like patterns (e.g. word.com, word.net)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(?:com|net|org|edu|gov|io|co|xyz|info|me|app|biz|tv)\b)/gi;
  if (urlRegex.test(text)) {
    return {
      isValid: false,
      error: `${fieldName} contains a web link or URL. To prevent spam and maintain safety, sharing links is strictly prohibited.`
    };
  }

  // 4. Phone numbers validation
  // Captures common phone patterns: e.g. +1 123-456-7890, 123-456-7890, (123) 456-7890, or sequences of 7+ digits
  // We want to be careful not to trigger on simple numbers like years (2026), case numbers, or metrics (e.g., 50% or 10,000).
  // A phone number usually has 7 to 15 digits, optionally with +, -, spaces, or parentheses.
  // We match a phone number pattern: 
  // - Starts with optional + and country code
  // - Or matches 7+ contiguous digits (excluding pure large year numbers or simple numbers)
  // Let's use a regex that looks for 7-15 digits with common formatting, but doesn't flag simple years.
  const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{7,15}\b/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches) {
    // Check if any match is actually just a big number/year (e.g. 1000000 or 2026)
    for (const match of phoneMatches) {
      // If it's a simple year or small number, let's skip.
      // E.g. length is exactly 7 but looks like a metric, or length is exactly 4 (not captured by 7+).
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        // Exclude common large numbers if they represent money (e.g. $100000) or are simple round numbers
        // But if it looks formatted (has spaces/dashes) or doesn't end with lots of zeros, flag it.
        const looksLikeBigNumber = /^[1-9]0{4,}$/.test(digitsOnly); // e.g. 10000, 100000, 5000000
        if (!looksLikeBigNumber) {
          return {
            isValid: false,
            error: `${fieldName} contains a phone number. To protect privacy, sharing phone numbers is strictly prohibited.`
          };
        }
      }
    }
  }

  return { isValid: true };
}
