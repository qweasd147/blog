---
title: "Docker - 기본"
date: "2020-06-10T00:40:53.901Z"
template: "post"
draft: false
category: "etc"
tags:
  - "docker"
  - "devOps"
  - "infra"
description: "배포 환경을 쉽게 구축하고 서버 확장을 유연하게 하고 싶을때 & 컴퓨터 리소스를 효율적으로 사용하고 싶을 때"
---

# Docker

컨테이너 환경에서 OS를 가상화

# 1. 장점

리눅스 환경에서 서버나 db 아니면 뭐 기타 프로그램 설치 할때 에러나는 케이스를 종종 경험해본 케이스가 있을 것이다.
`mac의 home brew`나 `npm`을 사용하면 그나마 낫지만 gcc 컴파일 부터 시작해서 `make`, `make install`을 사용해서 설치 시도 중, 실패할때면 그 짜증은 겪어본 사람만 안다.
일단 하나 성공해도 다른 컴퓨팅 환경에서도 성공한다는 보장도 없고 이런거 3~4개 설치하려면 얼마나 걸릴지 장담할 수도 없다.

또 하나의 프로그램 설치를 했고 그 프로그램에서 `80`포트를 사용한다고 가정하면 이걸 설치하는데 `root`계정이 필요하고 (major port 사용 시 root 권한 필요) 포트를 바꾸고 싶으면
해당 소스를 변경해야만 수정이 가능한 경우가 많다. 하지만 `docker`를 사용하면 특정 계정에 `docker` 사용 가능 권한을 주고(이때는 `root` 권한 필요) `docker` 통해 설치하면
root 계정 정보가 필요 없고, 외부에서 들어오는 포트를 docker를 통해 내부 컨테이너 포트로 쉽게 포트 포워딩이 가능해서 구지 소스 변경 없이 포트 변경이 가능하다.

여기까지가 직접 사용해보면서 느낀 `docker`의 장점이고 이론적으로 가상머신과의 차이, 거기서 얻는 컴퓨터 자원의 이득, 네트워크 방식(`bridge`, `host` 등)을 통한 보안 및 컨테이너
간의 통신 등 정말 많은 이득이 있다(필요 시 다른곳에서 설명)

# 2. docker run(실행) 옵션

| 옵션  | 설명                                                                                                                                                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -d    | detached mode. 백그라운드 모드                                                                                                                             |
| -p    | 호스트와 컨테이너의 포트를 연결(포워딩) <br /> ex) ... -p 1234:8080 ... 옵션을 주면 1234번 포트로 접속하면 내부 컨테이너의 8080으로 포워딩(연결)하여 준다. |
| -v    | 호스트와 컨테이너의 디렉토리를 연결(마운트)                                                                                                                |
| -e    | 컨테이너 내에서 사용할 환경변수 설정                                                                                                                       |
| -name | 컨테이너 이름 설정                                                                                                                                         |
| -rm   | 프로세스 종료 시 컨테이너 자동 제거                                                                                                                        |
| -it   | i(interactive)옵션과 t(pseudo-tty)옵션을 사용하여 bash 쉘 사용                                                                                             |
| -link | 컨테이너 연결 [컨테이너명:별칭]                                                                                                                            |

ex) ubuntu 이미지를 hello 라는 컨테이너로 생성 한 뒤, bash 쉘 실행
\$ docker run -i -t --name hello ubuntu /bin/bash

ex) testnode 이미지의 0.1 tag를 컨테이너의 3000번 포트와 외부 포트 4000번을 연결함

```sh
$ docker run -p 4000:3000 testnode:0.1
```

ex) httpd 컨테이너를 생성하여 컨테이너의 /usr/local/apache2/htdocs경로와 `소스 경로`를 연결하고

컨테이너 80포트를 외부포트 3000번과 연결

```sh
$ docker run -d -p 3000:80 --name=board-front -v 소스경로:/usr/local/apache2/htdocs httpd
```

ex base-node:0.1 컨테이너를 생성하여 컨테이너의 /app 경로를 `소스 경로`를 연결하고

컨테이너 4000번 포트를 외부 포트 4000번과 연결

