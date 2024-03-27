import "./container.css";

import $ from "jquery";

const container = $("<div/>", {
  id: "ilb-container",
});

export function addContainerToDOM(
  attachOnclick: boolean,
  onclick: () => void,
): void {
  container.removeClass("ilb-overlay");
  $("body").addClass("ilb-body");
  $("body").append(container);
  if (attachOnclick) {
    container.on("click.ilb7 touchend.ilb7", (): boolean => {
      onclick();
      return false;
    });
  }
}

export function darkenOverlay(): void {
  container.addClass("ilb-overlay");
}

export function removeContainerFromDOM(): void {
  container.remove();
  container.empty();
  $("body").removeClass("ilb-body");
}

export function triggerContainerEvent(event: string, element?: JQuery): void {
  container.trigger(event, element);
}

export function getContainer(): JQuery {
  return container;
}
