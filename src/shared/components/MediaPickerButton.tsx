import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

import { MediaBlock, uid } from "@/store/useAppStore";
import { useTheme } from "@/theme/useTheme";

export async function pickImages(): Promise<MediaBlock[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    quality: 0.9,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset) => ({
    id: uid(),
    uri: asset.uri,
  }));
}

export function MediaPickerButton({
  onPicked,
  label = "Добавить фото",
}: {
  onPicked: (images: MediaBlock[]) => void;
  label?: string;
}) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    if (busy) return;

    setBusy(true);

    try {
      const images = await pickImages();
      onPicked(images);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={pick}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        paddingVertical: 9,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: colors.primarySoft,
      }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.primaryDeep} />
      ) : (
        <Ionicons name="image-outline" size={18} color={colors.primaryDeep} />
      )}

      <Text
        style={{
          color: colors.primaryDeep,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
