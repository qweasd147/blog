---
title: "Closure"
date: "2016-02-06T22:40:32.169Z"
template: "post"
draft: false
category: "javascript"
tags:
  - "js"
  - "closure"
  - "scope"
description: "private, scope등 개념을 활용, 변수의 유효범위를 늘린다."
---

# closure.

# 1. 정의

변수 등의 유효범위를 늘림.

조금 길게 말하면, 함수를 렉시컬 스코프 밖에서 호출해도 함수는 자신의 렉시컬 스코프를 기억하고 접근할 수 있는 특성이다. 바꿔 말하면 렉시컬 스코프만 명확하게 기억하면 클로저 자체는 이해하는데 무리가 없을 것이라고 생각된다.

# 2. 주요 내용

### 2.1 기본 내용

```javascript
function closure() {
  var innerVal = 10;

  return {
    getInnerVal: function () {
      return innerVal;
    },
    setInnerVal: function (_val) {
      innerVal = _val;
    },
  };
}

var closureFunc = closure();

closureFunc.getInnerVal(); //10
```

소스를 설명하자면 'closure1'의 내부 값인 'innerVal'의 값을 반환되는 함수 'getInnerVal'와 'getInnerVal'를 통해서 접근이 가능하다는 점을 볼수가 있다. 원래대로라면 바깥 스코프에서 안에 있는 스코프에 접근 할 수도 없고, 변수 'innerVal'는 gc 대상이 될 것이라는 생각이 들겠지만 반환되는 'getInnerVal'와 'getInnerVal'로 접근이 가능하므로, gc 대상에서도 벗어나게 된다.

### 2.2 선언 시 결정됨

스코프 관련해서 똑같은 내용이고 당연히 적용되는 내용이다.

```javascript
var setter;
var getter;

function closure() {
  var innerVal = 10;

  getter = function () {
    return innerVal;
  };
  setter = function (_val) {
    innerVal = _val;
  };
}

closure();

getter(); //10
setter(50); //50
getter(); //50
```

단순 getter, setter의 유효범위는 전역 스코프에 속해 있고 변수 innerVal의 유효범위는 closure 함수에 속해 있다. getter, setter의 유효범위와 상관없이 내부에서 함수를 주입하고, 주입된 함수의 유효범위는 선언 될 시 결정이 된다.

# 3. 사용 범위

### 3.1 이벤트 바인딩

단순 html의 이벤트 바인딩, 또는 jquery의 이벤트 바인딩 등에서도 이 클로저를 이용된다.

```javascript
function bindEvent() {
  var innerData = "inner scope data";

  $("#bindBtn").on("click", function () {
    alert(innerData);
  });
}

bindEvent();
```

외부에서 innerData 변수에 접근 할 수 없지만 이벤트 발동 시, 값(렉시컬 스코프)을 기억하고 정상적으로 표출된다.

### 3.2 모듈화

```javascript
var MyModules = (function Manager() {
  var modules = {};

  function define(name, deps, impl) {
    for (var i = 0; i < deps.length; i++) {
      deps[i] = modules[deps[i]];
    }

    modules[name] = impl.apply(impl, deps);
  }

  function get(name) {
    return modules[name];
  }

  return {
    define: define,
    get: get,
  };
})();
```

es 6 이상에서 import, export 등의 키워드(또는 require)를 사용해서 모듈화 된 스크립트를 사용 할 수도 있다. 이는 각 파일(정확히는 모듈)마다 독립적인 렉시컬 스코프를 제공해야 한다. 위에 소스는 각 모듈마다 독립적인 렉시컬 스코프를 제공하려는 목적으로 작성이 되었다. 내부 this 바인딩 관련해서 문제가 생길 수도 있으니, 실제로 사용하지는 말고 '모듈화 시 각각 독립적인 스코프를 제공한다' 라는 초점으로만 확인!
