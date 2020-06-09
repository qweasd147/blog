---
title: 'Git Rebase'
date: '2020-06-09T00:50:06.996Z'
template: 'post'
draft: false
category: 'etc'
tags:
  - 'git'
  - 'rebase'
description: '소스를 병합 하고 싶을때, 아니면 최신 코드와 동기화 하고 싶을 때'
---

# Rebase

## 1 fast-forward

`master`브랜치에서 새로운 브랜치를 생성하여 기능 추가 후, 다시 `master`브랜치로 합칠 때 새로운 브랜치를 생성하는 시점 이후로 `master`브랜치 변경이력(`commit`)이 없으면 충돌 날 이유도 없고, 새로운 브랜치가 그대로 흡수되어 병합이 가능하다. 이러한 상태를 `fast-forward`상태, `fast-forward`상태에서 병합 시 `fast-forward`병합 이라고도 한다.

> https://backlog.com/git-tutorial/kr/stepup/stepup1_4.html

또한 `fast-forward`상태에서 브랜치를 병합하면 git graph가 여러 갈래로 나누어지는 일 없이 깔끔하게 합쳐진다.

## 2 rebase를 하는 이유

`fast-forward`상태 라면 브랜치를 합칠때 신경 쓸 요소가 없지만 `fast-forward`상태가 아니라면 `merge`시 git graph 모양이 마음에 안들 수가 있다.
브랜치가 많아지고, 새로운 브랜치에서 작업량(커밋 수 & 기간)이 많아지면 그래프도 한눈에 안들어오고 어지럽게만 보인다. 이럴때 내가 작업한 것을 `fast-forward`상태로 만들어 병합 시키면 git graph가 여러 갈래로 나누어지지 않고 깔끔하게 관리가 가능하다. 결과적으로 병합을 목적으로 `rebase`작업은 `master`브랜치와 새로운 기능 추가용 `func1`브랜치가 있을 때 `func1`브랜치의 시작지점(브랜치 생성 시점의 커밋)을 `master`브랜치의 가장 최근 커밋 지점으로 base를 재정의(git 커밋 이력을 수정)하여 `fast-forward`상태로 만드는 작업이다.

## 3 merge와 rebase 차이점 및 과정. with source tree

### 3.1 상황 설명을 위한 기본 브랜치 상황

![img1](/media/git/rebase/img01.PNG)

진행 과정을 위한 브랜치 상황 셋팅

- 일반적인 master 브랜치를 가정한 브랜치(git_m)와 기능 추가를 위한 서브 브랜치(git_s)를 추가
- git_m에서 일정 커밋을 쌓은 뒤 git_s 브랜치를 생성 후 각자 적당한 커밋을 추가

### 3.2 merge 방법

rollback시 기존 브랜치를 유지하고 헤깔리지 않게 하기위해 `git_s`와 이력이 똑같은 새로운 브랜치 `git_s_for_merge` 브랜치를 추가. `merge`용 `git_s` 브랜치는 `git_s_for_merge`

![img2](/media/git/rebase/img02.png)

**현재 브랜치를 git_m** 상태에서 원하는 브랜치 우클릭->병합

![img3](/media/git/rebase/img03.png)

> 만약 충돌 시, 충돌난 파일을 적절히 수동으로 병합 후, `스테이지에 올라간 파일`에서 해당 파일 우클릭->`충돌해결`->`해결된 것으로 표시` 클릭 후 다시 커밋

#### 주의사항

현재 브랜치가 `git_m`에서 `git_s_for_merge`를 우클릭하여 병합하면 병합 되어진 대상 브랜치(즉 변하는 브랜치)는 `git_m`으로, `git_s_for_merge`는 아무런 변화가 없다.

반대로 현재 브랜치가 `git_s_for_merge`에서 `git_m`를 병합하면 병합 되어진 대상 브랜치(변하는 브랜치)는 `git_s_for_merge`가 된다. 이는 현재 `git_s_for_merge`에서 개발 중, 중간에 마스터 브랜치(`git_m`)로 `push`된 소스 파일들을 `git_s_for_merge`로도 업데이트(동기화) 하는 효과를 준다.

![img4](/media/git/rebase/img04.png)

추가로 이 방금 말한 방법대로 `git_m`내용을 `merge` 후 다시 `git_m`에서 `git_s_for_merge`를 `merge`할 수도 있다. 병합 과정중 특별한 일이 없다면 그냥 `git_m`에서 `git_s_for_merge`를 병합한 효과와 같다. 물론 이러한 방법은 history가 헤깔리니까 추천은 x

![img6](/media/git/rebase/img06.png)

