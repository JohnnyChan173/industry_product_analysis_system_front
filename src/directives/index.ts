import { App } from "vue";
import { setupFocusDirective } from "./focus";
import { setupLoadingDirective } from "./loading";
import { setupPermissionDirective } from "./permission";

export function setupGlobDirectives(app: App) {
  setupLoadingDirective(app);
  setupFocusDirective(app);
  setupPermissionDirective(app);
}
