import { Plugin } from "obsidian";
import { AppHelper } from "./app-helper";

import { ViewPlugin } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { createViewPluginClass, MarkPlugin } from "./plugins/MarkPlugin";

export default class QuickJumpPlugin extends Plugin {
  extensions: Extension[];

  async onload() {
    const appHelper = new AppHelper(this.app);
    const markPlugin = new MarkPlugin(appHelper);
    const markViewPlugin = ViewPlugin.fromClass(
      createViewPluginClass(markPlugin),
      {
        decorations: (v) => v.decorations,
      }
    );

    this.addCommand({
      id: "quick-jump",
      name: "Quick Jump",
      checkCallback: (checking: boolean) => {
        const markdownView = appHelper.getMarkdownViewInActiveLeaf();

        if (markdownView?.getMode() === "source") {
          if (!checking) {
            this.extensions = [markViewPlugin];
            this.registerEditorExtension(this.extensions);

            const clean = () => {
              this.app.scope.unregister(escHandler);
              handlers.forEach((x) => {
                this.app.scope.unregister(x);
              });
              this.extensions.remove(markViewPlugin);
              this.app.workspace.updateOptions();
            };

            const escHandler = this.app.scope.register([], "Escape", () => {
              clean();
            });
            const handlers = markPlugin.marks.map((x) =>
              this.app.scope.register([], x.char, () => {
                clean();
                appHelper.openMarkdownFileByPath(
                  appHelper.linkText2Path(x.link),
                  false
                );
              })
            );

            console.log(markPlugin.marks);

            if (markPlugin.marks.length === 0) {
              clean();
            }
          }
          return true;
        }
      },
    });
  }

  onunload() {}
}
