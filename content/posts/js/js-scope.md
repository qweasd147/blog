---
title: 'Scope'
date: '2020-05-12T00:42:42.358Z'
template: 'post'
draft: false
category: 'javascript'
tags:
  - 'js'
  - 'scope'
description: '변수, 함수 등의 유효범위'
---

# Scope.

# 1. 정의

변수의 유효 범위. 어느 스코프에서 변수를 찾아내는데 필요한 개념이다.

```javascript
function innerScope() {
  var foo = 10;

  console.log(foo);
}

var foo = 30;

console.log(foo); //30

innerScope(); //10

console.log(foo); //다시 30
```

스코프는 전역 스코프와 그 외 내부 스코프로 구분된다. 각 스코프에서 변수를 호출 시,

현재 속한 스코프에서 가장 근접한 스코프에서 부터 변수를 찾는다.

위 소스를 보면 innerScope의 내부 변수 foo는 innerScope에 종속 되며(var는 함수 스코프!) foo를 호출 시

가장 가까운 스코프인 innerScope 함수에서 변수를 찾아 사용한다(내부 스코프는 계속해서 계층형 구조를 갖는다고 생각하면 된다).

그 외 전역스코프에서는 foo(소스에서 var foo = 30;)는 전역 객체에 종속 되고, 호출 시 30이라는 값이 사용된다.

해당 스코프에서 변수가 없을 시 상위 스코프에서 변수를 찾고, 없을 시 계속해서 상위 스코프로 이동하며 변수를 찾는다.

```javascript
function innerScope2() {
  console.log(bar);
}

var bar = 50;
innerScope2(); //50
```

innerScope2() 함수에서 bar는 선언되지 않았으므로, 글로벌 스코프에서 부터 bar를 찾아 사용하게 된다.

# 2. 주요 내용

### 2.1 스코프는 별다른 키워드(eval, with)를 사용하지 않는한 선언 시 결정된다.

> 매우 중요하고 기본이 되는 내용으로, 별다른 선언을 하지 않는 이상(eval, with)컴파일 시 결정 되는 것이 아니라
> 선언 시에 결정이 된다. 이 내용만 항상 기억하고 있으면 스코프 반은 알고 들어가는것이다.

```javascript
//scope
function innerScope1() {
  var foo = 'innerScope1';

  innerScope2();
}

function innerScope2() {
  //var foo = 'innerScope2';

  console.log(foo); //globalScope!
}

var foo = 'globalScope!';

innerScope1();
```

위 소스를 보면 함수 호출 순서는 글로벌 -> innerScope1() -> innerScope2()가 될것이다.

출력 내용을 보면 'globalScope!'가 될것인데, 그 이유는 스코프는 선언시에 결정되기 때문이다.

만약 스코프가 선언 시가 아니라 어떻게 사용하는지(동적 스코프. dynamic scope)에 따라 결정된다면

컴파일 시에 호출 순서에 따른 동적으로 내부 스코프 순서를 결정할 것이고, 'innerScope1'가 출력 되었을 것이다.

확실히 선언시 결정 된다는 점은 밑에 소스를 보면 구분이 될 것이다.

```javascript
function outerScope() {
  var foo = 'outerScope!';

  innerScope();

  function innerScope() {
    //var foo = 'innerScope';

    console.log(foo); //outerScope!
  }
}

var foo = 'globalScope!';

outerScope();
```

위 소스에서도 함수 호출 순서는 이름만 다르지 글로벌 -> outerScope() -> innerScope() 순서로 진행이 된다.

하지만 출력되는 내용은 'outerScope!'가 된다. 이는 innerScope함수가 outerScope에 선언되어 있고, innerScope 함수에서 변수 'foo'는

우선적으로 innerScope 스코프에서 찾고, 선언되어 있지 않을 시 전역 스코프가 아닌 자신(innerScope)이 선언된 outerScope에서 변수를

찾기 시작한다. 이렇게 상위 스코프가 연결된 구조를 스코프 체이닝(scope chaining)이라 한다.

> eval, with의 스코프 관련해서 짤막하게 설명하자면 두개를 사용 후 컴파일 시, 스코프를 바꿔주는 부가적은 효과가 나타난다. 바꿔말하면 컴파일 시 이미 결정된 스코프를 동적으로 바꿔주는 작업을 하기 때문에 성능적으로 좋지도 않고, 점점 사용하지 않는 방향으로 가므로 관련해서 설명은 생략!

### 2.2 렉시컬 스코프(lexical scope)

사실 렉시컬 스코프(lexical scope)관련해서 설명은 다 했다.

스코프는 '변수를 찾기 위한 범위', 렉시컬 스코프는 '함수를 어디에 선언하는지에 따라 생기는

스코프 체이닝(scope chaining) 특성'이라고 생각하면 된다.

```javascript
function scope1(){

    function scope1.1(){}
}

function scope2(){

    function scope2.1(){

      function scope2.1.1(){}

    }
}
```

함수명은 이해하기 쉽게 x.x 형태로 넘버링 했다... 변수명 관련해서 규칙은 일단 pass

