---
title: 'Docker - build cache(작업중)'
date: '2020-06-24T01:14:51.261Z'
template: 'post'
draft: false
category: 'etc'
tags:
  - 'docker'
  - 'devOps'
  - 'infra'
description: 'Docker image 생성 시 레이어 캐시를 유도하여 빠르게 빌드 & 멀티 스테이지로 빌드 환경, 실행환경 분리'
---

# Docker image 구조

도커 이미지의 구조는 여러 레이어의 순차적으로 겹쳐져 하나의 이미지를 구성한다. 가장 기본이 되는 layer는 파일 시스템으로 뭐 `docker`가 관리하니까 개발자의 관리포인트는 벗어나 생략하고,
예를들어 `Spring boot` 어플리케이션을 `Dockerizing`하여 실행 시킨다고 할때 일단 먼저 빌드 환경이 제공되야 할것이다. `gradle wrapper`를 안쓴다면 `gradle`, `jdk`가
설치되어 있어야 하고 그다음 빌드할 대상(소스 파일들), 마지막으로 빌드된 산출물 or `jar 파일`을 통해 최종적으로 어플리케이션이 실행되게 된다.

```sh
FROM openjdk:8-jdk-slim

RUN mkdir -p /app/java
WORKDIR /app/java

COPY . .

RUN ./gradlew build

CMD ["java", "-jar", "build/libs/auth-server-1.0.0.jar"]
```

위의 Dockerfile은 가장 기본적인 `spring boot` 어플리케이션을 빌드하는 형태가 된다(일부 커스터 마이징 설명은 생략). 해당 파일을 일단 `docker image`로 빌드해보고 layer 구조를 확인해보고 싶으면

```sh
$ docker build -t auth-no-cache:1.0.0 .
$ docker history auth-no-cache:1.0.0
```

위와 같이 build 후 history 명령을 통해 구조를 확인할 수가 있다. 밑의 내용은 로컬환경에서 빌드 후, 출력되는 히스토리 내용

```
IMAGE               CREATED             CREATED BY                                      SIZE                COMMENT
71ed18b7025d        29 minutes ago      /bin/sh -c #(nop)  CMD ["java" "-jar" "-serv…   0B
1d2f52d9e713        29 minutes ago      /bin/sh -c ./gradlew build -x test              397MB
259562f0edd3        31 minutes ago      /bin/sh -c #(nop) COPY dir:f0800f876ec82b2e3…   113MB
2cd82ea610e3        31 minutes ago      /bin/sh -c #(nop) WORKDIR /app/java             0B
4f44aa4209bc        31 minutes ago      /bin/sh -c mkdir -p /app/java                   0B
41fd53971008        7 months ago        /bin/sh -c set -eux;   dpkgArch="$(dpkg --pr…   206MB
<missing>           7 months ago        /bin/sh -c #(nop)  ENV JAVA_URL_VERSION=8u23…   0B
<missing>           7 months ago        /bin/sh -c #(nop)  ENV JAVA_BASE_URL=https:/…   0B
<missing>           7 months ago        /bin/sh -c #(nop)  ENV JAVA_VERSION=8u232       0B
<missing>           7 months ago        /bin/sh -c { echo '#/bin/sh'; echo 'echo "$J…   27B
<missing>           7 months ago        /bin/sh -c #(nop)  ENV PATH=/usr/local/openj…   0B
<missing>           7 months ago        /bin/sh -c #(nop)  ENV JAVA_HOME=/usr/local/…   0B
<missing>           7 months ago        /bin/sh -c #(nop)  ENV LANG=C.UTF-8             0B
<missing>           7 months ago        /bin/sh -c set -eux;  apt-get update;  apt-g…   8.79MB
<missing>           7 months ago        /bin/sh -c #(nop)  CMD ["bash"]                 0B
<missing>           7 months ago        /bin/sh -c #(nop) ADD file:bc8179c87c8dbb3d9…   69.2MB
```

