import { connectDB } from "@/lib/mongodb";
import { signAuthToken, toPublicUser } from "@/lib/auth";
import { userRepository } from "@/repositories/UserRepository";
import { LogEntryService } from "@/services/LogEntryService";
import type { Locale } from "@/lib/i18n/locales";
import type { LoginCredentials, LoginResponse, User } from "@/lib/types";

export class AuthService {
  static async login({ email, password }: LoginCredentials): Promise<LoginResponse> {
    await connectDB();
    const normalizedEmail = email.trim().toLowerCase();

    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      await LogEntryService.warning({
        category: "Security",
        message: `Failed login attempt for ${normalizedEmail} (no such user)`,
      });
      throw new Error("Invalid credentials");
    }

    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      await LogEntryService.warning({
        category: "Security",
        message: `Failed login attempt for ${normalizedEmail} (wrong password)`,
        userId: user.id,
        realtorId: user.realtorId ? user.realtorId.toString() : null,
      });
      throw new Error("Invalid credentials");
    }

    await LogEntryService.info({
      category: "Security",
      message: `User ${user.email} logged in`,
      userId: user.id,
      realtorId: user.realtorId ? user.realtorId.toString() : null,
    });

    return { user: toPublicUser(user), token: signAuthToken(user) };
  }

  // Self-service password change (Profile page). Unlike login, the caller's identity is already
  // established via their session, so a specific "wrong current password" error is safe to
  // return here — there's no email-enumeration concern the way there is at login.
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await connectDB();

    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw new Error("User not found");

    const validPassword = await user.comparePassword(currentPassword);
    if (!validPassword) {
      await LogEntryService.warning({
        category: "Security",
        message: `Failed password change attempt for ${user.email} (wrong current password)`,
        userId: user.id,
        realtorId: user.realtorId ? user.realtorId.toString() : null,
      });
      throw new Error("Current password is incorrect");
    }

    await userRepository.updateWithPassword(userId, { password: newPassword });

    await LogEntryService.info({
      category: "Security",
      message: `User ${user.email} changed their password`,
      userId: user.id,
      realtorId: user.realtorId ? user.realtorId.toString() : null,
    });
  }

  // Self-service display-language change (Profile page) — plain field update via BaseRepository's
  // findByIdAndUpdate (no password involved, so updateWithPassword's .save() detour isn't needed).
  // Inherently self-scoped by construction (always the caller's own id via getCurrentUserId()),
  // same reasoning as changePassword above.
  static async updateLanguage(userId: string, language: Locale): Promise<User> {
    await connectDB();

    const user = await userRepository.update(userId, { language });
    if (!user) throw new Error("User not found");

    await LogEntryService.info({
      category: "Profile",
      message: `User ${user.email} changed their language to ${language}`,
      userId: user.id,
      realtorId: user.realtorId ? user.realtorId.toString() : null,
    });

    return toPublicUser(user);
  }

  // Self-service display-name change (Profile page) — same shape/scoping as updateLanguage above.
  // An empty string is a valid value (clears it back to falling back on email everywhere it's shown).
  static async updateDisplayName(userId: string, displayName: string): Promise<User> {
    await connectDB();

    const user = await userRepository.update(userId, { displayName });
    if (!user) throw new Error("User not found");

    await LogEntryService.info({
      category: "Profile",
      message: displayName
        ? `User ${user.email} changed their display name to ${displayName}`
        : `User ${user.email} cleared their display name`,
      userId: user.id,
      realtorId: user.realtorId ? user.realtorId.toString() : null,
    });

    return toPublicUser(user);
  }
}
