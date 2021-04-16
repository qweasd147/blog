---
title: Kotlin - 변성
date: '2021-04-16T08:36:05.678Z'
template: 'post'
draft: false
category: 'java'
description: 'generic 타입의 상위, 하위 타입의 제한 사항 및 일부 유연하게 사용하고 싶을때'
---

## 변성

파라미터화한 타입이 서로 어떤 하위 타입 관계에 있는지 결정하는 방식을 말함

## 변성이 문제되는 이유

```kotlin
val intArr : MutableList<Int> = mutableListOf()
val numberArr :MutableList<Number> = mutableListOf()
val numberArr2 :MutableList<Number> = intArr    //error!
```

Int는 Number를 확장한 형태니까 논리적으로 충분히 받아 들여 사용 할수도 있어 보이지만 그렇지 못함. 기본적으로 제너릭 타입은 무공변성이라, T가 T1의 부모 타입이라도 List<T>와 List<T1> 사이에는 아무런 부모 자식 관계가 아니다
이렇게 쓰고 싶으면 컴파일러한테 상위타입처럼 쓸수 있도록 알려줘야한다. 상위 타입으로 써도 안전한 이유는 Number타입은 처리할때 오직 읽기 전용으로 쓴다는걸 문법적으로 보장 하는걸 말한다.

```kotlin
val intArr : MutableList<Int> = mutableListOf()
val numberArr :MutableList<Number> = mutableListOf()
val numberArr2 :MutableList<out Number> = intArr
```

반대로 `in` 이라는 키워드는 쓰기 전용으로 상위 오브젝트를 하위 오브젝트에 담을수가 있다

```kotlin
val intArr : MutableList<Int> = mutableListOf()
val numberArr :MutableList<Number> = mutableListOf()
val intArr2 :MutableList<in Int> = numberArr
```

| 변성                    | 설명                                                            | kotlin                                       |
| ----------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| 공변성(covariant)       | T1이 T의 하위 타입이면 C&lt;T1&gt;은 C&lt;T&gt;의 서브 타입이다 | C&lt;T1> 은 C&lt;out T&gt;의 서브타입이다.   |
| 반공변성(contravariant) | T1이 T의 하위 타입이면 C&lt;T&gt;은 C&lt;T1&gt;의 서브 타입이다 | C&lt;T&gt; 은 C&lt;in T1&gt;의 서브타입이다. |
| 무공변성(invariant)     | C&lt;T&gt;와 C&lt;T1&gt;는 아무관계 없다                        | C&lt;T&gt;는 오직 C&lt;T&gt;만 관계가 있다   |

## 읽기, 쓰기 전용

`out`은 read 전용, `in`은 write 전용이라 평가받는다.

```kotlin
interface UsingInOut<out T1, in T2>{

    fun get(): T1       //값을 내보낼 수만 있다
    fun use(t2: T2)     //값을 받을 수만 있다
}
```

`무공변성(invariant)` 제약 일부를 없애주는 대신, `out` 키워드는 오직 생산(read)만을, `in` 키워드는 오직 사용만이 가능하도록 설계되었다. 근데 read 전용 이긴 하지만 불변성을 보장하진 않는다.

```kotlin
val numberArr2 :MutableList<out Number> = intArr
numberArr2.clear() //이건 가능
```

| Kotlin       | 설명                                      |
| ------------ | ----------------------------------------- |
| out          | 생산하긴 하지만 소비하지 않음(read 전용)  |
| in           | 소비하긴 하지만 생산하지 않음(write 전용) |
| (따로 지정x) | 생산 & 소비 가능(read, write 가능)        |
