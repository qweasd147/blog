---
title: "Symbol"
date: "2021-09-30T15:06:06.220Z"
template: "post"
draft: false
category: "javascript"
tags:
  - "js"
  - "iterator"
description: "유일한 프로퍼티 키값을 만들고 싶을때."
---

# Symbol

## 1. 기본 정의

js에서 몇 안되는 원시타입 중 하나. `Symbol`을 통해 생성되면 항상 유니크한 식별자가 보장된다(예외 경우도 있다)

```javascript
Symbol("test") == Symbol("test"); //false

const obj = {};

const keyA1 = Symbol("A");
const keyA2 = Symbol("A");

obj[keyA1] = "A1";
obj[keyA2] = "A2";

console.log(obj);
/*
{
    Symbole(A): "A1"
    Symbole(A): "A2"
}
*/
```

얼핏 보면 똑같은 프로퍼티 키값이 존재하는걸로 보이지만 당연히 프로퍼티 키값은 다르다. (`keyA1 !== keyA2` 이기 때문에) 심볼 생성 시 넘겨준 인자값은 단순 심볼 설명(구분)을 위한 값일 뿐, 그 이상의 역할을 하지는 않는다.

## 2. Symbol.for

심볼 인자값을 description 용도가 아닌 진짜 키의 일부분으로 쓰기 위해 만들어진 심볼 객체 생성 메소드. Symbol 은 항상 새로운 객체를 만들어내지만 `Symbol.for`는 파라미터 값에 따라 동일한 심볼이 반환 될 수도 있다.

`Symbol.for`를 통해 생성 된 심볼은 먼저 해당 파라미터로 전역 심볼 레지스트리(global symbol registry) 내 동일한 값이 있는지 찾는다. 만약 없다면 새로운 심볼을 생성해서 만든 후, 전역 심볼 레지스트리에 등록한다. 그 후 `Symbol.for`을 통해 동일한 파라미터로 심볼을 생성하려고 하면 기존에 생성된 심볼을 반환 해준다.

```javascript
const obj = {};

const keyA1 = Symbol.for("A");
const keyA2 = Symbol.for("A");

obj[keyA1] = "A1";
obj[keyA2] = "A2";

console.log(obj);
/*
{
    Symbole(A): "A2"
}
*/
```

위에서 설명 했듯이, `Symbol.for("A") === Symbol.for("A")` 는 true를 반환하므로 객체엔 오직 하나의 프로퍼티만 존재하게 된다.

## 3. 미리 정의 된 심볼 들

다른 키와 겹치지 않는 유일한 프로퍼티 키값으로 사용하기 위해 js 내부적으로 이미 많은 심볼들이 정의되어 있다. 주요 프로퍼티를 실수로 덮어씌우면 의도치 않는 버그가 일어날 수도 있으므로 이런 프로퍼티는 외부에서 볼 수 없게 시스템 적으로 숨겨놓고 오직 미리 정의된 심볼을 통해서만 접근 할 수 있게끔 만들어놓으면, 개발자가 필요할때 정의 된 심볼을 통해 분명한 목적을 가지고 접근 한 것이라 판단 할 수 있으므로 버그를 줄여주는데 많은 역할을 하고 있다.

대표적으로 미리 정의 된 심볼들은 Symbol.match , Symbol.replace , Symbol.search, Symbol.iterator 등이 존재한다.

### Symbol.iterator

Iterable, 그니까 순환 가능한 객체를 만들기 위해선 java 에서는 Iterator 를 구현하면 되고, javascript에선 내부 프로퍼티인 @@iterator 를 구현해주면 된다. 근데 이건 일반적으로 접근이 불가능한데, 이 객체에 접근하기 위해 사용되는 심볼이 바로 Symbol.iterator 이다.

```javascript
const arr = [1,2,3]
const it = arr[Symbol.iterator]()
it.next();  //{value:1,done:false}
it.next();  //{value:2,done:false}
it.next();  //{value:3,done:false}
it.next();  //{value: undefined, done:true}
it.next();  //{value: undefined, done:true}
it.next();  //{value: undefined, done:true}
...
...
```

`Array`에 순환 객체(iterator)를 생성하기 위해 `Symbol.iterator`을 통해 접근하여 `iterator`를 생성하고 next를 통해 반복적으로 호출해 보면 array에 저장된 값들을 전부 순환해서 확인 할 수가 있다. (iterator에 대한 자세한 설명은 생략)

`js`에서 기본적으로 `array`, `map`, `set` 등은 `@@iterator` 가 구현되어 있어서 순환 가능한 객체로 분류된다. `js`에서 순환 가능한 객체라는 의미는 `for...of`나 `spread`를 사용 할 수 있다는 점이 큰 특징이다.

```javascript
const arr = [1,2,3,4,5]
const obj = {
    [Symbol.iterator] : function *(){
        for(const val of arr){
            yield val
        }
    }
}
//obj 는 실질적으로 빈 깡통인데 iterator만 구현 해줘서 외부 array값을 순환 할 수 있게 만들 수 있다.
console.log(..obj)  //1 2 3 4 5. --> spread


for(const _val of obj){
    console.log(_val) // 1,2,3,4,5 가 순서대로 출력된다.
}
```

generator 문법은 이미 포스트 해놓은 것이 있으니 생략하고, 이런식으로 `iterator`만 구현해서 외부객체를 마치 내가 가지고 있는것처럼 프로퍼티를 만들어 놓을 수가 있다.
다시 말하지만 `spread`, `for...of`는 iterator(`@@iterator`)에 의존하게 된다.
