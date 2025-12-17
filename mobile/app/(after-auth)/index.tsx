import { Redirect } from "expo-router";

export default function AfterAuthIndex() {
    return <Redirect href="/(after-auth)/dashboard" />;
}
