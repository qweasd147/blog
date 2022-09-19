---
title: "Spring Cloud - Zuul"
date: "2020-09-25T07:19:37.572Z"
template: "post"
draft: false
category: "spring"
tags:
  - "spring"
  - "cloud"
  - "msa"
  - "gateway"
description: "MSA 환경에서 API-Gateway를 담당"
---

여기서 설명할 내용 및 샘플은 [spring-cloud zuul 샘플](https://github.com/qweasd147/spring-cloud/tree/master/api-gateway) 여기서 확인 가능

## 프로젝트의 전체 구성도

![spring-cloud-image](/blog/media/cloud/spring-cloud.jpg)

`Zuul`은 Spring cloud stack에서 `API Gateway` 역할을 수행한다.

## Unique Entry Point

`Private Network`내에 여러 어플리케이션을 띄운 다음, `Reverse Proxy`를 통해 `Zuul`과 연결되어 있다. 외부에서 접근할 수 있는 방법이 없고 오직 `API Gateway`를 통해서만 접근 할 수 밖에 없는데, 이때 얻을 수 있는 장점이 강력하다.

1. Load Balancing

`MicroService Application`을 띄우고, 서버 정보를 `Zuul`에만 알려주면 된다. 로드벨런싱을 위해 다른 추가 작업은 할 필요가 없어 간단하게 구현이 가능하다.

2. 인증된 Request

인증 & 권한 관련해서 관리포인트가 확 줄어든다. 외부에선 오직 `Zuul`을 통해서만 접근 할 수 있으므로 `Zuul`에서 요청 정보를 확인하여 요청자 정보를 `Request Context`에 담아 다른 서비스로 포워딩 해주고 다른 서비스에서 `Request Context`에 담긴 정보를 확인하여 처리 해주기만 하면 된다. 이런 방식으로 구현하면 여러 `Micro Service`에서 반복되는 인증 & 권한 정보를 확인 로직을 줄일 수가 있다.

인증 관련해선 밑에서 추가로 설명

## 셋팅

### 1. Reverse Proxy

설정 파일(`properties` or `yaml`)을 통해 손쉽게 셋팅이 가능하다

```yml
zuul:
  routes:
    service-a:
      path: /service/a/**
      serviceId: service-a
      stripPrefix: false
      url: http://localhost:8080
    service-b:
      path: /service/b/**
      serviceId: service-b
      stripPrefix: false
      url: http://localhost:8081
    auth:
      path: /auth/**
      serviceId: auth
      stripPrefix: true
      url: http://localhost:8082
```

이런식으로 각 `Reuqest`의 경로에 따라 어느 어플리케이션으로 포워딩 해야하는지 설정만 해주면 된다. 설정 값도 직관적이고 필요에 따라 Document를 찾아보면 되고 아님 설정 값을 담는 java 파일(`ZuulProperties.java`)을 열어 필드값을 확인해보는게 더 빠를 수도(...) 있다.

### 2. 인증

설명할 내용의 샘플 실행은 [샘플 READ ME](https://github.com/qweasd147/spring-cloud) 참고

프로젝트에 구현해 놓은 것은 기본적으로 `Spring Security`를 바탕으로 `OAuth 2.0` & `JWT`를 사용하였다. 먼저 `Access token`을 얻고 요청 헤더에 담아 request를 날리면 `Zuul`에선 해당 토큰을 파싱 & 검증을 한 후, 다시 `Request`헤더에 `username`이란 key값으로 인증된 사용자 정보를 담아 포워딩 한다. 이런식으로 넘기면 다른 `Appication`에선 단순 요청 헤더에 `username`값이 있는지 없는지 여부만 판별하면 된다. 주의할 점은 외부에서 다른 `Application`으로 직접 접근 할 수 있어서는 안된다(`Zuul`이 아닌 다른곳에서 임의로 인증됬다고 속여서 해더값을 넘기면 안되니까).

```java
public class ZuulContextConfig extends ZuulFilter {

  private static final String TOKEN_HEADER = "Bearer ";

  @Override
  public String filterType() {
      return FilterConstants.PRE_TYPE;
  }

  @Override
  public boolean shouldFilter() {

      HttpServletRequest request = RequestContext.getCurrentContext().getRequest();
      String token = request.getHeader("Authorization");

      if(StringUtils.isEmpty(token))  return false;

      return token.startsWith(TOKEN_HEADER) && !Objects.isNull(getClaims());
  }

  @Override
  public Object run() throws ZuulException {

      RequestContext.getCurrentContext()
              .addZuulRequestHeader("username", getClaims().getName());

      return null;
  }

  private OAuth2Authentication getClaims(){

      return (OAuth2Authentication) SecurityContextHolder
              .getContext()
              .getAuthentication();
  }
}
```

소스의 중요한 부분만 일부 적어놓은 건데, `ZuulFilter`를 구현 한 것으로 위에서 설명한 내용을 구현한 것이다. 먼저 `Spring Security Filter`에서 `access token`을 파싱하여 `SecurityContextHolder`에 담아 놓으면 차후에 `ZuulFilter`가 실행 되는데, 사용자 정보가 `SecurityContextHolder`에 있으면 header에 `username`값을 넣어 보내주는 내용이다.

- `shouldFilter` -> `run` 메소드 적용 여부
- `run` -> 적용 할 내용

해당 프로젝트에서 `JWT` 토큰 검증 방법으로 `Auth 서버`랑 `Zuul 서버`에 동일한 `Sign key`값을 공유하도록 셋팅해 놓았다. 공개키 방식으로 하는게 여러모로 좋긴 하겠지만 설정 상 귀찮은 부분(공개키 공유)이 있어서 Pass 하였다. 검증 방법을 대칭키(`Sign Key` 공유)가 아닌 공개키 방법으로 바꾸는건 사실 뭐 어려운건 없으므로, [OAuth With JKS](https://github.com/qweasd147/springboot-oauth/tree/jks/jwt)를 참고해서 `JKS`를 만든 후, 공개키를 옮겨놓거나 Docker 컨테이너로 마운팅 해서 사용하면 된다.

```java
public class ResourceServerConfiguration extends ResourceServerConfigurerAdapter {

  ...
  @Override
  public void configure(HttpSecurity http) throws Exception {

      http.csrf().disable()
              .authorizeRequests()
              .antMatchers("/service/a/**")
                  .permitAll()
              .antMatchers("/service/b/**")
                  .authenticated()
              .antMatchers("/auth/**")
                  .permitAll()
              .anyRequest()
                  .denyAll();
  }
  ...
}
```

한가지 고민인건 현재 프로젝트에서 모든 접근 경로의 필요 권한을 체크하는 것을 `Zuul`에서 하고 있다. 이런 식이다 보니 `Zuul`에 모든 어플리케이션의 `Request URL`마다 필요한 인증 & 인가 정보를 넣아야 하니 나중에 너무 복잡해지는게 아닐까 싶다. 그래서 차후에 `Zuul`의 역할을 조금 더 단순하게 바꿔 토큰값을 파싱해여 단순 `uername`값만 넘기고, 세부 차단은 각 어플리케이션마다 구현할까 고민중이다(`Spring Security` 다 걷어내고 `TokenService`만 구현).

### 3. WAS

`Spring Cloud - 기본 설명` 게시물에 올려놓은 내용 대로, WAS는 그래도 바꾸는게 좋을꺼 같아 `Tomcat` -> `undertow`로 바꾸었다.

```gradle
  dependencies {

    implementation ('org.springframework.cloud:spring-cloud-starter-netflix-zuul') {
        exclude module: "spring-boot-starter-tomcat"
    }
    implementation('org.springframework.boot:spring-boot-starter-undertow')
  }
```

[Zuul Dependencies](https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-starter-netflix-zuul/2.2.5.RELEASE)를 보니 `zuul-core`만 2.x로 버전업 해서 사용해도 상관없다고 한다(2.x는 기본 netty 사용).

## TODO

aws에서 `X-Ray`를 써보니까 분산 트레이싱이 확실히 중요하다고 느껴졌다. `Spring Cloud`에서 적용 할만한것(`x-ray`는 빼고)을 찾아보니까 있긴 있는거 같은데 공부가 필요하다.

- Zipkin
- Sleuth
- Pinpoint
