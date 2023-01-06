---
title: "Lambda를 써야하는 이유"
date: "2023-01-06T04:49:25.173Z"
template: "post"
draft: false
category: "java"
tags:
  - "lambda"
  - "java"
  - "function"
description: "익명클래스 보다 람다를 써야하는 이유"
---

처음으로 자바에서 람다를 배울 때 쓰는 이유 중 하나는 '그냥 간편해서' 라고 배웠던 기억이 난다. 람다를 씀으로써 문법적으로 더 간단해지고, 여기서 더 나아가면 함수형 인터페이스(`functional interface`) 까진 많이들 알 것이라 생각되는데 비교적 최근에 자바를 좀 더 공부하면서 차이를 더 알게 되었다. 여기서 비교 할 코드는 아래와 같다.

### Lambda

```java
    public static void main(String[] args) {

        List<String> items = Arrays.asList("test item1", "test item2");
        LambdaTest test = new LambdaTest();

        test.testLambda(items);
    }

    public void testLambda(List<String> items) {

        items.stream()
                .filter(s -> s.length() > 1)
                .forEach(s-> System.out.println(s));
    }
```

### Anonymous

```java

    public static void main(String[] args) {

        List<String> items = Arrays.asList("test item1", "test item2");
        LambdaTest test = new LambdaTest();

        test.testAnonymous(items);
    }

    public void testAnonymous(List<String> items) {

        items.stream()
                .filter(new Predicate<String>() {
                    @Override
                    public boolean test(String s) {
                        return s.length() > 1;
                    }
                })
                .forEach(new Consumer<String>() {
                    @Override
                    public void accept(String o) {
                        System.out.println(o);
                    }
                });
    }
```

이전엔 두 메소드가 컴파일러를 거치면 완벽히 똑같은 코드가 될 것이라 생각하였다. 하지만 막상 컴파일 된 바이트 코드를 까보면 생각보다 꽤 많은 차이가 있다.

## 람다와 익명 클래스의 차이점

### 3.1. this 객체

쉬운거 먼저 말하면 `this`가 가르키는 객체가 다르다. 람다에서 `this`는 `LambdaTest` 클래스의 인스턴스를 가르키지만 익명클래스에서 this는 익명객체를 통해 생성 된 인스턴스 그 자체를 가르키게 된다.

```java
    public static void main(String[] args) {

        List<String> items = Arrays.asList("test item1", "test item2");

        LambdaTest test = new LambdaTest();

        test.testLambda(items);
        test.testAnonymous(items);
    }

    public void testLambda(List<String> items) {

        System.out.println("객체 this(lambda) -> " + this);

        items.stream().filter(s -> s.length() > 1).forEach((s) -> {
            System.out.println("lambda this -> " + this);
        });
    }

    public void testAnonymous(List<String> items) {

        System.out.println("객체 this(anonymous) -> " + this);

        items.stream().forEach(new Consumer<String>() {
            @Override
            public void accept(String o) {
                System.out.println("anonymous this -> " + this);
            }
        });
    }

    /*
    출력 내용
    객체 this(lambda) -> LambdaTest@3d24753a
    lambda this -> LambdaTest@3d24753a
    lambda this -> LambdaTest@3d24753a
    객체 this(anonymous) -> LambdaTest@3d24753a
    anonymous this -> LambdaTest$1@506e6d5e
    anonymous this -> LambdaTest$1@506e6d5e
    */
```

출력 내용을 보면 함수에서 호출 한 `this`와 람다에서 호출한 `this`는 같은 주소를 출력하지만 익명 함수 안에서 호출 한 `this`는 다른 값을 출력 해주는 걸 알 수 있다.

### 3.2 바이트 코드

다시 위에서 `filter`와 `forEach`를 사용한 코드를 바이트 코드로 만들면 아래와 같이 확인 할 수 있다.

#### 람다 함수 바이트 코드 내용

