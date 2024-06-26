import { openHistory } from "./history";
import { State } from "./State";

export class ImageLightbox {
  private readonly s: State;

  public constructor(
    images:
      | Array<HTMLAnchorElement>
      | HTMLCollectionOf<HTMLAnchorElement>
      | NodeListOf<HTMLAnchorElement>,
    options?: Partial<ILBOptions>,
  ) {
    const opts: ILBOptions = {
      activity: false,
      allowedTypes: "png|jpg|jpeg|gif",
      animationSpeed: 250,
      arrows: false,
      button: false,
      caption: false,
      enableKeyboard: true,
      history: false,
      fullscreen: false,
      gutter: 10,
      navigation: false,
      overlay: false,
      preloadNext: true,
      quitOnEnd: false,
      quitOnImgClick: false,
      quitOnDocClick: true,
      quitOnEscKey: true,
      ...options,
    };
    this.s = State(
      opts,
      images.length > 0 ? images[0].dataset.imagelightbox ?? "" : "",
      Array.from(images),
    );

    if (opts.history) {
      this.openHistory();
    }
  }

  public addImages(
    images:
      | Array<HTMLAnchorElement>
      | HTMLCollectionOf<HTMLAnchorElement>
      | NodeListOf<HTMLAnchorElement>,
  ): void {
    this.s.addImages(Array.from(images));
  }

  public open(image?: HTMLAnchorElement): void {
    if (image !== undefined) {
      this.s.openWithImage(image);
    } else {
      this.s.open(0);
    }
  }

  public previous(): void {
    this.s.previous();
  }

  public next(): void {
    this.s.next();
  }

  public close(): void {
    this.s.close();
  }

  public openHistory(): void {
    openHistory(
      this.s.set(),
      this.s.images(),
      (index: number, skipHistory?: boolean) => {
        this.s.open(index, skipHistory);
      },
    );
  }
}
