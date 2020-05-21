---
title: 'Prototype'
date: '2020-05-12T00:44:31.650Z'
template: 'post'
draft: false
category: 'javascript'
tags:
  - 'js'
  - 'inheritance'
  - 'extends'
description: 'javascript에서 상속 등이나 static등을 쓰고 싶을때'
---

# Prototype.

모든 소스 내용은 chrome 기준으로 작성되었습니다.

# 1. 정의

javascript 함수를 선언 시 생성되는 프로퍼티로 new를 사용하여 새로운 객체를 생성 시, 말그대로 prototype(원형)이 되는

객체를 정의한 프로퍼티가 되며, prototype을 통해 타 객체 지향 언어의 클래스, 상속 등에 사용이 된다.

추가적으로 아래에 설명할 `[[Prototype]]`과 `__proto__`는 사실상 같은 객체를 말하고,

`[[Prototype]]`와 `Prototype`은 비슷하지만 다른 목적으로 생성되어 진다(결국은 다르다!).

# 2. 주요 내용

### 2.1 Prototype을 사용한 객체 인스턴스

> 주의 원래 javascript에선 인스턴스라는 개념이 존재하지 않는다.
> 다른 객체지향 언어와 비교하여 이해하기 쉽게 하기 위해서 인스턴스라는 단어를 사용했을 뿐. 자세한건 주의사항에서 설명.

```javascript
function Foo(name) {
  this.name = name;
}

Foo.prototype.getName = function() {
  return this.name;
};

Foo.prototype.setName = function(name) {
  this.name = name;
};

var foo = new Foo();

foo.setName('name1');
console.log(foo.getName());
```

`Foo` 함수에서 `Foo.prototype`의 각 프로퍼티에 함수를 정의 후, 해당 함수의 new로 호출 하면 반환된 객체에 메소드가 생긴다(`foo.setName`, `foo.getName`).

### 2.2 [[Prototype]]

prototype 링크 또는 `__proto__` 라고도 불리는 객체로, 자신의 프로토타입을 가리킨다(링크 시킨다).

원래 정식 명칭은 `[[Prototype]]` 이고, 이 프로퍼티는 객체의 내부적으로 사용 용도로 사용되지만, 크롬 기준

`__proto__` 라는 프로퍼티 로 생성되어 접근이 가능하다. 대부분 브라우저에서 지원하는것으로 알고 있긴한데,

어쨋든 `__proto__`라는 객체는 자바스크립트 비표준으로 브라우저에 따라 생성되지 않을 수 있다.

`[[Prototype]]`는 객체가 생성 될 때 그 객체의 프로토타입이 되는 객체의 Prototype 객체를 링크 시킨다.

```javascript
function Bar() {}

var bar = new Bar();

Bar.prototype === bar.__proto__; // true
```

위 소스와 같이 `new`를 사용하여 객체를 생성 시, 생성된 객체의 `[[Prototype]]` 링크는 자신의 주체가 되는 Prototype을 찾아

그 객체를 연결 시킨다.

### 2.3 Prototype, [[Prototype]]

```javascript
function Foo(name) {
  this.name = name;
}

Foo.prototype.getName = function() {
  return this.name;
};

Foo.prototype.setName = function(name) {
  this.name = name;
};

var foo = new Foo();
foo.__proto__ === Foo.Prototype; //true
```

위 소스를 보면서 2.1과 2.2 내용을 종합하고 기타 내용을 추가하여 단계별로 설명하자면

#### 1. 모든 함수는 생성 시 Prototype 프로퍼티가 생성되며, Prototype 프로퍼티 안에는 constructor 라는 프로퍼티가 생긴다.

#### 2. 생성 된 constructor는 자기 함수 원형을 담고 있다

`Foo.prototype.constructor === Foo`

#### 3. Constructor와 해당 함수는 서로 환형 참조를 이루고 있다.

```javascript
Foo.prototype.constructor === Foo; //true
Foo.prototype.constructor.prototype.constructor === Foo; //true
//....
Foo.prototype === Foo.prototype.constructor.prototype; //true
Foo.prototype === Foo.prototype.constructor.prototype.constructor.prototype; //true
//...
```

#### 4. 함수를 new를 통하여 호출 시, 해당 함수를 호출하여 새로운 객체를 생성한다.

#### 5. 이때 생성된 객체의 `[[Prototype]]` 링크(`__proto__`)는 `Foo.Prototype`을 가리킨다.

    따라서 위 소스에서 foo.__proto__ === Foo.Prototype 는 true를 반환한다.

