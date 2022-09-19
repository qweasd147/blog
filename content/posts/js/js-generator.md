---
title: "Generator"
date: "2020-05-21T00:37:15.710Z"
template: "post"
draft: false
category: "javascript"
tags:
  - "js"
  - "async"
description: "비동기 로직을 동기식으로 & 메세징 통신을 하고 싶을때"
---

# Generator.

# 1. 정의

javascript에서 기본적인 함수의 완전 실행이 아닌 중간중간 `generator` 함수 호출부와 메세징(통신)이 가능한 함수

# 2. 주요 내용

## 2.1 실행 범위

`generator`를 실행 후, `next()` 함수를 실행 시 `yield`를 만나기 직전 or `return` 까지 실행.

```javascript
function* foo() {
  console.log("point 1");
  yield;
  console.log("point 2");
}

var _it = foo();

_it.next(); //point 1
_it.next(); //point 2
```

## 2.2 값을 주고 받을 수 있음

`generator` 내부에서 외부로 값 넘겨주기

```javascript
function* bar() {
  var _bar = 10;
  yield _bar;
  console.log("end");
}

var _barIt = bar();

var firstNext = _barIt.next();

console.log(firstNext.value); // 10
_barIt.next(); //end
```

외부에서 `generator`로 값 넘겨주기

```javascript
function* baz() {
  return 10 * (yield);
}

var _bazIt = baz();

_bazIt.next();
var res = _bazIt.next(2);
console.log(res.value);
```

## 2.3 외부에서 generator 제어

가장 많이 사용하는 `next`를 제외 하더라도 `throw`, `return`으로 `generator`를 제어 가능하다

## 2.3.1 throw

```javascript
function* genWithTryCath() {
  var cnt = 1;
  while (true) {
    console.log("break ", cnt);
    cnt++;
    try {
      yield;
    } catch (e) {
      console.log("error 감지. ", e);
    }
  }
}

var it1 = genWithTryCath();

it1.next(); //break 1
it1.next(); //break 2
it1.throw("외부에서 에러 발생!"); //error 감지.  외부에서 에러 발생!
//break 3
console.log(it1.return().done); //true
```

이런식으로 외부에서 `generator` 함수 내부에 `exception`을 발생 가능하다. 또한 이후 이터레이터는 종료(`done`)상태가 된다

## 2.3.2 return

```javascript
function* genWithTryCath() {
  var cnt = 1;
  while (true) {
    console.log("break ", cnt);
    cnt++;
    try {
      yield;
    } catch (e) {
      console.log("error 감지. ", e);
    }
  }
}

var it2 = genWithTryCath();
it2.next(); //break 1
it2.next(); //break 2
it2.next(); //break 3

it2.return();

console.log(it2.next().done); //true
```

이런식으로 외부에서 `generator` 함수 `return`이 가능하다. 또한 이후 이터레이터는 종료(`done`)상태가 된다
