import { ImageSourcePropType } from 'react-native';

export type CharacterState =
  | 'calm' | 'happy' | 'cheer' | 'shy' | 'sleep' | 'thinking' | 'worried' | 'loving';

export const ALL_STATES: CharacterState[] = [
  'calm', 'happy', 'cheer', 'shy', 'sleep', 'thinking', 'worried', 'loving',
];

// 1) Временные Lottie-заглушки (анимированные «колобки»). Лежат в assets/character/lottie-placeholders/.
export const placeholderLottie: Record<CharacterState, any> = {
  calm: require('../../../assets/character/lottie-placeholders/calm.json'),
  happy: require('../../../assets/character/lottie-placeholders/happy.json'),
  cheer: require('../../../assets/character/lottie-placeholders/cheer.json'),
  shy: require('../../../assets/character/lottie-placeholders/shy.json'),
  sleep: require('../../../assets/character/lottie-placeholders/sleep.json'),
  thinking: require('../../../assets/character/lottie-placeholders/thinking.json'),
  worried: require('../../../assets/character/lottie-placeholders/worried.json'),
  loving: require('../../../assets/character/lottie-placeholders/loving.json'),
};

// 2) НАСТОЯЩИЕ анимации из LottieLab. Положи json в assets/character/lottie/ и раскомментируй строку.
//    Всё, что здесь указано, автоматически заменит заглушку.
export const finalLottie: Partial<Record<CharacterState, any>> = {
  // calm: require('../../../assets/character/lottie/calm.json'),
  // happy: require('../../../assets/character/lottie/happy.json'),
};

// 3) Статичные PNG (необязательно): пригодятся, пока Lottie для состояния ещё нет.
//    Приоритет: finalLottie > PNG > placeholderLottie.
export const stillImages: Partial<Record<CharacterState, ImageSourcePropType>> = {
  // calm: require('../../../assets/character/calm.png'),
};
