---
title: "AWS - Lambda@Edge - 이미지 리사이징"
date: "2021-01-22T02:48:08.854Z"
template: "post"
draft: false
category: "aws"
tags:
  - "aws"
  - "cloudfront"
  - "cdn"
  - "lambda"
description: "Cloud Front, Lambda를 활용해서 이미지 실시간 리사이징"
---

## Lambda@Edge 활용한 이미지 리사이징

서비스를 운영할 때 이미지 리소스 관리는 귀찮은 일이 많다. 하나의 이미지라도 여러 서비스에서 각각 최적화된 형태의 포맷, 사이즈 등을 적용 시키고 싶을때가 많기 때문이다. 예를들어 하나의 이미지를 pc에서 볼 땐 원본 그대로 표출하고, 모바일에서 볼땐 `100x100` 사이즈로 표출하려고 한다면 이에 따라 이미지를 어떻게 관리 해야할지 고민이 많을수도 있기 떄문이다.

가장 일반적인 방법으로는 사이즈별 or 포맷별로 전부 이미지 파일을 업로드 하는 방법이 있다. 하지만 이러한 방법은 저장공간도 많이 필요하고 더욱 큰 문제는 업로드 할때도 많은 이미지를 일일이 업로드하기엔 엄청 귀찮고 관리포인트도 많이 늘어나게된다.
두번째 방법으로는 `S3`에 파일이 업로드 되면 여러 형태의 이미지가 생성되도록 람다 트리거를 거는 방법도 있다. 하지만 이 방법은 저장공간은 더욱 많이 들고, 이미지도 언제 생성될지 알 수 없다(생성은 빠르긴 하겠지만 그래도 업로드 직후 확인하면 `404`가 뜨는 케이스가 많을 것이라고 생각된다.)

이런 경우 많이 쓰는게 `Lambda@Edge`를 통해 실시간 이미지 리사이징이다.
`Cloud Front`로 이미지 요청이 오면 `Origin Response`를 조작해서 최적화된 형태의 이미지를 생성 후 응답해주면 된다. 이렇게 구성하면 이미지 저장 공간도 많이 절약되고, 각 플랫폼 별로 최적화 된 이미지를 원본 이미지 변경이나 추가 없이 제공해 줄수 있어 매우 유용하다. 이미지를 매번 생성하여 응답하면 응답시간이 너무 길어 질꺼라는 불안감이 생길 수 있지만 최초 응답 시엔 이미지를 생성하여 응답해주니까 응답시간이 약간 길어 질수 있지만 이후엔 똑같은 요청이라면 `Cloud front`에서 이미지가 캐싱되어 응답하므로 응답시간은 훨씬 단축된다.

---

## 이미지 리사이징 Cloud Front에 적용

사실 이러한 방법은 다른곳에서도 많이 사용하고 있고, 조금만 찾아보면 소스코드도 쉽게 구할 수가 있다. 하지만 뭔가 다 조금씩 아쉬운것들이 많아 조금 더 개선해 보았다. 구현한 소스코드는 [이미지 리사이징](https://github.com/qweasd147/serverless-boilerplate/tree/master/lambda-edge) 여기서 확인이 가능하다.

### 중요 포인트 & 개선한 것

1. `AWS IAM` 생성 및 관리를 `serverless framework`로 옮겨 관리를 쉽게 할 수 있도록 변경. `aws`를 해본 사람이라면 이거 코드로 관리하는게 얼마나 유용한 지 알 것이라 생각된다.
2. 역시 `serverless framework`를 써서 배포를 매우 간단하게 바꿧다.
3. 환경변수 관리를 파일(`config.js`) 및 `header`값을 통해 관리 가능하도록 개선. 기본적으로 `Lambda@Edge`는 환경변수를 사용 못해 `빌드 환경` or `헤더값`을 통해서만 설정값을 사용 할 수가 있다.
4. 만든 소스는 `Lambda@Edge`를 제외한 `cloud front` 및 연관 `behaviors`가 셋팅 된 상태에서 적용 시키는게 목적으로, 기본적인 `CDN` 기능에서 이미지 리사이징 기능을 추가한 일종의 데코레이터라고 생각하며 만들었다(`CF` & `behaviors`세부 셋팅 및 초기화는 `Cloud formation`으로 관리하지 않는다).

### 적용 방법(mac 환경 기준)

1. S3, Cloud Front & behaviors 셋팅

셋팅 방법은 이전 [cloud front 글 리스트](/tag/cloudfront/)를 참고한다. 추가로 s3는 public이 아닌 private하게 구성하는걸 추천하고, `behaviors` 구성 시 `Query String white list`를 `d w h`이렇게 3개 추가해준다(소스 코드상에서 3개의 값만 사용하기 때문에).

**주의!**

`behaviors`의 `path pattern`과 `S3`의 디렉토리 시작은 같은걸로 맞춰준다. 소스 코드에선 `/images`로 똑같이 맞춰져 있다.
ex) `behaviors`의 패턴은 `/images/*`로 셋팅, `S3`는 /images 하위에 이미지 파일 업로드

2. 소스코드 다운로드 & 설정값 변경

```sh
$ git clone https://github.com/qweasd147/serverless-boilerplate.git
$ cd ./lambda-edge
$ npm install
```

다운 받은 파일에서 `config.js`파일을 수정한다.

