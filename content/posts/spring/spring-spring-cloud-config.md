---
title: 'Spring Cloud - Config Server'
date: '2020-10-30T00:58:25.297Z'
template: 'post'
draft: false
category: 'spring'
tags:
  - 'spring'
  - 'cloud'
  - 'msa'
  - 'config'
description: 'MSA 환경에서 여러 설정값을 한곳에서 관리'
---

여기서 설명할 내용 및 샘플은 [spring-cloud MSA 샘플](https://github.com/qweasd147/spring-cloud/tree/master/config-server) 여기서 확인 가능

# Config Server

`Config Server`는 이 전에 설명한 대로 어플리케이션에 적용할 설정 값들을 한곳에서 관리하기 위해 만들어졌다. `MSA` 환경에서 일정한 `Starter Kit`을 기본 베이스로 많은 어플리케이션을 만들어 내는 케이스가 많을것이라 생각되는데, 설정값들이 공통적이지만 따로 관리하다가 변경하려고 하면 귀찮기도 하고 때때로 놓친 케이스가 생길 수도 있다. `Config Server`를 사용하면 한곳에서 어플리케이션 별, 환경(ex dev,staging, prod), 버전(`label`) 별로 각각 설정값을 따로 관리할 수 있기 때문에 꽤나 유용하게 사용 할 수가 있다.

## 1. Client Application 셋팅

`Config Server`에서 할 셋팅을 보기 전에 간단한 `Client Application`, 그니까 `Config Server`를 사용하는 쪽 셋팅을 보면 아래와 갔다.

`bootstrap.yml`

```yaml
spring:
  profiles:
    active: docker
  application:
    name: service-a
---
spring:
  profiles: local
  cloud:
    config:
      enabled: false
---
spring:
  profiles: docker
  cloud:
    config:
      uri: ${CONFIG_SERVER_URI:http://localhost:8888}
      fail-fast: true # config 서버 못찾으면 서버 종료
      profile: default,docker
      label: 1.0.0
```

> 참고로 `bootstrap.yml`의 파일은 일반적으로 설정파일로 사용되는 `application.yml`파일보다 먼저 실행되는 파일로, 보통 `Config Server`에 대한 정보를 적어놓는 용도로 많이 사용된다.

일단 profiles가 `local`인 설정은 로컬 개발 환경에서 `Config server`를 사용 안하는 목적으로 셋팅한 것으로 일단 무시해도 상관이 없다. 중요한건 `application name`이 기본적으로 `service-a`로 되어있는 점, profiles 값이 `docker`인 설정값들을 보면 된다.

`cloud config` 설정값을 보면 직관적이긴 하지만 그래도 풀어 써 보자면

1. uri - Config Server의 접근 주소
2. fail-fast - true일때 Config Server를 못찾으면 서버 실행이 안된다.
3. profile - 위 소스를 보면서 설명하면 `default`환경, `docker`환경의 설정값을 Config Server에서 가져온다.
4. label - 설정값 버전에 맞춰 요청하기 위해 사용된다. (필수값은 아님)

이정도만 셋팅하면 어플리케이션이 실행되면서 `Config Server`로 부터 설정값을 가져와 셋팅한다.

## 2. Config Server 셋팅

`Config Server`는 사실 기본셋팅이 잘 되어있어 거의 기본으로 사용해도 훌륭한 퍼포먼스를 보여준다. 그래도 일단 선택지가 있긴한데, 설정값 통신 방법을 순수 `http`로 주고 받을지, 아니면 `git repository` 위치를 저장하고 직접 가져 갈지 선택할 수 있는데 `git repository`는 딱히 장점을 모르겠어서 그냥 `http`로 주고 받는 것으로 선택했고, 공개키 방식도 쉽게 셋팅 가능해서 보안 레벨을 올릴 수도 있겠지만 `Config server`는 `private network`에 배포되어 외부에서 접근 할 수 있는 방법이 없으므로, 딱히 사용하진 않았다.

`application.yml`

```yml
server:
  port: 8888

spring:
  profiles:
    active: native
---
spring:
  profiles: native
  application:
    name: config-server
  cloud:
    config:
      server:
        native:
          search-locations: classpath:config/
```

설정값은 정말 단순하다. 사실상 설정파일 위치만 설정해 준게 전부이다.

```
/{application}-{profile}.yml
/{label}/{application}-{profile}.yml
/{application}-{profile}.properties
/{label}/{application}-{profile}.properties
```

위의 파일 & 디렉토리 패턴을 참고하여 설정 파일들 위치 시키고 서버를 실행 시키면 `Config Server` 셋팅은 끝이 난다.

```
resources/
├── application.yml
└── config
    └── 1.0.0
        ├── service-a-default.yml
        ├── service-a-docker.yml
        └── service-a-local.yml
```

위의 설정파일은 **`1. Client Application 셋팅`** 을 위해 셋팅한것으로, `Client Application`이 실행되면서 알아서 `service-a-default.yml`, `service-a-docker.yml` 설정 정보를 가져간다.

#### 2.1 Client Application에서 기록되는 정상적으로 가져왔다는 로그

```
Located environment: name=service-a, profiles=[default,docker], label=1.0.0, version=null, state=null
Located property source: [BootstrapPropertySource {name='bootstrapProperties-classpath:config/1.0.0/service-a-docker.yml'}, BootstrapPropertySource {name='bootstrapProperties-classpath:config/1.0.0/service-a-default.yml'}]
```

#### 2.2 Client가 소스 파일을 가져갈때 Config Server에서 감지되는 로그

```
Adding property source: classpath:config/1.0.0/service-a-docker.yml
Adding property source: classpath:config/1.0.0/service-a-default.yml

```
