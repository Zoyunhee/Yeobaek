// Fallback for using MaterialIcons on Android and web.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { SymbolWeight, SymbolViewProps } from "expo-symbols";
import type { ComponentProps } from "react";
import type { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];
type IconMapping = Record<SymbolViewProps["name"], MaterialIconName>;

/**
 * SF Symbol name -> Material icon name
 * (iOS에선 SF Symbol, Android/web에선 MaterialIcons로 매핑)
 */
const MAPPING = {
  // tabs
  "house.fill": "home",
  book: "menu-book",
  "book.fill": "menu-book",
  person: "person",
  "person.fill": "person",

  // navigation / actions
  "chevron.left": "chevron-left",
  ellipsis: "more-horiz",
  magnifyingglass: "search",
  clock: "schedule",
  "chevron.down": "keyboard-arrow-down",
  xmark: "close",

  // library tabs
  heart: "favorite-border",
  "heart.fill": "favorite",
  "bubble.left": "chat-bubble-outline",
  "bubble.left.fill": "chat-bubble",

  // keep old ones (template)
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
} as IconMapping;

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
                             name,
                             size = 24,
                             color,
                             style,
                           }: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}