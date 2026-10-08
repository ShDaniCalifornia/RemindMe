import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { addDays, dateKey } from "@/shared/utils/date";
import { useTheme } from "@/theme/useTheme";

export type HeatmapValue =
  | number
  | {
      green: number;
      red: number;
    };

type Props = {
  level: (key: string) => HeatmapValue | null;
  palette: string[];
  redPalette?: string[];
  selected?: string | null;
  onSelect?: (key: string) => void;
};

/*
 * Понедельник → воскресенье.
 */
const DAY_LABELS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

const MONTHS = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

const SEASONS = [
  {
    name: "Зима",
    months: [11, 0, 1],
  },
  {
    name: "Весна",
    months: [2, 3, 4],
  },
  {
    name: "Лето",
    months: [5, 6, 7],
  },
  {
    name: "Осень",
    months: [8, 9, 10],
  },
];

/*
 * Размеры heatmap.
 *
 * ВАЖНО:
 * CELL_HEIGHT используется и для:
 *
 * 1. подписей дней недели
 * 2. самих ячеек
 *
 * Поэтому они всегда находятся ровно друг напротив друга.
 */
const MONTH_HEADER_HEIGHT = 15;
const CELL_HEIGHT = 16;
const CELL_GAP = 4;
const DAY_LABEL_WIDTH = 26;

function startOfMondayWeek(date: Date) {
  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  const day = d.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diff);

  return d;
}

function clampLevel(value: number, palette: string[]) {
  if (!palette.length) {
    return 0;
  }

  return Math.max(0, Math.min(value, palette.length - 1));
}

/*
 * Возвращает индекс сезона:
 *
 * 0 — зима
 * 1 — весна
 * 2 — лето
 * 3 — осень
 */
function getSeasonIndex(date: Date) {
  const month = date.getMonth();

  if (month === 11 || month <= 1) {
    return 0;
  }

  if (month >= 2 && month <= 4) {
    return 1;
  }

  if (month >= 5 && month <= 7) {
    return 2;
  }

  return 3;
}

/*
 * Превращаем сезон в непрерывный индекс.
 *
 * Например:
 *
 * Осень 2026 → 2026 * 4 + 3
 * Зима 2027  → 2027 * 4 + 0
 */
function getSeasonPosition(date: Date) {
  const month = date.getMonth();

  let year = date.getFullYear();

  const season = getSeasonIndex(date);

  /*
   * Декабрь относится к зиме следующего года.
   *
   * Декабрь 2026 → Зима 2027
   */
  if (month === 11) {
    year += 1;
  }

  return year * 4 + season;
}

function getSeasonFromPosition(position: number) {
  const year = Math.floor(position / 4);

  const seasonIndex = position % 4;

  return {
    year,
    seasonIndex,
  };
}

function getSeasonStart(year: number, seasonIndex: number) {
  const season = SEASONS[seasonIndex];

  /*
   * Зима 2027:
   *
   * декабрь 2026
   * январь 2027
   * февраль 2027
   */
  if (seasonIndex === 0) {
    return new Date(year - 1, 11, 1);
  }

  return new Date(year, season.months[0], 1);
}

function getSeasonEnd(year: number, seasonIndex: number) {
  const start = getSeasonStart(year, seasonIndex);

  /*
   * Последний день третьего месяца.
   */
  return new Date(start.getFullYear(), start.getMonth() + 3, 0);
}

function getSeasonTitle(year: number, seasonIndex: number) {
  return `${SEASONS[seasonIndex].name} ${year}`;
}

