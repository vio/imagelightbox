import "./imagelightbox.css";

import $ from "jquery";

import {
  addActivityIndicatorToDOM,
  removeActivityIndicatorFromDOM,
} from "./activity-indicator";
import { addArrowsToDOM, showArrows } from "./arrows";
import { addCloseButtonToDOM } from "./close-button";
import {
  addImageViewToDOM,
  removeImageViewFromDOM,
  startLoadingImageView,
  transitionInImageView,
  transitionOutImageView,
} from "./image-view";
import type { PreloadedVideo } from "./interfaces/PreloadedVideo";
import type { VideoOptions } from "./interfaces/VideoOptions";
import { addNavigationToDOM } from "./navigation";
import { addQueryField, getQueryField, removeQueryField } from "./query";
import { State } from "./State";
import { TransitionDirection } from "./TransitionDirection";

// COMPONENTS //
const $wrapper = $("<div/>", {
  class: "imagelightbox-wrapper",
});

function cssTransitionTranslateX(
  element: JQuery,
  positionX: string,
  speed: number,
): void {
  element.css({
    transform: "translateX(" + positionX + ") translateY(-50%)",
    transition: "transform " + speed.toString() + "s ease-in",
  });
}

const hasTouch = "ontouchstart" in window,
  hasPointers = "PointerEvent" in window,
  wasTouched = (event: PointerEvent): boolean => {
    if (hasTouch) {
      return true;
    }

    if (!hasPointers || typeof event.pointerType === "undefined") {
      return false;
    }

    if (event.pointerType !== "mouse") {
      return true;
    }

    return false;
  },
  legacyDocument = document as LegacyDocument,
  hasFullscreenSupport: boolean =
    legacyDocument.fullscreenEnabled ||
    (legacyDocument.webkitFullscreenEnabled ?? false);