```
public testLambda(Ljava/util/List;)V
   L0
    LINENUMBER 22 L0
    ALOAD 1
    INVOKEINTERFACE java/util/List.stream ()Ljava/util/stream/Stream; (itf)
    INVOKEDYNAMIC test()Ljava/util/function/Predicate; [
      // handle kind 0x6 : INVOKESTATIC
      java/lang/invoke/LambdaMetafactory.metafactory(Ljava/lang/invoke/MethodHandles$Lookup;Ljava/lang/String;Ljava/lang/invoke/MethodType;Ljava/lang/invoke/MethodType;Ljava/lang/invoke/MethodHandle;Ljava/lang/invoke/MethodType;)Ljava/lang/invoke/CallSite;
      // arguments:
      (Ljava/lang/Object;)Z,
      // handle kind 0x6 : INVOKESTATIC
      LambdaTest.lambda$testLambda$0(Ljava/lang/String;)Z,
      (Ljava/lang/String;)Z
    ]
   L1
    LINENUMBER 23 L1
    INVOKEINTERFACE java/util/stream/Stream.filter (Ljava/util/function/Predicate;)Ljava/util/stream/Stream; (itf)
    INVOKEDYNAMIC accept()Ljava/util/function/Consumer; [
      // handle kind 0x6 : INVOKESTATIC
      java/lang/invoke/LambdaMetafactory.metafactory(Ljava/lang/invoke/MethodHandles$Lookup;Ljava/lang/String;Ljava/lang/invoke/MethodType;Ljava/lang/invoke/MethodType;Ljava/lang/invoke/MethodHandle;Ljava/lang/invoke/MethodType;)Ljava/lang/invoke/CallSite;
      // arguments:
      (Ljava/lang/Object;)V,
      // handle kind 0x6 : INVOKESTATIC
      LambdaTest.lambda$testLambda$1(Ljava/lang/String;)V,
      (Ljava/lang/String;)V
    ]
   L2
    LINENUMBER 24 L2
    INVOKEINTERFACE java/util/stream/Stream.forEach (Ljava/util/function/Consumer;)V (itf)
   L3
    LINENUMBER 25 L3
    RETURN
   L4
    LOCALVARIABLE this LLambdaTest; L0 L4 0
    LOCALVARIABLE items Ljava/util/List; L0 L4 1
    // signature Ljava/util/List<Ljava/lang/String;>;
    // declaration: items extends java.util.List<java.lang.String>
    MAXSTACK = 2
    MAXLOCALS = 2

  // access flags 0x100A
  private static synthetic lambda$testLambda$1(Ljava/lang/String;)V
   L0
    LINENUMBER 24 L0
    GETSTATIC java/lang/System.out : Ljava/io/PrintStream;
    ALOAD 0
    INVOKEVIRTUAL java/io/PrintStream.println (Ljava/lang/String;)V
    RETURN
   L1
    LOCALVARIABLE s Ljava/lang/String; L0 L1 0
    MAXSTACK = 2
    MAXLOCALS = 1

  // access flags 0x100A
  private static synthetic lambda$testLambda$0(Ljava/lang/String;)Z
   L0
    LINENUMBER 23 L0
    ALOAD 0
    INVOKEVIRTUAL java/lang/String.length ()I
    ICONST_1
    IF_ICMPLE L1
    ICONST_1
    GOTO L2
   L1
   FRAME SAME
    ICONST_0
   L2
   FRAME SAME1 I
    IRETURN
   L3
    LOCALVARIABLE s Ljava/lang/String; L0 L3 0
    MAXSTACK = 2
    MAXLOCALS = 1
}
```

#### 익명 함수 바이드 코드 내용

