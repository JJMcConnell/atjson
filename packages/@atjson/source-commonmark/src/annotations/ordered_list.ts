import { BlockAnnotation } from "@atjson/document";

export class OrderedList extends BlockAnnotation<{
  start: number;
  tight: boolean;
}> {
  static type = "ordered_list";
  static vendorPrefix = "commonmark";
}
