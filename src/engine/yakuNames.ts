// riichi-ts 가 반환하는 역 키(romaji) → namuwiki 표기 한국어 역명
// 키 목록은 riichi-ts v1.1.1 YAKU 테이블에서 직접 추출하여 검증함.

export const YAKU_KO: Record<string, string> = {
  // 1판역
  riichi: '리치',
  ippatsu: '일발',
  menzentsumo: '멘젠쯔모',
  pinfu: '핑후',
  tanyao: '탕야오',
  iipeikou: '이페코',
  haku: '역패 백',
  hatsu: '역패 발',
  chun: '역패 중',
  'own wind east': '자풍 동',
  'own wind south': '자풍 남',
  'own wind west': '자풍 서',
  'own wind north': '자풍 북',
  'round wind east': '장풍 동',
  'round wind south': '장풍 남',
  'round wind west': '장풍 서',
  'round wind north': '장풍 북',
  rinshan: '영상개화',
  chankan: '창깡',
  haitei: '해저로월',
  houtei: '하저로어',
  // 2판역
  'daburu riichi': '더블리치',
  sanshoku: '삼색동순',
  'sanshoku doukou': '삼색동각',
  ittsu: '일기통관',
  chanta: '찬타',
  chiitoitsu: '치또이쯔',
  toitoi: '또이또이',
  sanankou: '산안커',
  sankantsu: '산깡쯔',
  shosangen: '소삼원',
  honroutou: '혼노두',
  // 3판역
  ryanpeikou: '량페코',
  junchan: '준찬타',
  honitsu: '혼일색',
  // 6판역
  chinitsu: '청일색',
  // 역만
  tenhou: '천화',
  chihou: '지화',
  renhou: '인화',
  kokushimusou: '국사무쌍',
  'kokushimusou 13 sides': '국사무쌍 13면',
  suuankou: '스안커',
  'suuankou tanki': '스안커 단기',
  daisangen: '대삼원',
  shosuushi: '소사희',
  daisuushi: '대사희',
  tsuuiisou: '자일색',
  ryuuiisou: '녹일색',
  chinroutou: '청노두',
  suukantsu: '사깡쯔',
  chuurenpoto: '구련보등',
  'chuurenpoto 9 sides': '순정구련보등',
  // 도라류 (역 아님, 판수 가산)
  dora: '도라',
  uradora: '뒷도라',
  akadora: '적도라',
  aka: '적도라',
}

export function yakuKo(key: string): string {
  return YAKU_KO[key] ?? key
}

// 만관 이상 등급 한국어
export const LIMIT_KO: Record<string, string> = {
  mangan: '만관',
  haneman: '하네만',
  baiman: '배만',
  sanbaiman: '삼배만',
  'kazoe yakuman': '헤아림 역만',
  yakuman: '역만',
}
