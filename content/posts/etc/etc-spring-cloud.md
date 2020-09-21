---
title: 'Spring Cloud - 기본 설명'
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
2. Eureka (Discovery Server)
3. Ribbon (L7 Load Balancing)
4. Hystrix (Circuit Breaker)
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

예를 들어 위의 설정 처럼 걸어놓으면 클라이언트가 `https://domain/auth/find/me`로 요청을 하면 `auth` 어플리케이션(`serviceId`)의 `https://localhost:8082/find/me`로 연결시켜준다. 물론 `false`면 요청 url 그대로 포워딩 해준다.

또한 이러한 기능들을 추가로 커스터마이징 할 수 있어 자바 개발자는 정말 친숙하게 사용할 수가 있다.

(`AWS`의 `API Gateway`가 좋은 점은 생략!)

한가지 아쉬운 점은 현재 최신 버전 `spring-cloud-starter-netflix-zuul`을 쓰면 기본 `WAS`로 `Tomcat`을 사용하고 있다. 아무래도 `API Gateway`는 성능적으로 민감 할 수가 있어서 `Tomcat` 보다는 그래도 `Netty`(`undertow`)를 쓰는게 어떨까 싶다.

`Spring cloud Zuul`의 연관 모듈인 `zuul core`라는 녀석이 있는데 이게 `1.x` 버전에선 `Tomcat`을 쓰고, `2.x` 버전에선 `Undertow`를 쓰도록 바뀌어서 WAS를 `Undertow`로 바꾸고 싶으면 `zuul core` 버전을 바꾸던가 아니면 `Tomcat`을 제외 시키고 `Undertow`를 추가하던가 선택하면 된다.

## 2.2 Eureka (Discovery Server)

라이브 환경에선 어느정도 트래픽이 많으면 서버 이중화는 흔한 일이다. 단순 서버 인스턴스를 늘리고 해당 서버를 사용하는 다른 서버에 인스턴스 정보를 넘겨주고, 사용하는 쪽에서 적당히 라운드 로빈(로드벨런싱) 해주면 부하 분산을 위한 서버 다중화 작업은 끝나게 된다. 하지만 말은 쉽게 했지만 이러한 작업은 고려할께 많고 각 서버마다 인스턴스가 늘어가면서 모니터링 및 관리가 힘들어 질 수 밖에 없다. 이러한 귀찮은 작업을 Spring Cloud에서 `Discovery Server`역할을 담당하는 Eureka가 하게 된다. 유레카 서버를 올리고 다른 어플리케이션(`Eureka Client`가 된다)에 Eureka 정보를 넣어주면 어플리케이션이 실행 되면서 Eureka로 어플리케이션 정보 및 상태를 넘겨준다. 이런식으로 모인 각 어플리케이션의 인스턴스 정보를 필요한 어플리케이션에 각각 넣어주고(IP 정보 포함) 종료되면 다시 인스턴스 정보를 갱신한다(기본 적으로 30초 마다 인스턴스에 Ping을 날려 상태 점검도 한다).

하지만 이번 공부하면서 유레카는 쓰지 않았다. 이유는 딱히 메리트를 못느껴서 그런데 유레카의 역할은 `Scale in/out`시 인스턴스의 정보, 상태를 모니터링 및 관리를 하는데 내가 `Spring Cloud`를 사용하게 된다면 최종적으로 `Docker` + `Spring Cloud` 조합으로 사용할 것이다.

근데 Docker 생태계(`Docker Swarm`, `Kubernates`) 중엔 이러한 역할을 하는 얘들이 이미 있는데 구지 필요할까 의문이 들었고, 그렇다고 `Docker`를 포기하기엔 잃는게 더 많을꺼라 판단 하였다. `Docker Swarm`이나 `Kubernates`를 사용안하고 순수 `Docker`만 사용한다면 사용하는것도 괜찮을꺼 같긴하다(기술은 필요에 맞춰 도입하면 된다!).

