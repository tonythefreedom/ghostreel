// Lane B. Google Identity Services, the script that draws "Continue with Google" for CineSynth's client id.
// Kept in the adapter so pages name no outside host.
export const GIS_SRC = "https://accounts.google.com/gsi/client?hl=en"; // English button, whatever the browser's language

export interface GoogleId {
  initialize(options: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: "popup" }): void;
  renderButton(el: HTMLElement, options: Record<string, string | number>): void;
}
