import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from "node:crypto";

const cipherVersion = "v1";
const ivLength = 12;
const tagLength = 16;

type IdentityField = "email" | "firstName" | "lastName" | "phone";

type BorrowerIdentityPlaintext = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type BorrowerIdentityVaultData = {
  emailEncrypted: string;
  firstNameEncrypted: string;
  lastNameEncrypted: string;
  phoneEncrypted: string;
  phoneHash: string;
};

export function borrowerIdentityVaultData(
  input: BorrowerIdentityPlaintext,
): BorrowerIdentityVaultData {
  return {
    emailEncrypted: encryptBorrowerIdentityField("email", input.email),
    firstNameEncrypted: encryptBorrowerIdentityField(
      "firstName",
      input.firstName,
    ),
    lastNameEncrypted: encryptBorrowerIdentityField("lastName", input.lastName),
    phoneEncrypted: encryptBorrowerIdentityField("phone", input.phone),
    phoneHash: borrowerPhoneHash(input.phone),
  };
}

export function borrowerPhoneHash(phone: string): string {
  return createHmac("sha256", identityIndexKey())
    .update(normalizePhone(phone))
    .digest("hex");
}

export function sensitiveBlindIndex(scope: string, value: string): string {
  return createHmac("sha256", identityIndexKey())
    .update(`${scope}:${value}`)
    .digest("hex");
}

export function decryptBorrowerIdentityField(
  field: IdentityField,
  ciphertext: string,
): string {
  const [version, ivValue, tagValue, encryptedValue] = ciphertext.split(":");

  if (version !== cipherVersion || !ivValue || !tagValue || !encryptedValue) {
    throw new Error(`Invalid encrypted borrower identity ${field} value.`);
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    identityEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
    {
      authTagLength: tagLength,
    },
  );
  decipher.setAAD(Buffer.from(field));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function encryptBorrowerIdentityField(
  field: IdentityField,
  plaintext: string,
): string {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv("aes-256-gcm", identityEncryptionKey(), iv, {
    authTagLength: tagLength,
  });
  cipher.setAAD(Buffer.from(field));

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return [
    cipherVersion,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

function identityEncryptionKey(): Buffer {
  return deriveIdentitySubkey("borrower-identity-encryption");
}

function identityIndexKey(): Buffer {
  return deriveIdentitySubkey("borrower-identity-index");
}

function deriveIdentitySubkey(info: string): Buffer {
  return Buffer.from(
    hkdfSync("sha256", decodeIdentityKey(), Buffer.alloc(0), info, 32),
  );
}

function decodeIdentityKey(): Buffer {
  const value = process.env.BORROWER_IDENTITY_KEY;

  if (!value) {
    throw new Error("BORROWER_IDENTITY_KEY is required.");
  }

  if (/^[a-f0-9]{64}$/i.test(value)) {
    return Buffer.from(value, "hex");
  }

  if (!/^[A-Za-z0-9+/=_-]+$/.test(value)) {
    throw new Error("BORROWER_IDENTITY_KEY must be base64 or hex.");
  }

  const decoded = Buffer.from(value, "base64");

  if (decoded.length < 32) {
    throw new Error("BORROWER_IDENTITY_KEY must decode to at least 32 bytes.");
  }

  return decoded;
}
