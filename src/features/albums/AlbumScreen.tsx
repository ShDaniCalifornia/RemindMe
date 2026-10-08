import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";

import { uid, useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/theme/useTheme";

import { EmptyState } from "@/shared/components/EmptyState";

export default function AlbumScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const album = useAppStore((state) =>
    state.albums.find((item) => item.id === id),
  );

  const addAlbumImage = useAppStore((state) => state.addAlbumImage);

  const removeAlbumImage = useAppStore((state) => state.removeAlbumImage);

  const updateAlbum = useAppStore((state) => state.updateAlbum);

  const removeAlbum = useAppStore((state) => state.removeAlbum);

  const reorderAlbumImages = useAppStore((state) => state.reorderAlbumImages);

  if (!album) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[
          styles.center,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          Альбом не найден
        </Text>

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text
            style={{
              color: colors.primaryDeep,
            }}
          >
            Назад
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const addPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Нужен доступ к фото",
        "Разреши приложению доступ к галерее.",
      );

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: 50,
    });

    if (result.canceled) {
      return;
    }

    result.assets.forEach((asset) => {
      addAlbumImage(album.id, {
        id: uid(),
        uri: asset.uri,
      });
    });
  };

  const confirmDeleteImage = (imageId: string) => {
    Alert.alert("Удалить изображение?", "Это действие нельзя отменить.", [
      {
        text: "Отмена",
        style: "cancel",
      },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => removeAlbumImage(album.id, imageId),
      },
    ]);
  };

  const confirmDeleteAlbum = () => {
    Alert.alert(
      "Удалить альбом?",
      `Альбом «${album.title}» и все его изображения будут удалены.`,
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            removeAlbum(album.id);
            router.back();
          },
        },
      ],
    );
  };

  const setCover = (uri: string) => {
    updateAlbum(album.id, {
      coverUri: uri,
    });
  };

  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<(typeof album.images)[number]>) => {
    return (
      <ScaleDecorator>
        <View
          style={[
            styles.imageCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            isActive && {
              borderColor: colors.primary,
              borderWidth: 2,
            },
          ]}
        >
          <Image
            source={{
              uri: item.uri,
            }}
            style={styles.image}
            resizeMode="cover"
          />

          {item.uri === album.coverUri && (
            <View
              style={[
                styles.coverBadge,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="star" size={13} color="#FFFFFF" />
            </View>
          )}

          <View style={styles.imageActions}>
            <Pressable
              onLongPress={drag}
              delayLongPress={180}
              style={styles.iconBtn}
              hitSlop={4}
              accessibilityLabel="Перетащить"
            >
              <Ionicons name="reorder-three" size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={() => setCover(item.uri)}
              style={styles.iconBtn}
              hitSlop={4}
              accessibilityLabel="Сделать обложкой"
            >
              <Ionicons
                name={item.uri === album.coverUri ? "star" : "star-outline"}
                size={18}
                color="#FFFFFF"
              />
            </Pressable>

            <Pressable
              onPress={() => confirmDeleteImage(item.id)}
              style={styles.iconBtn}
              hitSlop={4}
              accessibilityLabel="Удалить"
            >
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={27} color={colors.text} />
        </Pressable>

        <Pressable
          onLongPress={() =>
            router.push({
              pathname: "/album-create",
              params: {
                id: album.id,
              },
            })
          }
          style={styles.headerTitleWrap}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: "700",
            }}
            numberOfLines={1}
          >
            {album.title}
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {album.images.length}{" "}
            {album.images.length === 1 ? "изображение" : "изображений"}
          </Text>
        </Pressable>

        <Pressable
          onPress={addPhotos}
          style={[
            styles.headerBtn,
            {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <Ionicons name="add" size={21} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/album-create",
              params: {
                id: album.id,
              },
            })
          }
          style={styles.headerBtn}
        >
          <Ionicons name="create-outline" size={22} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={confirmDeleteAlbum}
          style={styles.headerBtn}
          hitSlop={4}
          accessibilityLabel="Удалить альбом"
        >
          <Ionicons name="trash-outline" size={21} color={colors.accent} />
        </Pressable>
      </View>

      {album.images.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            sprite="thinking"
            title="В альбоме пока пусто"
            hint="Нажми «+», чтобы добавить фотографии."
          />
        </View>
      ) : (
        <DraggableFlatList
          data={album.images}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          activationDistance={8}
          onDragEnd={({ data }) => {
            reorderAlbumImages(
              album.id,
              data.map((item) => item.id),
            );
          }}
          contentContainerStyle={[
            styles.grid,
            {
              paddingBottom: 24 + insets.bottom,
            },
          ]}
          columnWrapperStyle={styles.column}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  backButton: {
    marginTop: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  title: {
    flex: 1,
    marginLeft: 8,
  },

  addButton: {
    marginRight: 6,
  },

  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },

  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyWrap: {
    flex: 1,
    padding: 16,
  },

  grid: {
    paddingHorizontal: 12,
    gap: 12,
  },

  column: {
    gap: 12,
    marginBottom: 0,
  },

  imageCard: {
    flex: 1,
    width: 0,
    minWidth: 0,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#DDD",
  },

  coverBadge: {
    position: "absolute",
    left: 8,
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  imageActions: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },

  iconBtn: {
    width: 32,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
