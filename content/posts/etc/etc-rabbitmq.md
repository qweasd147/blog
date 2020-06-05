---
title: 'RabbitMQ'
date: '2020-05-26T00:36:37.672Z'
template: 'post'
draft: false
category: 'etc'
tags:
  - 'messagequeue'
  - 'mq'
  - 'rabbitmq'
description: '메세지 큐를 사용하는 이유 및 사용 방법. with RabbitMQ'
---

# RabbitMQ.

메세지 큐 중 하나로 대표적으로 kafka, rabbitmq가 있지만 여기선 rabbitmq 위주로 설명할 예정

여기서 설명할 내용 및 샘플은 [rabbitmq-sample](https://github.com/qweasd147/StudyNote/tree/master/springboot/rabbitmq) 여기서 확인 가능

# 1. 메세지 큐

여러 어플리케이션에서 메세지를 주고 받는 시스템. 간단히 설명하면 일종의 DB를 외부에 두고 여러 어플리케이션에서 해당 DB에 데이터를 교환하는 시스템이다.
일종의 DB라고 설명했지만 DB와 큰 차이점은 각 메세지를 주고받는데 목적이 있고, 내부 처리 방식은 전혀 다른 점이다.
메세지 큐를 사용할 수도 있는 곳을 예를 들면 대용량 알림 시스템이다. 예를 들어 10만명의 사용자한테 이메일을 보내야 한다고 가정할때 메세지 큐를 사용 안한다면 대략적으로 다음과 같은 플로우를 거쳐야 할 것이다.

1. DB에서 사용자 정보 조회 및 변수에 저장
2. 이메일 대상 필터링(validation 포함)
3. 이메일 발송

이러한 작업은 주기적으로 cron이 돌면서 처리해야할 정보가 있나 체크도 해야할 것이며(감시해야하는 프로세스가 주기적으로 돌고 있어야됨), `3. 이메일 발송`은 뭐 자바를 기준으로 `java 8의 Stream`기반으로 처리하던가 푸시 기반인 `RxJava`등을 사용 할 수도 있을 것이다. 하지만 결국 문제는 이 모든 작업이 하나의 어플리케이션에서 수행이 된다는 점이다.

만약 처리중 예상하지 못한 에러가 발생한다면? 뭐 `RxJava`에서는 알림을 받을 수도 있을 것이다. 그럼 만약 너무 많은 데이터를 어플리케이션에 담고 있어서 처리 중간에 그냥 어플이 죽어버렸다면? 어플이야 다시 복구 하면 되지만 중간에 처리되던 과정들은 통째로 다 날라가게 된다. 2번 과정을 거의다 끝내고 3번이 남았는데 다시 1번 부터 수행해야 할것이고, 더 큰 문제는 많은 사용자들이 메일을 중복해서 받을 수도 있다는 점이다.

이러한 점을 봤을때 메세지큐를 사용함으로써 생기는 이득은 아래와 같다.

1. 기본적으로 구독형 방식(폴링 방식x)
2. 메세지(ex. 처리해야할 정보)를 외부에 저장
3. 일단 큐에 담고 비동기로 처리 가능
4. 여러 어플리케이션에서 처리 또는 consumer 개수 증가 등의 확장이 쉬움(분산 처리 가능)
5. 재처리 및 실패 처리가 쉬움

# 2. 기본 용어

### 2.1 Queue

메세지를 담는 큐

### 2.2 Exchange

메세지를 받아 어느 큐로 옮길지 정한다. Exchange 종류에 따라 똑같은 `Routing Key`라도 다른 큐에 담길 수 있다.

### 2.3 Binding

exchange와 queue를 연동(실질적인 Routing key 패턴과 exchange를 연동)

**참고** 메세지는 생성 후 바로 큐로 옮기는게 아닌, `Exchange`를 한번 거쳐서 전달된다. `Exchange` 종류와 `Binding`에 따라 큐가 결정 & 전달한다.

### 2.4 Routing Key

가상 주소로, 라우팅 시 필요한 key값이다.
예를 들어 '`Routing Key`값이 `r1`이면 `Exchange1`로 가라' 이런식으로 라우팅 하는데 사용

# 3. DLX(Dead Latter Exchanges)

> 메세지 처리 과정에서 에러가 발생한 메세지를 관리할 exchange

만약 메세지를 처리 중 에러가 발생하는 경우가 발생 할 수도 있다.`RabbitMQ`의 기본 셋팅은 메세지 처리중 에러가 발생하면 다시 큐로 집어넣고 다시 메세지 처리를 시도하게 된다.
근데 만약 절대 처리할 수 없는 메세지라면? 재처리 과정이 무한하게 반복될 것이다. 이런 케이스를 막기위해 만약 에러가 발생한다면 아래와 같이 처리되도록 유도한다.

1. 메세지 처리 중 에러 발생
2. n번 재시도
3. 그래도 실패 시, 처리가 불가능 한 메세지라 판단하고 DLX로 보냄
4. 실패 전용 큐로 해당 메세지로 보낸 후 처리

메세지 처리 시도 회수와 dlx 정보는 메세지의 헤더에 담겨지고, `DLX`에서 이러한 메세지들을 처리할 목적의 큐로 보내도록 셋팅해놓는다.
보통 이러한 메세지는 메세지 정보와 알림 정보만 개발자에게 알려주도록 셋팅한다(정상적인 처리가 불가능하니까).

`Spring Boot` + `RabbitMQ` 조합에선 프로퍼티 파일에서 큐를 정의할 때 아래와 같이 쉽게 셋팅이 가능하다.

큐 셋팅

```java
  @Bean
  public Queue queue() {

      final Map<String, Object> args = new HashMap<>();

      args.put("x-dead-letter-exchange", "dlx exchange 이름");
      args.put("x-dead-letter-routing-key", "실패 라우팅 키");
      args.put("x-message-ttl", 2000); //2초

      return new Queue(QUEUE_NAME, true, false, false, args);
  }
```

위와 같이 셋팅 시, ttl(Time to Live)값을 넘기는 메세지는 `DLX`로 보내지게 된다.

# 추가 설명 예정사항(TODO)

1. Exchange 종류 및 routing
2. 메세지 구조(헤더 정보 위주)
3. TTL 좀 더 자세히 설명
4. 메세지 실패 처리(retry interceptor)
