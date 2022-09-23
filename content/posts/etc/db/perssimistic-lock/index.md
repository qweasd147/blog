---
title: "Mysql - 비관적 락"
date: "2022-09-23T01:49:22.280Z"
template: "post"
draft: false
category: "etc"
tags:
  - "rds"
  - "db"
  - "mysql"
description: "Mysql에서 데이터 충돌을 대비하여 직접적인 Lock을 걸고 싶을 때(Perssimistic Lock)"
---

## 1. Lock

Lock이란 같은 데이터를 동시에 필요로 할때 미리 데이터를 선점하여 동시에 읽기/쓰기를 방지하기 위해 사용된다. `Mysql`에서 Lock은 크게 `Mysql 엔진 레벨`과 `스토리지 엔진 레벨`로 나눌 수 있고, 이런 Lock 들은 목적에 따라 `Shared Lock` 또는 `Exclusive Lock` 이라고 하는 추가적인 특성을 가질 수 있다. 이러한 `Shared Lock`과 `Exclusive Lock` 두 Lock은 `비관적 락 (Perssimistic Lock)` 이라고도 한다.

> Perssimistic Lock은 물리적으로 리소스가 충돌이 이루어 질 경우가 많을 것이라 생각되어, 이에 대비해서 특정 리소스(일반적으로 테이블의 레코드라 생각하면 된다)에 정말 물리적인 Lock을 거는것을 말한다.

Lock 전체를 나열한건 아니지만 대략적으로 Lock 종류는 아래와 같이 나눠진다. `Perssimistic Lock`은 이러한 Lock 종류 중에 Lock 거는 속성 정도 라고 생각하면 된다.

### 1.1 스토리지 엔진 레벨(InnoDB)

- 레코드 락(Record Lock)
- 갭락(Gap Lock)

### 1.2 Mysql 엔진 레벨

- 글로벌 락(Global Lock)
- 테이블 락(Table Lock)
- 네임드 락(Named Lock)
- 메타데이터 락(Metadata Lock)

이름만 봐도 Lock을 거는 대상이 어느것인지 예측이 가능할꺼라 생각 된다. 기억해야 할 사항으로는 `Mysql엔진 레벨`의 Lock은 모든 `스토리지 엔진 레벨`의 Lock에 영향을 주고, `스토리지 엔진 레벨`의 Lock은 다른 스토리지 엔진에 영향이 없다는 점이다.

> 레코드 락은 `Shared/Exclusive Lock` 둘 다 사용 가능하지만 Gap Lock 같은 경우엔 항상 `Shared Lock`이 걸린다. 여기서 하고 싶은 말은 위에서 나열한 Lock과 `Perssimistic Lock`은 다르게 생각해야 한다는 점이다.

개발자가 어플리케이션을 개발할 땐 레코드 락을 자주 사용하게 된다. 그래서 아래 나올 설명/예시 들은 항상 레코드를 대상으로 거는 레코드 락이 대부분이다.

## 2. Exclusive Lock

`쓰기 락`이라고도 하는데 동일한 자원에서 읽기/쓰기 행위를 막는데 사용된다. 아래 이미지는 `for update`를 써서 `Perssimistic Lock`걸었을 때 상황을 설명한다.

![perssimistic-lock](/media/img_perssimistic-lock-insert.png)

- #1, #2 `트랜잭션1`, `트랜잭션2` 시작
- #3 `트랜잭션1`에서 `idx=1`인 데이터 `Perssimistic Lock` 걸고 조회
- #4 `트랜잭션2`에서 해당 데이터를 `Perssimistic Lock` 걸고 시도 -> waiting
- #5 `트랜잭션1`에서 `commit`을 해야 `트랜잭션2`에서 waiting이 풀리고 출력

참고로 `트랜잭션2`에서 밑에서 설명할 Shared Lock으로 시도해도 `트랜잭션1`이 종료 될 때까지 대기가 걸린다.

> 위의 예제로써 `for update`를 쓰긴 했지만 update, delete도 똑같이 쓰기 행위이므로 다 `Exclusive Lock`이 걸린다

![perssimistic-lock](/media/img_perssimistic-lock-update.png)

## 3. Shared Lock

`읽기 락` 이라고도 하는데, 동일한 자원을 여러 곳에서 읽는 행위는 허용하는 Lock이다. Lock이라고 무조건 모든 행위를 막아버리면 병목이 심해 질 수 있으므로, 이러한 상황을 방지하기 위해 `Shared Lock`을 쓰면 다른곳에서 동일한 리소스를 읽기는 허용 되어도, 쓰기는 불가능하도록 막기 위해 사용된다.

![perssimistic-lock](/media/img_shared-lock01.png)

- #1, #2 `트랜잭션1`, `트랜잭션2` 시작
- #3 `트랜잭션1`에서 `idx=1`인 데이터 `Shared Lock` 걸고 조회
- #4 `트랜잭션2`에서 해당 데이터를 `Lock` 없이 조회 시도 -> 바로 출력
- #5 `트랜잭션2`에서 해당 데이터를 `Shared Lock`으로 조회 시도 -> 바로 출력
- #6 `트랜잭션2`에서 해당 데이터를 `Exclusive Lock`으로 조회 시도 -> waiting
- #7 `트랜잭션1`에서 `commit`을 해야 `트랜잭션2`에서 `Exclusive Lock` waiting이 종료 되고 출력

> Shared Lock은 일단 Lock을 걸어도 다른곳에서 `Shared Lock`을 사용해도 읽기는 가능하다는 점에서 Exclusive Lock 보다 병목 현상이 줄어든다

