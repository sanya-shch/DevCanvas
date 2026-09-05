export function generateDiagramId(): string {
  return `diagram_${crypto.randomUUID()}`;
}
