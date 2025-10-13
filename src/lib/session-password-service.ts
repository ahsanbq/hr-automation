import bcrypt from "bcryptjs";

/**
 * Service for managing MCQ session passwords with bcrypt encryption
 * Follows industry best practices for password security
 */
export class SessionPasswordService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly PASSWORD_LENGTH = 8;
  private static readonly CHARACTER_SET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  /**
   * Generate a secure random session password
   * @returns 8-character alphanumeric password
   */
  static generatePassword(): string {
    let password = "";
    for (let i = 0; i < this.PASSWORD_LENGTH; i++) {
      password += this.CHARACTER_SET.charAt(
        Math.floor(Math.random() * this.CHARACTER_SET.length)
      );
    }
    return password;
  }

  /**
   * Hash a password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   * @param password Plain text password to verify
   * @param hash Stored hash to compare against
   * @returns True if password matches hash
   */
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate and hash a session password in one operation
   * @returns Object containing both plain and hashed password
   */
  static async generateHashedPassword(): Promise<{
    plainPassword: string;
    hashedPassword: string;
  }> {
    const plainPassword = this.generatePassword();
    const hashedPassword = await this.hashPassword(plainPassword);

    return {
      plainPassword,
      hashedPassword,
    };
  }
}