```js
  development: {
    BUCKET_NAME: "버킷명",
    BUCKET_REGION: "ap-northeast-2", //버킷이 있는 리전
    BUCKET_PATH: "/images/*", //behaviors path, cf->bucket 접근 경로 제한 설정 위해서(role)
    DISTRIBUTION_ID: "xxxxxxx",
  },
```

위에 값을 바꿔준다. 참고 사항으로 `development`라는 키는 `stage`를 정의하는 값이다. 만약 다른 `stage`도 추가하고 싶으면 키값 & 설정값을 적당히 변경 및 추가 한 후, `Cloud Front` -> `Origins`으로 접근 한 다음 `Origin Custom Headers`값에 `x-lambda-stage` : stage 값을 추가 해주고, 배포 시 해당 `stage`로 셋팅해서 배포 하면 된다.

3. 배포

#### stage(`development`) 변경 없이 그냥 배포

```sh
$ npm deploy.dev
```

#### stage(`development`) 변경 했을 시, sls 문법 그대로 써서 배포

```sh
$ sls deploy --stage 셋팅한_stage_값
```

ex) production 환경 셋팅

config.js

```js
  development: {
    BUCKET_NAME: "버킷명",
    BUCKET_REGION: "ap-northeast-2", //버킷이 있는 리전
    BUCKET_PATH: "/images/*", //behaviors path, cf->bucket 접근 경로 제한 설정 위해서(role)
    DISTRIBUTION_ID: "xxxxxxx",
  },
  production: {
    BUCKET_NAME: "product-bucket",
    BUCKET_REGION: "ap-northeast-2",
    BUCKET_PATH: "/images/*",
    DISTRIBUTION_ID: "PRODUCT_CF_ID",
  }
```

deploy command

```sh
$ sls deploy --stage production
```

추가로 `x-lambda-stage`값 `production` 추가

### 주의점 & 커스텀 요소

1. 삭제 어려움

먼저 배포는 쉬운데 `Lambda@Edge` 적용을 취소하는게 어렵다. 보통 배포 된 것을 취소 하려면 `Serverless framework`에서 제공해주는 `sls remove` 명령을 통해 쉽게 없앨 수가 있지만 `Lambda@Edge` 특성 상 각 리전별로 함수 복제가 일어난다. 이러한 복제된 함수를 먼저 다 없어진 다음에야 버지니아 북부 리전에 배포된 함수 삭제가 가능한데, 복제된 함수가 언제 삭제 될 지는 알수 없다(상황에 따라 많이 다르지만 보통 10분 ~ 30분). 차라리 다시 업데이트 하는거면 일단 배포 한 뒤 적용 되기까지 그냥 무작정 기다릴 수도 있지만 없애는건 아무래도 개발자가 직접 개입해서 `cloud front`에서 연동된 람다 함수를 끊고 복제된 함수가 전부 없어지면 `cloud formation`에서 직접 삭제해야 할 듯 싶다.

2. 에러 발생 시 처리 방법

올려놓은 소스에선 에러 발생 시, 그냥 에러를 리턴하게 해놓았다. 만약 에러 발생 시 원본 이미지를 그대로 전달해주고 싶으면 약간의 수정이 필요하다.

또한 `Lambda@Edge` 특성상 `body`를 수정하면 `body`에 최대 1MB까지 담을 수 있다. 만약 리사이징 한 이미지가 1MB가 넘는다면 문제가 생기는데 이거 또한 고민이 필요하다. [당근 마켓에서 하는 이미지 리사이징](https://medium.com/daangn/lambda-edge%EB%A1%9C-%EA%B5%AC%ED%98%84%ED%95%98%EB%8A%94-on-the-fly-%EC%9D%B4%EB%AF%B8%EC%A7%80-%EB%A6%AC%EC%82%AC%EC%9D%B4%EC%A7%95-f4e5052d49f3)을 참고하면 1MB가 넘으면 퀄리티를 조금씩 내리면서 계속 이미지 생성을 하고 있다. 이것도 하나의 방법이긴 하지만 사용하는 곳에 따라 약간의 커스터 마이징이 필요할까 같다.

3. 배포 환경에 따라 스크립트 수정

먼저 간단하게 serverless에서 내부적으로 하는 배포 과정

- 로컬에서 build (`npm install` 및 `webpack`설정이 있으면 번들링)
- cloud formation에 따라 배포

현재 소스에서 이미지 리사이징 하는데 사용하는 `sharp`모듈은 os에 따라 내부적으로 설치되는게 다른데 위의 설명한대로 빌드는 로컬 환경에서, 실행은 컨테이너(아마도 리눅스) 환경에서 실행 되다 보니 os 차이가 발생 되어 오류가 발생된다. 이러한 문제를 해결하려면 빌드 환경을 실행하는 환경과 동일하게 구성하거나 아니면 강제로 특정 os에 맞게 모듈을 설치해야한다. 코드 상에서도 강제로 람다 환경에 필요한 모듈을 설치하도록 셋팅 되어 있는데, os에 따라 람다에 맞는 모듈을 설치하려면 [sharp install](https://sharp.pixelplumbing.com/install#aws-lambda)을 참고하면 된다. 참고로 소스 상에서 이러한 문제는 `npm install`하면 자동으로 인스톨 이후에 실행되는 `postinstall`을 사용해서 해결하였다.

package.json

```json
"scripts": {
    "postinstall": "rm -rf node_modules/sharp && SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --arch=x64 --platform=linux sharp"
  },
```

위에 내용은 설명한대로 mac 환경에서 셋팅한 `package.json`파일이다. 만약 mac이 아니라면 위 스크립트 내용 수정이 필요하다.
