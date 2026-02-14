import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import BookCard, { Book } from "@/components/ui/BookCard";
import SectionBox from "@/components/ui/SectionBox";

const dummyBooks: Book[] = [
    {
        id: "1",
        title: "1퍼센트 부자들의 법칙",
        author: "글쓴이",
        desc: "임시 문구(나중에 백엔드 연동)",
        coverUrl: "https://picsum.photos/200/300?random=11",
    },
];

//  임시 퀴즈 데이터
const dummyQuiz = {
    question: "소설 데미안의 저자는 헤르만 헤세이다",
    answer: true, // O = true, X = false
    explanation: "『데미안』은 독일 작가 헤르만 헤세가 1919년에 발표한 소설이다.",
};

export default function HomeScreen() {
    const router = useRouter();
    const [q, setQ] = useState("");

    const [showExplanation, setShowExplanation] = useState(false);

    const pickTitle = useMemo(() => "🟢🟢님 취향에 맞는 자기 개발 도서", []);

    const onPressAnswer = (userAnswer: boolean) => {
        const isCorrect = userAnswer === dummyQuiz.answer;

        Alert.alert(
            isCorrect ? "정답입니다 🎉" : "틀렸어요 😢",
            isCorrect ? "퀴즈를 맞히셨어요!" : "다시 한 번 확인해보세요.",
            [{ text: "확인" }]
        );

        setShowExplanation(true);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.screen}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.logo}>여백 餘白</Text>
                        <Text style={styles.subtitle}>오늘은 어떤 책 이야기를 해볼까요?</Text>
                    </View>

                    <SearchBar
                        value={q}
                        onChangeText={setQ}
                        editable={false}
                        onPress={() => router.push("/(home)/homesearch")}
                    />

                    <View style={{ height: 12 }} />

                    <SectionBox title={pickTitle}>
                        <BookCard
                            book={dummyBooks[0]}
                            showButtons
                            variant="flat"
                            onPress={() =>
                                router.push({
                                    pathname: "/(home)/resultdetails",
                                    params: { id: dummyBooks[0].id },
                                })
                            }
                        />
                    </SectionBox>

                    <View style={{ height: 12 }} />

                    <SectionBox title="월간 베스트 셀러" variant="mint">
                        <BookCard
                            book={dummyBooks[0]}
                            showButtons
                            variant="flat"
                            onPress={() =>
                                router.push({
                                    pathname: "/(home)/resultdetails",
                                    params: { id: dummyBooks[0].id },
                                })
                            }
                        />
                    </SectionBox>

                    <View style={{ height: 12 }} />

                    {/*  퀴즈  */}
                    <View style={styles.quizBox}>
                        <Text style={styles.quizTitle}>오늘의 여백 퀴즈</Text>
                        <Text style={styles.quizQ}>Q : {dummyQuiz.question}</Text>

                        <View style={styles.quizBtns}>
                            <Pressable style={styles.quizBtn} onPress={() => onPressAnswer(true)}>
                                <Text style={styles.quizBtnText}>O</Text>
                            </Pressable>
                            <Pressable style={styles.quizBtn} onPress={() => onPressAnswer(false)}>
                                <Text style={styles.quizBtnText}>X</Text>
                            </Pressable>
                        </View>

                        {showExplanation && (
                            <Text style={styles.quizExplanation}>
                                {dummyQuiz.explanation}
                            </Text>
                        )}
                    </View>

                    <View style={{ height: 18 }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    screen: { flex: 1, backgroundColor: COLORS.bg },

    content: {
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 18,
        gap: 10,
    },

    header: { alignItems: "center", gap: 8, marginBottom: 6 },
    logo: { fontSize: 28, fontWeight: "900", color: COLORS.primary },
    subtitle: { fontSize: 13, fontWeight: "700", color: COLORS.primaryDark },

    quizBox: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14 },
    quizTitle: { fontSize: 13, fontWeight: "900", color: COLORS.stepGreen },
    quizQ: { marginTop: 10, fontSize: 13, fontWeight: "800", color: COLORS.primary },

    quizBtns: { flexDirection: "row", gap: 12, marginTop: 14 },
    quizBtn: {
        flex: 1,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    quizBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 15 },

    // 풀이 스타일
    quizExplanation: {
        marginTop: 12,
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.stepGreen,
        lineHeight: 18,
    },
});
