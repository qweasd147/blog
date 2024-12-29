---
title: "Terraform으로 구축하는 AWS 기본 설계"
date: "2024-12-29T15:56:13.293Z"
template: "post"
draft: false
category: "aws"
tags:
  - "aws"
  - "db"
  - "auroradb"
description: "Terraform으로 IGW 부터 ELB까지 구축 및 설계"
---

aws를 기본적인 사용을 위해 가장 기본적이면서 기초적인 aws 설계 내용을 terraform으로 구현하고 무엇인지 설명

## 사전 준비

- terraform
- awscli(계정 & credentials 셋팅 포함)
- aws key pair

> key pair는 베스천 서버 구축을 위한 것으로(ec2 접속을 비밀번호가 아닌 ssh로 접속) 셋팅이 안되어 있다면 [여기](https://github.com/qweasd147/StudyNote/tree/master/terraform/key_pair) 를 참고해서 privacy key를 aws에 등록 시켜놓는다.

# 모듈 별 구성 및 설명

## 1. networks

실행은 [terraform vpc_ec2](https://github.com/qweasd147/StudyNote/tree/master/terraform/vpc_ec2)에서 pull 받고 하나씩 실행한다.

먼저 위의 프로젝트를 `pull`받고 기본적인 `network`먼저 구축한다.

```sh
$ terraform init
$ terraform apply
```

프로비저닝이 끝나면 아래 이미지 처럼 가장 기본적인 네트워크가 구축 된다.
![aws netowkrs](/media/networks.png)

### 1.1 VPC(Virtual Private Cloud)

이미지의 보라색 테두리 영역으로 영어 그대로 사설 네트워크 공간을 말한다. 즉 개인만의 네트워크 공간을 구축하고 하위에 리소스들을 프로비저닝 할 수 있는 네트워크 공간이 만들어 진것이다.

### 1.2 Region / Availity ZONE

- Region : 보통 나라 별 데이터 센터 클러스터링 단위. `AZ(Availity ZONE)`을 `grouping` 한거라고 생각하면 된다 (서울, 도쿄 리전 등)
- Availity ZONE : 물리적으로 분리 되어있는 인프라가 모여있는 Region 내 데이터 센터

> 쉽게 생각하면 나라별 데이터 센터(AZ)가 있고, 각각 데이터 센터를 묶어 Region을 만든다고 생각하면 된다(정확한 설명은 아님).

### 1.3 Subnet

`VPC`를 자잘하게 나눈 `networks` 영역. 하나의 서브넷은 하나의 `AZ`에서만 존재 가능하고, `subnet`을 구성하는 속성으로 `public subnet` 또는 `private subnet` 한 가지를 선택 하여야 한다.

- public subnet : 이 `subnet`에 만든건 외부에서 직접 통신이 가능하도록 만들기 위해 사용됨. 또 이 subnet에 만든건 public ip를 바로 부여하도록 셋팅이 가능하다
- private subnet : 이 `subnet`에 만든 resource들은 외부와 직접 통신이 불가능하고 중간 다리 역할을 하는 resource를 거쳐야 한다. 자동으로 public ip 부여 x

### 1.4 Routing Table

트래픽이 어디로 가야하는지(갈 수 있는지) 정의 한 테이블. 이하 `RT`

**사용 예시**

- `public` 서브넷의 `RT`의 구성은 목적지가 `vpc cidr block`과 같으면 내부에서 처리 하는 트래픽, 그게 아니라면 무조건 `IGW`로 보내도록 셋팅한다.
  > 내부에서 내부로 요청하는건 내부에서 처리, 내부에서 외부로 요청하는거면 `IGW`로 보냄
- `private` 서브넷의 `RT`의 구성은 목적지가 `vpc cidr block`과 같으면 내부에서 처리 하는 트래픽, 그게 아니라면 `Nat Gateway`로 보낸다.
  > 내부에서 내부로 요청하는건 내부에서 처리, 내부에서 외부로 요청하는거면 `Nat Gateway`로 보냄(직접 외부로 보내는건 불가능)

`RT`이 존재해야 `subnet`이 달라도 같은 `vpc`안에 구성되어 있다면 `subnet` 간 통신이 가능하다.

### 1.5 Nat Gateway

`private instance`가 외부의 인터넷과 통신하기 위한 통로로 사용되며, 하나의 공인 `ip`를 부여 할 수 있다(`elastic ip(EIP)`로 부여함). `Nat Gateway`는 고가용성 확보를 위해 여러 서브넷이 만들 수도, 아님 하나의 서브넷에 만들어 같이 사용 할 수도 있다. 물론 하나만 사용하면 해당 `AZ`이 문제가 되면 내부망은 외부와 통신 할 수가 없게 된다.

`Nat Gateway`는 `public subnet`에 있어야 하고, 부여 된 공인 IP를 통해 외부와 통신하게 되므로 외부의 인터넷에선 해당 IP로 요청을 보낸것으로 간주된다.

### 1.6 Internet Gateway(IGW)

- 인터넷으로 나가는 통로. 이게 없으면 `vpc`는 외부와 아예 격리되게 된다.
- 기본적인 고가용성이 확보되어 있음(2개 안만들어도 됨)
- IGW 로 연결되어 있지 않은 서브넷 = `Private Subnet`
- 하나의 `vpc`에만 연결 가능 (`vpc`는 하나의 `IGW`를 갖는다)
- IGW가 없으면 실질적으로 전부 `private subnet`이 된다고 생각하면 된다(내부에서 인터넷을 못씀).

### 1.7 cidr block

그냥 `vpc` 또는 `subnet`별 사용 할 수 있는 `private ip`범위라고 이해하는게 제일 편하다. `private network`에서 여러 ip 부여 및 관리를 위해 만들어졌다.

`terraform`코드에선 vpc의 `cidr block`값을 `10.0.0.0/16` 이렇게 정하였고, 이 vpc에 만들어지는 `private ip`는 모두 `10.0.x.x`으로 시작하게 된다.

> 16의미 -> 앞의 16비트를 네트워크 주소로 사용, 나머지 16비트를 호스트 주소로 사용

또 `AZ1`에 배치한 `private subnet`인 `private subnet-2a`는 `cidr block`값으로 `10.0.101.0/24`를 부여했는데, 이 서브넷에 생성되는 ec2 등은 `private ip`는 모두 `10.0.101.x`로 시작하게 된다.

반대로 생각하면 부여받은 `private ip`값으로 어느 서브넷, AZ에 배치되는지 확인이 가능하다.

## 2. ec2-web-server

![ec2 web server](/media/ec2.png)

네트워크를 구성 한 후, 각 `private subnet`에 웹서버로 사용 할 `ec2`를 올리고, 하나의 `public subnet`에 `bastion server`로 사용 할 `ec2`까지 올린 형태이다. `bastion server`에 `EIP`를 부여하면 고정된 ip 사용이 가능하겠지만, `EIP`가 저렴한 서비스는 아니니까 그냥 그때그때 생성되는 ip를 사용해도 무방하다.

앞서 terraform을 사용해서 프로비저닝 하면 아래와 같은 내용이 출력 될 것이다.

```
alb_dns_name = "xxxx.elb.amazonaws.com"
bastion-public-ip = "{배스천 ec2 public ip}"
server-private-ip = {
  "web-2a" = "{웹서버 private ip1}"
  "web-2c" = "{웹서버 private ip2}"
}
```

ssh 접근에 필요한 key 파일값이 `~/.ssh`위치에 있다는 가정하에

```sh
$ ssh -i ~/.ssh/{private key 파일명} ec2-user@{배스천 ec2 public ip}
```

이런 식으로 베스천 서버에 접근 하거나 아님 `~/.ssh/config` 파일에 아래와 같은 bastion 서버 정보를 입력 후,

```sh
Host aws-bastion
    HostName {배스천 ec2 public ip}
    Port 22
    User ec2-user
    IdentityFile ~/.ssh/{private key 파일명}
```

`$ ssh aws-bastion` 명령어 만으로도 `bastion` 서버 ssh 접속이 가능하게 구성 할 수도 있다. 아무튼 베스천 서버에 접석 한 이후엔 aws 네트워크에 접속 한 것이고, `RT`도 다 구축하였으니 다른 서브넷에 위치한 웹서버들로도 요청을 보내 볼 수도 있다.

```sh
# 베스천 서버로 접속 이후 실행
$ curl {웹서버 private ip1}
$ curl {웹서버 private ip2}
```

이런 식으로 프로비저닝 된 각 웹서버들로 요청을 보내고 값을 전달 받을 수도 있다.

> terraform에 해당 모듈에 `init-script.sh`스크립트를 보면 apache 웹서버를 설치하고 시작 하는 내용을 확인 할 수있다. 이 스크립트를 프로비저닝이 완료 된 후 실행되도록 셋팅하여, 80포트가 open 되어 있는것이다.

> 보안 관련 Security Group 관련 설명은 생략

## 2. alb

아래 이미지는 `ELB`까지 사용하여 최종 완성 된 형태이다.
![alb](/media/elb.png)

`ELB(ALB)`를 생성하여 `Target Group`에 연결하고, 이 `Target Group`은 생성한 웹서버들을 연결 시키면 `ALB`로 요청이 들어오면 각 웹서버들로 트래픽이 가도록 셋팅 한 것이다.
해당 모듈은 SG 설정은 처음하는 사람한텐 조금 헤깔릴 수 있지만 개념자체는 어려운 개념이 아니니 추가 설명은 생략
