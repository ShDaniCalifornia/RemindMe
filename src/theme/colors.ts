const palette = {
  sage: "#6B8A6E",
  sageDeep: "#55725A",

  coral: "#EE9B8C",
  coralSoft: "#F8E0D6",

  charcoal: "#2A2A2A",
  stone: "#857D6F",
};

export type BackgroundId = "beige" | "milk" | "sand" | "stone" | "mist";

export type DarkBackgroundId =
  | "graphite"
  | "coffee"
  | "forest"
  | "navy"
  | "plum";

export const BACKGROUNDS: Record<
  BackgroundId,
  {
    label: string;
    background: string;
    card: string;
    border: string;
    primarySoft: string;
  }
> = {
  beige: {
    label: "Бежевый",
    background: "#F4EFE7",
    card: "#FBF8F2",
    border: "#DED6C9",
    primarySoft: "#E4EBDD",
  },

  milk: {
    label: "Молочный",
    background: "#FAF8F3",
    card: "#FFFFFF",
    border: "#E6E1D8",
    primarySoft: "#E8EFE5",
  },

  sand: {
    label: "Песочный",
    background: "#EDE4D5",
    card: "#F7F0E4",
    border: "#D8CDBB",
    primarySoft: "#E0E8D9",
  },

  stone: {
    label: "Каменный",
    background: "#E8E6E1",
    card: "#F3F1ED",
    border: "#D2D0CA",
    primarySoft: "#DDE5DC",
  },

  mist: {
    label: "Туманный",
    background: "#E9EEEE",
    card: "#F5F8F7",
    border: "#D1DBD9",
    primarySoft: "#DDE8E0",
  },
};

export const DARK_BACKGROUNDS: Record<
  DarkBackgroundId,
  {
    label: string;
    background: string;
    card: string;
    border: string;
    primarySoft: string;
  }
> = {
  graphite: {
    label: "Графит",
    background: "#201F1D",
    card: "#2A2927",
    border: "#38362F",
    primarySoft: "#334034",
  },

  coffee: {
    label: "Кофейный",
    background: "#241F1B",
    card: "#302923",
    border: "#443A31",
    primarySoft: "#3A4035",
  },

  forest: {
    label: "Лесной",
    background: "#1C231E",
    card: "#252D27",
    border: "#354038",
    primarySoft: "#304336",
  },

  navy: {
    label: "Ночной синий",
    background: "#1C2028",
    card: "#252B35",
    border: "#353D4A",
    primarySoft: "#303C48",
  },

  plum: {
    label: "Сливовый",
    background: "#241F25",
    card: "#302930",
    border: "#423641",
    primarySoft: "#3D3440",
  },
};

const Colors = {
  light: {
    text: palette.charcoal,
    textMuted: palette.stone,

    ...BACKGROUNDS.beige,

    primary: palette.sage,
    primaryDeep: palette.sageDeep,

    accent: palette.coral,
    accentSoft: palette.coralSoft,

    tabInactive: "#A59D8D",
  },

  dark: {
    text: "#EFEAE0",
    textMuted: "#A29E94",

    ...DARK_BACKGROUNDS.graphite,

    primary: "#93AE95",
    primaryDeep: "#A9C2AB",

    accent: "#EBA394",
    accentSoft: "#44312D",

    tabInactive: "#77736A",
  },
};

export default Colors;