위의 과정을 거치면서 Foo.Prototype에 지정된 프로퍼티는 new로 생성 된 객체에 `[[Prototype]]` 링크를

통해 그대로 사용이 가능하다. Foo.Prototype은 `new`를 사용한 객체 생성 시에만 영향력이 있고

그 외의 상황에선 일반적으로 사용되지 않는다. 참고사항으로 모든 객체는 생성 시 `[[Prototype]]` 링크(`__proto__`)를

가지게 되는데, `Foo.prototype`도 객체이므로 `__proto__` 프로퍼티를 갖게 된다.

따라서 `foo.__proto__`는 `Foo.prototype`을 바라보게 되므로 `foo.__proto__.__proto__` 프로퍼티가 존재하게 된다.

이런식으로 해당 프로퍼티의 프로퍼티를 계속하여 타고 올라가는 것을 프로토타입 체이닝 이라고 한다.

위 소스는 체이닝이 짧아서 `Foo.prototype.__proto__`는 Object 함수를 링크 시키지만 상속을 통하여

체이닝을 늘려갈수 있고, 한가지 덫붙이자면 객체 리터럴 형태로 객체를 만들어도 똑같이 `__proto__` 프로퍼티가 생기며,

이는 모든 프로퍼티 체이닝의 마지막인 Object.prototype을 가리키게 된다(여기서 나온 Object도 함수인것을 잊지말자!)

```javascript
Object instanceof Function; //true

var obj = {};

obj.__proto__ === Object.prototype; //true
```

### 2.4 프로토타입 체이닝

위에서 짤막하게 말이 나왔지만 객체에 프로퍼티가 있는지 조사하고, 있으면 그 값을, 없으면 상위 prototype의 프로퍼티를 조사하게 된다.

```javascript
function Foo() {}

Foo.apply; // 존재함
Foo.bind; // 존재함
```

`Foo`에 `apply`와 `bind`가 존재하는 이유는 `Foo.__proto__` 가 `Function.prototype`을 바라보기 때문이다.

(참고로 프로퍼티 접근 시 `__proto__` 는 생략 가능하다)

이는 Foo가 컴파일 될 시, `Function`을 생성자로 한 객체가 생성 되고(`new Function`) `Function.prototype`이

`Foo.__proto__`에 링크되기 때문이다. 따라서 `Function.prototype`에 정의 된 내용를 그대로 사용 할수가 있게된다.

(그렇다고 성능상 문제가 있으니, 런타임 중에 `new Funtion`을 사용하라는 말은 아니다.)

아무튼 이러한 과정을 거치기 때문에 사용할 수가 있지만 추가적으로 `Foo.hasOwnProperty` 나 `Foo.valueOf` 라는 프로퍼티도

존재한다. 이러한 프로퍼티는 `Funtion.prototype`에 정의되어 있지도 않다. 하지만 사용가능한 이유는 자바스크립트의 주요 개념 중 하나가

함수도 객체라는 점이다. 또한 `Funtion.prototype`도 객체이기 때문에 이러한 이유들로 `Function.prototype.__proto__` 는

`Object.prototype` 과 연결 시켜놓았다. (`Function.prototype.__proto__ === Object.prototype; //true`)

정리하면 Foo 의 prototype(원형)은 `Function`이고, `Function`의 prototype은 Object가 된다. 따라서 Foo의 'hasOwnProperty'

프로퍼티 접근 시 `Foo.__proto__.__proto__` 까지 올라가서 정의된 hasOwnProperty를 호출하게 된다.

(다시 한번 말하자면 프로퍼티 접근 시 `__proto__` 는 생략 가능)

물론 중간에 `Function.prototype.hasOwnProperty = ~~` 로 정의 해놓지만 않았다는 가정이다.

이런 식으로 자기 자신의 프로퍼티 부터 조사하여 자신과 링크된 원형(`[[Prototype]]` 또는 `__proto__`)을 순차적으로 방문하면서

프로퍼티를 찾는것을 프로토타입 체이닝이라고 한다.

### 2.5 상속

대표적으로 상속을 구현하기 위한 방법으로 es5에 나온 `Object.create` 함수를 이용하는 방법과 이를 직접

구현하는 방법으로 나누어진다. es5 사용환경이 가능하면 `Object.create`를 사용하는게 훨씬 편하므로 사용하는걸

추천하지만, 그렇지 않으면 직접 만들어서 상속을 구현해야한다. 근데 사실상 es5를 지원 안한다는거는

