import { Button, Text, View } from "react-native";
import { setItem } from "../../utils/storage";

export default function Onboarding() {
  const completeOnboarding = async () => {
    await setItem("onboardingComplete", "true");
    // You may want to trigger a navigation refresh here
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Onboarding steps go here.</Text>
      <Button title="Finish Onboarding" onPress={completeOnboarding} />
    </View>
  );
}