위 소스에서 일부 함수의 스코프 체이닝을 살펴보면

scope1.1의 스코프 체인

> scope1.1 -> scope1

scope2.1의 스코프 체인

> scope2.1 -> scope2

scope2.1.1의 스코프 체인

> scope2.1.1 -> scope2.1 -> scope2

이런 식으로 구조가 잡힐 것이다. 각 함수의 스코프는 리스트 형태로 관리된다고 생각하고,

각 함수의 스코프는 단방향(scope2.1 함수에서 scope2.1.1의 스코프에 접근 할 수 없다.)이라는 점도 함께 기억하자.

### 2.3 function scope, block scope

각 변수 선언 키워드 마다 scope의 범위가 다르다. scope는 변수의 유효범위 라고 하였다. 그럼 scope의 범위(단위)를 알아보자.

#### 2.3.1 function scope

```javascript
function fnScope() {
  var foo = 'foo';

  {
    var bar = 'bar';
  }

  console.log(foo, bar); //foo bar
}
```

위 소스를 보면 스코프의 단위가 블록(block. {})과 전혀 관계가 없다는 점을 알 수가 있다. 조금 더 설명 하자면

만약 스코프의 단위를 `{}` 단위로 정하였다면 변수 `bar`는 접근 할 수가 없었을 것이다(단방향).

하지만 `var`의 키워드를 사용하여 변수를 선언 하였을 시 스코프 단위는 함수가 되어, 함수 내에서 블록과 관계없이

변수 접근이 가능하다. 이러한 점은 개발 시 생각 외의 차이를 남길 수가 있다.

```javascript
function fnScope2() {
  //var i = 100;

  for (var i = 0; i < 5; i++) {}

  console.log(i); // 5
}
```

충격적이게도 i는 for문 내에 종속되는것이 아니라 for문 밖에서도 접근이 가능하다. 이는 scope 단위가 함수가 되어, for문

내에서 i를 선언 하면 함수(fnScope2)에 종속 되어 함수 내에서 선언 한것과 동일하다는 점이다. 만약 i를 다른곳에서도 사용

하고 있었다면, i값는 바뀌어서 버그가 발생 할 수도 있다.

#### 2.3.2 block scope

만약 이러한 점을 예방하기 위해서는 `var`로 변수를 선언 하면 안되고, block scope 단위로 변수가 생성되는 `let`, `const`를

사용해서 변수를 선언해야 한다.

```javascript
function blScope() {
  let foo = 'foo';

  {
    let bar = 'bar';
  }

  console.log(foo, bar); //ERROR! bar is not defined
}
```

소스 내용은 다 똑같고, 선언 시 키워드만 `let`으로 바꾸었다. `let`으로 변수를 선언 시, scope의 범위는 `{}` 기준으로 구분 되며,

에러가 발생하는 것을 확인 할 수 있다. 물론 2.3.1에서 발생한 for문 내 i값도 함수가 아니라 for문 내 블록에 종속 되어

차후 발생할 수도 있는 버그를 예방 할 수 있다.

또한 이러한 특성이 유용한 점은 closure + garbage collection 조합에서 볼 수가 있다.

```javascript
function handleData() {
  let foo = 'foo';

  {
    let bigData = getBigData(); //단순 결과값이 많은 데이터
    //TODO handling Big Data
  }

  //TODO after handling Big Data
}
```

위 함수에서 만약 let이 아닌 var를 사용하여 구성하였다면, scope단위는 function이 되어 `bigData`는 사용 여부와 상관없이

handleData 함수에 종속 되어 handleData함수를 스코프로 갖는 함수들은 이 bigData를 가지고 다닐 수 밖에 없다.

하지만 위 소스처럼 let을 사용하여 bigData의 스코프를 제한 시키면, 블록 밖에서 접근 할 수 없으므로 garbage collection

대상이 될 것이다. closure 연관해서 설명은 빠져 있는데, handleData의 내부 스코프를 다른 외부 스코프에서도

접근(또는 이벤트 바인딩 등) 할 수 있다는 가정 하에 보거나, 아니면 closure를 알고 다시한번 보던가 하자.

### 2.4 즉시 실행 함수(IIFE. Immediately-Invoked Function Expression)

블록 스코프든 함수 스코프든 함수는 별도의 스코프를 갖는다는 점을 알수 있다.

이러한 점을 이용하여 다른 코드에 영향을 주지 않는 별도의 스코프를 만들어 작업하는것이 가능하다.

```javascript
//즉시 실행 함수를 활용한 별도의 스코프 생성
var scope = 'globla scope';

(function() {
  var scope = 'inner scope';
})();

console.log(scope);
```

즉시 실행 함수 사용법 관련해서 설명은 생략.

어떠한 작업을 할 때 즉시 실행 함수를 사용하여 별도의 스코프를 생성하여 작업하면, 외부의 global scope에

전혀 영향을 주지 않고 작업이 가능하다. 이러한 방식은 여러 라이브러리에서도 많이 사용하는 방식이다.
