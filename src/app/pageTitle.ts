export const APP_NAME = "DevCanvas";

export function setDocumentTitle(title?: string) {
  document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
}
