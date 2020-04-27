---
title: "OAuth2 with spring boot"
date: "2020-04-27T01:07:59.877Z"
template: "post"
draft: false
category: "etc"
tags:
  - "spring"
  - "oauth"
  - "oauth2"
  - "auth"
description: "OAuth2 + Spring boot를 사용하여 인증 Provider 제작 및 고려 사항"
---

`OAuth2.0`을 `Spring Security OAuth`에서 제공해주는 라이브러리를 사용해 구현 및 필요한 설명 추가.
기타 `grand type` 방식에 따른 인증 과정(`access token`발급 과정)등은 다른 document 참고

# OAuth ?

인증 Provider, 외부 API 사이 인증 및 권한 부여 관리하는 일종의 프로토콜

여기서 설명한 모든 샘플 코드는 [oauth-sample](https://github.com/qweasd147/springboot-oauth) 여기서 확인 가능

# OAuth 2.0 플로우 설명

특정 리소스 사용까지 전체 플로우(grant type마다 인증 flow는 다르니까 생략)

1. 특정 사용자가 인증서버를 통해 인증 flow를 거쳐 성공
2. 토큰 생성 및 TokenStore에 저장
3. 토큰 발급(반환)
4. Resource 서버로 토큰값(access_token)을 요청 api의 헤더에 담아 Resource 서버로 요청
5. Resource 제공 서버는 토큰값 validate (JWT를 사용 안하면 인증서버로 토큰 유효성 request를 날립니다) 
6. Resource 제공

# JWT

JSON Web Token의 줄임말 이지만 OAuth 2.0에서 JWT 도입한다면 추가적으로 이해 해야할 사항이 있습니다.

> Resource서버에선 request의 헤더에 담긴 토큰 (access_token)을 validate 할 수 있는 방법이 없습니다. 따라서 매번 인증서버로 토큰의 유효성 검사 api를 요청해야 합니다. 하지만 이는 당연히 많은 시간이 걸릴수 밖에 없습니다. 이러한 문제를 해결하기 위해선 Resource 서버 자체적으로 토큰 유효성 검사를 할 수 있는 방법이 필요하며, 인증서버와 리소스 서버 사이에 약속을 정해놓아야합니다(sign key, pem, jks 사용하여 서로 공유가 필요)

**참고**
resource 서버에서 `TokenStore`를 구현하면 별다른 검증 api없이 validate를 할수 있지만 이는 resource 서버에서 db 정보를 가지고 있을때만 가능합니다.
 

JWT를 사용하면 위에서 설명한 Flow가 아래와 같이 바뀝니다.

1. 특정 사용자가 인증서버를 통해 인증 flow를 거쳐 성공
2. 토큰 생성 및 발급 **TokenStore에 저장안함**
3. Resource 서버로 토큰값(access_token)을 요청 api의 헤더에 담아 Resource 서버로 요청
4. Resource 제공 서버는 토큰값 자체 유효성 검사
5. Resource 제공

주의할점은 토큰 파싱할 수 있는 정보를 각 resource 서버에 가지고 있으므로 보안상 관리포인트가 늘어나며, 만약 토큰값이 유출되게 된다면 인증서버에서도 차단할 수 있는 방법이 없습니다.

또한 `JWT`의 특징으로 decode가 빨라야하고 누구나 body값을 encode, decode가 가능합니다. 따라서 토큰변조가 이루어졌는지 체크가 필수적으로 들어갑니다.

> JWT의 정보(body값)을 바로 믿는게 아니라 checksum값을 확인하여 변조가 이루어졌는지를 먼저 확인

# Grant Type

grant type은 OAuth에서 인증 하는 방식? 방법? 수단 정도로 이해하시면 됩니다. oauth 구현 시 원하는 clint마다 제공해 줄 grant type을 지정해 줄수 있습니다.

> 앞서 설명한대로 grant type에 따라 인증 flow 가 달라집니다. type에 따른 요구 정보, flow설명 등은 생략합니다. (필요 시 인터넷 참고)

### 1. implict
이건 쫌 다른 타입에 비해 관리가 힘듭니다. 문제될껀 없어도 딱히 메리트가 많지 않다고 생각됩니다.

별도로 `was`를 구축하지 않고 `spa`등의 js앱에 사용 가능하지만, `refresh token`이 발급되지 않습니다.

### 2. authrozation code
가장 많이 쓰는 방식입니다. 하지만 인증 flow 내에 ui도 함께 구현하여 제공 되어야 합니다. 제공되는 ui를 통해서만 로그인을 진행할 수 있으므로 redirect가 많이 이루어 지는데, 아래와 같은 문제들이 발생합니다.

* 인증 서버 로그인 ui로 redirect가 이루어지고, 다시 응답 redirect가 올 때 응답 parameter가 제한됨(커스터 마이징이 힘듦)
* 웹에서 비동기 로그인 처리가 불가능

사실 이 방식은 구현은 쉬운데 사용 측에서 귀찮은 부분이 많습니다.

### 3. Resource Owner Password Credentials Grant (password)

인증서버로 client id, client secret, 계정 ID, 계정 password를 한꺼번에 날려 인증처리를 하는 방식입니다.

이 방식은 authrozation code와 반대로 따로 제공하는 ui를 사용 안하므로 사용 측에서 구현해야하는 단점이 존재합니다. 하지만 사용 측에서 로그인 전처리, 후처리 등이 쉬운게 장점입니다.

**주의!**
해당 타입(`password`)은 계정정보가 유출되지 않도록 믿을만한 client에만 지원하도록 제한하고 있습니다.
ex)
> 본인이 Auth서버와 Client 서버 둘다 만들고 Client서버에서 password 타입으로 인증처리를 하도록 하면 상관없지만(어차피 모든 계정정보를 알고 이쓰니까) 제3의 Client서버에 password 타입을 지원하면 중간에 계정정보가 제3의 서버를 통해 유출되어버릴수가 있습니다.

