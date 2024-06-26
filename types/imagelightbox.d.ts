export class ImageLightbox {
  public constructor(
    images:
      | Array<HTMLAnchorElement>
      | HTMLCollectionOf<HTMLAnchorElement>
      | NodeListOf<HTMLAnchorElement>,
    options?: Partial<ILBOptions>,
  );
  public addImages(
    images:
      | Array<HTMLAnchorElement>
      | HTMLCollectionOf<HTMLAnchorElement>
      | NodeListOf<HTMLAnchorElement>,
  ): void;
  public open(image?: HTMLAnchorElement): void;
  public previous(): void;
  public next(): void;
  public close(): void;
  public openHistory(): void;
}
