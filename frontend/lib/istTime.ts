const IST_TIME_ZONE = "Asia/Kolkata" as const;

type DateInput = Date | string;

const toDate = (input: DateInput): Date => {
  if (input instanceof Date) return input;

  const raw = input;

  // If the backend sends an ISO string *without* timezone info (e.g. "2026-02-25T14:30:00"),
  // treat it as UTC by appending "Z" so that we can then reliably format it as IST.
  if (typeof raw === "string" && raw.includes("T") && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    return new Date(`${raw}Z`);
  }

  return new Date(raw);
};

export const formatISTDateTime = (input: DateInput): string => {
  const date = toDate(input);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const formatISTTime = (input: DateInput): string => {
  const date = toDate(input);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const formatISTShortDateTime = (input: DateInput): string => {
  const date = toDate(input);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

type DateParts = {
  year: number;
  month: number;
  day: number;
};

const getISTDateParts = (input: DateInput): DateParts => {
  const date = toDate(input);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};

  for (const part of parts) {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      partMap[part.type] = part.value;
    }
  }

  return {
    year: Number(partMap.year),
    month: Number(partMap.month),
    day: Number(partMap.day),
  };
};

export const isSameISTDay = (a: DateInput, b: DateInput): boolean => {
  const da = getISTDateParts(a);
  const db = getISTDateParts(b);

  return (
    da.year === db.year &&
    da.month === db.month &&
    da.day === db.day
  );
};

