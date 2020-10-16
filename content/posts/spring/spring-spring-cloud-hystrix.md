---
title: 'Spring Cloud - Hystrix'
date: '2020-10-15T01:30:21.250Z'
template: 'post'
draft: false
category: 'spring'
tags:
  - 'spring'
  - 'cloud'
  - 'msa'
description: 'MSA 환경에서 에러 전파 방지. +(Feign, Ribbon, Circuit Breaker) 셋팅'
---

여기서 설명할 내용 및 샘플은 [spring-cloud MSA 샘플](https://github.com/qweasd147/spring-cloud/tree/master/service-a) 여기서 확인 가능

## 1. Feign

`Feign`은 기존 `RestTemplate`와 하는 역할이 비슷하다. 자바 프로그래밍 상에서 외부 api등을 호출할 때 쓰이며, 여기에 추가로 MSA에 특화된 기능이 존재한다.

```java
@FeignClient(name = "service-b"
  , fallbackFactory = BServiceFallbackFactory.class
  , configuration = FeignConfiguration.class)
public interface BService {

    @RequestMapping("/service/b")
    List<String> getAll();

    @RequestMapping("/service/b/{idx}")
    String getOne(@PathVariable("idx") String idx);
}
```

기본 적인 사용법은 위와 같은데 인터페이스 + 어노테이션으로 `Controller`를 구현하듯 정의해놓으면 알아서 구현체를 구현해줘서 편하게 사용이 가능하다.

또한 사용해보면서 개인적으로 느낀 장점으로는 `Logging`관리가 편하다는 건데, 요청 & 응답 로그 정보를 남길려면 `RestTemplate` 경우 `RestTemplate`클래스의 로그 레벨을 변경하거나 아니면 별도의 `Interceptor`를 구현해주는 방법 밖엔 없는데 `Feign`같은 경우엔 위와 같은 인터페이스 단위로 로그 레벨 정의가 가능하다.

```java
@Configuration
public class FeignConfiguration {

    @Bean
    public Logger.Level feignLoggerLevel(){
        return Logger.Level.FULL; //NONE, BASIC, HEADERS, FULL 가능
    }
}
```

위와 같이 통신 간 남길 로그를 정의 하고

```yml
logging:
  level:
    com.service.demo.service.BService: DEBUG
```

이렇게 서비스(인터페이스 클래스) 단위로 레벨을 관리할 수가 있어서 편하게 관리가 가능했다.

또한 API 통신 시, 발생 할 수 있는 에러 처리는 `FallbackFactory`를 구현하여 처리할 수가 있다. 아래와 같이 구현하면 호출 시 에러가 발생되면 `BServiceFallbackImpl`에서 매칭되는 메소드가 실행된다.

```java
@Component
@Slf4j
public class BServiceFallbackFactory implements FallbackFactory<BService> {

    @Override
    public BService create(Throwable cause) {

        log.error("외부 서비스 호출 중 에러 감지", cause);

        return new BServiceFallbackImpl();
    }
}
```

하나의 서비스 클래스를 구현하는데 1+1으로 구현(위 소스에서 `BServiceFallbackImpl` class)해야 하는게 거부감이 들 수도 있지만, MSA 환경에서 에러 후처리 관리는 사실상 필수라서 어쩔수 없다고 생각된다.(유용할 때가 많다)

추가로 외부 API를 호출할때 에러 발생 비율이 많으면 이 전에 설명한대로 `Circuit Breaker Open`이 된다.

## 2. Ribbon

`Ribbon`은 `L7 Load Balancing` 작업을 수행한다고 하였다. 로드벨런싱을 위해 호스트 서버의 물리적 접근 주소가 필요하지만 `Eureka`를 쓴것도 아니고 로드벨런싱도 `Docker Network`를 통해 처리하므로 다른 서비스에 접근 할 수 있는 정보만 입력하였다.

#### 로컬 환경

```yml
service-b:
  ribbon:
    listOfServers: localhost:8081
```

#### Docker Container 환경

```yml
service-b:
  ribbon:
    listOfServers: serviceb:8081
```

이런 식으로 접근 가능한 주소만 동적으로 주입 하는 정도로만 셋팅하였다.

## 3. Hystrix

```yml
hystrix:
  command:
    default: # command key. use 'default' for global setting.
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 3000
        ...
    custom_command_key:
      excution:
        isolation:
          thread:
            timeoutInMilliseconds: 3000
        ...
```

`Hystrix`는 위와 같은 방법으로 설정값 셋팅이 가능한데 보이는 바와 같이 `default` or 다른 키값으로 셋팅값을 맞춰 놓았다가 원하는 서비스 별로 셋팅값을 매칭 시켜 적용이 가능하다. `Thread Pool`을 사용한다면 서비스 별로 공유 할지 여부도 셋팅이 가능하다. 자세한 옵션 값은 역시 문서 또는 `HystrixCommandProperties.class`파일(...)을 통해 옵션값 확인이 가능하다.
