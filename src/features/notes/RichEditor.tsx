import { useTheme } from "@/theme/useTheme";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export type EditorState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
  block: string;
};

export const EMPTY_STATE: EditorState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  ul: false,
  ol: false,
  block: "",
};

export type RichEditorHandle = {
  exec: (cmd: string, arg?: string) => void;
  focus: () => void;
};

type Props = {
  initialHtml: string;
  placeholder?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  onChange: (html: string) => void;
  onState?: (state: EditorState) => void;
};

function buildPage(options: {
  bg: string;
  text: string;
  muted: string;
  caret: string;
  placeholder: string;
  init: string;
  autoFocus: boolean;
  readOnly: boolean;
}) {
  const init = JSON.stringify(options.init).replace(/</g, "\\u003c");

  const placeholder = JSON.stringify(options.placeholder);

  const editable = options.readOnly ? "false" : "true";

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"
/>

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;

  background: ${options.bg};
  color: ${options.text};

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    Roboto,
    Helvetica,
    Arial,
    sans-serif;

  font-size: 17px;
  line-height: 1.5;

  -webkit-text-size-adjust: 100%;
}

body {
  overflow-x: hidden;
}

#ed {
  box-sizing: border-box;

  min-height: ${options.readOnly ? "0" : "260px"};

  width: 100%;

  padding:
    14px
    16px
    70px;

  outline: none;

  caret-color: ${options.caret};

  word-wrap: break-word;
  overflow-wrap: break-word;

  -webkit-user-select: text;
  user-select: text;
}

#ed[contenteditable="false"] {
  padding-bottom: 20px;
}

#ed:empty:before {
  content: attr(data-ph);
  color: ${options.muted};
}

p,
div {
  margin: 0;
}

h1 {
  font-size: 26px;
  line-height: 1.25;
  margin: .6em 0 .3em;
}

h2 {
  font-size: 21px;
  line-height: 1.3;
  margin: .6em 0 .3em;
}

h3 {
  font-size: 18px;
  margin: .6em 0 .3em;
}

ul,
ol {
  margin: .3em 0;
  padding-left: 24px;
}

figure {
  margin: 14px 0;
  text-align: center;
}

figure img {
  display: block;

  max-width: 100%;
  width: auto;
  height: auto;

  border-radius: 12px;

  margin: 0 auto;
}

