import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/theme/useTheme";

import { AlbumAttachment } from "./AlbumAttachment";
import { Button } from "./Button";

export function AlbumPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { colors } = useTheme();

  const albums = useAppStore((s) => s.albums);

  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((x) => x !== id) : [...value, id],
    );
  };

  const selectedAlbums = albums.filter((album) => value.includes(album.id));

  return (
    <>
      <View style={styles.container}>
        <Text
          style={[
            styles.label,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Альбомы
        </Text>

        <Pressable
          onPress={() => setOpen(true)}
          style={[
            styles.row,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Ionicons
            name="images-outline"
            size={20}
            color={colors.primaryDeep}
          />

          <View style={styles.rowContent}>
            <Text
              numberOfLines={1}
              style={{
                color: colors.text,
                fontWeight: "600",
              }}
            >
              {value.length
                ? `Прикреплено: ${value.length}`
                : "Прикрепить альбом"}
            </Text>

            {selectedAlbums.length > 0 && (
              <Text
                numberOfLines={1}
                style={{
                  color: colors.textMuted,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {selectedAlbums.map((album) => album.title).join(" · ")}
              </Text>
            )}
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        {selectedAlbums.length > 0 && (
          <View style={styles.selectedList}>
            {selectedAlbums.map((album) => (
              <AlbumAttachment
                key={album.id}
                album={album}
                compact
                selected
                onPress={() => toggle(album.id)}
              />
            ))}
          </View>
        )}
      </View>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.head}>
              <Text
                style={[
                  styles.sheetTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Выбрать альбомы
              </Text>

              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {albums.length ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
              >
                {albums.map((album) => (
                  <AlbumAttachment
                    key={album.id}
                    album={album}
                    selected={value.includes(album.id)}
                    onPress={() => toggle(album.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.empty}>
                <Ionicons
                  name="images-outline"
                  size={34}
                  color={colors.textMuted}
                />

                <Text
                  style={{
                    color: colors.textMuted,
                    marginTop: 8,
                  }}
                >
                  Пока нет альбомов.
                </Text>
              </View>
            )}

            <Button title="Готово" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  label: {
    fontSize: 13,
    lineHeight: 18,
  },

  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },

  rowContent: {
    flex: 1,
    minWidth: 0,
  },

  selectedList: {
    gap: 8,
  },

  modalRoot: {
    flex: 1,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  sheet: {
    maxHeight: "82%",
    padding: 20,
    gap: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },

  head: {
    flexDirection: "row",
    alignItems: "center",
  },

  sheetTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
  },

  list: {
    gap: 10,
    paddingBottom: 4,
  },

  empty: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
  },
});
