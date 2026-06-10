# 리치마작 점수 트레이너

무작위로 출제되는 리치마작 화료패의 **판수·부수·점수**를 맞히는 모바일/웹 트레이너.
참고 사이트(chalkpe, mahjong-ten.com)에 없던 **도라 표시패 · 리치/잇파츠 · 멘젠/후로 상황 · 역 없음(화료 불가)** 케이스를 포함한다.

- 채점 엔진: [`riichi-ts`](https://github.com/MahjongPantheon/riichi-ts) (텐호 기준 검증된 라이브러리)
- 역 명칭: 나무위키 표기 기준
- 패 이미지: [FluffyStuff/riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles) (CC0 / 퍼블릭 도메인). `public/tiles/`의 `Front.svg`(본체) 위에 각 패 face SVG를 겹쳐 렌더링.

## 개발

```bash
npm install
npm run dev      # 로컬 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 배포 (GitHub Pages)

1. 이 폴더를 GitHub 레포지토리로 push (브랜치: `main`)
2. 레포 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 설정
3. push 시 `.github/workflows/deploy.yml` 가 자동 빌드·배포
   - 공개 주소: `https://<사용자명>.github.io/<레포명>/`
   - `base` 경로는 레포명으로 워크플로에서 자동 주입됨

## 구조

```
src/
  engine/
    tiles.ts       타일 인코딩(0~33) · 한국어 라벨 · 도라 변환
    yakuNames.ts   riichi-ts 역 키 → 나무위키 한국어 역명
    score.ts       riichi-ts 채점 어댑터 (호출 규약 캡슐화)
    generate.ts    무작위 화료패 + 상황 생성기
  components/
    Tile.tsx        타일 1장 (Front 본체 + face 이미지, 꺾기 지원)
    HandDisplay.tsx 손패/후로/도라/상황 표시
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
- `dora` 옵션에는 **도라 표시패**를 넣으면 엔진이 실제 도라 자동 계산
- 리치/잇파츠는 options가 아닌 **positional 인자**로 전달해야 적용됨
- `isAgari` 는 "형태 완성"이며, 역 없음 판정은 `ten === 0` (어댑터의 `canWin`)

## 다음 단계 (TODO)

- 깡(안깡/밍깡) 출제 — 부수 학습 강화
- 칠대자/국사무쌍 등 4멘쯔+머리 비표준 형태 출제 (현재 생성기는 4멘쯔+1머리만 생성)
- 뒷도라/적도라/깡도라 표시패
- 난이도 필터 (부수만 / 멘젠만 / 후로 포함 / 판수 범위)
- 약점 유형 가중 출제 (간격 반복)
- 부수 내역 분해 표시 (기본 20부 + 멘젠론 10부 + 안커 …)
- 정답률 영속 저장 (localStorage)
- PWA (오프라인 설치)

## 검증

`riichi-ts` 채점을 독립 구현한 표준 부판 공식과 37,000+건 교차검증함 — 총점·쯔모 지불 분해 전부 일치, 불가능한 부수/0점 모순/역만 점수 이상 없음.

## 라이선스

학습용 프로젝트. 타일 이미지는 CC0(퍼블릭 도메인). riichi-ts 등 의존 라이브러리의 라이선스를 따른다.