js 하기 싫다는거라고 생각하면 될꺼 같다.

#### 2.5.1 Object.create를 사용한 상속(es5 이상)

es5에서 자바스크립트의 상속은 따로 네이티브로 존재하지 않기 때문에 위에 설명한 프로토타입 체이닝을 통하여

상속을 구현하게 된다.

```javascript
function Foo(name) {
  this.name = name;
}

Foo.prototype.myName = function() {
  return this.name;
};

function Bar(name, label) {
  Foo.call(this, name);

  this.label = label;
}

Bar.prototype = Object.create(Foo.prototype);
//Bar.prototype = new Foo();    //Foo가 직접적으로 호출됨
Bar.prototype.constructor = Bar;

Bar.prototype.myLabel = function() {
  return this.label;
};

var a = new Bar('a', 'obj a');

console.log(a.myName()); //"a"
console.log(a.myLabel()); //"obj a"
```

위 소스는 `prototype`을 통해서 상속을 구현하고 있다. 여기서 핵심은 `Bar.prototype = Object.create(Foo.prototype);`

라고 할수 있는데 먼저 `Object.create`는 새로운 객체를 생성하고 입력된 객체를 `[Prototype]]`으로 연결한다.

```javascript
var createdObj = Object.create(obj);

createdObj.__proto__ === obj; //true
```

위 소스는 obj 값이 null일 때도 성립한다.

따라서 `new Bar()`로 생성되는 모든 객체는 프로토타입 체이닝을 통해 `Foo`와 연결된 객체를 프로토 타입으로 생성되게 된다.

다시 정리하면 `Bar.prototype`은 결과적으로 `Foo.prototyp`e을 복사한 객체(`Object.create` 사용해서)를 집어넣고

확장(`Bar.prototype.myLabel = function ~`)해서 사용했다고 볼수 있다.

말이 조금 어려울 수도 있는데 코드로 보면

```javascript
function Foo() {}
function Bar() {}

Bar.prototype = Object.create(Foo.prototype);
Bar.prototype.func1 = function() {};

var bar = new Bar();
bar.__proto__ === Bar.prototype; //true
bar.__proto__.__proto__ === Foo.prototype; //true
```

`__proto__` 인 `[[Prototype]]`을 통해서 어느 객체에 링크 되어있는지 확인 할 수가 있다.

마지막으로 `Bar.prototype.constructor = Bar;` 문장은 `Bar.prototype.constructor`를 따로 정의하지 않아서

프로토 타입 체이닝을 통해 `Foo.prototype.constructor`까지 그대로 올라가게 된다.

이러한 것을 막기 위해 정의해 놓은 것이다.

    참고로 위 소스에서 Bar.prototype = new Foo(); 를 사용하지 않는 이유는 생성된 객체의 __proto__에 의하여
    프로토타입 체이닝이 이루어 지긴 하지만, 불필요한 Foo 객체가 생성되고 내부의 인스턴스의 프로퍼티까지도
    prototype에 추가되기 때문이다.

#### 2.5.2 Util 상속 함수 구현

2.5.1에선 `Object.create`를 사용하였지만 es5 미만에선 지원하지 않기 때문에 이 부분을 직접 구현하여 주어야 한다.

그리고 어차피 상속이 목적이니깐 +@로 상속에 맞는 기능을 추가하여 유틸성 함수인 `inherit`구현 하였다.

```javascript
var inherit = (function(parent, child) {
  var F = function() {};

  return function(parent, child) {
    F.prototype = parent.prototype;
    child.prototype = new F();
    child.prototype.constructor = child;
    child.super = parent.prototype;
  };
})();

function Foo(name) {
  this.name = name;
}

Foo.prototype.myName = function() {
  return this.name;
};

function Bar(name, label) {
  Foo.call(this, name);

  this.label = label;
}

inherit(Foo, Bar);

Bar.prototype.myLabel = function() {
  return this.label;
};

var a = new Bar('a', 'obj a');

console.log(a.myName()); //"a"
console.log(a.myLabel()); //"obj a"
```

`inherit` 함수 내에서 싱글톤 함수인 `F`를 만들어서 child 함수를 만들때 마다 필요한 함수를 생성하지 않아도 되기 때문에

미리 만들어 놓았고,(다른 언어에선 이런식으로 util성 함수를 공통된 리소스를 변경하면서 까지 무분별하게 사용하면

thread-safe관련 문제가 생길 수 있지만 js는 싱글스레드 방식으로 돌아가서 상관없다)

