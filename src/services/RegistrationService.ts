import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { pendingRegistrationRepository } from "@/repositories/PendingRegistrationRepository";
import { userRepository } from "@/repositories/UserRepository";
import { realtorRepository } from "@/repositories/RealtorRepository";
import { LogEntryService } from "./LogEntryService";
import { TagService } from "./TagService";
import { sendMail } from "@/lib/mail";
import { registrationConfirmationEmail } from "@/lib/mailTemplates";
import { signAuthToken, toPublicUser } from "@/lib/auth";
import type { LoginResponse, RealtorInput } from "@/lib/types";

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

// Signup → email confirmation → realtor info flow. See CLAUDE.md → "Registration" for why this
// is a separate PendingRegistration collection rather than an unconfirmed User: the User schema
// requires a realtorId for every non-Root role, and there's no Realtor yet at signup time.
export class RegistrationService {
  static async signup(email: string, password: string): Promise<void> {
    await connectDB();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      // Don't reveal whether the email is already registered — same enumeration-safety
      // reasoning as login's generic "Invalid credentials" message. Log and stop silently;
      // the route above always returns the same generic success response either way.
      await LogEntryService.warning({
        category: "Registration",
        message: `Signup attempted for already-registered email ${normalizedEmail}`,
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    // Replace any earlier, unconfirmed attempt for this email rather than erroring — lets
    // someone who lost the first email just sign up again to get a fresh link.
    await pendingRegistrationRepository.deleteByEmail(normalizedEmail);
    await pendingRegistrationRepository.create({ email: normalizedEmail, passwordHash, token, expiresAt });

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const confirmUrl = `${baseUrl}/confirm-registration?token=${token}`;
    const { subject, html } = registrationConfirmationEmail(confirmUrl);
    const sent = await sendMail({ to: normalizedEmail, subject, html });

    await LogEntryService.info({
      category: "Registration",
      message: sent
        ? `Signup started for ${normalizedEmail}, confirmation email sent`
        : `Signup started for ${normalizedEmail}, confirmation email FAILED to send`,
    });
  }

  static async getPendingByToken(token: string) {
    await connectDB();
    const pending = await pendingRegistrationRepository.findByToken(token);
    if (!pending || pending.expiresAt.getTime() < Date.now()) return null;
    return pending;
  }

  static async completeRegistration(token: string, realtorInput: RealtorInput): Promise<LoginResponse> {
    await connectDB();
    const pending = await this.getPendingByToken(token);
    if (!pending) throw new Error("Invalid or expired registration link");

    const existingUser = await userRepository.findByEmail(pending.email);
    if (existingUser) throw new Error("This email is already registered");

    const realtorEmail = realtorInput.email.trim().toLowerCase();
    const existingRealtor = await realtorRepository.findByEmail(realtorEmail);
    if (existingRealtor) throw new Error("A realtor with this email already exists");

    const realtor = await realtorRepository.create({ ...realtorInput, email: realtorEmail });

    // Every new realtor starts with one default tag — see CLAUDE.md → "Tags". Best-effort: a
    // seeding failure must never break registration itself, same discipline as RealtorService's
    // own admin-created path.
    try {
      await TagService.create({ realtorId: realtor._id, name: "Recent" });
    } catch (error) {
      console.error(`Failed to seed default "Recent" tag for realtor ${realtor.id}`, error);
    }

    const user = await userRepository.createWithHashedPassword({
      email: pending.email,
      password: pending.passwordHash,
      role: "Administrator",
      realtorId: realtor._id,
    });

    // Realtor.userId can only be set once the User exists — same "profile can exist before, or
    // independently of, a login account" linkage the rest of the app already relies on (see
    // CLAUDE.md → Data layer).
    await realtorRepository.update(realtor.id, { userId: user._id });

    await pendingRegistrationRepository.deleteByEmail(pending.email);

    await LogEntryService.info({
      category: "Registration",
      message: `User ${user.email} completed registration and linked realtor ${realtor.firstName} ${realtor.lastName}`,
      userId: user.id,
      realtorId: realtor.id,
    });

    return { user: toPublicUser(user), token: signAuthToken(user) };
  }
}
