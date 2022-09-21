---
title: "Mysql - Isolation"
date: "2022-08-26T09:08:34.903Z"
template: "post"
draft: false
category: "etc"
tags:
  - "rds"
  - "db"
  - "mysql"
description: "RDB(Mysql)에서 Transaction의 Isolation 종류 및 설명"
---

## Isolation

`isolation`은 트랜잭션 간의 격리 수준을 말한다. `lock`이랑 많이 헤깔릴 수도 있는데 `lock`은 특정 데이터를 대상으로 `lock`을 걸어 읽기 또는 쓰기 동시접근을 막는거지만 `isolation`은 트랜잭션 간 데이터 접근 수준을 정의하는걸 말한다(트랜잭션 그 자체 집중 -> 비지니스 로직과 연관된다).

쉽게 말해 일반적으로 말하는 `Lock`은 대상이 데이터, `isolation`은 대상이 트랜잭션이 되고, `isolation`의 레벨을 높게 잡으면 Lock과 동일하게 처리량이 떨어지게 된다.

## 1. READ UNCOMMITTED

커밋 안 된 것을 다른 트랜잭션에서 읽을 수 있다. 사실상 `Isolation`가 없는 상태이다.

먼저

```sql
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
select @@session.transaction_isolation;
```

를 통해 세션의 `transaction isolation`를 바꿀 수 있다.

### 1.1 문제점 - Dirty Read

커밋 안된 것을 읽을 수 있다보니, `rollback` 되어버리면 해당 데이터는 정합성 문제가 발생 될 수 있다. 이런 상황을 `Dirty Read`라고 한다.

![read-uncommited-img](/media/img_read-uncommited.png)

- #1, #2 `트랜잭션1`, `트랜잭션2` 시작
- #3 `트랜잭션1`에서 데이터 입력
- #4 `트랜잭션2`에서 해당 데이터를 읽을 수 있음 -> 비지니스 로직에 관여 될 수 있음(이 데이터를 2차, 3차 가공해서 다른곳에 저장한다면?)
- #5 `트랜잭션1`에서 rollback -> 기존 insert 된 데이터 없어짐
- #6 `트랜잭션2`에서 데이터가 다시 사라짐 -> 기존 비지니스 로직에 정합성이 깨질 수도 있음

## 2. READ COMMITTED

커밋이 된 것은 읽을 수 있다. 적어도 이것만으로도 크리티컬한 문제는 해결된다(Dirty Read는 꽤나 크리티컬 할 수가 있다).

> `Dirty Read`는 커밋이 안된 것도 읽을 수 있어서 문제가 발생하는데, `READ COMMITTED`로 설정하면 커밋 된 것만 읽으니까 이 문제는 해결 된다.

```sql
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

### 2.1 문제점 - Non Repeatable Read

![img_read-commited](/media/img_read-commited.png)

- #1, #2 `트랜잭션1`, `트랜잭션2` 시작
- #3 `트랜잭션1`에서 데이터 입력
- #4 `트랜잭션2`에서 해당 데이터를 못읽음 -> `dirty read` x
- #5 `트랜잭션1`에서 `commit`
- #6 `트랜잭션2`에서 출력됨
- #7 `트랜잭션1`을 열어서 데이터 삭제 후, `commit`
- #8 `트랜잭션2`에서 해당 데이터가 사라진다.

> `Dirty Read`는 해결 되었지만, 하나의 트랜잭션(`트랜잭션2`)에서 외부 요인에 따라 다른 select 결과가 나온다는 점에서 데이터 정합성이 깨질 수가 있다. 이런 문제를 `Non Repeatable Read`라고 한다.

## 3. REPEATABLE READ

트랜잭션 단위로 동일한 select 조건이라면 동일한 결과가 나올 수 있게 보장 해준다. 자연스럽게 `Non Repeatable Read`문제가 해결 되지만 DB 내부적으로 `트랜잭션 ID`에 따른 `snapshot`을 떠서 관리하고, 이 버전보다 높은 결과는 반영하지 않게 된다(조회 불가). 이에 따라 DB 부하가 있을 수 있다.

```sql
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

### 3.1 문제점 - Phantom Read

먼저 데이터 구조

```
| idx | title           | contents           |
| --- | --------------- | ------------------ |
| 4   | article title 4 | article contents 4 |
| 5   | article title 5 | article contents 5 |
| 8   | article title 8 | article contents 8 |
| 9   | article title 9 | article contents 9 |
```

![img_phantom-read](/media/img_phantom-read.png)

위의 설명해서 `snapshot`을 통해 `Repeatable Read`을 서포트 한다고 하였다. 문제는 update를 하려고 하면 해당 `snapshot`의 대상 row를 갱신 시켜 버린다. 따라서 동일한 트랜잭션(위 이미지에서 `transaction2`)이라고 하더라도 update를 목적으로 하는 `for update` 를 통해 조회하면 가장 최신의 row가 조회 된다. 이런식으로 하나의 트랜잭션 내에서 **똑같은 쿼리**로 조회해도 결과적으로 `Non Repeatable Read`가 일어나는 현상을 `Phantom Read` 라고 한다.

