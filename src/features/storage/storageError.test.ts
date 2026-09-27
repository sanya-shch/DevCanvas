import { describe, expect, it } from "vitest";
import { INDEXED_DB_UNAVAILABLE_MESSAGE, describeStorageError } from "./storageError";

describe("describeStorageError", () => {
  it("gives a clear message when IndexedDB is unavailable", () => {
    const message = describeStorageError(new Error(INDEXED_DB_UNAVAILABLE_MESSAGE));

    expect(message).toMatch(/private browsing/i);
  });

  it("gives a clear message for quota exceeded errors", () => {
    const error = new DOMException("full", "QuotaExceededError");

    expect(describeStorageError(error)).toMatch(/enough storage space/i);
  });

  it("gives a clear message for a closed or missing database", () => {
    const invalidState = new DOMException("closed", "InvalidStateError");
    const notFound = new DOMException("missing", "NotFoundError");

    expect(describeStorageError(invalidState)).toMatch(/unavailable/i);
    expect(describeStorageError(notFound)).toMatch(/unavailable/i);
  });

  it("falls back to a generic message for anything else", () => {
    expect(describeStorageError(new Error("boom"))).toBe(
      "Something went wrong accessing local storage.",
    );
    expect(describeStorageError("not even an error")).toBe(
      "Something went wrong accessing local storage.",
    );
  });
});
