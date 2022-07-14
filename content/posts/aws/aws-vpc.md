---
title: 'Session Manager'
date: '2016-02-08T22:40:32.169Z'
template: 'post'
draft: false
category: 'aws'
tags:
  - 'infra'
  - 'ec2'
  - 'ssh'
description: 'SSH로 ec2 접근이 아닌 IAM에 의존한 ec2 접근 방식'
---

# Session Manager

일반적으로 ec2 서버에 접근하려면 ssh가 필요하다. ssh

https://docs.aws.amazon.com/ko_kr/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html#install-plugin-macos-signed

## VPC(virtual private cloud)

- aws 크ㄹ라우드에서 논리적으로 격리된 공간
- 가상 네트워크 공간이라 생각하면 됨

## AZ

- 물리적으로 분리 되어있는 인프라가 모여있는 데이터 센터
- 하나의 리전은 2개 이상의 AZ이 구성되어 있음

## Subnet

- VPC 하위 단위(부분 집합. 하나의 vpc를 쪼개 놓은 공간이라 생각하면 된다)
- 하나의 서브넷은 하나의 AZ에서만 존재 가능
- 인터넷을 통한 접근 가능/불가 설정을 할 수 있음(private subnet, public subnet)
- cidr block(사용 할 수 있는 아이피 범위) 적용 가능

## Internet Gateway(IGW)

- 인터넷으로 나가는 통로
- 고가용성이 확보되어 있음
- IGW 로 연결되어 있지 않은 서브넷 = Private Subnet
- Route Table에서 연결 해줘야하
- 하나의 vpc에만 연결 가능

## NACL / Security Group

- 검문소
- NACL => Stateless, SG => Stateful
- 기본적으로 VPC 생성 시 만들어줌
- Deny는 NACL 에서만 가능

## Route Table

- 트래픽이 어디로 가야할지 알려주는 테이블
- 기본적으로 vpc 생성 시 만들어줌
- local에 해당하는 아이피는 말그대로 자기한테서 찾고 그 외의 대역은 다른 igw(or nat gateway)에서 찾도록 셋팅 가능

## NAT Gateway

- private instance가 외부의 인터넷과 통신하기 위한 통로
- 내부 사설망이 있는 private 인스턴스들이 외부 인터넷과 통신을 위해 생성 된 일종의 통로
- 하나의 공인 ip 를 가짐
- public subnet에 있어야함

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
