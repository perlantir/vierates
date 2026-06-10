type LogPrimitive = string | number | boolean | null;
type LogValue = LogPrimitive | LogValue[] | { [key: string]: LogValue };

const redacted = "[REDACTED]";
const sensitiveKeys = new Set([
  "name",
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "streetAddress",
]);

export function redactText(value: string): string {
  return value
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, redacted)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, redacted)
    .replace(/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}\b/g, redacted)
    .replace(
      /\b\d{1,6}\s+[A-Za-z0-9.' -]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct)\b/gi,
      redacted,
    );
}

export function redactLogValue(value: LogValue): LogValue {
  if (typeof value === "string") {
    return redactText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactLogValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitiveKeys.has(key) ? redacted : redactLogValue(entry),
      ]),
    );
  }

  return value;
}

export const logger = {
  info(message: string, meta?: LogValue) {
    console.info(redactText(message), meta ? redactLogValue(meta) : undefined);
  },
  warn(message: string, meta?: LogValue) {
    console.warn(redactText(message), meta ? redactLogValue(meta) : undefined);
  },
  error(message: string, meta?: LogValue) {
    console.error(redactText(message), meta ? redactLogValue(meta) : undefined);
  },
};
