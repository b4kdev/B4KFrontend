# Figma 정합 작업 인수인계 (2026-10-19, 갱신 2026-10-21, devtest)

## 2026-10-21 갱신

- **예전 CSS 완전 삭제**: `app/legacy.css`, 옛 Tailwind 테마(lav, bg-2, sp-*, f-* …), 옛 셸, 옛 라우트 페이지와 그것만 쓰던 컴포넌트·훅·lib 전부 삭제(약 19,500줄). 404·오프라인·사이트맵·로그인 콜백도 v2로 옮겼고, 모르는 주소는 v2 "페이지를 찾을 수 없습니다"(404)로 간다. 이전 화면으로 되돌리려면 그 커밋을 revert.
  - 점검 결과: 삭제 전에도 legacy.css가 v2 화면에 새는 경로는 없었다(요소 규칙은 `.b4k-v2` 없는 페이지 한정, v2 코드는 옛 변수·클래스를 하나도 안 씀). 그래서 v2 화면 모양은 이번 삭제로 바뀌지 않는다.
- **화면 대조 A1→A5: 진행 불가.** Figma MCP가 4개 파일 모두 "edit access 없음"으로 거부한다(gyulim@b4korea.com, B4K 팀 Dev 좌석. 10/19 13:43까지는 정상). 파일 위치·공유 권한이 바뀐 것으로 보임. 권한이 돌아오면 아래 "남은 작업 1"부터 이어서 한다.


v2 화면과 `components/library`를 Figma(B4K_Main: UX IA / UI Screens / UI Components / UI Foundations)에 1:1로 맞추는 작업의 진행 상황.
같은 폴더의 `01`~`06` 파일이 컴포넌트별 대조 결과 원본(변형/상태, 요소, 속성, Figma 값, 당시 코드 위치)이다. 라인 번호는 수정 전 기준이라 지금과 다를 수 있다.

## 작업 규칙 (요청자 지시)

- 수치는 `get_design_context`로 Figma 값을 정확히 뽑는다. 스크린샷 보고 근사 금지.
- Figma에 없는 것은 추가 전에 먼저 묻는다.
- UI 문구는 Copy Deck에 있는 것만 쓴다. 새 문구가 필요하면 목록으로 올린다.
- 순서: 라이브러리 컴포넌트 → 화면 A1 Map/Plan → A2 Home/Explore → A3 → A4 → A5.
- Plan, 경로 보기 등 이미 만든 로직은 유지한다.

## 완료

1. **v2 이전 CSS 분리**
   - `app/globals.css`는 v2 기본(토큰 배경·글자색, 테마별 color-scheme, reduced motion)만 남겼다.
   - 옛 전역 규칙(`:lang(ko){line-height:1.7; word-break:keep-all}` 등)은 `app/legacy.css`로 옮겼고, `.b4k-v2` 셸이 없는 페이지에만 적용된다.
   - 이 충돌을 되돌리던 `components/v2/v2.css`는 삭제했다.
   - `legacy.css`는 아직 v2로 안 옮긴 404·에러·오프라인·사이트맵 때문에 남아 있다. 이 화면들을 v2로 옮기면 파일째 지운다.
2. **토큰**
   - Foundations의 Color 31개 + Component 21개 변수를 Dark/Light 모두 비교했다. 104/104 값이 `app/tokens.css`와 일치한다.
   - 색 외 토큰 313개 중 `modal/padding`(코드 40 → Figma 24)만 달라서 `tokens/tokens.json`을 고치고 재생성했다.
   - text style 24개는 모두 일치한다.
3. **라이브러리 컴포넌트 대조·수정**
   - B4K UI Components 약 125개를 대조했다. 빠진 컴포넌트는 없고, 약 200개 값을 Figma에 맞췄다.
   - 대상 범위: 폼 atom, 내비/메뉴/셸/오버레이, 콘텐츠/플랜/리스트, organism(Plan cart, Saved hub, Itinerary, Place detail, AI panel, Card, Sign-in, Consent, Search filters, Profile header, Legal, Search suggestions), Sections.
   - 새 optional prop(기본값은 기존과 같음):
     - `Tabs.baseline`
     - `ItineraryPanel.ownerAvatarSrc`, `Card` featured `trending`
     - `SignInCard.subtitle`, `labels.backToSignIn`
     - `ConsentStep.subtitle`, `footnote`
     - `SearchFilters.onClose`, `labels.close`
     - `ProfileHeader.actionInRow`
     - `SearchSuggestions` `plans[].imageSrc`, `explore[].meta`
     - `Combobox.resultsLabel`, `emptyTitle`
     - `BottomSheet.actions`
     - `Fieldset.hideLegend`, `optionsClassName`
4. **화면 쪽 연쇄 수정**
   - `A1Map`: 모바일 플랜 시트의 cart 오프셋을 새 BottomSheet 패딩 24에 맞췄고(`-mx-[var(--space-6)]`), 저장 모달의 중복 하단 패딩을 제거했다.
   - `A1Map` Plan cart 장소 목록: 패딩 0이 되면서 × 버튼의 44px 터치 영역이 2px 넘쳐 가로 스크롤바가 생겼다. `overflow-x-hidden`으로 해결했다.
   - `A4Auth` 동의 화면: 400 래퍼를 없애고 CD1511을 `ConsentStep.footnote`로 카드 안에 넣었다(카드 폭 420, Figma).
