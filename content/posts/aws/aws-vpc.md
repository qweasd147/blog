---
title: "AWS- Network"
date: "2022-08-25T04:20:10.125Z"
template: "post"
draft: false
category: "aws"
tags:
  - "infra"
  - "aws"
  - "network"
description: "AWS 기본적인 네트워크 용어 정리"
---

## VPC(virtual private cloud)

- aws 클라우드에서 논리적으로 격리된 공간
- 가상 네트워크 공간이라 생각하면 됨

## AZ(availability zone)

- 물리적으로 분리 되어있는 인프라가 모여있는 데이터 센터
- 하나의 리전은 2개 이상의 AZ이 구성되어 있음

## Subnet

- VPC 하위 단위(부분 집합. 하나의 vpc를 쪼개 놓은 공간이라 생각하면 된다)
- 하나의 서브넷은 하나의 AZ에서만 존재 가능
- 인터넷을 통한 접근 가능/불가 설정을 할 수 있음(private subnet, public subnet)
- cidr block(사용 할 수 있는 아이피 범위) 적용 가능

## Internet Gateway(IGW)

- 인터넷으로 나가는 통로. 이게 없으면 vpc는 외부와 아예 격리되게 된다.
- 고가용성이 확보되어 있음
- IGW 로 연결되어 있지 않은 서브넷 = Private Subnet
- Route Table에서 연결 해줘야하
- 하나의 vpc에만 연결 가능 (vpc는 하나의 IGW를 갖는다)
- IGW가 없으면 실질적으로 전부 private subnet이 된다고 생각하면 된다(내부에서 인터넷을 못씀).

## NACL / Security Group

- 검문소
- NACL => Stateless, SG => Stateful
- 기본적으로 VPC 생성 시 만들어줌
- Deny는 NACL 에서만 가능

## Route Table

- 트래픽이 어디로 가야할지 알려주는 테이블
- 기본적으로 vpc 생성 시 만들어줌
- local에 해당하는 아이피는 말그대로 자기한테서 찾고 그 외의 대역은 다른 igw(or nat gateway)에서 찾도록 셋팅 가능

`pub & pri subnet` 별 Route table 사용 예시를 보자면

#### public subnet

| Destination | Target | 구분   |
| ----------- | ------ | ------ |
| 10.0.0.0/16 | local  | case 1 |
| 0.0.0.0/0   | igw    | case 2 |

#### private subnet

| Destination | Target      | 구분              |
| ----------- | ----------- | ----------------- |
| 10.0.0.0/16 | local       | (똑같으므로 생략) |
| 0.0.0.0/0   | nat-gateway | case 3            |

이렇게 `pub & pri subnet` 에 `route table`을 셋팅하였다고 가정

**case 1**

`Destination` === `vpc cidr block` vpc 범위 내 있는 내부로 보내는 트래픽이란 뜻으로 내부에서 처리 된다.

> 이게 있어야 서브넷 끼리 통신이 가능하다.

#### case 2

`public subnet`내부로 보내는 트래픽이 아닌 그 외 모든 트래픽은 외부로 보내는 트래픽이라는 뜻으로 전부 igw(`internet gateway`)로 보내 외부와 통신이 가능하도록 처리한다. 이게 없으면 내부 subnet에서 이미지나 소스를 다운 받는등의 인터넷 사용이 불가능하다.

#### case 3

public subnet에 리소스(ec2 등)가 있으면 `public ip`도 부여받고 바로 `igw`로 나갈 수 있지만 `private subnet`에 위치하면 바로 `igw`로 빠져 나갈 수가 없다. `public subnet`에 위치한 `nat-gateway`를 통해 `igw`로 나가라고 정의 해놓은 것이다.

> 이 설정이 없으면 `private subnet`에 위치한 리소스(ec2 등)은 인터넷 사용이 불가능하다. `nat-gateway`를 통해 내부에서 외부 인터넷 접속은 가능해도 외부에선 바로 `private subnet`에 위치한 리소스로 들어올 수는 없다.

## NAT Gateway

- private instance가 외부의 인터넷과 통신하기 위한 통로
- 내부 사설망이 있는 private 인스턴스들이 외부 인터넷과 통신을 위해 생성 된 일종의 통로
- 하나의 공인 ip 를 가짐
- public subnet에 있어야함

`route table`에서 필요한 설명은 다 했고, 하나의 공인 ip를 가진다고 했는데 public subnet에 위치시켜 `elastic ip`를 부여 받도록 처리 해야한다.

> public subnet에 위치하면 언제 바뀔지 모르긴 하지만(ec2 재부팅하면 날라감) public ip를 부여 받지만 private subnet은 그렇지 못하니까 하나의 public ip로 사용된다고 생각하면 된다.

> public ip를 가져야만 인터넷 통신이 가능하다.

---

여기까지가 aws에 종속된 서비스. 이 이하는 추가적으로 함께 이해하면 좋은 네트워크 관련 내용

## cidr(Classless Inter Domain Routing)

- 클래스 없이 도메인간 라우팅기법(a,b,c 클래스기반 X). class를 안써서 더 유연한 ip 범위을 갖는다
- private network를 위해 만들어짐(ip가 부족해서 사설망을 구축하기 위해)
- ip주소의 영역을 여러 네트워크 영역으로 나누기 위해 ip를 묶는 방식
- ip 주소에서 네트워크 주소/호스트 주소 구분을 위해 사용된다.

예를들어 네트워크 대역이 `192.168.0.0/16` 이라치면 앞의 2개(`192.168`)는 네트워크 주소로, 나머지 2개(`0.0`)은 호스트 주소 구분용으로 쓰인다는 의미이다.
즉, 이 대역의 호스트 개수는 `192.168.0.0` ~ `192.168.255.255` 까지 가능하다(예약된 ip 주소 포함)

추가로 `subnet` 은 `vpc`의 부분 집합이라 하였는데 `vpc`의 `cidr block` 보다 더 작은 대역을 갖게 된다.
예를들어 `vpc` 의 `cidr block` 이 `192.168.0.0/16` 이라면 `subnet` `cidr`는 17 이상이 되어야 한다.

아래 이미지는 vpc의 네트워크 대역과 하위 subnet 대역, subnet에 소속된 기기들의 아이피 주소를 설명하고 있다

### Private Network(사설망)

- 하나의 public ip를 여러 기기가 공유 할 수 있는 방법
- 하나의 망에는 private ip를 갖는 기기들과 gateway로 구성됨.

즉 하나의 사설망 안에 여러 컴퓨터를 셋팅 해놓고 그 컴퓨터 기기에 고유한 private ip(망 안에서만 고유한)를 부여 받도록 구축해놓으면 하나의 public ip를 통해서 여러 컴퓨터가 인터넷을 쓸 수가 있다. 이때, 어느 기기로 트래픽을 보내야할지 라우팅 테이블이 필요하다.
