import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewUpdate,
} from "@codemirror/view";
import { MarkWidget } from "../widgets/MarkWidget";
import { AppHelper } from "../app-helper";

type MarkType = "internal" | "external";
export interface Mark {
  type: MarkType;
  char: string;
  offset: number;
  link: string;
}

export class MarkPlugin {
  marks: Mark[] = [];
  constructor(public appHelper: AppHelper) {}

  clean() {
    this.marks = [];
  }

  get visible() {
    return this.marks.length > 0;
  }

  createMarks(view: EditorView): DecorationSet {
    const CHARS = "ASDFGHJKLQWERTYUIOPZXCVBNM,./\\:]@[1234567890-^";

    const { from, to } = view.viewport;

    const links = this.appHelper.getCurrentFileLinks();
    const internalLinkMarks = links
      .filter(
        (x) => x.position.start.offset >= from && x.position.start.offset < to
      )
      .map((x, i) => ({
        type: "internal" as MarkType,
        char: "",
        offset: x.position.start.offset,
        link: x.link,
      }));

    const contents = this.appHelper.getCurrentContentByOffsets(from, to);
    const urlsMatches = Array.from(
      contents.matchAll(/(?<= |\n|^|\()(https?:\/\/[^ )\n]+)/g)
    );
    const externalLinkMarks = urlsMatches.map((x, i) => ({
      type: "external" as MarkType,
      char: "",
      offset: x.index,
      link: x[0],
    }));

    this.marks = [...internalLinkMarks, ...externalLinkMarks]
      .sort((a, b) => a.offset - b.offset)
      .slice(0, CHARS.length)
      .map((x, i) => ({ ...x, char: CHARS[i] }));

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
      this.decorations = markPlugin.createMarks(update.view);
    }
  };
}
