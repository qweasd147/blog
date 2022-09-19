---
title: "구조 분해 & 할당"
date: "2021-04-06T00:41:24.507Z"
template: "post"
draft: false
category: "javascript"
tags:
  - "js"
description: "Object를 그때그때 유연하게 spread 하여 사용"
---

# Destructuring

# 1. Array 타입 구조분해

기본적으로 `Array`는 저장된 순서대로 펼치기가 가능하다

```javascript
const arr = [1, 2, 3, 4];
const [a, b, c] = arr;

console.log(a, b, c); //1 2 3
```

`null`, 직접 `undefined` 할당, 정의 되지 않은 상태(`undefined`) 일때 각 출력과 기본값 할당이 가능하다.

```javascript
const arr = [1, null, undefined];
const [a, b, c, d, e = 10] = arr;

console.log(a, b, c, d, e, 10); //1 null, undefined, undefined
```

# 2. Object 타입 구조분해

기본적으로 `key` 값을 기준으로 값을 펼칠수가 있고, key값을 변경 하고 싶을땐 `b:f`와 같이 하면 문법적으로 `const f=obj.b`와 같이 사용이 가능하다

```javascript
const obj = {
  a: 1,
  b: 2,
  c: 3,
};

const { a, b: f, c, d = 5 } = obj;
console.log(a, f, c, d);
```

구조 분해한걸 다시 구조분해

```javascript
const obj = {
  a: { b: 6, c: 7 },
};

const {
  a: { b, c },
} = obj;
console.log(b, c);
```

이런식으로 쉽게 펼치기가 가능하고 물론 변수명 변경 및 기본값 할당이 가능하다 주의 점은 존재하지 않은 key 값으로 구조분해를 시도하면 에러난다.

# 3. Spread

아래처럼 Array는 기본적으로 분해가 가능함

```javascript
const arr = [3, 4, 5, 6];
const combinedArr = [1, 2, ...arr];
console.log(combinedArr); //[1, 2, 3, 4, 5, 6]
```

프로퍼티들을 순회 하면서 하나씩 spread씩 하게 해준다. 기본 json 타입에서도 가능하며, 객체를 합쳐지는 효과로도 많이 사용된다.

```javascript
const obj = {
  ...{ a: 1, b: 2, c: 3 },
  ...{ b: 4, c: 5 },
};

console.log(obj); //{a: 1, b: 4, c: 5} 나중에 전개된 b, c로 값이 변경됨
```

전개(`...`)구문은 순회가 가능하면(`iterable`) 사용 가능하며, 배열의 중복 제거도 유용하게 사용 가능하다.

```javascript
//Set & spread를 활용해서 array 중복 제거
console.log(...new Set([1, 2, 3, 3, 3, 3, 4])); //1 2 3 4
```

# 4. Rest Parameter

`Rest Parameter`는 자바에서 가변인자, 코틀린에서 `vararg`를 생각하면 된다.

```javascript
function restFunc(...rest) {
  console.log(rest); //[1, 2, 3]
}

function restFunc2(ignore, ...rest) {
  console.log(rest); //[2, 3]
}

restFunc(1, 2, 3);
```
