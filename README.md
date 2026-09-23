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

`restart: unless-stopped` 설정으로 VM이 재부팅되거나 컨테이너가 종료될 때 자동으로 다시 시작합니다. 토큰은 저장소나 Docker 이미지에 넣지 않습니다.