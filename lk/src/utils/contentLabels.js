import { isB2B } from '../config/edition';

// Раздел библиотеки. На «Родном голосе» он называется «Для малышей».
// На «Родных голосах» остаётся «Колыбельные». Код категории на сервере
// по-прежнему lullaby.
export const LULLABY_TITLE = isB2B ? 'Для малышей' : 'Колыбельные';
export const LULLABY_ONE = isB2B ? 'Для малышей' : 'Колыбельная';
export const LULLABY_GEN = isB2B ? 'для малышей' : 'колыбельных';
export const LULLABY_ONE_PREP = isB2B ? 'для малышей' : 'колыбельной';
