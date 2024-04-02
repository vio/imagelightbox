import "./ImageView.css";

import { getContainer } from "./container";
import { TransitionDirection } from "./TransitionDirection";
import type { VideoCache } from "./VideoCache";

export interface ImageView {
  addToDOM(
    transitionDirection: TransitionDirection,
    callback: () => void,
  ): void;
  startLoading(onload: () => void, onerror: () => void): void;
  transitionIn(
    callback: () => void,
    previousImage: () => void,
    nextImage: () => void,
    closeLightbox: () => void,
  ): void;
  transitionOut(
    transitionDirection: TransitionDirection,
    callback: () => void,
  ): void;
  removeFromDOM(): void;
}

export function ImageView(
  image: HTMLAnchorElement,
  options: ILBOptions,
  videoCache: VideoCache,
): ImageView {
  let swipeStart = 0;
  let swipeDiff = 0;
  let imageElement: HTMLImageElement | HTMLVideoElement =
    document.createElement("img");
  imageElement.setAttribute("id", "ilb-image");
  imageElement.setAttribute("src", image.getAttribute("href") ?? "");
  const containerElement = document.createElement("div");
  containerElement.classList.add("ilb-image-container");
  containerElement.appendChild(imageElement);
  let isVideoPreloaded: boolean | undefined = undefined;

  const isVideo = image.dataset.ilb2Video !== undefined;
  if (isVideo) {
    [imageElement, isVideoPreloaded] = videoCache.element(
      // TODO: Check this non-undefined assertion
      image.dataset.ilb2VideoId!,
    );
  }

  function onready(
    callback: () => void,
    previousImage: () => void,
    nextImage: () => void,
    closeLightbox: () => void,
  ): void {
    if (!isVideo) {
      (imageElement as HTMLImageElement).addEventListener("click", (e) => {
        e.stopPropagation();
        if (options.quitOnImgClick) {
          closeLightbox();
        }
        const xPosRelativeToImage =
          (e.pageX - imageElement.offsetLeft) / imageElement.width;
        if (xPosRelativeToImage <= 1 / 3) {
          previousImage();
        } else {
          nextImage();
        }
      });
    }
    imageElement.addEventListener("touchstart", (e) => {
      swipeStart = (e as TouchEvent).touches[0].pageX;
      imageElement.style.transitionProperty = "opacity";
    });
    imageElement.addEventListener("touchmove", (e) => {
      swipeDiff = (e as TouchEvent).touches[0].pageX - swipeStart;
      imageElement.style.left = swipeDiff.toString() + "px";
    });
    // TODO: Handle touch cancel - return image back to original position
    imageElement.addEventListener("touchend", (e) => {
      e.stopPropagation();
      imageElement.style.transitionProperty = "left, opacity";
      if (swipeDiff > 50) {
        previousImage();
        return false;
      }
      if (swipeDiff < -50) {
        nextImage();
        return false;
      }
      imageElement.style.left = "0";
      return true;
    });
    callback();
  }

  function addToDOM(
    transitionDirection: TransitionDirection,
    callback: () => void,
  ): void {
    getContainer().appendChild(containerElement);
    const maxSize = Math.abs(100 - options.gutter);
    imageElement.style.maxHeight = maxSize.toString() + "%";
    imageElement.style.maxWidth = maxSize.toString() + "%";
    imageElement.style.left = (-100 * transitionDirection).toString() + "px";
    imageElement.style.transition =
      "all ease " + options.animationSpeed.toString() + "ms";
    // TODO: Check later that this really works and the transition isn't discarded
    setTimeout(callback, 1);
  }

  function startLoading(onload: () => void, onerror: () => void): void {
    imageElement.addEventListener("error", onerror);
    if (isVideoPreloaded === true) {
      onload();
    } else {
      imageElement.addEventListener("load", onload);
      imageElement.addEventListener("loadedmetadata", onload);
    }
  }

  function transitionIn(
    callback: () => void,
    previousImage: () => void,
    nextImage: () => void,
    closeLightbox: () => void,
  ): void {
    imageElement.style.left = "0";
    imageElement.style.opacity = "1";
    setTimeout(() => {
      onready(callback, previousImage, nextImage, closeLightbox);
    }, options.animationSpeed);
  }

  function transitionOut(
    transitionDirection: TransitionDirection,
    callback: () => void,
  ): void {
    if (transitionDirection !== TransitionDirection.None) {
      const currentLeft = parseInt(imageElement.style.left, 10) || 0;
      imageElement.style.left =
        (currentLeft + 100 * transitionDirection).toString() + "px";
    }
    imageElement.style.opacity = "0";
    setTimeout(() => {
      callback();
    }, options.animationSpeed);
  }

  function removeFromDOM(): void {
    containerElement.remove();
  }

  return {
    addToDOM,
    startLoading,
    transitionIn,
    transitionOut,
    removeFromDOM,
  };
}