추가로 아래 표는 `Shared Lock` 과 `Exclusive Lock` 관계를 보여주는데 동일한 리소스에 어떤 Lock에 걸려있는지에 따라 `Conflict`가 나는지, `Compatible`가 되는지 보여준다.

|     | X        | S          |
| --- | -------- | ---------- |
| X   | Conflict | Conflict   |
| S   | Conflict | Compatible |

> `Exclusive Lock`은 `X`, `Shared Lock`은 `S`로 표현하였는데 mysql 8.0 이상을 기준으로 `performance_schema.data_locks`테이블을 살펴보면 해당 락을 이렇게 표현한다. 이 테이블은 나중에 추가로 분석 예정

## 4. Gap Lock, Next Key Lock

트랜잭션 `Isolation`을 쓸 때 잠깐 설명한 적이 있는데 `Mysql`에선 이런 `Next Key Lock`을 통해 `Phantom Read`를 방지한다고 하였다. `Gap Lock`은 단독으로 사용되지 않고 `Next Key Lock`과 함께 사용되는 것인데 `Gap Lock`은 범위를 통한 `Lock`을 걸었을 때 레코드에 빈 데이터가 있으면 중간 `Gap`에 Lock을 걸어버리는걸 의미한다. `Next Key Lock`은 `Gap Lock` + 레코드 락이 합쳐진 락이라고 이해하면 된다.

![perssimistic-lock](/media/img_gap-lock.png)

- #1, #2 `트랜잭션1`, `트랜잭션2` 시작
- #3 `트랜잭션1`에서 `idx`값이 4~8인 레코드들을 `select ... for update`를 통한 조회
- #4 `트랜잭션2`에서 `idx` 값이 5인 레코드 입력을 시도하지만 바로 처리가 안되고 대기 상태가 된다
  > 물리적으로 진짜 존재하는 4,6,8은 `record lock`, 중간중간 값이 없는 5,7은 `gap lock`이 걸린다.
- #5 `트랜잭션1`에서 commit을 해야 `#4`의 대기상태가 풀리고 처리된다.

추가로 `gap lock`은 `쓰기 lock`이라고 이해 해야한다. `select ... for update`을 통해 5,7인 가상의 값들은 `gap lock`이 걸렸지만 `select`는 가능하다(출력되는건 당연히 없지만). `gap lock`은 insert를 방지하여 하나의 transaction내에서 동일한 결과, 즉 `Repeatable Read`를 보장한다.

## 6. Lock 주의사항

굉장히 중요한 얘기를 짧게 설명하자면 `Lock`은 항상 `index`를 대상으로 Lock이 걸린다는 점이다.

현재 테스트 대상으로 위와 같이 셋팅 된 `article` 테이블이 있고 `idx`만 PK로 지정되어 있다고 가정

```
| idx | title           | contents           |
| --- | --------------- | ------------------ |
| 2   | article 2 title | article 2 contents |
| 3   | article 3 title | article 3 contents |
| 4   | article 4 title | article 4 contents |
| 6   | article 6       | article content 6  |
| 7   | article 7       | article content 7  |
| 10  | article 10      | article10          |
| 12  | article 6       | article content 6  |
```

이런 상태에서 `title` 컬럼을 기준으로 Lock을 걸고, `performance_schema.data_locks`테이블을 조회하면 아래와 같이 나온다

```sql
# 1. title로 특정 row Locking
select * from article
where title = 'article 3 title' for update;

# 2. 현재 Lock Data 확인
select OBJECT_NAME, INDEX_NAME, LOCK_TYPE, LOCK_DATA from performance_schema.data_locks;
```

### 출력된 Lock Data

```
| OBJECT_NAME | INDEX_NAME | LOCK_TYPE | LOCK_DATA              |
| ----------- | ---------- | --------- | ---------------------- |
| article     | <null>     | TABLE     | <null>                 |
| article     | PRIMARY    | RECORD    | supremum pseudo-record |
| article     | PRIMARY    | RECORD    | 2                      |
| article     | PRIMARY    | RECORD    | 3                      |
| article     | PRIMARY    | RECORD    | 4                      |
| article     | PRIMARY    | RECORD    | 12                     |
| article     | PRIMARY    | RECORD    | 6                      |
| article     | PRIMARY    | RECORD    | 7                      |
| article     | PRIMARY    | RECORD    | 10                     |
```

결과를 보면 idx값이 2~14인 모든 레코드 들이 Lock이 걸린것을 확인 할수 있다.

> `INDEX_NAME`이 `PRIMARY` -> PK기반으로 Lock이 걸림 -> LOCK_DATA가 PK값을 의미한다.

> `LOCK_TYPE`이 `Table`인 `Lock`은 `Intention Locks`이라고 하여 `Table` 레벨에 Lock을 걸어버린다. 다른 트랜잭션에서 Lock을 확인하기 위해 사용되는데 일단 성능 최적화 정도로 이해하면 된다

> `LOCK_DATA`가 `supremum pseudo-record`인 Lock은 이것으로 인해 Mysql에서 `Phantom Read`를 방지한다.

이런이유로 Index가 걸리지 않은 컬럼을 Lock을 거는건 지양해야하고, Index가 걸린 컬럼이라도 `Unique Index`가 아니라면 또는 `Where` 조건에 따라 `Gap Lock`이 걸릴수도 있다는걸 같이 기억 해야한다. 혹시나마 lock을 걸고 싶으면 차라리 검색 후, pk(또는 unique index)기반으로 lock을 걸어야 원하는 record만 lock이 걸리도록 유도해야한다.