5. **확인한 것**
   - `tsc`, `eslint`, `next build` 모두 통과.
   - 로컬 데스크톱: 홈, 지도(클러스터·핀), 장소 추가 → Plan cart 펼침(다른 핀 숨김, 경로, 일차 탭), 로그인 카드.
   - 로컬 모바일: 지도 → 플랜 시트.
   - 그 외 화면과 라이트 모드는 눈으로 확인하지 않았다.

## 남은 작업

1. **화면 대조 A1 → A5** (아직 시작 전): 화면별로 `get_design_context` 수치를 코드와 대조하고, 차이 목록(화면, 요소, Figma 값, 코드 값, 수정 여부)을 만든 뒤 수정한다.
   이미 알려진 항목:
   - `A3Account` ProfileHeader: 컴포넌트가 자체 pt24/px 패딩을 갖게 돼서 V2Page 패딩과 겹칠 수 있다.
   - Search filters 모바일: A4Pages의 BottomSheet 안에서 패딩이 맞는지 확인이 필요하다.
2. ~~404·에러·오프라인·사이트맵을 v2로 옮긴 뒤 `app/legacy.css`를 삭제한다.~~ 완료(2026-10-21).
3. 화면 대조 범위에서 **Quick plan(`V2QuickPlan`)과 내 플랜(Plan cart, 플랜 진행 중 화면)은 제외**한다. 요청자가 직접 수정한 부분이라 Figma 기준으로 되돌리지 않는다(2026-10-21 지시).

## 요청자 결정 대기

**Figma에 없는 추가 기능** (지금 코드대로 유지 중, 유지/되돌리기 결정 필요):
- 플랜 장소 사진(40px)
- 일차 × 삭제(선택된 일차에만) + 확인창
- 일차 탭 스크롤 화살표
- 펼친 플랜 배경 `bg-sunken` → `bg`
- 특별 페이지 "지도에서 보기"

**코드에만 있는 소소한 extra**:
- Map pin focus ring
- 선택 정류장 외곽선
- FAB Open hover, Drop zone hover
- Menu/Combobox 제거 × 툴팁
- Sign-in 오류 Alert
- 최근 검색 × / 전체 지우기

**데이터 차이**: Quick Plan 목적지(Figma 9개 / 코드 17개 지역), 관심사(Figma 5개 / DB 10개 그룹). 결정 전까지 코드 유지.

**디자인 질문**
1. 아이콘 선 두께: Figma는 모든 크기에서 2px이고, Lucide는 작아질수록 얇아진다(16px에서 1.3px). 전부 2px로 맞출지.
2. Figma 오류로 보이는 것(코드는 손대지 않음):
   - Tab focus ring 위치(설명은 안쪽, 레이어는 바깥)
   - Route map preview 선 색(그림은 파랑, 설명은 fg)
   - Card Featured 이미지 폭(레이아웃 약 50%, 설명 42%)
   - Stop badge Day 8 숫자가 "1"로 고정
3. EmptyState 기본 컨테이너를 Figma 기본값(bordered)으로 바꿀지(바꾸면 기존 호출부 모양이 바뀜).
4. Plan cart "+ Day": 지금은 기존 라벨 "일차 추가"를 텍스트 버튼으로 표시. Figma 문구 "+ Day"를 Copy Deck에 추가할지.
5. Sign-in 카드 하단 Back/Guest 순서.
6. Dropdown/Account 메뉴 그룹 사이, Drawer 계정 행 아래: 지금은 1px Separator. 예전 주석(UI-95)은 "공백으로 구분"이었다. Figma Separator가 숨김이면 공백으로 바꿔야 한다.
7. Table sticky header: 세로 스크롤 컨테이너(max-height)를 둘지, 가로 overflow 래퍼를 없앨지.
8. Date range picker: gap 2가 요일 행과 1주차 사이에도 들어감(Figma는 주 사이만 명시).
9. File upload: Uploading 상태에서 진행바를 힌트 위/아래 중 어디에 둘지, Drop zone 최소 높이(128 제거함)를 유지할지.
10. 토큰 없는 고정값: 레일 셀 56, 헤더 검색 480, 계정 메뉴 280. 토큰을 만들지.

**동작 변화**:
- Spinner 기본 크기가 sm(16)이 되어 `V2QuickPlan` 로딩 스피너가 작아졌다.
- File upload는 업로드 중 비활성화된다.
- Slider thumb의 focus ring이 이제 실제로 보인다(이전 셀렉터는 매칭이 안 됐음).

## Copy Deck 추가가 필요한 문구

컴포넌트에 optional prop만 만들어 두었고, 문구가 없으면 표시하지 않는다.

| 위치 | Figma 문구 |
|---|---|
| Transport mode 로딩 | "· Calculating" |
| File upload | "Uploading", "Choose file", "Uploading, 60%" 캡션 |
| Combobox | 결과 헤더 "Places", 빈 결과 제목, "Searching" |
| Sign-in card | subtitle, "Back to sign in" |
| Consent step | subtitle |
| Legal document | 메타 구분자 "·" |
| Plan cart | "+ Day" |

이 밖에 Copy Deck 행이 없는 기존 `gap` 문구 21개가 있다(`components/v2/gaps.ts`, `messages/v2/supplement`). `k('…')` 키 180개는 모두 Copy Deck 행에 연결돼 있어 문제없다.
