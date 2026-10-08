import { FoldersView } from "@/features/todos/FoldersView";
import { Card } from "@/shared/components/Card";
import { Chip } from "@/shared/components/Chip";
import { EmptyState } from "@/shared/components/EmptyState";
import { Screen } from "@/shared/components/Screen";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { formatDateTime } from "@/shared/utils/date";
import { Album, MOOD_LABELS, Note, useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Sortable from "react-native-sortables";
import { WeeklySummaryCard } from "./WeeklySummaryCard";

function NoteCard({ note }: { note: Note }) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/create-note",
          params: {
            id: note.id,
          },
        })
      }
    >
      <Card style={{ gap: 6 }}>
        {note.title ? (
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            {note.title}
          </Text>
        ) : null}

        <Text
          style={{
            color: colors.text,
          }}
          numberOfLines={4}
        >
          {note.text}
        </Text>

        <View style={styles.meta}>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
            }}
          >
            {formatDateTime(note.createdAt)}
          </Text>

          {note.mood && (
            <Text
              style={{
                color: colors.primaryDeep,
                fontSize: 12,
              }}
            >
              {MOOD_LABELS[note.mood]}
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

function AlbumCard({ album, isActive }: { album: Album; isActive?: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();

  const cover = album.coverUri ?? album.images[0]?.uri;

  return (
    <View
      style={[
        styles.albumDragWrap,
        isActive && {
          zIndex: 1000,
          elevation: 30,
        },
      ]}
    >
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/album/[id]",
            params: {
              id: album.id,
            },
          } as any)
        }
        style={({ pressed }) => [
          styles.albumPressable,
          {
            opacity: pressed && !isActive ? 0.88 : 1,
          },
        ]}
      >
        <Card
          style={[
            styles.albumCard,
            {
              borderColor: album.color ?? colors.border,
            },
            isActive && {
              borderColor: colors.primary,
              borderWidth: 2,
              shadowColor: colors.primary,
              shadowOpacity: 0.35,
              shadowRadius: 16,
              shadowOffset: {
                width: 0,
                height: 8,
              },
              elevation: 18,
            },
          ]}
        >
          <View style={styles.coverWrap}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.cover} />
            ) : (
              <View
                style={[
                  styles.cover,
                  styles.coverEmpty,
                  {
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <Ionicons
                  name="images-outline"
                  size={32}
                  color={album.color ?? colors.primary}
                />
              </View>
            )}

            <View
              style={[
                styles.count,
                {
                  backgroundColor: album.color ?? colors.primary,
                },
              ]}
            >
              <Ionicons name="images-outline" size={12} color="#fff" />

              <Text style={styles.countText}>{album.images.length}</Text>
            </View>

            <View
              pointerEvents="none"
              style={[
                styles.dragHandle,
                isActive && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="reorder-three" size={22} color="#fff" />
            </View>
          </View>

          <Text
            style={[
              styles.albumTitle,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {album.title}
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
            }}
            numberOfLines={2}
          >
            {album.description ||
              (album.images.length ? "Фотоальбом" : "Пустой альбом")}
          </Text>
        </Card>
      </Pressable>
    </View>
  );
}

export function NotesScreen() {
  const router = useRouter();

  const notes = useAppStore((s) => s.notes);
  const albums = useAppStore((s) => s.albums);
  const reorderAlbums = useAppStore((s) => s.reorderAlbums);

  const [mode, setMode] = useState<"note" | "diary" | "todo" | "album">("note");

  const list = notes.filter((note) => note.kind === mode);

  const header = (
    <View style={styles.archiveHeader}>
      <ScreenHeader
        title="Архив"
        onAdd={() => {
          if (mode === "todo") {
            router.push("/folder-edit");
            return;
          }

          if (mode === "album") {
            router.push("/album-create" as any);
            return;
          }

          router.push({
            pathname: "/create-note",
            params: {
              kind: mode,
            },
          });
        }}
      />

      <View style={styles.row}>
        <Chip
          label="Заметки"
          active={mode === "note"}
          onPress={() => setMode("note")}
        />

        <Chip
          label="Дневник"
          active={mode === "diary"}
          onPress={() => setMode("diary")}
        />

        <Chip
          label="Задачи"
          active={mode === "todo"}
          onPress={() => setMode("todo")}
        />

        <Chip
          label="Альбомы"
          active={mode === "album"}
          onPress={() => setMode("album")}
        />
      </View>
    </View>
  );

  if (mode === "album") {
    return (
      <Screen scroll={false}>
        <View style={styles.albumScreen}>
          {header}

          {albums.length === 0 ? (
            <View style={styles.albumEmpty}>
              <EmptyState
                sprite="thinking"
                title="Альбомов пока нет"
                hint="Нажмите «+», чтобы создать альбом."
              />
            </View>
          ) : (
            <View style={styles.albumListWrap}>
              <Sortable.Grid
                data={albums}
                columns={2}
                rowGap={16}
                columnGap={16}
                renderItem={({ item }) => <AlbumCard album={item} />}
                onDragEnd={({ data }) => {
                  reorderAlbums(data.map((album) => album.id));
                }}
              />
            </View>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {header}

      {mode === "todo" ? (
        <FoldersView />
      ) : (
        <>
          {mode === "diary" && <WeeklySummaryCard />}

          {list.length === 0 ? (
            <EmptyState
              sprite="thinking"
              title={mode === "note" ? "Пока здесь тихо" : "Дневник пуст"}
              hint="Нажмите «+», чтобы написать первую запись."
            />
          ) : (
            list.map((note) => <NoteCard key={note.id} note={note} />)
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  archiveHeader: {
    width: "100%",
    paddingBottom: 14,
    paddingHorizontal: 8,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingRight: 8,
  },

  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  albumScreen: {
    flex: 1,
  },

  albumEmpty: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  albumListWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  albumGrid: {
    paddingTop: 8,
    paddingBottom: 40,
  },

  albumDragWrap: {
    width: "100%",
    overflow: "visible",
  },

  albumPressable: {
    width: "100%",
  },

  albumCard: {
    width: "100%",
    padding: 10,
    gap: 7,
    minHeight: 0,
  },

  coverWrap: {
    width: "100%",
    position: "relative",
  },

  cover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
  },

  coverEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },

  count: {
    position: "absolute",
    right: 7,
    top: 7,
    minWidth: 30,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  dragHandle: {
    position: "absolute",
    left: 7,
    top: 7,
    width: 30,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  albumTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
});