### 3.3 rebase 방법

rollback시 기존 브랜치를 유지하고 헤깔리지 않게 하기위해 `git_s`와 이력이 똑같은 새로운 브랜치 `git_s_for_rebase` 브랜치를 추가. `rebase`용 `git_s` 브랜치는 `git_s_for_rebase`

**rebase 시 주의!**
rebase는 말 그대로 브랜치의 base를 재정의하는 작업이기 때문에 `git_s_for_rebase`브랜치를 활성화 하고 작업해야됨. 중요한 내용이니까 다시 상황 및 목적을 정리하자면

1. 마스터 브랜치(`git_m`)에 새로운 기능을 개발한 브랜치(`git_s_for_rebase`)내용을 추가 하고 싶음
2. history 및 그래프를 깔끔하게 관리하고 싶어, `git_m`와 `git_s_for_rebase`브랜치 관계를 `fast-forward`상태로 만들고 싶음(`rebase` 사용 목적 1)
3. 그러기 위해선 `git_s_for_rebase`브랜치 base를 `git_m`의 가장 최근 `commit` 된 곳으로 맞추어야됨(`rebase` 사용 목적 2)
4. `git_s_for_rebase`를 수정해야 하는 작업이므로 `git_s_for_rebase`를 활성화 한 상태에서 `git_m`을 선택하여 `rebase`

![img7](/media/git/rebase/img07.png)

이러한 이유로 위의 그림대로 rebase를 하려고 하면 경고창이 나타난다. 경고창 말대로 `rebase`는 해당 프로젝트의 git history를 수정하는 작업(base 수정) 하는 작업이므로 해당 브랜치를 누군가가 작업을 하고 있는 중에 `rebase`시 history가 꼬여 귀찮아 진다.

![img8](/media/git/rebase/img08.png)

`확인` 버튼을 눌러 rebase를 진행 중, 혹시나마 파일간 충돌이 일어나면 꽤나 귀찮아 진다.

![img9](/media/git/rebase/img09.png)

위 그림은 일부로 충돌을 낸 상황으로 브랜치를 새로 생성 후 `git_m`에서 `temp.txt`를 수정 후 커밋(git*m에서 커밋 5), 이후 `git_s`에서 똑같은 파일을 2번 수정 후 커밋(git_s에서 커밋 2, git_s*에서 커밋 3)을 하여 충돌을 유발시킨 상황 & 이미지 이다.

`rebase` 충돌이 귀찮은 이유는 충돌난 파일을 가지고 있는 커밋들(위 상황에서 git*s에서 커밋 2, git_s*에서 커밋 3)을 모두 적절히 해결을 해주어야 한다. 수정 중 모두 똑같은 내용으로 수정하면 commit history가 이상해 지니까 이 점을 고려해서 적절하게 수정 해주어야 한다. `gits_s에서 커밋 2`, `gits_s에서 커밋 3`의 `temp.txt`파일 내용을 똑같게 만들고, git message는 다른 상황이라면 나중에 git 이력을 보며 수정사항을 확인할 일이 생기면 더 헤깔리는 일이 생길 것이다.

이러한 점을 고려하면서, `rebase`를 계속 하자면 위 그림에선 (git*s에서 커밋 2)에서 충돌난 파일을 적절히 수정하고 `source tree`의 `액션`->`재배치 계속`(또는 `$ git rebase --continue` 명령어 입력) 후 (git_s*에서 커밋 3)에서 충돌난 상황을 또 적절히 해결한 후에 다시 `액션`->`재배치 계속`(또는 `$ git rebase --continue` 명령어 입력)을 입력해야만 아래 그림처럼 정상적으로 `rebase`가 완료된다.

![img10](/media/git/rebase/img10.png)

위 그림은 어차피 rollback을 위한 브랜치를 추가한거니까 `git_s`를 신경쓰지 말고(아예 없다고 가정) `git_s_for_rebase`브랜치가 정상적으로 `fast-forward` 상태, 즉 `git_m`의 가장 최근 커밋으로 base가 변경 된 상태를 확인 할 수가 있다. 또한 커밋한 날짜도 변경 된 것도 같이 확인이 가능하다

## 그 외 사용 용도

rebase의 사용 목적으로는 위에서 설명한 소스 병합 말고도 커밋 삭제, 수정 커밋 합치기(`squash`), 수정 일시, 작업한 사람 정보(아이디, 이메일) 수정 등 많은 용도로 사용된다.

하지만 이러한 작업들은 수정하는 개념이라기 보단 기존 정보를 삭제하고 새로운 정보를 원하는 위치에 끼워 넣는 작업이다.
