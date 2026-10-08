import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import type { Album } from "@/store/useAppStore";
import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type Props = {
  album: Album;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
};

export function AlbumAttachment({
  album,
  selected = false,
  onPress,
  compact = false,
}: Props) {
  const { colors } = useTheme();

  const cover = album.coverUri ?? album.images[0]?.uri;

  const imageSize = compact ? 42 : 52;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          padding: compact ? 8 : 10,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {cover ? (
        <Image
          source={{
            uri: cover,
          }}
          style={{
            width: imageSize,
            height: imageSize,
            borderRadius: 9,
          }}
        />
      ) : (
        <View
          style={{
            width: imageSize,
            height: imageSize,
            borderRadius: 9,
            backgroundColor: album.color ?? colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="images-outline" size={22} color="#FFFFFF" />
        </View>
      )}

      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={[
            font.body,
            {
              color: colors.text,
              fontWeight: "600",
            },
          ]}
        >
          {album.title}
        </Text>

        <Text
          numberOfLines={1}
          style={{
            marginTop: 2,
            fontSize: 12,
            color: colors.textMuted,
          }}
        >
          {album.images.length} {album.images.length === 1 ? "фото" : "фото"}
        </Text>
      </View>

      {selected && (
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },
});
