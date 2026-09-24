# m-discord-bot

## Oracle Free VM 배포

1. VM에 Docker와 Docker Compose를 설치합니다.
2. 저장소를 clone합니다.
3. 프로젝트 폴더에서 `.env`를 만들고 `DISCORD_TOKEN`, `CLIENT_ID`를 입력합니다.
4. 아래 명령으로 봇을 실행합니다.

```bash
docker compose up -d --build
```

상태 확인:

```bash
docker compose ps
docker compose logs -f discord-bot
```

기본 포트는 `8080`으로 고정되어 있으며, 다른 서비스가 `3000`을 사용 중일 때도 자동으로 대체 포트를 찾아 부팅합니다. `restart: always` 설정으로 컨테이너가 비정상 종료되면 자동 재시작됩니다. 토큰은 저장소나 Docker 이미지에 넣지 않습니다.