# 개발 시 선택사항

## Token Store

### 1. In memory db(h2 등)
사실 이건 고민할 여지가 없습니다. 어디까지나 개발용 or 샘플용으로 사용해야 합니다.

### 2. RDB
가장 무난합니다. 단점으로는 토큰 생성 시 많은 sql access가 이루어져, 최적화가 필요할 수도 있습니다. 물론 jwt 사용 시 별도로 token 정보를 DB에 저장 하지 않으므로 큰 상관은 없습니다.


### 3. Redis
개인적으로 토큰 저장소로 redis를 선택하는게 꽤 좋은 방법이라고 생각하였습니다. RDB보단 처리가 빠른 redis가 낫다고 생각했는데 spring security 에 성능적으로 문제가 발생한다고 합니다. 현재는 수정 되었지만 해당 버전을 피하려면 버전 의존관계를 생각하여 도입을 고려해야합니다.

참고

* https://youtu.be/mPB2CZiAkKM?t=2975
* https://charsyam.wordpress.com/2018/05/11/%EC%9E%85-%EA%B0%9C%EB%B0%9C-spring-security-oauth%EC%9D%98-redistokenstore%EC%9D%98-%EC%82%AC%EC%9A%A9%EC%9D%80-%EC%84%9C%EB%B9%84%EC%8A%A4%EC%97%90-%EC%A0%81%ED%95%A9%ED%95%98%EC%A7%80-%EC%95%8A/

## JWT
앞서 설명한건 JWT가 무엇인지, 왜 사용해야하는지를 설명하였습니다. 하지만 JWT 사용은 필수가 아닌 선택사항이며 JWT를 사용할때와 안할때 access token 인증 case는 아래와 같습니다.

### 1. JWT 사용할 시

1. sign key를 지정해서 auth 서버와 모든 resource 서버가 공유한다.
2. 공개키 방식으로 pem 파일(JKS)을 생성하여 auth 서버와 모든 resource 서버에 각각 셋팅한다.

### 2. JWT 사용 안할 시

1. auth 서버로 access token값을 담아, validate api를 요청하여 토큰값을 검증한다(default)
2. token store를 구현하여 자체적으로 token store에서 유효한 값이 존재하는지 검증한다