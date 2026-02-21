import React from "react";
import { Pressable, Text, View } from "react-native";
import { COLORS } from "@/constants/colors";

type Props<T extends string> = {
    leftLabel: string;
    rightLabel: string;
    value: T;
    leftValue: T;
    rightValue: T;
    onChange: (v: T) => void;
};

export default function SegmentedToggle<T extends string>({
                                                              leftLabel,
                                                              rightLabel,
                                                              value,
                                                              leftValue,
                                                              rightValue,
                                                              onChange,
                                                          }: Props<T>) {
    const isLeft = value === leftValue;

    return (
        <View style={{ backgroundColor: COLORS.mint, borderRadius: 999, padding: 4, flexDirection: "row" }}>
            <Pressable
                onPress={() => onChange(leftValue)}
                style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: isLeft ? COLORS.stepGreen : "transparent",
                    alignItems: "center",
                }}
            >
                <Text style={{ color: isLeft ? COLORS.white : COLORS.stepGreen, fontWeight: "800" }}>{leftLabel}</Text>
            </Pressable>

            <Pressable
                onPress={() => onChange(rightValue)}
                style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: !isLeft ? COLORS.stepGreen : "transparent",
                    alignItems: "center",
                }}
            >
                <Text style={{ color: !isLeft ? COLORS.white : COLORS.stepGreen, fontWeight: "800" }}>{rightLabel}</Text>
            </Pressable>
        </View>
    );
}
// ai, 그룹 채팅 이동 초록바버튼