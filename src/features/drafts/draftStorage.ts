export function generateDraftId(): string {
  return `draft_${crypto.randomUUID()}`;
}
