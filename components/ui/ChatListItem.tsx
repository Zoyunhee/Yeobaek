import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { COLORS } from "@/constants/colors";

type MetaItem = {
    icon?: string; // "👥" 같은 이모지
    text: string;
};

export type Props = {
    title: string;
    subtitle?: string;
    coverUrl?: string;

    // 오른쪽 상/하단 텍스트(예: 시간 / 진행중)
    rightTopText?: string;
    rightBottomText?: string;

    // ✅ 그룹에서 쓰는 메타(권장)
    meta?: MetaItem[];

    // ✅ 예전 코드 호환용
    metaLeft?: string;
    metaRight?: string;

    // ✅ 추가: 메타 방향(가로/세로)
    metaDirection?: "row" | "column";

    // 배지(옵션)
    badge?: string;

    onPress?: () => void;
};

export default function ChatListItem({
                                         title,
                                         subtitle,
                                         coverUrl,
                                         rightTopText,
                                         rightBottomText,
                                         meta,
                                         metaLeft,
                                         metaRight,
                                         metaDirection = "row",
                                         badge,
                                         onPress,
                                     }: Props) {
    const computedMeta: MetaItem[] | undefined =
        meta?.length
            ? meta
            : metaLeft || metaRight
                ? [
                    ...(metaLeft ? [{ text: metaLeft }] : []),
                    ...(metaRight ? [{ text: metaRight }] : []),
                ]
                : undefined;

    return (
        <Pressable
            onPress={onPress}
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
            }}
        >
            {/* 썸네일 */}
            <View
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: COLORS.white,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    overflow: "hidden",
                    marginRight: 12,
                }}
            >
                {coverUrl ? <Image source={{ uri: coverUrl }} style={{ width: "100%", height: "100%" }} /> : null}
            </View>

            {/* 가운데 */}
            <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 15 }} numberOfLines={1}>
                    {title}
                </Text>

                {subtitle ? (
                    <Text style={{ color: COLORS.neutralDark, fontSize: 13 }} numberOfLines={1}>
                        {subtitle}
                    </Text>
                ) : null}

                {/* 메타 */}
                {computedMeta?.length ? (
                    <View
                        style={{
                            flexDirection: metaDirection,
                            alignItems: metaDirection === "row" ? "center" : "flex-start",
                            gap: metaDirection === "row" ? 10 : 6,
                            marginTop: 2,
                        }}
                    >
                        {computedMeta.map((m, idx) => (
                            <View
                                key={`${m.text}-${idx}`}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                {m.icon ? <Text style={{ fontSize: 13 }}>{m.icon}</Text> : null}
                                <Text style={{ color: COLORS.muted, fontSize: 12 }} numberOfLines={1}>
                                    {m.text}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </View>

            {/* 오른쪽 */}
            <View style={{ alignItems: "flex-end", gap: 6, marginLeft: 10 }}>
                {rightTopText ? (
                    <Text style={{ color: COLORS.muted, fontSize: 12 }} numberOfLines={1}>
                        {rightTopText}
                    </Text>
                ) : null}

                {badge ? (
                    <View
                        style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 999,
                            backgroundColor: COLORS.mintLight,
                            borderWidth: 1,
                            borderColor: COLORS.mint,
                        }}
                    >
                        <Text style={{ color: COLORS.stepGreen, fontWeight: "900", fontSize: 12 }}>{badge}</Text>
                    </View>
                ) : rightBottomText ? (
                    <Text style={{ color: COLORS.stepGreen, fontWeight: "900", fontSize: 12 }} numberOfLines={1}>
                        {rightBottomText}
                    </Text>
                ) : null}
            </View>
        </Pressable>
    );
}