export default function Heatmap({
  level,
  palette,
  redPalette,
  selected,
  onSelect,
}: Props) {
  const { colors } = useTheme();

  const today = new Date();

  /*
   * По умолчанию показываем текущий сезон.
   */
  const [seasonPosition, setSeasonPosition] = useState(() =>
    getSeasonPosition(today),
  );

  const { year, seasonIndex } = getSeasonFromPosition(seasonPosition);

  const season = SEASONS[seasonIndex];

  const seasonStart = getSeasonStart(year, seasonIndex);

  const seasonEnd = getSeasonEnd(year, seasonIndex);

  /*
   * Начало сетки:
   * понедельник недели, в которой
   * находится начало сезона.
   */
  const gridStart = startOfMondayWeek(seasonStart);

  /*
   * Конец сетки:
   * воскресенье недели, в которой
   * находится конец сезона.
   */
  const gridEndMonday = startOfMondayWeek(seasonEnd);

  const gridEnd = addDays(gridEndMonday, 6);

  /*
   * Количество дней между началом
   * и концом сетки.
   */
  const totalDays =
    Math.round(
      (gridEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const weeks = Math.ceil(totalDays / 7);

  /*
   * Каждая колонка = одна неделя.
   *
   * Каждая неделя:
   *
   * 0 — понедельник
   * 1 — вторник
   * 2 — среда
   * 3 — четверг
   * 4 — пятница
   * 5 — суббота
   * 6 — воскресенье
   */
  const columns = Array.from({ length: weeks }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) =>
      addDays(gridStart, weekIndex * 7 + dayIndex),
    ),
  );

  const todayKey = dateKey(today);

  /*
   * Отрисовка одной ячейки.
   */
  const renderCell = (key: string): ReactNode => {
    const value = level(key);

    /*
     * Обычный режим.
     *
     * Например:
     * настроение,
     * продуктивность,
     * активность.
     */
    if (typeof value === "number") {
      const color = palette[clampLevel(value, palette)] ?? palette[0];

      return (
        <View
          style={{
            flex: 1,
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      );
    }

    /*
     * Нет данных.
     */
    if (!value) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: palette[0],
            borderRadius: 3,
          }}
        />
      );
    }

    const greenColor = palette[clampLevel(value.green, palette)] ?? palette[0];

    const reds = redPalette ?? palette;

    const redColor = reds[clampLevel(value.red, reds)] ?? reds[0];

    /*
     * Вредных привычек не было.
     */
    if (value.red <= 0) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: greenColor,
            borderRadius: 3,
          }}
        />
      );
    }

    /*
     * Были и хорошие,
     * и вредные привычки.
     */
    return (
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: greenColor,
          }}
        />

        <View
          style={{
            flex: 1,
            backgroundColor: redColor,
          }}
        />
      </View>
    );
  };

  /*
   * Предыдущий сезон.
   */
  const previousSeason = () => {
    setSeasonPosition((value) => value - 1);
  };

  /*
   * Следующий сезон.
   */
  const nextSeason = () => {
    setSeasonPosition((value) => value + 1);
  };

  return (
    <View
      style={{
        gap: 10,
      }}
    >
      {/* =================================
          Заголовок сезона
          ================================= */}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Предыдущий сезон */}

        <Pressable
          onPress={previousSeason}
          hitSlop={8}
          style={{
            width: 34,
            height: 34,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 17,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              lineHeight: 24,
              color: colors.text,
            }}
          >
            ‹
          </Text>
        </Pressable>

        {/* Текущий сезон */}

        <View
          style={{
            alignItems: "center",
            gap: 1,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {getSeasonTitle(year, seasonIndex)}
          </Text>

          <Text
            style={{
              fontSize: 10,
              color: colors.textMuted,
            }}
          >
            {MONTHS[season.months[0]]} — {MONTHS[season.months[2]]}
          </Text>
        </View>

        {/* Следующий сезон */}

        <Pressable
          onPress={nextSeason}
          hitSlop={8}
          style={{
            width: 34,
            height: 34,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 17,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              lineHeight: 24,
              color: colors.text,
            }}
          >
            ›
          </Text>
        </Pressable>
      </View>

      {/* =================================
          Heatmap
          ================================= */}

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        {/* =================================
            Подписи дней недели
            ================================= */}

        <View
          style={{
            width: DAY_LABEL_WIDTH,
            paddingTop: 1,
          }}
        >
          {/* Точно такое же место,
              как у названия месяца справа */}

          <View
            style={{
              height: MONTH_HEADER_HEIGHT,
              marginBottom: CELL_GAP,
            }}
          />

          {/* Пн */}

          {DAY_LABELS.map((label, index) => (
            <View
              key={`${label}-${index}`}
              style={{
                height: CELL_HEIGHT,
                marginBottom: index === 6 ? 0 : CELL_GAP,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  lineHeight: 10,
                  color: colors.textMuted,
                }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* =================================
            Недели
            ================================= */}

        <View
          style={{
            flex: 1,
            flexDirection: "row",
            gap: CELL_GAP,
          }}
        >
          {columns.map((column, columnIndex) => {
            const firstDay = column[0];

            const previousColumn = columns[columnIndex - 1];

            const previousMonth = previousColumn?.[0]?.getMonth();

            const currentMonth = firstDay.getMonth();

            const showMonth =
              columnIndex === 0 || currentMonth !== previousMonth;

            return (
              <View
                key={`week-${columnIndex}`}
                style={{
                  flex: 1,
                }}
              >
                {/* =================================
                      Название месяца
                      ================================= */}

                <View
                  style={{
                    height: MONTH_HEADER_HEIGHT,
                    marginBottom: CELL_GAP,
                    justifyContent: "flex-end",
                  }}
                >
                  {showMonth ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 9,
                        color: colors.textMuted,
                      }}
                    >
                      {MONTHS[currentMonth]}
                    </Text>
                  ) : null}
                </View>

                {/* =================================
                      Дни
                      ================================= */}

                {column.map((date) => {
                  const key = dateKey(date);

                  const isSelected = selected === key;

                  const isToday = key === todayKey;

                  /*
                   * Дни вне текущего
                   * сезона.
                   *
                   * Они нужны для того,
                   * чтобы недели оставались
                   * полноценными.
                   */
                  const isOutsideSeason =
                    date < seasonStart || date > seasonEnd;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => onSelect?.(key)}
                      hitSlop={2}
                      style={{
                        width: "100%",

                        /*
                         * Главное исправление:
                         *
                         * раньше здесь был
                         * aspectRatio: 1,
                         * из-за чего высота
                         * зависела от ширины.
                         *
                         * Теперь высота такая же,
                         * как у строк слева.
                         */
                        height: CELL_HEIGHT,

                        borderRadius: 4,

                        borderWidth: isSelected || isToday ? 1 : 0,

                        borderColor: isSelected
                          ? colors.primary
                          : isToday
                            ? colors.text
                            : "transparent",

                        padding: 1,

                        opacity: isOutsideSeason ? 0.3 : 1,

                        marginBottom: date.getDay() === 0 ? 0 : CELL_GAP,
                      }}
                    >
                      {renderCell(key)}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>

      {/* =================================
          Легенда
          ================================= */}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 5,
          marginTop: 2,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            color: colors.textMuted,
          }}
        >
          меньше
        </Text>

        {palette.slice(0, Math.min(palette.length, 5)).map((color, index) => (
          <View
            key={`legend-${index}`}
            style={{
              width: 11,
              height: 11,
              borderRadius: 3,
              backgroundColor: color,
            }}
          />
        ))}

        <Text
          style={{
            fontSize: 9,
            color: colors.textMuted,
          }}
        >
          больше
        </Text>
      </View>
    </View>
  );
}
