// Public Anonymous Display Name Generator for BeforeRegret Contributors
// Generates automatically masked public display names revealing only the first 3 letters and other letters as *****

export const INDIAN_FIRST_NAMES = [
  'Rahul', 'Priya', 'Amit', 'Vikram', 'Anish', 'Suresh', 'Kavita', 'Neha', 'Rohan', 'Deepak', 
  'Sanjay', 'Rajesh', 'Pooja', 'Sunita', 'Manish', 'Alok', 'Tarun', 'Gaurav', 'Nitin', 'Preeti', 
  'Swati', 'Aditya', 'Aarav', 'Divya', 'Karan', 'Meera', 'Nikhil', 'Pankaj', 'Ritu', 'Sachin',
  'Shweta', 'Varun', 'Yash', 'Ananya', 'Harish', 'Kiran', 'Madhav', 'Praveen', 'Ramesh', 'Shalini'
];

/**
 * Formats a given name string to reveal only the first 3 letters followed by '*****'.
 * E.g., 'Rahul' -> 'Rah*****'
 *       'Rahul Sharma' -> 'Rah*****'
 *       'Anish' -> 'Ani*****'
 *       'An' -> 'An*****'
 */
export function formatMaskedDisplayName(name: string): string {
  if (!name || name.trim().length === 0) {
    return 'Res*****';
  }
  const cleanName = name.trim();
  const first3 = cleanName.slice(0, 3);
  const formattedFirst3 = first3.charAt(0).toUpperCase() + first3.slice(1).toLowerCase();
  return `${formattedFirst3}*****`;
}

/**
 * Generates an automatically masked anonymous display name revealing only first 3 letters and other letters *****.
 */
export function generateAnonymousDisplayName(existingNames: Set<string> | string[] = new Set()): string {
  const existingSet = Array.isArray(existingNames) ? new Set(existingNames) : existingNames;
  
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;
    const randomName = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)];
    const candidate = formatMaskedDisplayName(randomName);

    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  const fallback = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)];
  return formatMaskedDisplayName(fallback);
}