```
public testAnonymous(Ljava/util/List;)V
   L0
    LINENUMBER 31 L0
    ALOAD 1
    INVOKEINTERFACE java/util/List.stream ()Ljava/util/stream/Stream; (itf)
    NEW LambdaTest$2
    DUP
    ALOAD 0
    INVOKESPECIAL LambdaTest$2.<init> (LLambdaTest;)V
   L1
    LINENUMBER 32 L1
    INVOKEINTERFACE java/util/stream/Stream.filter (Ljava/util/function/Predicate;)Ljava/util/stream/Stream; (itf)
    NEW LambdaTest$1
    DUP
    ALOAD 0
    INVOKESPECIAL LambdaTest$1.<init> (LLambdaTest;)V
   L2
    LINENUMBER 38 L2
    INVOKEINTERFACE java/util/stream/Stream.forEach (Ljava/util/function/Consumer;)V (itf)
   L3
    LINENUMBER 44 L3
    RETURN
   L4
    LOCALVARIABLE this LLambdaTest; L0 L4 0
    LOCALVARIABLE items Ljava/util/List; L0 L4 1
    // signature Ljava/util/List<Ljava/lang/String;>;
    // declaration: items extends java.util.List<java.lang.String>
    MAXSTACK = 4
    MAXLOCALS = 2
}
```

#### 참고

- INVOKEINTERFACE - 인터페이스 메소드 호출
- INVOKESPECIAL - 생성자, private 메소드, 슈퍼 클래스의 메소드 호출
- INVOKESTATIC - static 메소드 호출
- INVOKEVIRTUAL - 인스턴스 메소드 호출

만들어진 바이트 코드를 통해 람라 먼저 보면 만들어진 부분은 아예 `static`의 별도의 메소드가 만들어 진다는 점이다.

```
private static synthetic lambda$testLambda$1(Ljava/lang/String;)V
...
private static synthetic lambda$testLambda$0(Ljava/lang/String;)Z
```

람다식은 컴파일러를 거치면서 해당 람다 메소드가 정의 된 클래스의 `private static` 메소드로 정의 되고, 그 메소드를 매번 호출 하는 형태가 된다.

> 주의 할 점은 람다식 내에서 `this`를 쓰냐, 아니냐에 따라 `static`이냐, 아니냐가 갈리게 된다. `this`를 사용 안하면 위와 같이 `static`으로, `this`를 쓰면 `static`한 메소드에선 사용 할 수 없으니까 `static`이 아니게 된다.

즉 람다는 메소드로 변환 되어 매번 객체를 생성하지 않아도 된다.

하지만 익명클래스로 직접 구현한 방식에선 `INVOKESPECIAL`을 사용하여 객체를 생성 하는 것을 확인 할 수가 있다. 따라서 익명 클래스는 상대적으로 더 많은 객체를 생성하게 되므로, 람다에 비해 메모리가 더 많이 필요하게 된다.

여기서 끝나는게 아니라 한가지 더 확인 할 수가 있는데 익명 클래스의 바이트 코드는 아래와 같은 내용을 볼 수가 있다

```
...
INVOKESPECIAL LambdaTest$2.<init>
...
INVOKESPECIAL LambdaTest$1.<init>
```

이게 무슨 클래스 생성자를 호출 하는것인지 의아 할 수가 있는데, 이건 진짜 컴파일 된 파일 결과를 보면 알 수 있다.

```sh
# 컴파일 된 결과를 떨어뜨리는 디렉토리로 이동. 개인 설정 기준 다를 수 있음
$ out/production/TestJava
$ ls
LambdaTest$1.class LambdaTest$2.class LambdaTest.class   Main.class
```

즉, 익명 클래스를 쓰면 아예 새로운 클래스를 컴파일 과정에서 만들고 그 클래스의 인스턴스를 만드는 것이다.

-> 힙뿐만 이나라 메타스페이스 메모리도 더 사용하게 된다.

> 익명클래스 2개 썻다고 2개의 새로운 클래스 `LambdaTest$1.class`, `LambdaTest$2.class`가 만들어진 것이다
> 코드에 따라 최적화 결과가 다르므로 람다도 클래스를 동적으로 만들어 사용 될 수도 있다.

추가로 람다의 장점은 더 있는데, `INVOKEDYNAMIC`을 통해 컴파일 타임이 아닌 런타임 시에 호출 되는 특징과 외부 객체 참조 여부, this 사용 여부에 따라 똑같은 람다를 반복되어 사용하는 특징(마치 string 처럼)등이 있다. 물론 최적화 과정은 익명 클래스도 어느 정도 지원을 하지만 기본적으로 람다를 쓰는게 메모리 측면에서 더 좋다
