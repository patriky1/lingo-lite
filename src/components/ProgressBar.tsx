import { View } from "react-native";

export default function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height: 10, backgroundColor: "#e9e9e9", borderRadius: 6, overflow: "hidden" }}>
      <View style={{ width: `${v * 100}%`, height: 10, backgroundColor: "#2e7d32" }} />
    </View>
  );
}