또한 `Eureka client`들, 그니까 다른 서버들은 Eureka 관련 Library에 종속성이 생기게 된다. 만약 다른 어플리케이션을 `Node.js`나 `Django`같은 걸로 만들었을 경우 `Eureka client`로 등록 하려면 외부 라이브러리를 사용해야 하지만 이러한 라이브러리를 제공해주지 않으면 어떻게 해야할지 감도 안잡힌다. 물론 방법이 있을 수도 있지만 그런거 하나하나 알아보는데 시간을 사용하니, 그냥 안쓰고 `Docker` 쓸꺼 같다.

## 2.3 Ribbon (L7 Load Balancing)

> `Load Balancer`는 대표적으로 2가지 종류가 있는데 `L4 Switch`, `L7 Switch` 2 종류가 있다. L4는 `OSI 7Layer`에서 L4 계층, 쉽게 말하면 네트워크 장비로 로드 벨런싱을 하는 것이고, L7은 `Application` 계층으로 로드 벨런싱을 하는 것을 말한다. `L4 Switch`는 가격이 엄청나게 비싸므로 돈없으면 사용하지도 못하거나 아니면 AWS의 `NLB`를 알아보면 되고, 여건이 안되면 결국에 사용해야 할 것은 `L7 Load Balancer` 이다

우선 `Load Balancing`을 하고 싶으면 최소 2개 이상의 서버 인스턴스가 필요하고, 해당 인스턴스의 물리적 접근 주소(IP, Port 번호)를 `Load Balancer`에 제공해야 한다. 이때 `Eureka`와 궁합이 잘 맞는데 위에서 잠깐 설명 하였지만 Eureka는 필요한 곳에 물리적인 서버 목록을 제공해 준다.

#### Ribbon

Load balancing 관련 작업을 관리한다. `timeout`, `retry 정책`등을 설정 가능하고 필요한 서버 목록은 직접 물리적 주소를 적는 방법도 있으나, 그렇게 하면 탄력적으로 주소값을 확보 할 수 없으므로 `Eureka`한테 필요한 서버 목록 리스트를 요청하도록 셋팅도 가능하다.

#### Eureka

주기적으로 헬스 체크를 하여, 현재 활성화 된 서버 인스턴스 목록을 Ribbon에 제공해준다.

---

Ribbon이 좋긴 하지만 이번 공부엔 절반 정도의 기능만 사용하였다. `timeout`, `retry` 정책 정도만 사용하고 `Load Balancing`작업은 Ribbon이 아닌 docker를 통해서 할 생각이기 때문이다.

## 2.4 Hystrix (Circuit Breaker)

`Hystix`에서 제공해주는 기능은 대표적으로 `Request Caching`, `장애 전파 방지` 기능이 있다. 이 중 `Request Caching`은 딱히 어려운 내용도 아니고 다른 쪽에서도 많이 사용 할 수 있으니까 Pass하고 추가로 기능은 아니지만 관리 정책으로 request 격리 방식을 지정 할 수가 있다.

### Circuit Breaker(요청 차단)

`Circuit Breaker`는 간단히 말해 특정 조건이 만족하면 요청 자체를 실행하지 않고 내부적으로 `fallback`을 실행하는 방식이다.

`Circuit Breaker`를 사용하는 이유는 만약 특정 서비스 `A` -> `B` -> `C` 순서로 호출한다고 가정 할 때, `C`측에서 처리량이 적거나 DB에 LOCK이 걸려 무한 대기가 발생 할 경우 `A`, `B`, `C` 모두가 무한 대기가 걸리게 된다. 물론 `Timeout`이 걸려 있을테니 진짜 무한대기는 아니겠지만 적어도 `A`, `B`만큼은 빠른 응답, 또 `C`한테 불필요한 트래픽(어차피 실패할꺼)을 줄이기 위해 `B`는 `C`를 호출하는 대신 자체 `fallback`을 실행 시킨다(`Circuit Breaker open` 상태) 그러다가 일정 시간이 지나면 다시 확인 해보고 이상이 없으면 다시 정상적으로 처리한다(`Circuit Breaker close` 상태).

### Isolation 방법

`Micro Service`는 하나의 어플리케이션에서 모든 일을 하는게 아닌, 필요에 따라 내부적으로 다른 어플리케이션을 호출하여 처리하는 방식이 많다. 이때 중요한건 다른 서비스를 호출해야 한다는 점인데 이때 호출을 관리하는 방법은 `Thread Pools` 방식과 `Semaphore` 방식 두가지를 사용한다.