설명하자면 밑에서부터 이미지 레이어가 하나씩 쌓여 최종적으로 하나의 이미지를 구성하고 있다. `CREATED BY`를 살펴보면 명령어가 실행되는 단위로 레이어가 생성되고 있으며, 참고사항으로 각 레이어는 이전 레이어 + 실행 컨텍스트에 종속 적이다.(필요 시 뒤에서 설명)

이렇게 레이어로 나누어 관리되면서 생기는 장점이 각 명령어가 실행되는 환경(컨텍스트)이 같으면 새롭게 레이어를 빌드(생성)하는게 아니라 기존 레이어를 재사용해서 빌드 시간을 단축할 수가 있다.

따라서 기존 빌드된 레이어를 재사용을 유도(캐싱)하는 것이 docker build cache의 핵심이다.

**참고**

> `missing`은 다른 시스템에서 빌드되어 로컬에서 정보가 없어 재사용이 불가능하다는걸 나타낸다

# 1. Spring boot application Dockerizing

## 1.1 기존 Dockerfile의 문제점

```sh
FROM openjdk:8-jdk-slim

RUN mkdir -p /app/java
WORKDIR /app/java

COPY . .

RUN ./gradlew build

CMD ["java", "-jar", "build/libs/auth-server-1.0.0.jar"]
```

위에서 예를 들어 설명한 `Dockerfile`로 보이는 개선 사항이 2가지가 존재한다.

### 빌드 캐시 적용 x

작업을 할때마다 위 `Dockerfile`로 빌드하면 딱 `WORKDIR` 지정하는 부분까지만 이미지 레이어를 재사용하고 그 이후에는 항상 새로운 이미지 레이어를 생성한다.
그 이유는 `WORKDIR`까진 항상 똑같은 과정이니까 레이어 재사용이 가능하지만 소스를 `COPY`하는 과정에서 기존 소스와 다르다면 `COPY` 하는 결과가 달라지게 된다.
결과가 다르면 작업 환경도 다르므로 캐시 적용이 아닌 새로운 이미지 레이어 생성 작업을 시작하게 된다. 그래서 결과적으로 항상 빌드할때마다 캐싱 효과는 없다.

일단 어느 이미지 레이어를 캐싱 해야할지 고민해봐야한다. 일반적으로 어플리케이션을 개발하면서 연관 라이브러리의 변동은 많지는 않다. 그래서 연관 `dependencies`를 다운로드 하는 부분, 소스 파일을 컴파일 하는 부분 이렇게 2단계로 나눈다면 적어도 `dependencies`를 다운로드하는데 걸리는 시간만큼은 줄일 수가 있다.

소스 파일도 도메인 별로 분리해서 각각 따로 빌드한다면 시간을 아낄수 있을진 몰라도 각 도메인 사이 의존도에따라 빌드 시 영향을 미칠수가 있으므로 그냥 pass

### 최종 이미지에 불필요한 내용이 있다.

소스파일을 실행시키는데 구지 `jdk`환경까진 필요없다. 또 이미지 안에 실행 시키는데 필요없는 소스 파일들도 함께 포함되어 있어 불필요한 용량을 차지하고 있다.

`docker`에서 지원하는 `multi stage`로 구성해서 빌드환경과 실행환경을 나누고, 실행환경은 `jdk`가 아닌 `jre`, 전체 소스 파일이 아닌 빌드된 결과물만 가진다면 많은 용량을 줄일수가 있다.

## 1.2 Docker file 개선

TODO

## 2. React (create-react-app)

`react`는 `Spring boot` 어플리케이션보단 단순하다. 연관 라이브러리 다운로드를 직접 명령할 수 있기 때문에(install) 분리가 쉽다.

소스 관련해서 레이어 분리 및 캐싱 유도는 아래와 같이 나눈다.

1. 연관 라이브러리 install(`npm install` or `yarn install`)
2. 소스 번들링(cra에서 build 스크립트 실행)

TODO