`child` 하위에 `super` 프로퍼티를 두어서 `Bar.super`를 통해 Parent 함수의 고유한 `prototype`에 접근 할 수 있게

만들어져 있다. 나머지는 2.5.1 동일하다.

# 3. 주의사항

### 3.1 `[[Prototype]]` 링크 또는 `__proto__` 는 단지 객체의 prototype에 링크 시킨다.

일반 다른 클래스 언어는 클래스를 선언 후, 해당 클래스를 마구 찍어내듯 복사 하는 형식으로 인스턴스화 한다.

하지만 자바스크립트는 Prototype을 서로 연결해주는것으로 인스턴스화 한다. 엄밀히 말하면 다른 객체지향 클래스의

인스턴스와는 다른 개념이기 때문에, javascript에서 인스턴스화는 맞는 말은 아니다.

```javascript
function Foo() {}

var beforeDef = new Foo();

Foo.prototype.show = function() {
  console.log('show');
};

var afterDef = new Foo();

beforeDef.show(); //show
afterDef.show(); //show
```

`[[Prototype]]` 링크를 통해서 링크 되었다는 점은 위 소스에 보면 메소드를 정의 하기 전에 객체를 생성하거나,

정의 후 생성하거나 사용할 수 있다는 점을 통하여 확인할 수 있다.

### 3.2 `bind`를 통한 함수 생성 시, `prototype`은 생성되지 않는다.

```javascript
function Foo() {}

var Bar = Foo.bind(null);

Bar.prototype; //undefined
new Bar().__proto__ === Foo.prototype; //true
```

모든 함수는 생성 시, `Prototype` 프로퍼티가 생성되고, 그 안에 `constructor` 라는 프로퍼티가 생성된다고 하였다.

하지만 `Function.bind`를 통해서 함수를 생성 시, prototype은 생성되지 않는다. 왜 그렇게 만든지는 모르겠지만, 일단

bind 된 함수를 new를 통해 객체 생성 시, 기존 함수의 prototype으로 연결된다.

### 3.3 프로토타입 가려짐

constructor를 정의하면서 잠깐 말했지만 프로퍼티를 접근 시, 가장 우선순위가 높은건 자기 자신 프로퍼티이고, 체이닝을

통해 점차 프로토타입에 있는 프로퍼티를 조사하게 되고 마지막 프로토타입(`Object.prototype`)까지 조사하고 없을 시

최종적으로 `undefined`를 반환하게 된다.

```javascript
function Foo() {}

Foo.prototype.method1 = function() {
  console.log('Foo method1');
};

Foo.prototype.method2 = function() {
  console.log('Foo method2');
};

function Bar() {}

Bar.prototype = Object.create(Foo.prototype);

Bar.prototype.method2 = function() {
  console.log('Bar method2');
};

var bar = new Bar();

bar.method1(); //Foo method1
bar.method2(); //Bar method2

bar.__proto__.method1 === Foo.prototype.method1; //true
bar.__proto__.method2 === Foo.prototype.method2; //false
```

어떻게 보면 정상적인 현상이지만 getter, setter 적용 시 혼동 될 수도 있다.

### 3.4 프로토타입 재정의 시 주의

```javascript
function Foo() {}

Foo.prototype.method1 = function() {
  console.log('Foo method1');
};

var foo1 = new Foo();

Foo.prototype = {
  method: function() {
    console.log('new method');
  },
};

var foo2 = new Foo();
var foo3 = new Foo();

foo1.method1(); //Foo method1
foo2.method1; //undefined

foo2.method(); //new method
foo1.method; //undefined

foo1.__proto__ === foo2.__proto__; //false
foo2.__proto__ === foo3.__proto__; //true
```

프로토타입에 프로퍼티를 확장하는 형태가 아니라 아예 새롭게 대입하면 그 이후에 생성된 객체들은

새로운 프로토타입 객체에 링크 되고, 기존에 생성된 객체들은 기존 프로토타입 객체를 링크시킨다.

### 3.5 this bind

```javascript
function Foo(name) {
  this.name = name;
}

Foo.prototype.getName = function() {
  return this.name;
};

Foo.prototype.setName = function(name) {
  this.getName = name;
};

var foo = new Foo('name');

foo.getName(); //name
foo.__proto__.getName(); //undefined
```

`foo.__proto__.getName();`에서 this는 Foo.prototype이 된다. 프로토타입을 통하여 클래스를 구현하는건

어디까지나 자바스크립트만의 특성을 이용한 일종의 꼼수이다.