참고사항으로 `Thread Pools` & `Semaphore` 개념은 `Spring cloud`에서 시작한 개념은 아니니까 다른곳에서 검색해보면(...) 더 자세한 정보를 얻을 수 있다.

#### Semaphore

사실 `Semaphore`는 격리라고 보기에는 애매하다. 외부 어플리케이션 호출을 별도의 `Thread`를 할당 받는게 아닌 현재 사용중인 `Thread`를 그대로 사용하는 방식이다. 단순 동시 호출(`Concurrency`) 개수를 지정해 놨다가 사용하는 방식이라 장점은 `Thread Pools` 방식에 비해 빠르다는 점이 있지만 의미있는 값은 아니고, 단점으로는 별도의 `Thread`를 사용하지 않아 지연문제 발생 시 다른곳에 영향을 미칠수 있다는 점이다(이 부분은 추가로 확인 해봐야함).

#### Thread-Pool

Hystrix에서 관리하는 별도의 `Thread Pool`을 사용해서 외부 어플리케이션을 호출하는 방식이다. 따라서 동시 호출 개수는 `Thread Pool`에서 확보한 Thread 만큼 가능하고, 장점으로는 별도의 `Thread`로 사용하니 외부 시스템과 완전히 격리된다는 점이다. 단점으로는 별도의 `Thread Pool`을 관리하는데 오는 리소스, 오버헤드 등이 있지만 이러한 비용은 크게 신경쓰지 않고 거의 모든 케이스에서 `Thread Pool` 방식을 권장하고 있다.

## 2.5 Config Server

하나의 어플리케이션만 사용할때는 잘 느껴지지 않지만 여러 어플리케이션으로 나누어 관리하다 보면 프로퍼티 설정값들 관리가 힘들어 질 때가 있다. 비슷한 설정값들을 다른 어플리케이션에 각각 관리되어야 하고, 한 두개만 바꾸고 싶어도 다 수정하고 빌드 배포까지 해야한다는 점이 귀찮은 요소이다. 물론 프로퍼티 파일은 컴파일 대상도 아닌데 무슨 다 다시 빌드하냐고 생각 할 수 있지만 역시 기준은 `docker` 환경이기 때문이기도 하고 빌드 배포 시스템이 자동으로 갖추어져 있으면 결국 다시 빌드 배포하게 된다.

`Config Server`는 이러한 설정 값들을 한 곳에서 관리하고 있다가 필요한 어플리케이션에서 요청이 오면 값을 넘겨주는 형태로 제공하는 서버이다. `Application Name`, `Profile` 조합으로 값을 요청 할 수가 있고 공통적으로 제공해주는 값도 일괄적으로 관리 할 수가 있어 편하다. 문제는 특정 비밀번호 등의 예민한 값들 관리가 귀찮다는 건데, `Vault`같은 걸 써야 되지만 이게 꽤 귀찮은게 많고 결국 파일 시스템으로 관리되는데 차라리 `Docker`쪽에서 비슷한 역할을 하는것을 찾아서 쓰는게 어떨까 싶다(`Kubernates Secret` 등).

## 2.6 Spring Cloud Bus(notify configuration)

`Config Server`를 사용하여 설정 파일과 소스파일을 완전히 분리해서 관리하다 설정 파일을 바꾸고 어플리케이션에 적용하려면 어플리케이션을 다시 시작하거나 아니면 인스턴스에서 특정 api를 호출하여 최신 설정값을 셋팅하도록 유도하는 수 밖에 없다. 인스턴스가 한두개 있다는 보장도 없고 외부에서 호출하기도 까다로워 불편한 점이 있는데 `Spring Cloud Bus`는 설정값이 바뀌면 `Message Queue`를 통해 알려주고, 해당 `Message Queue`에 연결된 인스턴스는 서버 재시작 없이 설정값을 갱신하게 된다.

좋은것 같지만 아무래도 처리중인 데이터가 존재할 수도 있는데 설정값을 갱신한다는건 부담이 있는거 같아 이것 역시 관련 이슈가 있는지 검토를 해보고 적용여부를 다시 검토 해보는게 좋을것 같다.
