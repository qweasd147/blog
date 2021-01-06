---
title: 'AWS - Cloud Front - WebServer'
date: '2020-08-12T07:52:44.005Z'
template: 'post'
draft: false
category: 'aws'
tags:
  - 'aws'
  - 'cloudfront'
  - 'cdn'
  - 'web server'
  - 'infra'
description: 'Cloud Front를 써서 React로 만들어진 어플리케이션 배포'
---

# 웹서버 구축

웹서버를 구축하기 위해선 생각 해봐야 할 것들이 있는데, 보통 물리적 공간에 웹서버(보통 `apache` or `nginx`)를 설치하고 정적 파일들을 올려놓은 후 해당 위치를 바라보도록 웹서버 셋팅을 하면 된다.

딱히 어려운건 없지만 인프라 구축 자체가 귀찮은게 많으니 이러한 작업을 AWS를 사용해서 구축하면 엄청 편하고 빠르게 배포가 가능하다.

기술 스택

- S3
- CloudFront
  1. OAI
- CRA

`route53`도 사용하고 싶지만, 보유한 도메인도 없고 돈도 없어서 생략

기술 스택을 보면 아는 사람은 짐작하겠지만 CRA(`React`)로 만들어진 소스를 빌드해서 `S3`에 올려놓고 `Cloud Front`에서 빌드된 파일을 접근하여 서비스 하는 형태로 구축한다.

---

## 버킷 생성

버킷은 원하는 이름 및 리전만 선택해서 디폴트 옵션으로 생성해도 충분하다. 주의할 것은 `모든 퍼블릭 엑세스 차단`을 체크 해서 생성한다(아마도 디폴트 옵션이 차단 활성화).

## 소스파일 빌드 및 S3에 업로드

먼저 서비스하고 싶은 `CRA`소스 파일을 빌드해서 `S3`에 업로드 해놓는다. 밑에 내용은 샘플 소스를 `git clone`해서 사용한 것이다.

- 샘플 소스 다운로드 및 빌드

```sh
$ git clone https://github.com/qweasd147/AwsStudy.git
$ cd ./AwsStudy/cloudfront/webserver/

$ yarn install
$ yarn build
```

- S3로 파일 업로드

```sh
$ aws s3 sync ./build s3://버킷명 --delete --output text
```

`aws-cli`를 설치하면 cli로도 가능한데 웹에서 직접 올려도 상관없다.

## Cloud Front 설정

다른 항목은 이전 `Cloud Front` 설명을 참조해서 만들면 되지만 주의해서 셋팅해야하는 부분이 있다.

### Cloud Front 생성 시 옵션

- Restrict Bucket Access(버킷 access 제한)

  CloudFront를 통해서만 버킷 접근을 허용 할지 여부. `예`를 선택하면 `OAI` 선택 창이 보이는데 필요에 따라 새로운 `OAI` 생성 또는 기존 `OAI`를 사용 선택

- Grant Read Permissions on Bucket

  CloudFront가 원본(s3)에 접근 권한을 자동으로 부여 할지 여부. 그냥 yes

- Default Root Object

  기본 접근 파일. cra로 만들어져 모든 접근 파일인 `index.html`로 입력

이렇게 3개만 주의해서 생성하면 된다.

### 라우팅 설정(에러페이지 셋팅)

위 내용까지 셋팅하면 `CloudFront`에서 제공해주는 도메인으로 `S3`에 존재하는 하위 디렉토리 및 파일들을 찾아가도록 셋팅한 것이다. 근데 우리는 `React App`이니까 `URL`의 주소가 어찌되어 있던 `index.html`로 접근하여 `React` 소스 레벨에서 라우팅 처리가 되도록 셋팅해야 한다.

생성된 `Cloud Front`를 선택 -> `Error Pages`를 클릭하면 에러 페이지 셋팅이 가능하고, `403`, `404`일때 `/index.html`로 보내 어플리케이션 레벨에서 모든 처리가 이루어 지도록 셋팅하면 된다.

| HTTP Error Code | Response Page Path | Http Response Code |
| --------------- | ------------------ | ------------------ |
| 403             | /index.html        | 200                |
| 404             | /index.html        | 200                |

이런식으로 셋팅하면 어플리케이션 레벨(`React`)에서 모든 라우팅 처리를 맡기게 셋팅된다.
캐싱 기간은 디폴트값으로 사용해도 충분할꺼라 생각된다.

## 정리

이렇게 까지 셋팅해야 보다 안전하고 빠른 웹서버 구축이 된다. 중요한 부분을 몇가지 다시 생각해보면

#### 1. 외부에서 S3 접근 불가

처음 `S3`를 만들 때 `퍼블릭 엑세스 차단`을 체크하였고, `S3`에서 `정적 웹 사이트 호스팅` 또한 하지 않았다. 따라서 외부에서 `S3`에 직접 접근 할 수도, 버킷명도 알아낼 방법이 없어 보안적으로 좋아진다.

#### 2. SSL 적용이 쉽다

`Cloud Front`를 사용함으로써 기본적으로 SSL 사용이 쉽게 셋팅이 된다
정적 웹서버 호스팅은 aws 내에서도 여러가지 방법이 존재하긴 한다.

1. S3에서 `정적 웹 사이트 호스팅`
2. `route53`에서 S3로 직접 연결

이런 방법들이 있긴 하지만 SSL 적용을 이보다 편하게 할 수는 없는걸로 알고 있다.

#### 3. 모든 라우팅 처리는 어플리케이션 레벨

CDN 서버 입장해선 접근 시 무조건 index.html로 보내게 된다(`/`, `403`, `404` 한정).

#### 4. 웹서버 관리가 필요없다.

내가 직접 웹서버를 구축하고 관리하는게 아니라 다 aws에서 관리해주니까 성능, 관리 측면에서 엄청난 이득이다.

---

## 안될 시 점검 사항

- cloudfront를 통해 S3 접근이 안될 때(403)

`Grant Read Permissions on Bucket` 이 옵션은 `S3`에 해당 `CloudFront`의 읽기 권한을 자동으로 추가 해준다고 하였다. 근데 최근에 `AWS`쪽 버그인지 해당 옵션을 주고 생성하여도 접근을 못한 적이 있었다. 혹시나 셋팅을 다 끝냈는데 막상 요청해보면 `403`이 뜬다면 `S3`에 접근 권한이 추가 되어있는지 확인 먼저 해보는게 좋다.

`S3` 이동 -> `버킷 선택` -> 권한 탭 이동
순서대로 이동 하면 중간에 `버킷 정책`이라고 있는데 여기에 `CloudFront`의 OAI가 잘 붙어 있는지 확인한다.

```json
{
  "Version": "2008-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [
    {
      "Sid": "1",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity CF의_OAI_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::버킷명/*"
    }
  ]
}
```

이런식으로 잘 등록 되어있나 눈으로 확인이 가능하고, 추가로 버킷에 특정 디렉토리 하위만 접근 가능하도록 수정 가능하다(`Resource`에서 수정)
