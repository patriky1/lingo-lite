import { Stack } from "expo-router";
import { useEffect } from "react";
import { initDb } from "../src/services/db";

export default function RootLayout() {
  useEffect(() => { initDb().catch(console.warn); }, []);
  return <Stack screenOptions={{ headerShown: false }} />;
}
