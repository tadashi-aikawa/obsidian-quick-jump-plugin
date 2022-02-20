import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { MarkWidget } from "../widgets/MarkWidget";
import { AppHelper } from "../app-helper";

interface Mark {
  char: string;
  offset: number;
  link: string;
}

export class MarkPlugin {
  marks: Mark[] = [];
  constructor(public appHelper: AppHelper) {}

  createMarks(view: EditorView): DecorationSet {
    const CHARS = "asdfghjklqwertyuiopzxcvbnm";
    this.marks = [];

    const links = this.appHelper.getCurrentFileLinks();
    const { from, to } = view.viewport;

    this.marks = links
      .filter(
        (x) => x.position.start.offset >= from && x.position.start.offset < to
      )
      .map((x, i) => ({
        char: CHARS[i],
        offset: x.position.start.offset,
        link: x.link,
      }));

    const widgets = this.marks.map((x) =>
      Decoration.widget({
        widget: new MarkWidget(x.char),
        side: 1,
      }).range(x.offset)
    );

    return Decoration.set(widgets);
  }
}

export function createViewPluginClass(markPlugin: MarkPlugin) {
  return class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = markPlugin.createMarks(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = markPlugin.createMarks(update.view);
      }
    }
  };
}
