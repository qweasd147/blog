---
title: 'AWS - Cognito'
date: '2020-08-03T02:09:50.508Z'
template: 'post'
draft: false
category: 'aws'
tags:
  - 'aws'
  - 'cognito'
  - 'oauth'
description: 'cognito를 써서 독립적인 인증서버 구축 & user pool로 data 마이그레이션 구현'
---

# Cognito

각 어플리케이션(웹 & 모바일 앱)에서 사용 가능하도록 인증, 권한 부여, 사용자 관리 등을 제공해준다.

일반적으로 이러한 기능을 구현하려면 인증 정보를 확인하고 세션 등에 저장 또는 `token`발급을 해주는 기능과 해당 데이터 관리 및 `DB`도 구축해야만 하지만 이러한 작업을 하나로 묶어 제공한다.

Cognito를 사용함으로써 생각하는 장점

1. 일단 사용자 정보 저장소(`user pool`)에 사용자 정보를 저장 한 뒤, 사용 용도에 맞게 그룹화하여 각 용도에 맞게 분류해서 사용가능
2. 단순 인증 처리(로그인) 기능만 구현해서 써도 돼고, 추가로 `identity pool`을 구축하여 aws 여러 resources들을 사용 가능한 임시 권한(`IAM`)을 발급하여 사용 가능하다.
3. 사용자 마이그레이션이 쉽다. 사용자 데이터를 일괄 넣어서 사용해도 돼고, `cognitor`에 사용자 조회 중, 사용자 정보가 없을때 `trigger`를 발생 시켜 사용자 데이터를 넣도록 구성 가능하다.

단점으로는 가격이 비싸다(월별 활성 `MAU`를 기준으로 가격 책정, [cognito 요금표](https://aws.amazon.com/ko/cognito/pricing/)). 이게 소규모에선 가격이 정말 저렴하지만 일정 수준 넘어가면 그냥 직접 구축하는게 훨씬 저렴하므로, 소규모의 이벤트용 프로젝트로 빠르게 오픈하고 다시 내리는 형태로 쓰는게 베스트인거 같다.

사용해본 내용 중, `Cognito`를 통해서 인증 서버와 리소스 서버를 구현해 설명할 것이고 해당 소스는 [cognito with lambda](https://github.com/qweasd147/serverless-boilerplate/tree/master/cognito)에서 확인 가능

---

## 어플리케이션 전체 구성도

![cognito_app](/blog/media/aws/cognito-diagram.jpg)

어플리케이션은 총 2개(`auth-server`, `resource-server`)로 나누어 구현하였다.

### auth-server

사실 이 앱(`auth-server`)가 필요 없기도 하다. 그냥 설정값과 `trigger` 정도만 관리하고 다른 앱(`front쪽`)에서 cognito에서 제공해주는 api를 직접 써도 된다. 하지만 backend 개발자이기도 하고 backend에서 한번 가공한 형태로 하는게 더 커스터마이징이 편할테니까 추가하였다.

`Auth-Server App Lambda`는 `aws lambda`로 구현한 nodejs 서버 이고, `Cognito`는 위에서 설명한것과 같이 일단 `User DB` + 인증 관리 해주는 모듈 정보로 생각해도 충분하다.

아무튼 중요한건 Cognito에서 특정 조건일때 발생하는 `Lambda Trigger`를 구현해서 추가 할 수도 있는데 프로젝트에선 `사용자 마이그레이션` 항목에 트리거를 추가하였다. 그래서 만약 로그인 시도 중 `Cognito User Pool`에 접근하였는데 해당 사용자 정보가 `User pool`에 없으면 `Lambda Trigger`가 실행된다. 여기서 그냥 사용자 정보가 없다고 처리할지, 아니면 다른곳에 존재하는 사용자 정보를 `User pool`에 추가 후, 원래부터 존재하던 사용자로 처리할지 분기처리가 가능하다.

구현한 소스는 기존 `data source`가 따로 없으므로, 그냥 요청 이메일 도메인이 `google`이면 사용자 정보를 추가하도록 구성하였다.

```javascript
if (!email?.endsWith('gmail.com')) {
  callback(null, event);
  return;
}

//이메일 도메인이 google인 것들만 마이그레이션 허용
event.response.userAttributes = {
  email: event.userName,
  email_verified: 'true',
  name: 'temp_name',
};
event.response.finalUserStatus = 'CONFIRMED';
event.response.messageAction = 'SUPPRESS';

context.succeed(event);
```

보통 요청한 `id`, `password` 정보를 event 객체에서 꺼내 다른곳에 존재 여부를 확인 후, 마이그레이션을 허용할지 판별한다.

#### API

- POST /{stage}/api/user -> 회원가입
  - email, name, password 필수
- POST /{stage}/api/user/signin -> 로그인(`token`값 반환)
  - email, password 필수
- GET /{stage}/api/user/signout -> 로그아웃
  - 요청 해더에 `access token`이 존재해야함
- GET /{stage}/api/user/me -> 내 정보 보기(`jwt 토큰 기반`)
  - 요청 해더에 `access token`이 존재해야함

### Resource-Server

리소스 서버는 `Auth-Server`에서 발급 받은 토큰으로 resource를 사용하는 목적의 서버이다.

전체 흐름은 `user request`->`API Gateway`->`Lambda`순서로 진행되지만 인증이 확인 안된 `request`는 모두 `API Gateway`에서 차단해 버린다. `API Gateway Authorizer`를 추가하여 연결된 API는 인증되지 않은 Request를 전부 차단하므로 `Lambda`에 도달한 Request는 모두 인증된 Request를 보장하게 된다.

이떄 중요한 점은 요청 해더에 `Authorization : Bearer {token}`형태로 요청 해야하고, 이때 토큰값은 `access token`이 아니라 `id token`이어야 한다. 이 부분은 커스터 마이징이 가능할것 같지만 일단 기본 셋팅은 `id token`을 사용해야 한다.

당장 `id token`을 사용해도 `API Gateway`로 가니까 별 상관 없을꺼 같지만 `access token`을 사용 하도록 변경하는건 필요하긴 할꺼 같다.

#### API

- GET /{stage}/api/users/me -> 토큰값으로 요청한 사용자 정보를 파싱하여 반환
  - 요청 헤더에 `id token`값이 존재해야함

일단 람다 어플리케이션에선 인증된 `Request`라고 보장해주는거 까진 좋은데 토큰 파싱은 아무래도 직접 해야하는거 같다. 그래서 리소스 서버엔 [AWS JWT 토큰 검증 가이드](https://docs.aws.amazon.com/ko_kr/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)에서 설명한 방법으로 토큰값을 검증 & 파싱해주는 내용이 포함되어 있다.