figcaption {
  color: ${options.muted};
  font-size: 13px;
  margin-top: 6px;
  outline: none;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>
</head>

<body>

<div
  id="ed"
  contenteditable="${editable}"
  data-ph=${placeholder}
></div>

<script>
(function () {
  var ed = document.getElementById("ed");
  var saved = null;
  var timer = null;

  ed.innerHTML = ${init};

  ed.querySelectorAll("figcaption").forEach(function (node) {
    node.setAttribute(
      "contenteditable",
      "${options.readOnly ? "false" : "true"}"
    );
  });

  function post(value) {
    try {
      window.ReactNativeWebView.postMessage(
        JSON.stringify(value)
      );
    } catch (e) {}
  }

  function queryState(command) {
    try {
      return document.queryCommandState(command);
    } catch (e) {
      return false;
    }
  }

  function getBlock() {
    try {
      var block = String(
        document.queryCommandValue("formatBlock")
      ).toLowerCase();

      block = block.replace(/[<>]/g, "");

      if (block === "div") {
        return "p";
      }

      return block;
    } catch (e) {
      return "";
    }
  }

  function sendState() {
    post({
      t: "state",

      bold: queryState("bold"),
      italic: queryState("italic"),
      underline: queryState("underline"),
      strike: queryState("strikeThrough"),

      ul: queryState("insertUnorderedList"),
      ol: queryState("insertOrderedList"),

      block: getBlock()
    });
  }

  function sendChange() {
    post({
      t: "change",
      html: ed.innerHTML
    });
  }

  function saveSelection() {
    var selection = window.getSelection();

    if (!selection || !selection.rangeCount) {
      return;
    }

    var range = selection.getRangeAt(0);

    if (
      ed.contains(range.commonAncestorContainer)
    ) {
      saved = range.cloneRange();
    }
  }

  function restoreSelection() {
    ed.focus();

    if (!saved) {
      return;
    }

    try {
      var selection = window.getSelection();

      selection.removeAllRanges();
      selection.addRange(saved);
    } catch (e) {}
  }

  try {
    document.execCommand(
      "defaultParagraphSeparator",
      false,
      "p"
    );
  } catch (e) {}

  ${
    options.readOnly
      ? ""
      : `
  ed.addEventListener("input", function () {
    if (
      !ed.textContent.trim() &&
      !ed.querySelector(
        "ul,ol,li,figure,img"
      )
    ) {
      ed.innerHTML = "";
    }

    clearTimeout(timer);

    timer = setTimeout(function () {
      sendChange();
    }, 120);
  });

  ed.addEventListener("keyup", function () {
    saveSelection();
    sendState();
  });

  ed.addEventListener("mouseup", function () {
    saveSelection();
    sendState();
  });

  ed.addEventListener("touchend", function () {
    setTimeout(function () {
      saveSelection();
      sendState();
    }, 0);
  });

  document.addEventListener(
    "selectionchange",
    function () {
      var selection = window.getSelection();

      if (
        selection &&
        selection.rangeCount &&
        ed.contains(selection.anchorNode)
      ) {
        saveSelection();
        sendState();
      }
    }
  );

  window.__cmd = function (command, value) {
    restoreSelection();

    try {
      document.execCommand(
        "styleWithCSS",
        false,
        true
      );
    } catch (e) {}

    try {
      switch (command) {
        case "bold":
          document.execCommand(
            "bold",
            false,
            null
          );
          break;

        case "italic":
          document.execCommand(
            "italic",
            false,
            null
          );
          break;

        case "underline":
          document.execCommand(
            "underline",
            false,
            null
          );
          break;

        case "strike":
          document.execCommand(
            "strikeThrough",
            false,
            null
          );
          break;

        case "ul":
          document.execCommand(
            "insertUnorderedList",
            false,
            null
          );
          break;

        case "ol":
          document.execCommand(
            "insertOrderedList",
            false,
            null
          );
          break;

        case "h1":
        case "h2":
          var current = getBlock();

          document.execCommand(
            "formatBlock",
            false,
            current === command
              ? "p"
              : command
          );
          break;

        case "color":
          document.execCommand(
            "foreColor",
            false,
            value
          );
          break;

        case "hilite":
          try {
            document.execCommand(
              "hiliteColor",
              false,
              value
            );
          } catch (e) {
            document.execCommand(
              "backColor",
              false,
              value
            );
          }
          break;

        case "html":
          document.execCommand(
            "insertHTML",
            false,
            value || ""
          );
          break;

        case "image":
          document.execCommand(
            "insertHTML",
            false,

            '<figure>' +
              '<img src="' +
              String(value || "")
                .replace(
                  /"/g,
                  "&quot;"
                ) +
              '" />' +
              '<figcaption contenteditable="true">' +
              "Подпись к изображению" +
              "</figcaption>" +
            "</figure>" +

            "<p><br></p>"
          );
          break;

        case "clear":
          document.execCommand(
            "removeFormat",
            false,
            null
          );

          document.execCommand(
            "formatBlock",
            false,
            "p"
          );
          break;

        case "undo":
          document.execCommand(
            "undo",
            false,
            null
          );
          break;

        case "redo":
          document.execCommand(
            "redo",
            false,
            null
          );
          break;
      }
    } catch (e) {}

    saveSelection();
    sendChange();
    sendState();
  };

  ${
    options.autoFocus
      ? `
  setTimeout(function () {
    ed.focus();
  }, 100);
  `
      : ""
  }
  `
  }

  post({
    t: "ready"
  });
})();
</script>

</body>
</html>
`;
}

export const RichEditor = forwardRef<RichEditorHandle, Props>(
  function RichEditor(
    {
      initialHtml,
      placeholder = "Пишите здесь…",
      autoFocus = false,
      readOnly = false,
      onChange,
      onState,
    },
    ref,
  ) {
    const { colors } = useTheme();

    const web = useRef<WebView>(null);

    const html = useMemo(
      () =>
        buildPage({
          bg: colors.background,
          text: colors.text,
          muted: colors.textMuted,
          caret: colors.primary,
          placeholder,
          init: initialHtml,
          autoFocus,
          readOnly,
        }),
      [
        colors.background,
        colors.text,
        colors.textMuted,
        colors.primary,
        placeholder,
        initialHtml,
        autoFocus,
        readOnly,
      ],
    );

    useImperativeHandle(
      ref,
      () => ({
        exec(command, value) {
          if (readOnly) {
            return;
          }

          const commandJson = JSON.stringify(command);

          const valueJson = JSON.stringify(value ?? null);

          web.current?.injectJavaScript(
            `window.__cmd(${commandJson}, ${valueJson}); true;`,
          );
        },

        focus() {
          if (readOnly) {
            return;
          }

          web.current?.injectJavaScript(
            `
            document
              .getElementById("ed")
              .focus();
            true;
          `,
          );
        },
      }),
      [readOnly],
    );

    const onMessage = (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);

        if (message.t === "change") {
          onChange(message.html);
          return;
        }

        if (message.t === "state") {
          onState?.({
            bold: !!message.bold,
            italic: !!message.italic,
            underline: !!message.underline,
            strike: !!message.strike,
            ul: !!message.ul,
            ol: !!message.ol,
            block: message.block || "",
          });
        }
      } catch {
        // Игнорируем некорректные сообщения WebView.
      }
    };

    return (
      <View style={styles.root}>
        <WebView
          ref={web}
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled={false}
          hideKeyboardAccessoryView
          keyboardDisplayRequiresUserAction={false}
          automaticallyAdjustContentInsets={false}
          bounces={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          scrollEnabled
          style={[
            styles.web,
            {
              backgroundColor: colors.background,
            },
          ]}
          containerStyle={{
            backgroundColor: colors.background,
          }}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },

  web: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "transparent",
  },
});
