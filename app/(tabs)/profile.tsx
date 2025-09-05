import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useGameStore } from "../../src/store/useGameStore";

export default function Profile() {
  const { xp, hearts, streak, refillHearts } = useGameStore();

  return (
    <View style={s.container}>
      <Text style={s.title}>Seu perfil</Text>
      <Text style={s.info}>XP total: {xp}</Text>
      <Text style={s.info}>Streak: {streak} 🔥</Text>
      <Text style={s.info}>Vidas: {hearts} ❤️</Text>

      <TouchableOpacity style={s.button} onPress={refillHearts}>
        <Text style={s.buttonText}>Recarregar vidas</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  info: { fontSize: 18, marginBottom: 10 },
  button: { backgroundColor: "#2e7d32", padding: 16, borderRadius: 12, marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 }
});
0