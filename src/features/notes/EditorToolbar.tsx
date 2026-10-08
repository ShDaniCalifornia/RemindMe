import { ColorPicker } from "@/shared/components/ColorPicker";
import { HIGHLIGHT_COLORS, TEXT_COLORS } from "@/shared/constants/palettes";
import { onColor } from "@/shared/utils/color";
import { useTheme } from "@/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { RefObject, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type EditorState = {
  block: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
};

export type RichEditorHandle = {
  exec: (command: string, value?: string) => void;
  focus?: () => void;
};

type Props = {
  editor: RefObject<RichEditorHandle | null>;
  state: EditorState;
};

export function EditorToolbar({ editor, state }: Props) {
  const { colors, isDark } = useTheme();

  const [picker, setPicker] = useState<"text" | "hilite" | null>(null);

  const [lastText, setLastText] = useState<string | null>(null);

  const [lastHi, setLastHi] = useState<string | null>(null);

  const exec = (command: string, value?: string) => {
    editor.current?.exec(command, value);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];

    if (!asset.base64) {
      return;
    }

    const mime = asset.mimeType || "image/jpeg";

    const dataUri = `data:${mime};base64,${asset.base64}`;

    exec("image", dataUri);
  };

  const Btn = ({
    active,
    onPress,
    children,
    label,
  }: {
    active?: boolean;
    onPress: () => void;
    children: React.ReactNode;
    label: string;
  }) => (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={[
        styles.btn,
        active && {
          backgroundColor: colors.primarySoft,
        },
      ]}
    >
      {children}
    </Pressable>
  );

  const glyph = (text: string, extra?: object) => (
    <Text
      style={[
        {
          color: colors.text,
          fontSize: 17,
        },
        extra,
      ]}
    >
      {text}
    </Text>
  );

  return (
    <View
      style={[
        styles.bar,
        {
          borderColor: colors.border,
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.content}
      >
        <Btn
          label="Заголовок 1"
          active={state.block === "h1"}
          onPress={() => exec("h1")}
        >
          {glyph("H1", {
            fontWeight: "700",
          })}
        </Btn>

        <Btn
          label="Заголовок 2"
          active={state.block === "h2"}
          onPress={() => exec("h2")}
        >
          {glyph("H2", {
            fontWeight: "700",
            fontSize: 15,
          })}
        </Btn>

        <Btn label="Жирный" active={state.bold} onPress={() => exec("bold")}>
          {glyph("B", {
            fontWeight: "800",
          })}
        </Btn>

        <Btn
          label="Курсив"
          active={state.italic}
          onPress={() => exec("italic")}
        >
          {glyph("I", {
            fontStyle: "italic",
          })}
        </Btn>

        <Btn
          label="Подчёркнутый"
          active={state.underline}
          onPress={() => exec("underline")}
        >
          {glyph("U", {
            textDecorationLine: "underline",
          })}
        </Btn>

        <Btn
          label="Зачёркнутый"
          active={state.strike}
          onPress={() => exec("strike")}
        >
          {glyph("S", {
            textDecorationLine: "line-through",
          })}
        </Btn>

        <Btn
          label="Маркированный список"
          active={state.ul}
          onPress={() => exec("ul")}
        >
          <Ionicons name="list" size={22} color={colors.text} />
        </Btn>

        <Btn
          label="Нумерованный список"
          active={state.ol}
          onPress={() => exec("ol")}
        >
          {glyph("1.", {
            fontWeight: "600",
          })}
        </Btn>

        <Btn label="Цвет текста" onPress={() => setPicker("text")}>
          <View style={styles.colorButton}>
            {glyph("A", {
              fontWeight: "700",
            })}

            <View
              style={[
                styles.colorLine,
                {
                  backgroundColor: lastText ?? colors.text,
                },
              ]}
            />
          </View>
        </Btn>

        <Btn label="Выделение цветом" onPress={() => setPicker("hilite")}>
          <View style={styles.colorButton}>
            <Ionicons name="brush" size={20} color={colors.text} />

            <View
              style={[
                styles.colorLine,
                {
                  backgroundColor: lastHi ?? HIGHLIGHT_COLORS[0],
                },
              ]}
            />
          </View>
        </Btn>

        <Btn label="Вставить изображение" onPress={pickImage}>
          <Ionicons name="image-outline" size={22} color={colors.text} />
        </Btn>

        <Btn label="Убрать оформление" onPress={() => exec("clear")}>
          <Ionicons name="close-circle-outline" size={22} color={colors.text} />
        </Btn>

        <Btn label="Отменить" onPress={() => exec("undo")}>
          <Ionicons name="arrow-undo" size={20} color={colors.text} />
        </Btn>

        <Btn label="Вернуть" onPress={() => exec("redo")}>
          <Ionicons name="arrow-redo" size={20} color={colors.text} />
        </Btn>
      </ScrollView>

      {picker === "text" && (
        <ColorPicker
          title="Цвет текста"
          presets={TEXT_COLORS}
          value={lastText}
          noneLabel="По умолчанию"
          onClose={() => setPicker(null)}
          onPick={(color) => {
            exec("color", color ?? colors.text);

            setLastText(color);
            setPicker(null);
          }}
        />
      )}

      {picker === "hilite" && (
        <ColorPicker
          title="Выделение цветом"
          presets={HIGHLIGHT_COLORS}
          value={lastHi}
          noneLabel="Убрать выделение"
          onClose={() => setPicker(null)}
          onPick={(color) => {
            exec("hilite", color ?? "transparent");

            if (color && isDark) {
              exec("color", onColor(color));
            }

            setLastHi(color);
            setPicker(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,

    borderBottomWidth: StyleSheet.hairlineWidth,

    paddingVertical: 4,
  },

  content: {
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 2,
  },

  btn: {
    minWidth: 40,
    height: 40,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 6,
  },

  colorButton: {
    alignItems: "center",
  },

  colorLine: {
    width: 18,
    height: 3,

    borderRadius: 2,

    marginTop: -2,
  },
});
