import { WidgetType } from "@codemirror/view";

export class MarkWidget extends WidgetType {
  constructor(readonly mark: string) {
    super();
  }

  eq(other: MarkWidget) {
    return other.mark === this.mark;
  }

  toDOM() {
    const mark = document.createElement("span");
    mark.className = "obsidian-quick-jump-plugin__mark";
    mark.innerText = this.mark;

    const wrapper = document.createElement("div");
    wrapper.style.display = "inline-block";
    wrapper.style.position = "relative";
    wrapper.append(mark);

    return wrapper;
  }

  ignoreEvent() {
    return false;
  }
}
