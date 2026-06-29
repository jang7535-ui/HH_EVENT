# 헥토헬스케어 이벤트 추첨 v2

GitHub Pages 배포용 정적 웹 프로젝트입니다.

## 파일 구조

- `index.html` : 관리자 추첨 페이지
- `result.html` : 참여자 결과 확인 페이지
- `assets/style.css` : 디자인
- `assets/app.js` : 추첨/결과 로직

## 기본 관리자 PIN

`hhc2026`

변경 위치: `assets/app.js` 상단의 `ADMIN_PIN` 값

## 사용 방법

1. GitHub 저장소에 전체 파일 업로드
2. Settings → Pages → Deploy from a branch → main → Save
3. 생성된 Pages 주소로 접속
4. 관리자 페이지에서 참여자 입력 후 추첨
5. 결과 링크 복사 후 메일 발송

## 보안/개인정보 참고

참여자 결과 링크에는 실제 이름 목록이 들어가지 않고, SHA-256 해시값으로 저장됩니다.
참여자 페이지에서는 전체 참여자 이름이 노출되지 않습니다.

단, 완전한 서버 보안이 필요한 용도라면 서버/DB 기반으로 전환해야 합니다.
