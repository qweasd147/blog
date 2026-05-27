---
title: "k6를 사용한 성능 테스트"
date: "2026-04-02T08:49:06.157Z"
template: "post"
draft: false
category: "etc"
tags:
  - "k6"
  - "test"
description: "k6를 사용해서 성능, 부하 테스트를 하고 싶을때"
---

사용한 서버랑 k6 코드는 아래서 확인 가능하다

- [서버 코드](https://github.com/qweasd147/StudyNote/tree/master/springboot/PerformanceTest)
- [k6 코드](https://github.com/qweasd147/StudyNote/tree/master/k6/performance2)

1. mac 기준 `brew install k6`명령어로 `k6` 설치
2. 위 `서버 코드` 올린다.
3. `k6 코드`에서 `k6 run k6script.js` 실행

이런 단계로 진행하면 실행화면 결과를 볼 수 있다.

# k6를 사용한 성능 테스트

`k6`는 성능&부하 테스트를 위해 많이 사용하는 도구이다.
HTTP API에 대해 얼마나 많은 요청을 처리할 수 있는지, 응답 시간은 어느 정도인지, 요청이 실패하지는 않는지 등을 스크립트 기반으로 확인할 수 있다.

특히 아래와 같은 상황에서 간단하게 사용하기 좋다.

- 특정 API가 동시에 여러 요청을 받았을 때 얼마나 버티는지 확인
- 응답 시간이 어느 정도 수준으로 유지되는지 확인
- 코드 수정 전후로 성능 차이를 비교
- DB 락, 외부 API 호출, 캐시 적용 여부 등에 따라 어떤 차이가 나는지 비교

> 개인적으로도 일할 때 로컬 환경에선 `k6`와 이전에 작성한 `async-profiler` 조합으로 성능&부하 테스트를 진행한다.

`k6`의 장점은 테스트 코드를 `javascript` 문법으로 비교적 단순하게 작성할 수 있다는 점이다.
복잡한 테스트 도구를 바로 도입하기 부담스러울 때, 로컬 환경이나 개발 서버를 대상으로 빠르게 부하를 걸어보며 감을 잡기 좋다.

맨 위의 `서버 코드` 기준 아래 API가 구현되어 있는데, 이걸 기준으로 `k6`를 사용해서 부하 테스트를 해보면서 정리한 내용이다.

- `http://localhost:8081/normal/detail/1/optimistic-lock`
- `http://localhost:8081/normal/detail/2/shared-lock`

일단 가장 단순한 스크립트부터 만들고, 내 기준 헤깔렸던 개념들 위주로 무슨 의미인지 하나씩 정리해본다.

## 1. 가장 단순한 예제

아래처럼 두 API를 각각 다른 `group()`으로 묶어서 테스트를 만들 수 있다.

```js
import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE_URL = "http://localhost:8081";

export const options = {
  stages: [
    { duration: "5s", target: 5 },
    { duration: "20s", target: 20 },
    { duration: "5s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  group("normal detail optimistic lock", () => {
    const res = http.get(`${BASE_URL}/normal/detail/1/optimistic-lock`, {
      tags: { api_group: "optimistic_lock" },
    });

    check(res, {
      "optimistic lock status is 200": (r) => r.status === 200,
    });

    sleep(0.5);
  });

  group("normal detail shared lock", () => {
    const res = http.get(`${BASE_URL}/normal/detail/2/shared-lock`, {
      tags: { api_group: "shared_lock" },
    });

    check(res, {
      "shared lock status is 200": (r) => r.status === 200,
    });

    sleep(0.5);
  });
}
```

실행은 아래처럼 하면 된다.

```sh
$ k6 run k6script.js
```

## 2. `stages`

`stages`는 **가상 사용자 수(VU, Virtual Users)를 시간에 따라 어떻게 변화시킬지 정의하는 옵션**이다.

예를 들어 아래 설정은

```js
stages: [
  { duration: "5s", target: 5 },
  { duration: "20s", target: 20 },
  { duration: "5s", target: 0 },
];
```

이런 의미를 가진다.

1. 처음 5초 동안 VU를 5명까지 증가
2. 다음 20초 동안 VU를 20명까지 증가
3. 마지막 5초 동안 VU를 0명까지 감소

여기서 주의할 점은 두 번째 구간이 "20초 동안 20명을 유지"가 아니라, **5명에서 20명으로 점진적으로 증가**한다는 점이다.

즉 `stages`는 정확한 요청 개수를 보장하는 옵션이 아니다.
실제 요청 수는 아래 요소들에 따라 달라진다.

- 응답 속도
- 코드 내부의 `sleep()`
- 현재 시점의 VU 수
- `default function` 안에서 호출하는 API 개수

## 3. 가상 사용자(VU)

`VU 1명`은 실제 사람 1명이라기보다, `default function`을 반복 실행하는 독립 실행 단위라고 이해하는게 더 정확하다.

현재 코드 기준으로 VU 한 명은 아래 순서로 움직인다.

1. 첫 번째 그룹 실행
2. `optimistic-lock` API 호출
3. 응답 수신
4. `sleep(0.5)`
5. 두 번째 그룹 실행
6. `shared-lock` API 호출
7. 응답 수신
8. `sleep(0.5)`
9. 한 바퀴 종료
10. 테스트가 끝나지 않았다면 다시 반복

지금 구조는 '사용자 한 명이 두 API를 순서대로 호출하는 흐름'을 여러 개의 VU가 동시에 반복하는 구조이다.

> 가상 사용자는 그냥 사용자 한명이 테스트하는 개념으로, 보통 사이트에서 하나 누르고 잠시 있다가(`sleep`) 다른거 누르는 시나리오를 생각해서 만들어낸 개념이다.

## 4. `group`과 `tag`

### 4.1 `group`

`group`은 **테스트 코드의 구조를 나누는 기능**이다.

예를 들어

- 로그인
- 상품 조회
- 결제

같은 흐름 단위로 묶을 때 사용한다(`group` 안에 또 다른 `group`을 넣는 중첩 구조도 가능).

### 4.2 `tag`

`tag`는 **결과 데이터에 붙이는 라벨**이다.

예를 들어 아래처럼

```js
tags: {
  api_group: "optimistic_lock";
}
```

붙여두면 결과 메트릭에 `api_group=optimistic_lock` 같은 분류 정보가 같이 저장된다. 이렇게 tag를 붙이고 통과 기준(`thresholds`)을 태그별로 다르게 적용하거나 나중에 필터링 or 집계하기 위한 메타데이터라고 보면 된다.

### 4.3 `tag` 활용법

1. 태그별 threshold 추가
2. JSON output으로 결과 저장

예를 들어 threshold를 아래처럼 걸 수 있다.

```js
thresholds: {
  "http_req_duration{api_group:optimistic_lock}": ["p(95)<1000"],
  "http_req_duration{api_group:shared_lock}": ["p(95)<1000"],
}
```

이렇게 하면 결과에 태그가 반영된 threshold 단위로 구분해서 볼 수 있다. 아니면 아래처럼 JSON으로 저장하면

```sh
$ k6 run --out json=result.json k6script.js
```

실제 메트릭 포인트 안에 `group`, `api_group`, `url`, `status` 같은 태그들이 포함되어 있는걸 확인할 수 있다.

## 5. `stages`, `scenarios`, `iterations`

헷갈리는 옵션들인데, 셋 다 "부하를 어떻게 줄 것인가"와 관련 있지만 초점이 조금씩 다르다.

### 5.1 `stages`

`stages`는 시간의 흐름에 따라 `VU` 수를 변화시키는 방식이다.
즉 "몇 명의 사용자가 점점 늘어나거나 줄어드는가"를 표현할 때 사용한다.

예를 들어 아래 설정은

```js
stages: [
  { duration: "5s", target: 5 },
  { duration: "20s", target: 20 },
  { duration: "5s", target: 0 },
];
```

이런 식으로 해석할 수 있다.

1. 처음 5초 동안 사용자를 5명까지 증가
2. 다음 20초 동안 사용자를 20명까지 증가
3. 마지막 5초 동안 사용자를 0명까지 감소

즉 `stages`는 "부하를 점진적으로 올리고 내리는 테스트"에 적합하다. 예를 들어 트래픽이 몰릴 때 어느 구간부터 응답 시간이 급격히 느려지는지, 에러가 언제부터 증가하는지 확인할 때 많이 사용한다.

반대로 `stages`는 정확한 요청 개수를 맞추는 용도는 아니다.
응답 속도, `sleep`, `default function`의 수행 시간에 따라 실제 요청 수는 계속 달라진다.

### 5.2 `scenarios`

`scenarios`는 여러 종류의 테스트 흐름을 분리해서 실행하고 싶을 때 사용하는 방식이다.

예를 들어 아래처럼 생각할 수 있다.

- 첫 번째 API는 100번 호출
- 두 번째 API는 50번 호출
- 로그인 API는 짧게 워밍업만 수행
- 주문 API는 더 많은 사용자로 집중 테스트

이런 식으로 **각기 다른 실행 조건을 가진 테스트를 하나의 스크립트 안에서 분리해서 운영**할 수 있다.

즉 `scenarios`는 "테스트 구조를 여러 실행 단위로 나누는 기능"에 가깝다.
그리고 각 시나리오 안에서는 `executor`를 통해 어떤 방식으로 실행할지도 지정할 수 있다.

예시를 들면 아래와 같은 형태가 된다.

```js
scenarios: {
  optimistic_lock_test: {
    executor: "shared-iterations",
    vus: 5,
    iterations: 100,
    exec: "optimisticLock",
  },
  shared_lock_test: {
    executor: "shared-iterations",
    vus: 5,
    iterations: 50,
    exec: "sharedLock",
  },
}
```

이 경우에는 각 시나리오가 서로 분리되어 실행되므로, 지금처럼 `default function` 하나 안에서 순서대로 두 API를 호출하는 구조와는 의미가 다르다.

즉 `scenarios`는 여러 API 또는 여러 사용자 흐름을 독립적으로 테스트하고 싶을 때 유용하다.

여기서 자주 보게 되는 `executor`가 `shared-iterations`, `per-vu-iterations`이다.

#### `shared-iterations`

전체 반복 횟수를 여러 `VU`가 나눠서 처리하는 방식이다.

예를 들어 아래처럼 설정하면

```js
{
  executor: "shared-iterations",
  vus: 5,
  iterations: 100,
}
```

전체 100번을 `VU 5명`이 나눠서 수행한다.
즉 누가 몇 번 실행할지는 내부적으로 분배되며, 중요한 건 **총합이 100번**이라는 점이다.

#### `per-vu-iterations`

이건 이름 그대로 `VU`마다 정해진 횟수만큼 반복하는 방식이다.

예를 들어 아래 설정은

```js
{
  executor: "per-vu-iterations",
  vus: 5,
  iterations: 100,
}
```

각 `VU`가 100번씩 실행하므로 전체 실행 횟수는 `500번`이 된다.

즉 같은 `iterations: 100`이어도 의미가 완전히 다르다.

- `shared-iterations`: 전체 합계가 100번
- `per-vu-iterations`: 각 사용자당 100번

그래서 "전체 요청 수를 정확히 100번으로 맞추고 싶다"면 `shared-iterations`가 더 직관적이고,
"가상 사용자 1명당 같은 횟수로 반복시키고 싶다"면 `per-vu-iterations`가 더 적합하다.

### 5.3 `iterations`

`iterations`는 테스트 함수를 총 몇 번 실행할지 지정하는 옵션이다.
즉 "정확히 몇 번 반복할 것인가"에 초점이 있다.

예를 들어 아래처럼 설정하면

```js
export const options = {
  vus: 5,
  iterations: 100,
};
```

`default function`이 총 100번 실행된다.

현재 예제처럼 `default function` 안에 API가 2개 있다면

- 첫 번째 API 100번
- 두 번째 API 100번
- 총 요청 수 200번

이 된다.

여기서 `vus`는 그 100번의 작업을 몇 명이 나눠서 동시에 처리할지를 의미한다.
즉 `iterations`는 총 작업량, `vus`는 동시성 수준이라고 보면 된다.

그래서 `iterations`는 아래 같은 상황에 적합하다.

- 정확히 몇 번 호출되는지 맞추고 싶을 때
- 같은 횟수로 전후 성능 비교를 하고 싶을 때
- 데이터 생성이나 반복 호출 테스트를 일정 횟수로 제한하고 싶을 때

### 5.4 차이점 정리

간단히 정리하면 아래와 같이 이해하면 편하다.

- `stages`: 시간에 따라 사용자 수를 어떻게 변화시킬지
- `iterations`: 총 몇 번 실행할지
- `scenarios`: 서로 다른 테스트 흐름을 어떻게 분리할지

즉 "점점 부하를 올려보는 테스트"면 `stages`,
"정확히 몇 번 호출"이 중요하면 `iterations`,
"API별로 다른 조건으로 따로 테스트"하고 싶으면 `scenarios`가 더 잘 맞는다.

## 6. 결과 화면

그냥 별다른 옵션 없이 실행하면 화면에만 나오지만 아래 명령어로 실행하면 결과 화면을 `html`파일로 만들어줘서 별다른 작업없이 로컬에서도 확인 가능하다

```sh
# 보통 k6 run k6script.js
# 상세히 볼때(그룹별 그룹핑) k6 run --summary-mode=full k6script.js
$ K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-report.html k6 run k6script.js
```

이러면 동일한 경로에 `html-report.html`파일이 생긴다.

![k6_html](/media/k6_html.png)

특별한 상세 내역(그룹핑, 태그 등)은 없고 단순한 시간흐름에 따른 결과만 보여주는 점은 쫌 아쉽다.
