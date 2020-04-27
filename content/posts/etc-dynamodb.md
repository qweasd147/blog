---
title: "Dynamo DB"
date: "2016-02-07T22:40:32.169Z"
template: "post"
draft: false
category: "etc"
tags:
  - "aws"
  - "nosql"
  - "db"
description: "aws의 No SQL 완전관리형 DB"
---

# Dynamodb

DynamoDB 공부하면서 배운 기본 사항 정리.

## 1. 기본은 Key & Value 형태의 DB
기본은 key value 형태의 `nosql` 형태의 DB 이다.

또한 데이터의 유일한 식별키인 `Primary key`가 **반드시** 존재한다.

## 2. Primary key, Partition key, Range key
### 2.1 Primary key
딱 부러지게 내가 지정한다기 보다는 유도를 하는 느낌. 기본적으로 테이블을 만들 시 `Partition Key`는 필수로 지정을 해야하는데 `Partition Key`만 지정하게 되면 일단 `Primary key`는 `Partition Key`가 된다. `Range key`도 함께 설정을 하게 된다면 `Primary key`는 `Partition key` + `Range key`를 조합한 혼합키 형태가 된다.

### 2.2 Partition key
`Range key`를 지정하지 않았다면 식별키(`PK`)가 된다. 하지만 식별키라고 그대로 이해하기 보단 이름 그대로 해당 Partition에 key값이라고 이해해야 한다. 만약 `GSI`를 따로 지정하지 않았다면 하나의 파티션(`Table`)안에 있는 key값이라 생각하고 `GSI`를 지정하게 된다면 여러 파티션(`Table`)안에 각각의  key 값들이라고 생각하면 된다. 이해가 어렵다면 우선 `Secondary Index`(`LSI`, `GSI`) 먼저 보는걸 추천.

### 2.3 Range key
DynamoDB는 별다른 설정을 안했다면 데이터를 추출 시 정렬이 불가능하다. 정렬된 형태로 값을 원할 시 `Range Key`또는 `범위 키`라고도 하는 옵션을 설정하면 그때서야 정렬이 가능하다. 하지만 `2.1`에서 설명한 대로 `Range key`를 설정하게 되면 하나의 레코드의 고유한 `Primary key`(RDB의 pk)는 `Partition Key` + `Range Key`가 되므로 이점을 주의해야 한다.

## 3. Query, Scan
### 3.1 scan
scan은 테이블의 모든 데이터를 찾는 형태고 지정된 표현식으로 필터링 하여 값을 가져올 수가 있다. 구지 `Primary key`값을 조건으로 검색을 안해도 값을 구할 수가 있다. 이때 가져오는 값은 정렬은 불가능한걸로 알고 있다.

### 3.2 query
주어진 범위(partition) 내에서 해당 데이터만 찾기 때문에 검색이 빠르다. 인덱스를 지정해서 해당 범위만 찾게 할 수도 있어서 여러모로 유용하지만 단점으로는 당연히 `주어진 범위`값을 줘야하는데 이 값이 `Partition Key`이다. 만약 `Partition key`값을 일반 RDB의 `PK`값(고유한 값)을 사용한다면 꽤나 난감한 상황이 발생된다. 조건에 맞는 데이터를 검색하는데 `PK`를 알아야하는 상황이 발생한다.

## 4. LSI, GSI
### 4.1 LSI
기본 테이블의 `Partition Key`값을 유지하고, `Range Key`만 바꿔서 인덱싱을 하는 형태. 읽기, 쓰기 비용이 추가로 발생하진 않지만 활용도 면은 썩 좋진 않은거 같다.

### 4.2 GSI
테이블 안에 테이블을 만든다고 생각하는게 편하다. 새롭게 `Partition key`를 지정하고, 옵션으로 `Range Key` 지정이 가능하다. 테이블 안에 테이블을 만든다고 했는데 진짜로 내부적으로 그렇게 사용해서 GSI를 지정하면 쓰기 비용이 훨씬 증가한다. 데이터를 삽입할 때 '테이블 안에 테이블'에 어떤값을 저장할지 지정해 줄 수 있다. partition & range key만 저장(`KEYS_ONLY`)하거나 특정 attribute만 저장(INCLUDE), 아니면 저장되는 모든 데이터를 지정(`ALL`)할 수도 있는데 물론 저장하는 데이터를 많이 지정할 수록 쓰기비용이 더욱 늘어나고 이러한 옵션을 `Projection` 또는 `Projection type`이라고 한다.

장점으로는 `Query`를 요청 시 `Partition key`값을 필수로 요구하는데 테이블의 공통된 값 아무거나 `Partition Key`로 묶어 `GSI`를 지정하면 내가 지정한 `Range Key`값에 따라 정렬이 보장된 조회할 수가 있다(쿼리 요청 시 `GSI` index name을 넘겨주기만 하면 된다.)