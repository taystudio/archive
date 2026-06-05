# VSCode Extension Host 100% CPU 폭주 / 맥북 발열 / 깃 그래프 무한로딩

- **날짜**: 2026-05-11
- **환경**: macOS (Darwin 24.6.0), VSCode, 레포 = Archive (정적 HTML/CSS/blog)
- **결론**: `adrientecher.just-cant-git-enough` 익스텐션이 범인. 제거 후 즉시 정상화.

---

## 증상

- 맥북이 비정상적으로 뜨거워짐 (장시간 풀로드)
- VSCode가 멈춘 듯한 느낌 → Claude Code 토큰 사용량이 안 늘어남
- `Ctrl+C` 두 번 눌러야 빠져나옴
- Source Control / Git Graph 패널이 **계속 로딩 스피너만 돌고** 반영 안 됨
- VSCode 재시작해도 같은 증상 재발

## 진단 과정

### 1단계: 프로세스 확인

```bash
ps aux | grep -E "git|node|Code Helper" | grep -v grep
```

→ `Code Helper (Plugin)` (PID 23452, Extension Host) 가 **CPU 99%, 메모리 1GB+** 점유 중인 것 확인.

### 2단계: 깃 lock / 레포 크기 확인

```bash
ls -la .git/ | grep -E "lock|HEAD|index"
du -sh .git
```

→ lock 파일 없음 (정상). 다만 **`.git` 폴더가 394MB**로 정적 사이트 레포치고 매우 큼.

### 3단계: Extension Host 자식 프로세스 확인

```bash
ps -axo pid,ppid,pcpu,pmem,comm,args | awk '$2==23452 || $1==23452' | sort -k3 -rn
```

→ **자식 언어서버들(tsserver, eslint, java, mssql 등)은 전부 0% CPU**.
→ Extension Host **본체(Node.js)가 직접 100% 폭주** 중. 즉 별도 프로세스로 분리된 무거운 언어 서버가 아니라, **호스트 안에서 같이 돌고 있는 JS 익스텐션 중 하나**가 범인.

### 4단계: VSCode 빌트인 git 로그 확인

```
~/Library/Application Support/Code/logs/<latest>/window1/exthost/vscode.git/
```

→ 모든 git 명령 10~30ms 안에 정상 종료. **빌트인 git은 무죄**.

### 5단계: Show Running Extensions 화면 점검

`Cmd+Shift+P → "Developer: Show Running Extensions"`

→ 정상 익스텐션은 `Activation: Xms`처럼 숫자가 박혀 있는데, 두 개가 비정상 상태였음:

| 익스텐션 | 상태 |
|---|---|
| **Just Can't Git Enough 0.0.1** | `Activating...` (영구 활성화 중, 절대 안 끝남) |
| GitHub Copilot Chat 0.47.0 | `Activating... ⚠️ 2 uncaught errors` |

`Activating...` 상태가 안 끝난다 = 그 익스텐션의 startup 코드가 무한루프 또는 매우 무거운 동기 작업으로 매달린 상태.

## 범인

**`adrientecher.just-cant-git-enough` (v0.0.1)**

이 깃 관련 익스텐션이 394MB 짜리 `.git` 폴더 인덱싱하다 매달림 → Extension Host CPU 100% → VSCode 깃 패널 응답 불가 → 깃 그래프 무한 로딩.

## 해결

```bash
code --uninstall-extension adrientecher.just-cant-git-enough
```

또는 Extensions 사이드바 (`Cmd+Shift+X`)에서 검색 후 Uninstall.

이후 `Developer: Restart Extension Host` 또는 VSCode 재시작 → **즉시 정상화**.

## 부수 발견 / 정리할 거리

### 깃 관련 익스텐션이 6개나 깔려있었음

```
adrientecher.just-cant-git-enough   ← 범인 (제거 완료)
codezombiech.gitignore
donjayamanne.githistory
dzhavat.git-cheatsheet
eamodio.gitlens
felipecaputo.git-project-manager
mhutchie.git-graph
```

같은 `.git` 폴더를 동시에 긁어대면서 경합 발생 가능. **GitLens 또는 Git Graph 하나만 남기는 걸 권장**.

### 이 레포에 불필요한데 깔려서 Extension Host 부담 주는 것들

Archive는 정적 HTML/CSS + 블로그 레포인데 다음이 활성화되어 있었음:

- **자바**: redhat.java, Java IDE, Project Manager for Java, Gradle for Java, Test Runner for Java, Debugger for Java
- **DB**: SQL Server (mssql), SQL Database Projects
- **컨테이너**: Container Tools, Dev Containers
- **.NET / C++**: .NET Install Tool, Runtime Server Protocol UI, C/C++, CodeLLDB, CMake Tools, Decompiler
- **기타**: WSL (맥에서 무의미), Azure Application Insights, Red Hat Dependency Analytics, Vue (안 씀)
- **AI 중복**: ChatGPT - Genie AI (Claude Code랑 중복)
- **빌드툴**: Grunt, Gulp, Jake (이 레포에 빌드 없음)

워크스페이스 단위로 비활성화 (`.vscode/extensions.json`의 `unwantedRecommendations`) 또는 전역 제거 검토.

### `.git` 394MB

정적 사이트 레포치고 비정상적으로 큼. 시간 날 때 정리 가치 있음:

```bash
git gc --aggressive --prune=now
git repack -a -d --depth=250 --window=250
```

큰 바이너리가 히스토리에 들어갔다면 `git filter-repo`로 솎아내는 것도 고려.

## 다음에 같은 증상 나오면 빠르게 짚는 법

1. `ps aux | grep "Code Helper (Plugin)"` → CPU% 확인
2. 100% 근처면 `Cmd+Shift+P → Developer: Show Running Extensions`
3. `Activating...` 상태로 멈춰있는 익스텐션이 범인
4. 우클릭 Disable → `Developer: Restart Extension Host`로 검증
5. 확인되면 `code --uninstall-extension <publisher>.<name>`
