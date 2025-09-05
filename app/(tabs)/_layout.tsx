// app/(tabs)/_layout.tsx
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGameStore } from "../../src/store/useGameStore";

const COLOR = {
  primary: "#2e7d32",
  inactive: "#9CA3AF",
  iosBg: "transparent",
  androidBg: "rgba(255,255,255,0.92)"
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { hearts } = useGameStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLOR.primary,
        tabBarInactiveTintColor: COLOR.inactive,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarItemStyle: { paddingTop: 6 },
        tabBarStyle: [
          s.tabBar,
          {
            height: 64 + insets.bottom,
            paddingBottom: 10 + insets.bottom,
            backgroundColor: Platform.OS === "android" ? COLOR.androidBg : COLOR.iosBg
          }
        ] as any,
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLOR.androidBg }]} />
          )
      }}
    >
      <Tabs.Screen
        name="learn"
        options={{
          title: "Aprender",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={22} color={color} />
          ),
          tabBarBadge: hearts < 5 ? String(hearts) : undefined,
          tabBarBadgeStyle: { backgroundColor: "#ef4444", color: "#fff" }
        }}
      />
      <Tabs.Screen
        name="greetings"
        options={{
          title: "Saudações",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={22} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Missões",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "trophy" : "trophy-outline"} size={22} color={color} />
          )
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          )
        }}
      />
      
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    borderRadius: 18,
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden"
  }
});