```sh
$ run -d -p 4000:4000 --name=board-api -v 소스경로:/app base-node:0.1
```

# 3. 그외 docker 명령어

### 3.1 docker inspect

기본 \$ docker inspect [옵션][컨테이너 명] 으로 실행되며 컨테이너 정보를 보여준다.

```sh
$ docker run -d --name test-httpd httpd

$ docker inspect test-httpd
```

### 3.2 docker exec

기본 \$ docker exec [옵션][컨테이너명] [명령어] 으로 해당 컨테이너의 명령어를 날린다.

ex) `abc` 컨테이너에 접근(/bin/bash 명령어 사용).
참고로 옵션은 STDIN 표준 입출력으로(i) 가상 tty (pseudo-TTY,t) 를 통해 접속하겠다는 의미이다.

```
$ docker exec -it abc /bin/bash
```

주의! 참고로 해당 컨테이너에 접속하여 여러 작업을 하는건 추천하지 않는다. 이유는 히스토리 관리가 큰데

docker를 사용하는 이유 중 하나가 여러 컨테이너를 마구마구 찍어내서 생산성을 높이는것을 목표로 하는데 직접 접근하여

파일을 수정하면 각 컨테이너를 만들때 마다 그러한 작업이 요구될 수도 있기 때문이다. 따라서 파일 수정등이 목적이라면

Dockerfile을 사용하여 수정하는것을 추천한다.

# 4. docker compose

### 4.1 docker와 docker compose 차이점

    docker compose
    Docker Compose는 컨테이너 여럿을 띄우는 도커 애플리케이션을 정의하고 실행하는 도구(Tool for defining and running multi-container Docker applications)
    컨테이너를 여러개 띄울 시, 순서대로 컨테이너를 띄울 수 있고, run 할때 옵션들을 미리 정의할수도 있다.

| docker                 | docker-compose       | 설명                                                            |
| ---------------------- | -------------------- | --------------------------------------------------------------- |
| Dockerfile             | Dockerfile-dev       | 서버 구성을 문서화 <br /> ex) 클래스 선언                       |
| docker build           | docker-compose build | 도커 이미지 만들기 <br /> ex) 클래스 선언을 어플리케이션에 로드 |
| docker run (+@ 옵션들) | docker-compose.yml   | 이미지에 붙이는 장식들. <br /> ex) 인스턴스의 변수들            |
| docker run             | docker-compose up    | 장식 붙은 이미지를 실제로 실행 <br /> ex) 인스턴스 생성         |

# 5. 발생했던 문제점들

### 5.1 docker chain이 제대로 설정x

    ~(생략) -i docker0: iptables: No chain/target/match by that name. (exit status 1)).

docker 컨테이너를 올릴 때 iptables에 docker chain이 없을 때 발생. 맨 처음 docker를 실행 할 때 발생하였는데 정확한

원인은 모르겠음...

#### 해결책

수동으로 docker chain을 iptables에 등록한다.

```sh
$ iptables -t filter -N DOCKER
$ iptables -t nat -N DOCKER
```

or

docker 서비스를 재시작 한다.

```sh
$ service docker stop
$ service docker start
```

# 6. 참고

#### Docker file을 써서 Linux위에 Centos나 Ubuntu 설치 시 Guest OS가 설치 되는건지

> X. Host OS(Linux)와 `CentoOS`, `Ubuntu` 등의 다른 부분(diff)만 따로 패키징하여 결과적으로 훨씬 가볍다.

- https://developer.ibm.com/kr/cloud/2019/02/01/easy_container_kubernetes/

#### 도커 무작정 따라하기(책)

http://pyrasis.com/docker/2015/02/09/docker-for-dummies

#### 하루만에 배우는 도커(책)

http://www.hanbit.co.kr/store/books/look.php?p_code=E7149016842

#### 인터넷 클라우드에서 도커 체험

https://labs.play-with-docker.com/

#### docker 설명(블로그)

- http://raccoonyy.github.io/docker-usages-for-dev-environment-setup/
- https://blog.nacyot.com/articles/2014-01-27-easy-deploy-with-docker/
- http://programmingsummaries.tistory.com/392?category=695325
