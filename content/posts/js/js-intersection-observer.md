---
title: 'InterSection Observer'
date: '2020-11-18T01:32:47.518Z'
template: 'post'
draft: false
category: 'javascript'
tags:
  - 'js'
  - 'react'
  - 'event driven'
description: 'event driven 기반으로 하는 dom 노출 여부를 감지하는 Observer'
---

블로그를 하나씩 개선하면서 이번에 처음 `IntersectionObserver`를 써봤는데 너무 편해서 기록

## InterSection Observer

`IntersectionObserver`는 기본 설정값을 기준으로 설명하면 `viewport`, 그니까 현재 화면에 보여지는 영역에 특정 `dom element`가 노출되거나 사라지는 시점을 감지하는 `Observer`이다

보통 무한 스크롤에 많이 쓰이긴 하지만 내 블로그에서 쓰인 경험을 바탕으로 설명하자면 PC 버전 기준으로 문서를 거의 끝까지 읽으면 우측 하단에 `Up` 버튼이 표출되는 기능이 있다.
`IntersectionObserver`적용 전에는 스크롤 이벤트를 추가해서 문서 위치 정보를 판단해서 `Up`버튼 표출 여부를 결정했다

기존 코드 일부분

```js
const handleScroll = () => {
  const windowBottomY = window?.scrollY + window?.innerHeight;

  if (!Number.isInteger(windowBottomY)) return;

  const documentY = refTarget.current.clientHeight;
  const currentPercent = (windowBottomY / documentY) * 100;

  // 전체 문서 길이가 너무 짧으면 버튼 그냥 생략, 전체 문서의 80퍼 이상 읽으면 표출
  if (currentPercent < 20 || currentPercent < 80) {
    setIsShow(false);
  } else {
    setIsShow(true);
  }
};

useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

이런식으로 하였었는데, 문제점은 스크롤 이벤트에 있다. 매번 스크롤 위치가 바뀔때마다 `document`위치 정보를 가져와 표출 여부를 판단했었는데, `dom`을 직접 접근해서 하는 작업들은 많은 리소스를 사용하게 된다. 사실 블로그에 많은 기능들이 있는것도 아니고 요즘 워낙 하드웨어가 좋아 별 차이는 없지만 그래도 성능 개선을 위해 `IntersectionObserver`를 적용하였다. 기본적으로 `IntersectionObserver`는 viewport에 `dom element` 표출 여부를 감지하는 역할이지만 감지하는 것은 비동기로, 그니까 메인 스레드가 매번 감지하는 방식이 아니라 변화가 감지되면 callback을 실행하는 방식이라 이벤트 기반 프로그래밍에 맞다고 생각된다.

> 기존 코드는 스크롤 이벤트가 발생하면 매번 `handleScroll`함수를 메인 스레드에서 실행했다. -> 너무 많이 실행됨

`IntersectionObserver` 사용하여 개선한 코드 일부분

```ts
//props 구조
type Props = {
  buttonText: string;
  docTarget: RefObject<HTMLDivElement>;
  observeTarget: RefObject<HTMLDivElement>;
};

// 주요 함수
useEffect(() => {
  const observer = new IntersectionObserver(([btnEntry]) => {
    if (isTooShort(docTarget)) {
      setIsShow(false);
    } else {
      setIsShow(btnEntry.isIntersecting);
    }
  });

  observer.observe(observeTarget.current);

  return () => observer?.disconnect();
}, []);
```

> 기본적인 사용법으로 감지 할 대상(`IntersectionObserver.observe`)들을 등록하면 대상들이 viewport에 표출되거나 사라지는 시점에 callback 함수가 실행된다. 콜백 함수의 첫번째 argument는 감지하는 대상들로, 배열 형태로 넘어온다. `isIntersecting`값이 `true`면 표출 중인 상태고 `false`면 사라진 상태가 된다(위 소스에선 하나의 dom만 등록했다). 그 외 옵션값도 지정이 가능한데 자세한건 [document](https://developer.mozilla.org/ko/docs/Web/API/IntersectionObserver/IntersectionObserver) 참고.

다시한번 말하지만 `IntersectionObserver`는 특정 영역(기본값 `viewport`)에 특정 `dom element`가 표출여부를 감지하는 함수이다. 따라서 감지할 `observeTarget`을 추가하였는데, 무조건 블로그 하단에 위치하는 투명한 element를 추가하였다. 그래서 해당 dom(`observeTarget`)이 화면에 표출 중 인지 여부(`btnEntry.isIntersecting`)를 판단해서 `Up` 버튼 표출 여부를 결정하도록 개선하였더니 확실히 dom에 직접 접근하는 횟수는 확 줄어 들었다.

약간 억지스럽게 한것도 있긴하지만 공부도 하게 되고, 말 그대로 react 스럽게 한것 같아 마음에 든다.
