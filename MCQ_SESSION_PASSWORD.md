## MCQ Session Password: Hashing and Candidate Portal Workflow

### Overview

This document describes how MCQ session passwords are generated, hashed, stored, emailed to candidates, and later verified when a candidate submits answers in the exam portal.

### Involved Files

- `src/lib/session-password-service.ts`
- `src/pages/api/interview/send-mcq-to-candidate.ts`
- `src/pages/api/interview/send-mcq-simple.ts`
- `src/pages/api/interview/send-test.ts`
- `src/pages/api/interview/submit/[attemptId].ts`
- `prisma/schema.prisma` (model fields)
- `src/lib/email.ts` (email content helper)

### Data Model (Prisma)

Interview stores both a legacy plain password (for email display/backward compatibility) and a secure hash for validation.

```26:33:prisma/schema.prisma
  sessionPassword    String?        // Keep for backward compatibility and email display
  sessionPasswordHash String?       // New bcrypt hashed password for validation
```

### Core Service

`src/lib/session-password-service.ts` encapsulates password generation and hashing (bcryptjs, 12 salt rounds):

```28:35:src/lib/session-password-service.ts
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }
```

```49:65:src/lib/session-password-service.ts
  static async generateHashedPassword(): Promise<{
    plainPassword: string;
    hashedPassword: string;
  }> {
    const plainPassword = this.generatePassword();
    const hashedPassword = await this.hashPassword(plainPassword);
    return { plainPassword, hashedPassword };
  }
```

### Generation and Storage (Sending MCQ)

When an MCQ is sent to a candidate, we generate a password and store both plain and hashed versions in the `Interview` record.

```235:246:src/pages/api/interview/send-mcq-to-candidate.ts
    const { plainPassword, hashedPassword } =
      await SessionPasswordService.generateHashedPassword();

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        candidateEmail,
        sessionPassword: plainPassword, // for email display
        sessionPasswordHash: hashedPassword, // for validation
      },
    });
```

The same pattern exists in:

- `src/pages/api/interview/send-mcq-simple.ts`
- `src/pages/api/interview/send-test.ts`

### Emailing the Candidate

The plain session password is included in the email so the candidate can log in:

- `src/lib/email.ts` → `sendMCQInvitation(...)`
- Email body examples in `send-mcq-test.ts` include `interview.sessionPassword` for the candidate.

### Verification on Submit (Candidate Portal)

When the candidate submits their answers, we verify the provided session password.

```67:76:src/pages/api/interview/submit/[attemptId].ts
    if (attempt.interview.sessionPasswordHash) {
      const isValidPassword = await SessionPasswordService.verifyPassword(
        sessionPassword,
        attempt.interview.sessionPasswordHash
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid session password" });
      }
    }
```

There is a legacy fallback to compare against `sessionPassword` if no hash is present.

### End-to-End Workflow

1. Generate password and hash using `SessionPasswordService.generateHashedPassword()`.
2. Store `sessionPassword` (plain, for email) and `sessionPasswordHash` (bcrypt hash) on the `Interview` record.
3. Email candidate with the test link and `sessionPassword`.
4. Candidate starts/attempts the test via the exam portal.
5. On submit, API verifies the provided password:
   - Prefer `sessionPasswordHash` via bcrypt compare.
   - Fallback to legacy plain `sessionPassword` if hash is absent.
6. If valid, submission proceeds; otherwise, `401 Invalid session password`.

### Security Notes

- Hashing uses `bcryptjs` with 12 salt rounds.
- Plain `sessionPassword` is kept only for display/backward compatibility; validation should use the hash whenever available.
- Consider removing the plain field once all legacy flows are migrated to hash-based validation.