$.fn.imageLightbox = function (opts?: Partial<ILBOptions>): JQuery {
  const options: ILBOptions = $.extend(
    {
      allowedTypes: "png|jpg|jpeg|gif",
      animationSpeed: 250,
      activity: false,
      arrows: false,
      button: false,
      caption: false,
      enableKeyboard: true,
      history: false,
      fullscreen: false,
      gutter: 10, // percentage of client height
      navigation: false,
      overlay: false,
      preloadNext: true,
      quitOnEnd: false,
      quitOnImgClick: false,
      quitOnDocClick: true,
      quitOnEscKey: true,
    },
    opts,
  );
  const state = new State(
    options,
    $(this).data("imagelightbox") as string,
    $(this),
  );
  let image = $(); // The open image element or $() if the imagelightbox is closed
  let inProgress = false; // Whether a transition is in progress
  let swipeDiff = 0; // If dragging by touch, this is the difference between the X positions of the touch start and toudh end
  let target = $(); // targets.eq(targetIndex)
  let targetIndex = -1; // The index of the currently open image in its set (targets). -1 if the lightbox isn't open
  let targets: JQuery = $([]); // Clickable images
  const videos: Array<PreloadedVideo> = [], // Videos preloaded in the background
    _pushQuitToHistory = (): void => {
      if (!options.history) {
        return;
      }
      let newQuery = removeQueryField(
        document.location.search,
        "imageLightboxIndex",
      );
      newQuery = removeQueryField(newQuery, "imageLightboxSet");
      window.history.pushState({}, "", document.location.pathname + newQuery);
    },
    _removeImage = (): void => {
      removeImageViewFromDOM(image);
    },
    _quitImageLightbox = (noHistory = false): void => {
      state.closeLightbox();
      targetIndex = -1;
      if (!noHistory) {
        _pushQuitToHistory();
      }
      $wrapper.trigger("quit.ilb2");
      $("body").removeClass("ilb-open");
      transitionOutImageView(image, TransitionDirection.None, options, () => {
        _removeImage();
        inProgress = false;
        $wrapper.remove().find("*").remove();
      });
    },
    _pushToHistory = (): void => {
      if (!options.history) {
        return;
      }
      const newIndex =
        targets[targetIndex].dataset.ilb2Id ?? targetIndex.toString();
      const newState = {
        imageLightboxIndex: newIndex,
        imageLightboxSet: "",
      };
      const set = targets[targetIndex].dataset.imagelightbox;
      let newQuery = addQueryField(
        document.location.search,
        "imageLightboxIndex",
        newIndex,
      );
      if (set !== undefined) {
        newState.imageLightboxSet = set;
        newQuery = addQueryField(newQuery, "imageLightboxSet", set);
      }
      window.history.pushState(
        newState,
        "",
        document.location.pathname + newQuery,
      );
    },
    _onLoadStart = (): void => {
      if (options.activity) {
        addActivityIndicatorToDOM($wrapper);
      }
    },
    _onLoadEnd = (): void => {
      if (options.activity) {
        removeActivityIndicatorFromDOM();
      }
      if (options.arrows) {
        showArrows();
      }
    },
    _previousTarget = (): void => {
      state.previousImage();
      if (inProgress) {
        return;
      }

      targetIndex--;
      if (targetIndex < 0) {
        if (options.quitOnEnd) {
          _quitImageLightbox();
          return;
        } else {
          targetIndex = targets.length - 1;
        }
      }
      target = targets.eq(targetIndex);
      _pushToHistory();
      $wrapper.trigger("previous.ilb2", target);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Cyclical dependency
      _loadImage(TransitionDirection.Left);
    },
    _nextTarget = (): void => {
      state.nextImage();
      if (inProgress) {
        return;
      }

      targetIndex++;
      if (targetIndex >= targets.length) {
        if (options.quitOnEnd) {
          _quitImageLightbox();
          return;
        } else {
          targetIndex = 0;
        }
      }
      _pushToHistory();
      target = targets.eq(targetIndex);
      $wrapper.trigger("next.ilb2", target);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Cyclical dependency
      _loadImage(TransitionDirection.Right);
    },
    _loadImage = (direction: TransitionDirection): void => {
      if (inProgress) {
        return;
      }

      if (image.length) {
        transitionOutImageView(
          image,
          direction,
          options,
          () => {
            _removeImage();
          },
          swipeDiff,
        );
        swipeDiff = 0;
      }

      inProgress = true;
      _onLoadStart();

      setTimeout((): void => {
        let swipeStart = 0;
        let swipeEnd = 0;
        const imgPath = target.attr("href");

        // if (imgPath === undefined) {
        //     imgPath = target.attr('data-lightbox');
        // }

        const videoOptions = target.data("ilb2Video") as
          | VideoOptions
          | undefined;
        let element = $();
        let preloadedVideo: boolean | undefined = undefined;
        if (videoOptions) {
          $.each(videos, (_, video): void => {
            if (video.i === target.data("ilb2VideoId")) {
              preloadedVideo = video.l;
              element = video.e;
              if (video.a !== undefined) {
                if (preloadedVideo) {
                  void (element.get(0) as HTMLVideoElement).play();
                } else {
                  element.attr("autoplay", video.a);
                }
              }
            }
          });
        } else {
          element = $('<img id="ilb-image" />').attr("src", imgPath!);
        }
        function onload(): void {
          addImageViewToDOM(
            image,
            $wrapper,
            options,
            () => videos,
            () => {
              transitionInImageView(image, direction, options, () => {
                inProgress = false;
                _onLoadEnd();
              });
              if (options.preloadNext) {
                let nextTarget = targets.eq(targets.index(target) + 1);
                if (!nextTarget.length) {
                  nextTarget = targets.eq(0);
                }
                $("<img />").attr("src", nextTarget.attr("href")!);
              }
              $wrapper.trigger("loaded.ilb2");
            },
          );
        }
        function onclick(e: BaseJQueryEventObject): void {
          e.preventDefault();
          if (options.quitOnImgClick) {
            _quitImageLightbox();
            return;
          }
          if (wasTouched(e.originalEvent as PointerEvent)) {
            return;
          }
          const posX =
            (e.pageX || (e.originalEvent as PointerEvent).pageX) -
            (e.target as HTMLImageElement).offsetLeft;
          if ((e.target as HTMLImageElement).width / 3 > posX) {
            _previousTarget();
          } else {
            _nextTarget();
          }
        }
        image = element
          .on("error.ilb7", (): void => {
            _onLoadEnd();
          })
          .on(
            "touchstart.ilb7 pointerdown.ilb7 MSPointerDown.ilb7",
            (e: BaseJQueryEventObject): void => {
              if (
                !wasTouched(e.originalEvent as PointerEvent) ||
                options.quitOnImgClick
              ) {
                return;
              }
              swipeStart =
                (e.originalEvent as PointerEvent).pageX ||
                (e.originalEvent as TouchEvent).touches[0].pageX;
            },
          )
          .on(
            "touchmove.ilb7 pointermove.ilb7 MSPointerMove.ilb7",
            (e: BaseJQueryEventObject): void => {
              if (
                (!hasPointers && e.type === "pointermove") ||
                !wasTouched(e.originalEvent as PointerEvent) ||
                options.quitOnImgClick
              ) {
                return;
              }
              e.preventDefault();
              swipeEnd =
                (e.originalEvent as PointerEvent).pageX ||
                (e.originalEvent as TouchEvent).touches[0].pageX;
              swipeDiff = swipeStart - swipeEnd;
              cssTransitionTranslateX(image, (-swipeDiff).toString() + "px", 0);
            },
          )
          .on(
            "touchend.ilb7 touchcancel.ilb7 pointerup.ilb7 pointercancel.ilb7 MSPointerUp.ilb7 MSPointerCancel.ilb7",
            (e): void => {
              if (
                !wasTouched(e.originalEvent as PointerEvent) ||
                options.quitOnImgClick
              ) {
                return;
              }
              if (Math.abs(swipeDiff) > 50) {
                if (swipeDiff < 0) {
                  _previousTarget();
                } else {
                  _nextTarget();
                }
              } else {
                cssTransitionTranslateX(
                  image,
                  "0px",
                  options.animationSpeed / 1000,
                );
              }
            },
          );
        startLoadingImageView(image, onload);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Rule cannot handle loops
        if (preloadedVideo === true) {
          onload();
        }
        if (!videoOptions) {
          image = image.on(
            hasPointers ? "pointerup.ilb7 MSPointerUp.ilb7" : "click.ilb7",
            onclick,
          );
        }
      }, options.animationSpeed + 100);
    },
    _onStart = (): void => {
      if (options.arrows) {
        addArrowsToDOM($wrapper, _previousTarget, _nextTarget);
      }
      if (options.navigation) {
        addNavigationToDOM(
          $wrapper,
          () => targets,
          () => targets.index(target),
          (newTarget: JQuery, direction: TransitionDirection) => {
            target = newTarget;
            _loadImage(direction);
          },
        );
      }
      if (options.button) {
        addCloseButtonToDOM($wrapper, _quitImageLightbox);
      }
    },
    _openImageLightbox = ($target: JQuery, noHistory: boolean): void => {
      state.openLightboxWithImage($target, $wrapper);
      if (inProgress) {
        return;
      }
      inProgress = false;
      target = $target;
      targetIndex = targets.index(target);
      if (!noHistory) {
        _pushToHistory();
      }
      _onStart();
      $("body").append($wrapper).addClass("ilb-open");
      $wrapper.trigger("start.ilb2", $target);
      _loadImage(TransitionDirection.None);
    },
    _openHistory = (): void => {
      if (!options.history) {
        return;
      }
      const id = getQueryField("imageLightboxIndex");
      if (id === undefined) {
        return;
      }
      let element = targets.filter('[data-ilb2-id="' + id + '"]');
      if (element.length > 0) {
        state.openLightboxWithImage(element, $wrapper);
        targetIndex = targets.index(element);
      } else {
        state.openLightbox(parseInt(id), $wrapper);
        targetIndex = parseInt(id);
        element = $(targets[targetIndex]);
      }
      const set = getQueryField("imageLightboxSet");
      if (
        element.length === 0 ||
        (set !== undefined && set !== element[0].dataset.imagelightbox)
      ) {
        return;
      }
      _openImageLightbox(element, true);
    },
    _popHistory = (event: BaseJQueryEventObject): void => {
      const newState = (event.originalEvent as PopStateEvent).state as
        | { imageLightboxIndex?: string; imageLightboxSet?: string }
        | undefined;
      if (!newState) {
        _quitImageLightbox(true);
        return;
      }
      const newId = newState.imageLightboxIndex;
      if (newId === undefined) {
        _quitImageLightbox(true);
        return;
      }
      if (newState.imageLightboxSet !== state.getSet()) {
        return;
      }
      let element = targets.filter('[data-ilb2-id="' + newId + '"]');
      if (element.length === 0) {
        const rawElement = targets.get(parseInt(newId));
        if (rawElement === undefined) {
          return;
        }
        element = $(rawElement);
      }
      if (targetIndex < 0) {
        _openImageLightbox(element, true);
        return;
      }
      const newIndex = targets.index(element);
      let direction = TransitionDirection.Left;
      if (newIndex > targetIndex) {
        direction = TransitionDirection.Right;
      }
      target = element;
      state.changeImage(newIndex);
      targetIndex = newIndex;
      _loadImage(direction);
    },
    isTargetValid = (element: JQuery): boolean =>
      (($(element).prop("tagName") as string).toLowerCase() === "a" &&
        new RegExp(".(" + options.allowedTypes + ")$", "i").test(
          $(element).attr("href")!,
        )) ||
      $(element).data("ilb2Video") !== undefined,
    _addTargets = function (newTargets: JQuery): void {
      function filterTargets(): void {
        newTargets
          .filter(function (): boolean {
            return isTargetValid($(this));
          })
          .each(function (): void {
            targets = targets.add($(this));
          });
      }
      newTargets.each(function (): void {
        targets = newTargets.add($(this));
      });
      newTargets.on("click.ilb7", function (e): void {
        e.preventDefault();
        filterTargets();
        if (targets.length < 1) {
          _quitImageLightbox();
        } else {
          _openImageLightbox($(this), false);
        }
      });
    },
    _preloadVideos = function (elements: JQuery): void {
      elements.each(function () {
        const videoOptions = $(this).data("ilb2Video") as
          | VideoOptions
          | undefined;
        if (videoOptions) {
          let id = $(this).data("ilb2Id") as string;
          if (!id) {
            // Random id
            id = "a" + (((1 + Math.random()) * 0x10000) | 0).toString(16);
          }
          $(this).data("ilb2VideoId", id);
          const container: PreloadedVideo = {
            e: $(
              "<video id='ilb-image' preload='metadata' data-ilb2-video-id='" +
                id +
                "'>",
            ),
            i: id,
            l: false,
            a: undefined,
            h: undefined,
            w: undefined,
          };
          $.each(videoOptions, (key: string, value): void => {
            switch (key) {
              case "autoplay":
                container.a = value as string;
                break;
              case "height":
                container.h = value as number;
                break;
              case "sources":
                break;
              case "width":
                container.w = value as number;
                break;
              default:
                // TODO: Remove this general behaviour
                container.e = container.e.attr(key, value as number | string);
            }
          });
          if (videoOptions.sources) {
            $.each(videoOptions.sources, (_, source): void => {
              let sourceElement = $("<source>");
              $.each(source, (key: string, value): void => {
                // TODO: Remove this general behaviour
                sourceElement = sourceElement.attr(key, value!);
              });
              container.e.append(sourceElement);
            });
          }
          container.e.on("loadedmetadata.ilb7", (): void => {
            container.l = true;
          });
          videos.push(container);
        }
      });
    };

  if (options.history) {
    $(window).on("popstate", _popHistory);
  }

  function toggleFullScreen(): void {
    const doc = window.document as LegacyDocument;
    const docEl = document.getElementById("ilb-image")!
      .parentElement as LegacyHTMLElement;

    /* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/unbound-method -- Polyfills for very old browsers */
    const requestFullScreen =
      docEl.requestFullscreen || docEl.webkitRequestFullScreen;
    const exitFullScreen = doc.exitFullscreen || doc.webkitExitFullscreen;
    /* eslint-enable */

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      void requestFullScreen.call(docEl);
    } else {
      void exitFullScreen.call(doc);
    }
  }

  $((): void => {
    if (options.quitOnDocClick) {
      $(document).on(hasTouch ? "touchend.ilb7" : "click.ilb7", (e): void => {
        if (image.length && !$(e.target).is(image)) {
          e.preventDefault();
          _quitImageLightbox();
        }
      });
    }

    if (options.fullscreen && hasFullscreenSupport) {
      $(document).on("keydown.ilb7", (e): void => {
        if (!image.length) {
          return;
        }
        if ([9, 32, 38, 40].includes(e.which!)) {
          e.stopPropagation();
          e.preventDefault();
        }
        if ([13].includes(e.which!)) {
          e.stopPropagation();
          e.preventDefault();
          toggleFullScreen();
        }
      });
    }

    if (options.enableKeyboard) {
      $(document).on("keydown.ilb7", (e): void => {
        if (!image.length) {
          return;
        }
        if ([27].includes(e.which!) && options.quitOnEscKey) {
          e.stopPropagation();
          e.preventDefault();
          _quitImageLightbox();
        }
        if ([37].includes(e.which!)) {
          e.stopPropagation();
          e.preventDefault();
          _previousTarget();
        }
        if ([39].includes(e.which!)) {
          e.stopPropagation();
          e.preventDefault();
          _nextTarget();
        }
      });
    }
  });

  _addTargets($(this));

  _openHistory();

  _preloadVideos(targets);

  this.addToImageLightbox = (elements: JQuery): void => {
    state.addImages(elements);
    _addTargets(elements);
    _preloadVideos(elements);
  };

  this.openHistory = (): void => {
    _openHistory();
  };

  this.loadPreviousImage = (): void => {
    _previousTarget();
  };

  this.loadNextImage = (): void => {
    _nextTarget();
  };

  this.quitImageLightbox = function (): JQuery {
    _quitImageLightbox();
    return this;
  };

  this.startImageLightbox = function (element?: JQuery): void {
    if (element) {
      element.trigger("click.ilb7");
    } else {
      $(this).trigger("click.ilb7");
    }
  };

  return this;
};
