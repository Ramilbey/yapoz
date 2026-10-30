// Input rules shared by the browser forms and the API, so both reject the same things with the same words.
import { z } from "zod";

const COMMON_PASSWORDS = new Set(["password1", "password12", "password123", "qwerty123", "qwerty1234", "abc12345", "abcd1234", "admin123", "welcome1", "letmein1", "iloveyou1", "12345678a", "1q2w3e4r"]);

export const personName = z.string().trim().min(2, "Enter your name").max(80, "That name is too long").regex(/\p{L}/u, "Enter your name");
export const businessName = z.string().trim().min(2, "Business name is too short").max(80, "Business name is too long").regex(/[\p{L}\p{N}]/u, "Enter your business name");
export const email = z.string().trim().toLowerCase().max(120, "That email is too long").email("Enter a valid email");

/** bcrypt only reads the first 72 bytes, so a longer password would be silently cut. */
export const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .refine((p) => new TextEncoder().encode(p).length <= 72, "Use 72 characters or fewer")
  .refine((p) => /\p{L}/u.test(p) && /\p{N}/u.test(p), "Use at least one letter and one number")
  .refine((p) => !COMMON_PASSWORDS.has(p.toLowerCase()), "That password is too easy to guess");

export const SignupFields = z.object({ businessName, name: personName, email, password }).refine(
  (v) => {
    const local = v.email.split("@")[0];
    return local.length < 4 || !v.password.toLowerCase().includes(local);
  },
  { path: ["password"], message: "Don't use your email in your password" },
);

export const verificationCode = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email");

export const BusinessDetails = z.object({
  type: z.string().trim().min(2, "Say what kind of business this is").max(80, "Keep the kind of business short"),
  description: z.string().trim().max(2000, "Keep the description under 2000 characters"),
  address: z.string().trim().max(300, "That address is too long"),
  country: z.string().trim().min(2, "Choose your country").max(80, "That country name is too long"),
  phone: z.string().trim().regex(/^\+?[\d\s().-]{6,25}$/, "Enter a valid phone number, like +60 12 345 6789").nullable(),
  website: z.string().trim().max(300, "That website address is too long").regex(/^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i, "Enter a valid website, like yourbusiness.com").nullable(),
  languages: z.array(z.string().trim().min(1).max(40, "That language name is too long")).min(1, "Add at least one language").max(8, "Add 8 languages at most"),
});

/** The first problem with each field, for showing next to the inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}
