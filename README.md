# 리치마작 점수 트레이너

무작위로 출제되는 리치마작 화료패의 **판수·부수·점수**를 맞히는 모바일/웹 트레이너.
참고 사이트(mahjong-ten.com)에 없던 **도라 표시패 · 리치/일발 · 멘젠/후로 상황 · 역 없음(화료 불가) · 깡(안깡/대명깡/가깡) · 치또이츠** 케이스를 포함한다.

- 채점 엔진: [`riichi-ts`](https://github.com/MahjongPantheon/riichi-ts) (텐호 기준 검증된 라이브러리)
- 역 명칭: 나무위키 표기 기준
- 패 이미지: [FluffyStuff/riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles) (CC0 / 퍼블릭 도메인). `public/tiles/`의 `Front.svg`(본체) 위에 각 패 face SVG를 겹쳐 렌더링.

## 구조

```
src/
  engine/
    tiles.ts       타일 인코딩(0~33) · 한국어 라벨 · 도라 변환
    yakuNames.ts   riichi-ts 역 키 → 나무위키 한국어 역명
    score.ts       riichi-ts 채점 어댑터 (호출 규약 캡슐화)
    generate.ts    무작위 화료패 + 상황 생성기
  components/
    Tile.tsx        타일 1장 (Front 본체 + face, 꺾기/뒷면(안깡)/fluid 사이징)
    HandDisplay.tsx 손패 단일 행(fit 사이징) · 후로/깡 · 도라/리치봉 표시
    RiichiStick.tsx 리치봉 SVG (--u 연동)
    AnswerForm.tsx  판·부·점수 입력 + '역 없음' 버튼
    ResultPanel.tsx 정답 판정(항목별) + 역/부수/점수 분해
  App.tsx           출제 흐름 + 정답률/연속 카운터
  types.ts
public/tiles/       FluffyStuff 타일 SVG (CC0)
```

### riichi-ts 호출 규약 (어댑터에 반영됨)

- 타일 인덱스: 만 `0~8`, 통 `9~17`, 삭 `18~26`, 동남서북 `27~30`, 백발중 `31~33`
- **쯔모**: `closed` 에 화료패를 마지막에 둔 14장, `ronTile = undefined`
- **론**: `closed` = 13장, 화료패는 `ronTile` 인자로 별도 전달
- `dora` 옵션은 **표시패가 아니라 실제 도라패**를 받는다(엔진이 표시패→도라 변환을 안 함). 어댑터가 `doraIndicators.map(doraFromIndicator)`로 변환해 전달
- 리치/일발은 options가 아닌 **positional 인자**로 전달해야 적용됨
- `isAgari` 는 "형태 완성"이며, 역 없음 판정은 `ten === 0` (어댑터의 `canWin`)

## 다음 단계 (TODO)

- 적도라(아카 5m/5p/5s) 출제·채점
- 국사무쌍 등 비표준 형태 출제 (현재 생성기는 4멘쯔+1머리 / 치또이츠만 생성)
- 영상개화·창깡 등 깡 특수역


## 라이선스

학습용 프로젝트. 타일 이미지는 CC0(퍼블릭 도메인). riichi-ts 등 의존 라이브러리의 라이선스를 따른다.
