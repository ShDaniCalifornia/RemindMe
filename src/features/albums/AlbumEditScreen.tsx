import { useMemo, useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/shared/components/Button";
import { FormScreen } from "@/shared/components/FormScreen";
import { TextField } from "@/shared/components/TextField";

import { MediaBlock, uid, useAppStore } from "@/store/useAppStore";

import { font } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const ALBUM_COLORS = [
  "#6B8A6E",
  "#8B6B61",
  "#6B7A8A",
  "#8A7A5C",
  "#806B8A",
  "#5F7F7A",
  "#8A6B72",
  "#6B7280",
];

export default function AlbumEditScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id?: string;
  }>();

  const albums = useAppStore((state) => state.albums);
  const addAlbum = useAppStore((state) => state.addAlbum);
  const updateAlbum = useAppStore((state) => state.updateAlbum);
  const removeAlbum = useAppStore((state) => state.removeAlbum);

  const existing = useMemo(
    () => albums.find((album) => album.id === id),
    [albums, id],
  );

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");

  const [color, setColor] = useState(existing?.color ?? ALBUM_COLORS[0]);

  const [images, setImages] = useState<MediaBlock[]>(existing?.images ?? []);

  const [coverUri, setCoverUri] = useState<string | undefined>(
    existing?.coverUri,
  );

  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Нет доступа", "Разреши приложению доступ к фотографиям.");

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 50,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const added: MediaBlock[] = result.assets.map((asset) => ({
      id: uid(),
      uri: asset.uri,
    }));

    setImages((current) => [...current, ...added]);

    if (!coverUri && added[0]) {
      setCoverUri(added[0].uri);
    }
  };

  const deleteImage = (image: MediaBlock) => {
    const remaining = images.filter((item) => item.id !== image.id);

    setImages(remaining);

    if (existing?.images.some((item) => item.id === image.id)) {
      setRemovedImageIds((current) =>
        current.includes(image.id) ? current : [...current, image.id],
      );
    }

    if (coverUri === image.uri) {
      setCoverUri(remaining[0]?.uri);
    }
  };

  const save = () => {
    const name = title.trim() || "Без названия";

    const finalCover =
      coverUri && images.some((image) => image.uri === coverUri)
        ? coverUri
        : images[0]?.uri;

    if (existing) {
      updateAlbum(existing.id, {
        title: name,
        description: description.trim(),
        color,
        coverUri: finalCover,
        images,
      });
    } else {
      addAlbum({
        title: name,
        description: description.trim(),
        color,
        coverUri: finalCover,
        images,
      });
    }

    router.back();
  };

  const confirmDelete = () => {
    if (!existing) {
      return;
    }

    Alert.alert(
      "Удалить альбом?",
      "Все фотографии альбома будут удалены из него.",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            removeAlbum(existing.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <FormScreen
      title={existing ? "Редактировать альбом" : "Новый альбом"}
      footer={
        <>
          <Button
            title="Сохранить"
            onPress={save}
            disabled={!title.trim() && images.length === 0}
          />

          {existing && (
            <Button
              title="Удалить альбом"
              variant="danger"
              onPress={confirmDelete}
            />
          )}
        </>
      }
    >
      <View style={{ gap: 20 }}>
        {/* НАЗВАНИЕ */}
        <TextField
          label="Название"
          value={title}
          onChangeText={setTitle}
          placeholder="Например, Путешествия"
        />

        {/* ОПИСАНИЕ */}
        <TextField
          label="Описание"
          value={description}
          onChangeText={setDescription}
          placeholder="Небольшое описание альбома"
          multiline
        />

        {/* ЦВЕТ */}
        <View style={{ gap: 10 }}>
          <Text
            style={{
              color: colors.text,
              ...font.h2,
              fontWeight: "700",
            }}
          >
            Цвет альбома
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {ALBUM_COLORS.map((item) => {
              const active = color === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setColor(item)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: item,
                    borderWidth: active ? 3 : 1,
                    borderColor: active ? colors.text : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ФОТО */}
        <View style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.text,
                ...font.h2,
                fontWeight: "700",
              }}
            >
              Фотографии
            </Text>

            <Pressable
              onPress={pickImages}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {images.length === 0 ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 24,
                alignItems: "center",
              }}
            >
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
                Добавь фотографии
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {images.map((image) => {
                const isCover = coverUri === image.uri;

                return (
                  <Pressable
                    key={image.id}
                    onPress={() => setCoverUri(image.uri)}
                    onLongPress={() => deleteImage(image)}
                    style={{
                      width: "31%",
                      aspectRatio: 1,
                      borderRadius: 10,
                      overflow: "hidden",
                      borderWidth: isCover ? 3 : 1,
                      borderColor: isCover ? colors.primary : colors.border,
                    }}
                  >
                    <Image
                      source={{ uri: image.uri }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                    />

                    {isCover && (
                      <View
                        style={{
                          position: "absolute",
                          top: 5,
                          left: 5,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="star" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text
            style={{
              color: colors.textMuted,
              ...font.caption,
            }}
          >
            Нажми на фотографию, чтобы сделать её обложкой. Удерживай
            фотографию, чтобы удалить её.
          </Text>
        </View>
      </View>
    </FormScreen>
  );
}
