export const INDEXED_DB_UNAVAILABLE_MESSAGE = "IndexedDB is not available in this browser.";

/**
 * Converts a raw IndexedDB failure into a message that is safe to show a user.
 * Browsers throw different exception shapes for the same underlying problem
 * (missing API, full quota, closed connection), so this centralizes the mapping
 * instead of leaking DOMException internals into the UI.
 */
export function describeStorageError(error: unknown): string {
  if (error instanceof Error && error.message === INDEXED_DB_UNAVAILABLE_MESSAGE) {
    return "Local storage isn't available in this browser (private browsing can block it). Your changes won't be saved.";
  }

  if (error instanceof DOMException) {
    if (error.name === "QuotaExceededError") {
      return "There isn't enough storage space left in this browser to save your changes.";
    }

    if (error.name === "InvalidStateError" || error.name === "NotFoundError") {
      return "Local storage is unavailable right now. Try reloading the page.";
    }
  }

  return "Something went wrong accessing local storage.";
}
