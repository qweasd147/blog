---
title: 'Git - 알면 유용한 명령어들'
date: '2022-06-18T16:04:47.302Z'
template: 'post'
draft: false
category: 'etc'
tags:
  - 'git'
  - 'alias'
  - 'hooks'
description: 'alias, hooks, rebase 중 merge commit 유지하기'
---

# 1. alias

git 명령어 중 옵션이 너무 많아서 기억하기 힘들거나 타이핑이 귀찮은 경우, 연속되는 명령줄을 alias로 묶어 한방에 처리할 때 유용하다.
개념자체는 간단하지만 alais를 사용하기 위해선 git 명령어의 적용 범위를 먼저 알아야 한다.

### 1.1 Config Scope

git 최초 설정을 할때 한번쯤은 `user name`, `email` 등을 지정하기 위해 `$ git config ~~~~` 이런 명령어들 써봤을 것이라 생각된다. 이런 명령어가 설정값 적용 범위를 지정해 놓기 위해 설정한건데 설정값 범위는 크게 3가지 종류로 구분 된다.

1. System

전체적인 시스템에 일괄 적용되며 `/etc/gitconfig` 에 저장된다. 모든 사용자를 대상으로 설정값을 지정하기 위해서 적용한다.

2. Global

global 설정으로, 이 값을 설정하면 해당 user의 모든 git repository에 적용된다. 위치는 해당 사용자를 위한 설정 값이니까

3. Local

특정 `repository`에 적용하기 위해 사용된다. 저장 위치는 `/프로젝트경로/.git/config` 가 된다.

다시 좀 전에 말했던 걸로 되돌아가서, git commit 작성자 정보를 지정하기 위해 `git config --global user.name` 이런식으로 git 설정값을 건드려 본적 있을텐데, 이제 보면 알겠지만 global 설정, 즉 내 계정의 모든 git repository에 적용하기 위한 scope를 지정한 것이고 반대로 `--local` 옵션을 주면 해당 repository에만 적용된다.

> 적용 우선 순위는 local -> global -> system 순으로 적용된다.

### 1.2 Alias 적용

일단 예제는 global scope를 대상으로 했다.

1. 등록

```sh
$ cd ~/프로젝트 위치
$ git config --global alias.b 'branch' # git branch 명령 alia
$ git b # 위에서 적용한 alias (git branch 명령어) 사용
# 현재 로컬의 브랜치 목록 표출
```

2. 적용 된 목록

```sh
$ git config --global --list | grep alias
```

3. 삭제

```
git config --global --unset alias.b
```

**Tip**
여러 사람과 git 작업 + 공통 브랜치(git flow 같은거) 공유하면서 사용하다 보면 공통 브랜치를 항상 pull 받기 귀찮을 수도 있다. 이런거 alias 등록 해놓으면 편하게 사용 가능하다.

```
$ cd ~/프로젝트_위치
$ vi ./.git/config
```

```
~~~ 로컬 설정값 + branch들 ~~~~~
[alias]
	pull-all = "!git checkout master && git pull origin \
	; git checkout develop && git pull origin \
```

이런식으로 설정하고 `$ git pull-all` 명령어로 한번에 여러 브랜치 pull을 할 수도 있다

> 참고로 alias 명령어는 중간에 `_` 이거 넣으면 안되니까 주의하자

# 2. hooks

어렵게 생각 할것 없이 그냥 특정 조건에 만족되면 실행되는 로직을 hook 이라고 이해하면 된다. git에서도 자체적으로 이런 Hooks들을 지원하는데 git 커밋 전후나 push 전후에 실행되는 로직을 스크립트로 관리 해줄 수 있게 지원해주고 있다.

### 2.1 대표적인 hooks 종류들

- pre-commit - 커밋 직전 실행되는 hook
- commit-msg - 커밋 메세지 쓰고 저장 직전에 실행되는 hook
- post-commit - 커밋을 완료 된 후 실행되는 hook
- pre-push - 푸시 직전에 실행되는 hook
- pre-rebase - 리베이스 직전에 실행되는 hook
- post-rewrite - 리베이스나 커밋을 수정한 직후 실행 되는 hook
- post-merge - 머지 직후 실행되는 hook

> pre로 시작되는 hooks는 해당 action을 reject 시킬 수도 있다

### 2.2 사용법

그냥 특정 위치에 지정된 파일명으로 스크립트 짜 넣으면 알아서 실행된다.

`.git/hooks` 디렉토리 하위에 위에 적어놓은 `hooks 종류` 이름으로 파일로 만들면 자동으로 실행된다. 주의점은 **실행 가능한 스크립트** 이어야 한다는 점이다. 뭐 특별히 어려운건 없고 그냥 `rwx` 옵션에서 x 옵션 잘 잇나 확인하면 된다.

```sh
#pre-commit
cho 'action pre-commit'
```

```
$ ls -l .git/hooks # 지정 된 위치에 hooks 잘 있나 확인
-rwxr-xr-x  1 (기본 파일정보) pre-commit

$ git add . # 변경 된 파일 전부 스테이지에 올림
$ git commit -m 'git hooks test' # git 커밋&커밋 메세지
action pre-commit # git hooks 스크립트에 저장된 echo 실행된거
[master 6f4b9fa] git hooks test
```

이런식으로 쉽게 사용이 가능하다.

### 2.3 단점

