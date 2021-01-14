---
title: 'AWS - Lambda@Edge'
date: '2021-01-14T02:31:18.369Z'
template: 'post'
draft: false
category: 'aws'
tags:
  - 'aws'
  - 'cloudfront'
  - 'cdn'
  - 'lambda'
description: 'Cloud Front, Origin Server 서버 요청 전후로 Lambda 함수 실행'
---

## Lambda@Edge

`CloudFront`는 CDN역할만 해도 좋은 퍼포먼스를 보여주지만 추가로 Lambda와 함께 사용이 가능하다.

`CloudFront`로 요청 전후를 가로채 `Lambda`함수 내에서 `Request`&`Response` 객체, 상태코드 등을 바꾸거나 아니면 다른곳으로 redirect도 가능하다.

![img1](/blog/media/aws/cf/edge/lamda_edge_trigger.png)
[aws 공식문서 설명](https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/lambda-edge.html)

위 이미지 및 문서에 보이는데로 총 4곳에 `Lambda` 함수 연결이 가능하다.

- CloudFront가 최종 사용자로부터 요청을 수신한 후(최종 사용자 요청)
- CloudFront가 오리진에 요청을 전달하기 전(오리진 요청)
- CloudFront가 오리진으로부터 응답을 수신한 후(오리진 응답)
- CloudFront가 최종 사용자에게 응답을 전달하기 전(최종 사용자 응답)

이런식으로 단순 cdn, 라우팅 역할만 하다가 Lambda로 전후처리가 가능하면서 활용도가 많이 높아졌다.

## 주의점

1. 연결 할 함수는 버지니아 북부 리전에 배포

   > `CloudFront`에 적용할 Lambda 함수는 `us-east-1(버지니아 북부)` 리전에 배포된 함수만 가능하다. 그럼 추가 의문사항으로 `CF`는 각 엣지로케이션에서 데이터를 가져오는데 정작 Lambda 함수는 특정 리전에서만 실행되면 느려지지 않을까 생각 할수도 있지만, 요청이 들어오면 가장 가까운 리전으로 함수가 복사된 후 실행되므로 물리적 거리로 인해 느려지는건 고민 안해도 된다. 또한 `CloudWatch`에 쌓이는 로그도 역시 각 함수가 실행된 리전에 쌓이게 된다. 만약 복제되는 걸 직접 확인하고 싶으면 AWS 홈페이지에서 Lambda -> 옵션 창에 `복제된 함수 표시`옵션을 키면 배포는 버지니아 북부에 배포되었지만 다른 리전에도 `(Replica)`표기와 함께 배포되어 있는걸 확인 할 수가 있다.

2. 항상 실행되는 함수, 결과 값을 캐싱하여 필요할 때만 실행되는 함수

   > 위 이미지를 보면 `viewer-request`, `viewer-response`는 각각 캐싱서버 도착 전, 캐싱서버 응답 후 실행되는 함수이다. 이런건 request마다 매번 실행되는 함수이니까 조심해야한다.(Lambda 함수 비용 폭탄을 맞을 수가 있다). 반대로 `origin-request`, `origin-response`는 캐싱 적중 여부에 따라 실행 될 수도, 안될 수도 있다.

3. 캐싱
   > `Lambda@Edge`를 구성해도 CDN 기능이 없어지는게 아니다. 위에서 설명한 대로 요청에 따라 결과값을 캐싱하고 응답하게 된다. 여기서 캐싱 키값은 어떤값들을 기준으로 생성되나 생각할 수 있는데, `uri`는 필수도 들어가고 여기에 `querystring`, `header`값을 섞어서 키가 만들어지게 설정 할 수도 있다. 일반적으로 해더값을 추가하면 요청 기기에 따라 다 각각 캐시가 될 수도 있으므로 `querystring`만 사용하여 키가 만들어지도록 설정하다. (`CF`에서 `Behavior` 탭에서 설정이 가능하다.)

추가로 제한사항이 쫌 많은데 자세한건 역시 [공식 문서](https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html)를 한번 읽어보는걸 추천
