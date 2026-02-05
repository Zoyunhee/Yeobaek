import { Redirect } from "expo-router";

export default function Index() {
    return <Redirect href="/login" />; // 앱 시작시 로그인으로 보내라
}