git hooks 관련해서 가장 큰 단점은 이 스크립트들이 .git 디렉토리 하위에 있어야 하다보니 버전관리하기가 힘들다. 그래서 실상은 개개인 별로 쓰거나 그냥 서드파티 라이브러리에 의존해서 많이 쓰인다. 또한 강제성이 없다는것도 큰 단점이다. 뭐 어찌어찌 버전관리하고 스크립트도 알아서 설치(지정된 위치로 이동or심볼릭 링크) 해놔도 그냥 로컬에서 빼버리면 그만이라서 정말 warning 정도로만 많이 쓰게 된다. 물론 git cloud 서버 측에서 관리 할수 있는 hook도 있다(pre-receive, update, post-receive). 단점이 너무 커서 애매하긴 하지만 일단 '이렇게도 사용 할 수 있다'는 정도로 마스터 브랜치는 rebase를 막는 `pre-rebase` 는 기록해 둔다.

```sh
#pre-rebase
branch="$(git rev-parse --abbrev-ref HEAD)"

if [ "$branch" = "master" ]; then
  echo "마스터 브랜치는 리베이스 허용 안함"
  exit 1
fi
```

```sh
$ git checkout master # master 브랜치로 이동
$ git rebase test-rebase # master 브랜치 리베이스 시도
마스터 브랜치는 리베이스 허용 안함
fatal: 리베이스 전 후크에서 리베이스를 거부했습니다.

# 반대로 test-rebase 브랜치를 master로 리베이스 시도
$ git checkout test-rebase
'test-rebase' 브랜치로 전환합니다
$ git rebase master
Successfully rebased and updated refs/heads/test-rebase. #다른 브랜치는 rebase 가능
```

> rebase는 히스토리 관리 측면에선 안좋으니까 master 브랜치는 rebase가 안되게 설정을 많이 해놓는다.

# 3. rebase 과정 중 merge 커밋 유지

git rebase는 파괴적인 작업이다. 이름에서 부터 알수 있듯이 re + base로 기존 작업의 히스토리를 직접적으로 덮어쓰기 형태로 작업하여 잘못하면 커밋을 날려먹을 수가 있다.

> 정확히는 내부적으로 직접 커밋을 수정하는게 아니라 새로운 커밋을 만들어 이어 붙인 다음, 접근할수 없는 이전 커밋은 자연스럽게 버려지는 구조이다.

개인적으로 rebase를 자주 사용하는데 특정 커밋을 합치거나(squash) 삭제, 수정 등등 case by case로 쉬운방법을 골라서 쓰고 있지만 이런 작업 중 중간에 merge commit 이 섞여들어가면 진짜 귀찮아진다(물론 내가 몰랐을때)

**상황 설명을 위한 기본 branch 상황**
![img1](/blog/media/git/rebase_merge/git-rebase-merge-1.png)

이 상태에서 rebase 작업을 하려다가 그냥 빠져나와도 git 그래프는 바껴있다.

```sh
$ git checkout master # master 브랜치에서 작업
$ git rebase -i HEAD~2 # HEAD를 기준으로 최근 2개 커밋을 핸들링 한다.

~~~
대충 대화식 화면. 별다른 수정 없이 :wq 를 통해 빠져나왔다고 가정
~~~
```

![img2](/blog/media/git/rebase_merge/git-rebase-merge-2.png)

그나마 별다른 수정없이 빠져나와서 눈치 챈거지, 추가로 작업도 하고 rebase 종료 & 이렇게 flat하게 바껴버리면 진짜 내가 뭘 한건지 인지하기 힘들다. 아무튼 이럴때 쓰는게 -r 옵션(—rebase-merges)을 써서 rebase 과정 중에 merge 커밋을 유지한다는 옵션을 쓰면 된다.

```
$ git checkout master
$ git rebase -i -r HEAD~2
```

이러면 옵션을 안줬을 때와 다르게 merge 커밋과 label(그냥 있는 그대로 라벨이다. 큰 의미는 갖지 않아도 됨) 정보가 함께 보여준다.
![img3](/blog/media/git/rebase_merge/git-rebase-merge-3.png)

이런 다음 다시 그대로 wq로 빠져나오면 rebase 전후로 달라진게 없다는걸 알 수있다.
조금더 연장선 & 응용 하면 merge 커밋만 지우거나 기능 브랜치에서 특정 커밋만 삭제 후 병합 한걸로 한방에 작업 된걸로 처리가 가능하다

**Case 1. 머지커밋 되돌리기**

![img4](/blog/media/git/rebase_merge/git-rebase-merge-4.png)

맨 밑의 merge commit(해시 아이디가 ed80daa 커밋. 이전에 작업한거 몇번 시도해서 첫번째 이미지랑 아이디가 달라진건 이해 부탁드립니다)을 d 옵션을 줘서 삭제하면 merge 자체를 되돌릴 수가 있다(근데 최근 merge 커밋 되돌리는건 reset이 압도적으로 편하다)

**Case 2. feature/fature-1 커밋의 특정 커밋만 재외하고 merge**

이미 머지 되어있는 상황에서 기능브랜치의 특정 커밋만 뺀 다음 merge하는 효과를 주고 싶을때
![img5](/blog/media/git/rebase_merge/git-rebase-merge-5.png)

이런식으로 `작업 2-2` 커밋을 삭제(d) 처리하면 이 커밋만 빼놓고 병합한 효과를 줄 수가 있다.

이렇게 종료 되면 아래 결과처럼 바껴잇다
![img5](/blog/media/git/rebase_merge/git-rebase-merge-6.png)

> 참고로 merge commit을 유지하는 기능으로 비슷한 역할을 하는 --preserve-merges 라는 옵션이 있는데 이건 deprecated 됬다. 라벨 정보가 오히려 익숙하지 않은 사람은 임시로 이걸 쓰는것도 괜찮다(사용법이 오히려 이게 더 직관적이라고 생각된다).
