import { debounce, KeymapEventHandler, Plugin } from "obsidian";
import { AppHelper } from "./app-helper";

import { ViewPlugin } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { createViewPluginClass, Mark, MarkPlugin } from "./plugins/MarkPlugin";

export default class QuickJumpPlugin extends Plugin {
  extensions: Extension[];
  keymapHandlers: KeymapEventHandler[];
  appHelper: AppHelper;
  markPlugin: MarkPlugin;

  async onload() {
    this.appHelper = new AppHelper(this.app);
    this.markPlugin = new MarkPlugin(this.appHelper);
    const markViewPlugin = ViewPlugin.fromClass(
      createViewPluginClass(this.markPlugin),
      {
        decorations: (v) => v.decorations,
      }
    );

    this.addCommand({
      id: "quick-jump",
      name: "Quick Jump",
      checkCallback: (checking: boolean) => {
        const markdownView = this.appHelper.getMarkdownViewInActiveLeaf();
        const handle = () => {
          this.keymapHandlers = [
            this.app.scope.register([], "Escape", () => {
              this.clean();
              return false;
            }),
            ...this.markPlugin.marks.flatMap((m) =>
              Array.from(this.mark2Handlers(m))
            ),
          ];

          if (this.markPlugin.marks.length === 0) {
            this.clean();
          }
        };
        // Avoid conflict
        const debounceHandle = debounce(handle, 50);

        if (markdownView?.getMode() === "source") {
          if (!checking && !this.markPlugin.visible) {
            this.extensions = [markViewPlugin];
            this.registerEditorExtension(this.extensions);
            debounceHandle();
          }

          return true;
        }
      },
    });
  }

  onunload() {}

  clean() {
    this.markPlugin.clean();
    this.keymapHandlers.forEach((x) => {
      this.app.scope.unregister(x);
    });
    this.extensions.remove(this.extensions[0]);
    this.app.workspace.updateOptions();
  }

  *mark2Handlers(mark: Mark): Generator<KeymapEventHandler> {
    yield this.app.scope.register([], mark.char, () => {
      this.clean();
      switch (mark.type) {
        case "internal":
          this.appHelper.openMarkdownFileByPath(
            this.appHelper.linkText2Path(mark.link),
            false
          );
          break;
        case "external":
          window.open(mark.link);
          break;
      }
      return false;
    });
    yield this.app.scope.register(["Shift"], mark.char, () => {
      this.clean();
      switch (mark.type) {
        case "internal":
          this.appHelper.openMarkdownFileByPath(
            this.appHelper.linkText2Path(mark.link),
            true
          );
          break;
        case "external":
          window.open(mark.link);
          break;
      }
      return false;
    });
  }
}
