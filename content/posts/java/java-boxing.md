---
title: "Boxing, Unboxing & Cache"
date: "2022-12-28T10:19:01.562Z"
template: "post"
draft: false
category: "java"
tags:
  - "java"
description: "Wrapper class의 boxing과 unboxing, 과도한 객체 생성을 막기 위한 캐싱 전략"
---

# 1. boxing, unboxing

자바를 공부 해본 사람이라면 `boxing`과 `unboxing`은 한번씩 들어 봤을 것이다.

```java
public static void main(String[] args) {

    int primitive = 42142;
    Integer wrapper = 1414141;
    boxing(primitive);
    unboxing(wrapper);
}
public static void boxing(Integer boxing){
    System.out.println("boxing " + boxing);
}
public static void unboxing(int unboxing){
    System.out.println("unboxing " + unboxing);
}
```

기본적으로 `primitive type`을 argument로 넘겨줘도 해당 메소드에서 class 타입(`wrapper class`)으로 받을 수도 있고, 그 반대도 가능하다. 또 서로 변수에 대입도 가능한데 이게 가능한 이유가 다 java에서 자동으로 `boxing`과 `unboxing`을 해주기 때문이다.

참고로 null값을 `unboxing`하게 되면 에러가 발생하니, 이러한 점은 주의해야 한다.

```java
public static void main(String[] args) {

    Integer wrapper = null;
    unboxing(wrapper); //NPE가 발생한다.
}

public static void unboxing(int unboxing){

    System.out.println("unboxing " + unboxing);
}
```

`primitive type`은 null일 수는 없으니까 `auto boxing`하는 경우엔 적어도 NPE는 발생하지 않는다.

# 2. Wrapper class 비교

위 내용을 설명하려고 포스트를 작성한건 아니고, wrapper class도 결국엔 class의 인스턴스이다. 그 말은 인스턴스의 `==` 비교를 하게 되면 값으로 비교 하는게 아니라 주소값을 비교하는게 기본 원칙인데, 막상 비교 해보면 주소값이 아니라 진짜 '값'으로써 비교 하는게 아닐까 의심 될 수도 있다.

```java
public static void main(String[] args) {

    Integer a = 2;
    Integer b = 2;

    Integer c = 4;

    System.out.println("result 1 " + (a == b)); //true
    System.out.println("result 2 " + (a == c)); //false

    Integer d = 200;
    Integer e = 200;

    System.out.println("result 3 " + (d == e)); //false
}
```

위 코드에서 a,b,c 세 변수만 비교한 결과값을 보면 정말 값으로써 비교 한 것 처럼 보인다. 근데 밑의 d,e 두 개를 비교한 결과를 보면 이번엔 주소값을 비교한 것 처럼 느껴진다.

## 2.1 Wrapper class Cache

이러한 결과를 설명 하자면 일단 주소값을 통해 비교하는것은 맞다. 그런데도 a,b,c 변수의 비교 결과가 발생한 이유는 java에서 자주 사용되는 값들은 미리 객체를 생성 해놓고, 그 인스턴스를 반복해서 사용하도록 만들었기 때문이다.

`Integer`도 결국 방식은 똑같은데 이해하기 쉬운 `Character`를 기준으로 설명하자면, `Character` 클래스를 찾아보면 아래와 같은 `CharacterCache` 클래스를 찾을 수 있다.

**Character.java**

```java
    private static class CharacterCache {
        private CharacterCache(){}

        static final Character cache[] = new Character[127 + 1];

        static {
            for (int i = 0; i < cache.length; i++)
                cache[i] = new Character((char)i);
        }
    }
```

이런식으로 class가 메모리에 올라갈 때 미리 `cache`라는 변수에 인스턴스를 미리 생성해서 채워넣는다. 그 후, `Character.valueOf` 메소드를 사용하면 먼저 `cache`에 해당 값을 찾고, 존재한다면 해당 객체를 사용하게 된다. 이래서 `valueOf`를 통해 생성 된 객체는 캐시 범위 내에 있다면 매번 똑같은 객체를 사용하게 되니까 주소값 비교를 하게 되어도 동일한 인스턴스를 비교하게 되고, 결과는 `true`일 수 밖에 없다.

**Character.valueOf**

```java
    public static Character valueOf(char c) {
        if (c <= 127) { // must cache
            return CharacterCache.cache[(int)c];
        }
        return new Character(c);
    }
```

대부분의 `wrapper class`는 자주 사용되는 범위 안에 값들을 이런식으로 미리 생성 해 놓는데 `Integer` 값의 범위는 -128 ~ 127까지 미리 생성 해놓는다. 즉, 이 범위 안에 있는 값들은 자주 사용 되는 값이라 판단되어 사용할때마다 매번 객체를 생성하는게 아니라 캐싱을 통해 재사용되고, 이 범위 밖에 있는 건 매번 진짜 인스턴스를 생성하게 된다.

```java
public class Main {
    public static void main(String[] args) {

        List<Integer> numberList1 = List.of(-129, -128, -127, 126, 127, 128);
        List<Integer> numberList2 = List.of(-129, -128, -127, 126, 127, 128);


        for (int i = 0; i < numberList1.size(); i++) {
            System.out.println(
                    String.format("%s -> %s",
                            numberList1.get(i),
                            numberList1.get(i) == numberList2.get(i)
                    )
            );
        }
    }
}

/**
결과
-129 -> false
-128 -> true
-127 -> true
126 -> true
127 -> true
128 -> false
**/
```

만약 `new Integer(xxx)`를 통해 생성 된 객체를 비교하면 정말로 매번 객체 생성을 하게 된다. -> `auto boxing`은 `valueOf`메소드를 통해 생성 된다는 것을 간접적으로 알 수 있다.

> jvm 옵션을 통해 캐싱 범위를 더 넓힐 수도 있다.

> 코틀린은 `==`은 `equals`를, `===`는 주소값을 비교하니까 헤깔리면 안된다.

```kotlin
fun main() {

    val data1: Int? = 12345
    val data2: Int = 12345

    println("result ${(data1 == data2)}")  //true
    println("result ${(data1 === data2)}") //false
}
```
