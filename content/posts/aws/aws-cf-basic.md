---
title: 'AWS - Cloud Front - 기본'
date: '2020-08-10T05:58:14.024Z'
template: 'post'
draft: false
category: 'aws'
tags:
  - 'aws'
  - 'cloudfront'
  - 'cdn'
  - 'web server'
  - 'infra'
description: 'Cloud Front를 사용해서 CDN 서버 구축'
---

# CloudFront

정적 리소스들을 전 세계를 대상으로 빠르게 제공해주는 CDN 서버

일반적으로 정적 리소드들을 `S3`에 올려놓고 `Cloud Front`를 `S3`에 연결하여 사용을 한다. 그 외에도 다른 도메인에서 사용하는 리소스, 기타 `Cloud Front`에서 제공해주는 서비스를 정리

### 목차

1. `Cloud Front` 생성 시 옵션
2. Origins & Origin Group
3. Behaviors
4. Error Pages
5. 캐시 초기화(Invalidations)

---

## 1. `Cloud Front` 생성 시 옵션

- Origin Domain Name

  - 다른 도메인 주소 입력
    > 다른곳에서 제공해주는 특정 리소스들을 CDN 서버에 캐싱해놓고 제공하고 싶으면 원하는 도메인을 입력한다. 예를 들어 다른 nginx 서버에서 제공해주는 정적 리소스들을 CDN으로 제공하고 싶으면 nginx 주소값을 넣으면 된다.

  2. Bucket 지정
     > s3를 통해 Resource를 제공하고 싶으면 dropDown에 나타나는 bucket중, 원하는 버켓을 선택한다. **주의!** 이때, `{버킷명}.s3.{리전}.amazonaws.com`형태로 리전 값을 넣어야 한다. 안넣고 최초 배포 시, DNS에서 실제 주소 값을 찾아가 리소스를 활성화 하는데 오래 걸릴 수가 있다. 시간이 지나면 해결 되지만 리전값 넣는게 어려운것도 아니므로 왠만하면 그냥 넣어준다.

* Restrict Bucket Access(버킷 access 제한)

  CloudFront를 통해서만 버킷 접근을 허용 할지 여부. `예`를 선택하면 `OAI` 선택 창이 보이는데, 경우에 따라 새로운 `OAI` 생성 또는 기존 `OAI`를 사용 선택

* Grant Read Permissions on Bucket

  CloudFront가 원본(s3)에 접근 권한을 자동으로 부여 할지 여부. 그냥 yes

* Viewer Protocol Policy

  접근 허용할 프로토콜을 선택하는건데 http는 속도 느리고 보안적으로도 안좋으니까 https를 통해서만 접근하는게 좋다. 경우에 따라(보통 다른 앱) http로 접근 할 수도 있으므로 http로 접근 시 https로 Redirect 되도록 설정(`Redirect Http to Https`)

* Allowed HTTP Methods

  정적 웹서버를 만드는게 목표니까 `GET, HEAD`로만 설정해도 충분. 필요 시, 다른걸로 설정해도 상관없다.

* TTL

  캐싱 기간을 무한히 가져가면 만약 s3에 기존 파일을 업데이트 해도 업데이트 된 파일을 확인이 불가능하다. 그래서 캐싱된 기간을 제어하려고 만든건데 개인적으로 그냥 디폴트 값으로 쓰다가 필요 시 CloudFront의 캐싱을 날려버리는 기능을 많이 쓴다.

* Restrict Viewer Access

  서명된 URL만 접근을 허용할지 여부. 접근 제한이 필요하다면 `Yes` 아니면 `No`로 하면 되고, 현재는 접근 제한없이 public하게 만드는게 목적이니까 `NO`. 당연히 yes를 선택하면 추가적인 정보가 있어야 하고, 요청 URL에 파라미터를 많이 셋팅해서 사용해야한다.

* Compress Objects Automatically

  압축이 가능한 형태의 리소스라면 압축해서 제공할지 여부 선택. 그냥 yes로 하는게 좋다고 한다.

* Price Class

  사용할 엣지 로케이션을 선택하는건데 뭐 전세계를 대상으로 서비스 할꺼면 모든 곳에 배포하면 좋지만 그러면 배포 시간도 오래걸리고 돈도 많이 나간다고 한다. 국내만 서비스 할것이냐 아니냐에 따라 선택하면 된다.

* Supported HTTP Versions

  그냥 HTTP/2 선택. 만약 3버전도 서비스 해준다면 그때 3으로 선택할지를 고려

* Default Root Object

  기본 접근 파일. cra로 만들어져 모든 접근 파일인 `index.html`로 입력

필요한 설정을 완료 하고 `Create Distribution` 클릭 하면 완료된다.

## 2. Origins & Origin Group

### 2.1 Origins

리소스들이 존재하는 위치를 정의한다. 맨 처음 `Cloud Front` 생성 시 기본 하나를 등록하니 최소 한개 이상이 존재하고, 추가로 `Bucket`, 도메인 등을 계속해서 등록 가능하다.

### 2.2 Origin Groups

말 그대로 `Origins`의 그룹이다.
![cognito_app](/blog/media/aws/cf/cf_origin1.png)

예를 들면 특정 `Origin A`에 리소스가 없거나 에러 발생 시 `Origin B`에서 찾도록 하고 싶을 때 사용한다. 우선순위별 `Origin`을 등록 해놓고 아래 `Failover criteria`를 선택 해놓으면 각 `Origin`을 방문하면서 체크 된 에러가 발생 시 하위 `Origin`에서 리소스를 찾는다.

## 3. Behaviors

요청 주소에 따라 어느 `Origin` 또는 `Origin Group`으로 보낼지 설정한다.
![cognito_app](/blog/media/aws/cf/cf_behaviors1.png)

위와 같이 설정 했다고 가정하면

`/path_a/*`로 요청 시 연결 된 `Origin` or `Origin Group`으로, `/path_b/*`로 요청 시 연결 된 `Origin` or `Origin Group`으로 보내고, 그게 아니라면 `Default(*)`에 연결된 `Origin` or `Origin Group`으로 보낸다. (`precedence`는 우선 순위)

이것 말고도 TTL, private 요청 설정이 가능하다(모두 생성 시 옵션과 중복 되므로 생략).

## 4. Error Pages

에러 발생 시 결과값을 선택하여 보내준다.

![cognito_app](/blog/media/aws/cf/cf_errorPages1.png)

이런식으로 `Cloud Front`에서 최종 응답 코드가 `403`, `404`일 때, 지정된 리소스를 반환하도록 셋팅이 가능하다. 물론 캐싱 기간은 짧게 주는게 좋다.

## 5. 캐시 초기화(Invalidations)

`Invalidations`탭에서 `Create Invalidation`을 선택 후 캐시를 지우고 싶은 경로를 입력하면 된다.

예를 들면 `/*` or `/path/img*`

---

#### TODO

1. Restrictions
   > `Cloud Front`의 접근 권한을 체크 하고 싶을때 설정한다. 나중에 쓸 일 있으면 추가 예정.