- #1, #2 `트랜잭션1`, `트랜잭션2` 시작
- #3 `트랜잭션2`에서 5~9를 `select ... for update`을 통한 조회(5,8,9 조회 됨)
- #4, #5 `트랜잭션1`에서 5~9 사이에 있는 6의 값을 입력 및 `commit`
- #6 `트랜잭션2`에서 **똑같은 쿼리**로 조회 시 `6`의 값이 추가되어 조회됨 -> `Phantom Read`

### 3.1.2 Phantom Read 발생 조건

`mysql`에선 `REPEATABLE READ`라고 `Phantom Read`가 발생하지 않는다. 이유는 `gap-lock & next-key-lock`을 통해 `Phantom Read`를 방지하고 있다(차후 다른 포스트 or 현재 포스트를 업데이트 하여 설명 할 예정) 위의 현상은 `mysql` 설정값을 변경하여 `next-key-lock` 옵션을 꺼서 재현 해보았다.

**설정파일 옵션**

```
[mysqld]
innodb_locks_unsafe_for_binlog=1
```

`innodb_locks_unsafe_for_binlog=1` 설정을 통해 `next-key-lock`을 끌 수가 있고, 이 옵션은 실행 중에 바꿀 수는 없고 바꿀려면 설정값을 바꾼 후, DB를 재시작해야 한다.

> 사소한 문제로 이 `innodb_locks_unsafe_for_binlog`옵션은 `mysql 5.6.3` 부터 `deprecated` 되었다. 그 이후 `mysql 8.0`부터 코드 상에서 제거되어 작동되지도 않으므로, 이 옵션을 적용하고 싶으면 그 보다 낮은 버전에서 테스트 해봐야한다.

### 3.2 문제점 - 공유되지 않는 `snapshot`

`Phantom Read`에서 동일한 쿼리를 실행 했을때, 조건에 따라 다른 결과값이 나올 수 있다고 하였다. `mysql`에선 `next-key-lock`을 통해 `Phantom Read`를 방지한다고 하였지만 이것도 결국 `lock`이 걸어서 방지하는 방법이라 `lock`이 풀리면 `snapshot`이 새롭게 생성되어 관리된다.

![img_repeatable-read](/media/img_repeatable-read.png)

- #1, #2 `트랜잭션1`, `트랜잭션2` 시작
- #3 `트랜잭션1`에서 데이터 입력
- #4 `트랜잭션2`에서 일반 `select`를 통해 데이터 조회 -> 출력되지 않음
- #5 `트랜잭션1`에서 `commit`
- #6 `트랜잭션2`에서 일반 `select`를 통해 데이터 조회 -> 출력되지 않음 (`repeatable read`)
- #7 `트랜잭션2`에서 `select ... for update`를 통해 데이터 조회 -> 출력됨

`#5` 전후로 `트랜잭션2`에서 `select`와 `select ... for update` 쿼리는 동일한 레코드 11을 바라보지만 결과값이 달라지는걸 확인할수 있다.

> 이걸 `Phantom Read`라고 설명하는곳도 있지만 그럼 mysql `REPEATABLE READ`에선 발생하면 안된다. 하지만 `isolation` 레벨과 무관하게 발생되기도 하고 발생 조건도 조금 다르다. `Phantom Read`는 **동일한 쿼리**를 실행해도 결과가 달라지는점, 이건 `snapshot`이 공유되지 않아 별도로 발생하므로 다르게 생각하는게 맞지 않을까 생각된다.

## 4. SERIALIZABLE

모든 `select` 쿼리에 최소 `shared lock`을 걸어버린다. 즉 `transaction 1`에서 쓰기 작업 중(`insert`, `delete`, `for update`)이라면 다른 트랜잭션에선 해당 데이터 조회가 불가능하다(`locking`)

```sql
SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

![img_serializable](/media/img_serializable.png)

`transaction 1`에서 `#1`, `#3` 쓰기 작업 중이라면 `transaction 2`에선 `for update`가 아닌데도 `lock` 대기가 걸려버린다(`#4`). `transaction 1`에서 commit을 해야 비로소 `wait`가 끝나고 데이터 조회가 가능하다.

> `select ... for update` 단계는 도전도 안했다. 똑같이 lock이 풀릴때 까지(commit 될 때 까지) waiting 상태가 된다.

### 4.1 문제점 - 동시성

모든 select 쿼리에 최소 `shared lock`이 걸리다보니까 동시성이 떨어져 병목현상이 심하게 발생 할 수가 있다.

> `shared lock`과 `exclusive lock`을 알아야 `SERIALIZABLE`의 정확한 이해가 가능하다. 추후 lock 관련해서 따로 포스트 예정
