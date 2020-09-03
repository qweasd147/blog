---
title: 'Spring Cloud'
date: '2020-09-03T00:55:55.498Z'
template: 'post'
draft: false
category: 'etc'
tags:
  - 'spring'
  - 'cloud'
  - 'msa'
description: 'MSA 환경에서 여러 어플리케이션을 효과적으로 개발 및 관리'
---

여기서 설명할 내용 및 샘플은 [spring-cloud 샘플](https://github.com/qweasd147/spring-cloud) 여기서 확인 가능

샘플을 실행시키기 위해 필요한거

- git
- docker
- docker compose

실행 방법

```
$ git clone https://github.com/qweasd147/spring-cloud.git
$ ls ./spring-cloud
$ docker-compose up
```

# 1. MSA

각각의 용도에 맞게 하나의 큰 어플리케이션이 아닌, 여러개의 작은 어플리케이션으로 쪼개어 변경 및 조합을 쉽게 만든 아키텍쳐

## 장점

### 확장성이 좋다

하나의 큰 어플리케이션으로 만들었다고 가정하면 특정 구간 병목현상을 발견하여 어플리케이션을 이중화 하면 많은 리소스를 사용하게 된다. 하지만 여러 어플리케이션으로 나눈 상태에서 특정 어플리케이션만 인스턴스를 늘리는 작업은 상대적으로 적은 리소스만 필요하게 된다.

### 신기술 적용이 좋다

기존 레거시 프로그램을 만지다 보면 괜찮다고 생각되는 패턴, 라이브러리 등을 적용을 하고 싶어도 전혀 예상하지 못한곳에 악영양을 줄 수가 있어 고민하게 된다.
이럴때 차라리 여러개의 작은 어플리케이션 형태라면 이러한 부분을 검토하는 시간도 빠르고, 기존 레거시와 일관성 때문에 생길 수 있는 문제들을 고려하지 않아도 된다.

## 단점

### 성능

MSA는 성능까진 크게 고려하지 않는다. 물론 어느정도 고려 대상이긴 하지만 `Monolithic Architecture`보단 느려질 가능성이 높다.

### Transaction 처리

트랜잭션이 보장되어야 하는 작업의 경우, 여러 어플리케이션을 걸쳐 요청한 request를 다시 되돌리기는 힘들다. 이런건 전략적으로 잘 구성해놔야 하는데(`보상 트랜잭션` 등) 이러한 요소 자체가 많은 리스크를 가질수 밖에 없다.

# 2. Spring Cloud

`Spring Cloud`는 이런 MSA 환경에서 각 서비스 간의 통신과 공통 부분 등을 쉽게 구축 및 운영을 도와주는 도구이다. 자주 쓰는 도구로는 아래와 같은 것들이 있다.

1. Zuul (API Gateway)
2. Hystrix (Circuit Breaker)
3. Eureka (Discovery Server)
4. Ribbon (L7 Load Balancing)
5. Config Server
6. Spring Cloud Bus(notify configuration)

## 2.1 Zuul (API Gateway)

AWS의 `API Gateway`를 사용 해봤다면 바로 그 용도를 짐작 할 수가 있다. `entry point`로 지정하여 request를 분석하여 특정 어플리케이션으로 라우팅이 가능하고(웹서버의 `reverse proxy`), 인증 기능을 추가 해 줄 수가 있다. 또한 `AWS API Gateway` 이러한 기능이 있는지 모르겠는데 아래와 같이 `stripPrefix`옵션을 주면 `path`값은 대상 어플리케이션에서 제외 하고 보내주는 기능이 있는데 이 기능이 은근 유용할때가 많다.

```
zuul:
  routes:
    auth:
      path: /auth/**
      serviceId: auth
      stripPrefix: true
      url: http://localhost:8082
```

예를 들어 위의 설정 처럼 걸어놓으면 클라이언트가 `https://domain/auth/find/me`로 요청을 하면 `auth` 어플리케이션의 `https://domain/find/me`로 연결시켜준다. 물론 `false`면 요청 url 그대로 포워딩 해준다.

또한 이러한 기능들을 추가로 커스터마이징 할 수 있어 자바 개발자는 정말 친숙하게 사용할 수가 있다.
(`AWS`의 `API Gateway`가 좋은 점은 생략!)

한가지 아쉬운 점은 현재 최신 버전 `spring-cloud-starter-netflix-zuul`을 쓰면 기본 `WAS`로 `Tomcat`을 사용하고 있다. 아무래도 `API Gateway`는 성능적으로 민감 할 수가 있어서 `Tomcat` 보다는 그래도 `Netty`(`undertow`)를 쓰는게 어떨까 싶다.

`Spring cloud Zuul`의 연관 모듈인 `zuul core`라는 녀석이 있는데 이게 `1.x` 버전에선 `Tomcat`을 쓰고, `2.x` 버전에션 `Undertow`를 쓰도록 바뀌어서 WAS를 `Undertow`로 바꾸고 싶으면 `zuul core` 버전을 바꾸던가 아니면 `Tomcat`을 제외 시키고 `Undertow`를 추가하던가 선택하면 된다.

## 2.2 Hystrix (Circuit Breaker)

- Circuit Breaker
  - Open & Close
  - fallback
- request 격리 방법
  - Thread-Pool
  - Semaphore

TODO
