---
title: "Lambda"
date: "2016-02-02T22:40:32.169Z"
template: "post"
draft: false
category: "java"
tags:
  - "lambda"
  - "java"
  - "functional"
  - "function"
description: "중요한 로직만 작성하여 가독성을 높이고 functional interface에 적합하게 사용하고 싶을때"
---

# Lambda.

# 1. 장점
    간단하다! 그래서 알아보기가 쉽고 마치 자바에 없는 함수를 사용하는 느낌을 받는다.
    
# 2. Lambda 기본 사용법
### 2.1 메소드 표현식을 ()=>{} 형태로 사용함
### 2.2 Functional Interface

#### 2.2.1 기본 사용법
java에선 기본적으로 함수 개념이 없다. 하지만 함수를 주고 받아야 하기 때문에 조금 편법을 사용한다.

interface에 하나의 메소드만 선언 해 놓고, 이 메소드의 구현하여 interface를 주고 받는 것이다. 
    
     
```java
public interface LambdaInterface {
    public void doSomeThing();
}
```

```java
public void likeCallback(LambdaInterface cb){
    // 함수를 넘겨 받아 원하는 시점에 호출할수 있다
    cb.doSomeThing();
}
```

```java
likeCallback(() -> {
    //TODO : .....

});
```

위와 같이 interface에 단 하나의 메소드만 선언하고(`LambdaInterface`의 `doSomeThing`) 사용 시,

그 메소드 부분만 정의 하고 사용 하는 쪽에서는 해당 인터페이스로 받아 그냥 사용하는 방식이다. 다른 부분은

그렇다 치더라도, 위의 `LambdaInterface`는 진짜 별 의미 없는 인터페이스가 된다.

무조건 하나의 메소드만 강제해야 되고, 가장 큰 문제점은 확장성이다.

위의 `doSomeThing`은 반환값이 없고, 매개변수가 없다. 하지만 매개변수가 있고 반환값이 있다면?

또 새로운 의미없는 인터페이스를 작성하는 방식이다.  java 1.8이상부터 이렇게 별 의미없고

(어디까지나 모든 소스에서 쓸수도 있는 인터페이스 라는 점에서 의미가 없다는 것이다.)

경우에 따라 많이 선언해 놓아야 하는 이런 인터페이스를 미리 선수 쳐서 선언만 해놓았다.

```java
@FunctionalInterface
public interface Function<T, R> {
    
    ....
    
    R apply(T t);
    
    ....
}
```

위의 `interface`는 이러한 조건을 만족하려고 1.8버전 이상부터 미리 만들어 놓은 인터페이스 이다.

제너릭을 이용하여 타입을 선언 해놓았고(T -> argument type, R -> result type) 단 하나의 메소드(apply)만 존재한다.

이렇게 단 하나의 메소드만 선언 해 놓고 사용시 그 메소드만 사용 목적인 인터페이스를 컴파일에서 강제하기 위하여,

`@FuntionalInterface`를 선언해 놓는다. 이 어노테이션을 적어 놓으면 2개 이상의 메소드는 선언이 불가능하다.

아래 표는 자바에서 제공하는 함수형 인터페이스를 표로 나타냈다(전부 다는 아니고 일부만)

| Interface  | Method |
| ------------- | ------------- |
| Function<T, R>  | R apply(T t);  |
| Predicate&lt;T&gt;  | boolean test(T t);  |
| Consumer&lt;T&gt;  | void accept(T t);  |
| Supplier&lt;T&gt;  | T get();  |
| Runnable  | void run();  |

T는 type(매개변수 타입), R은 Return Type을 나타내므로, 용도는 꽤나 직관적으로 알 수 있다.

또한 표에는 없지만 매개변수가 2개인 함수형 인터페이스는 위 인터페이스 명 앞에 Bi가 붙는다(`BiFunction<T,U,R>`).

`Runnable` 만 java.lang 패키지에 있고 그 외 것들과 더 많은 함수형 인터페이스는 

java.util.function 패키지에 더 많은 함수형 인터페이스가 존재한다.

-------------

#### 2.2.2 collection framework 에서 활용
이런 함수형 인터페이스의 강점은 javascript의 callback과 같은 기능을 생각하면 된다.

기본 native code에서 공통적인 비지니스 로직을 처리하고, 딱 필요한 부분만 사용자가

함수(정확히는 메소드)를 구현 하여 호출하는 방식이다.

| Interface  | Method | 설명 |
| ------------- | ------------- | ------------- |
| Collection  | boolean removeIf(Predicate&lt;E&gt; filter)  | 조건에 맞는 요소를 삭제 |
| List  | void replaceAll(UnaryOperator&lt;E&gt; operator)  | 모든 요소를 변환하여 대체 |
| Iterable  | void forEach(Consumer&lt;T&gt; action) | 모든 요소에 작업 action을 수행 |
| Map  | V compute(K key, BiFunction<K, V, V> f)  | 지정된 키의 값에 작업 f를 수행 |
| Map  | V computeIfAbsent(K key, Function<K, V> f)  | 키가 없으면, 작업 f 수행 후 추가 |
| Map  | V computeIfPresent(K key, BiFunction<K, V, V> f)  | 지정된 키가 있을 때, 작업 f 수행 |
| Map  | V merge(K key, V value, BiFunction<V, V, V> f)  | 모든 요소에 병합작업 f를 수행 |
| Map  | void forEach(BiConsumer<K, V> action)  | 모든 요소에 작업 action을 수행 |
| Map  | void replaceAll(BiFunction<K, V, V> action)  | 모든 요소에 치환작업 f를 수행 |

개인적으로 좋은 내용들이라 생각해서 '자바의 정석' 책을 읽다가 그냥 배꼇다... 

아무튼 사용 예제를 보면
```java
public void collectionDefaultMethod(){
    List<String> strList = new ArrayList<>();

    strList.add("one");
    strList.add("two");
    strList.add("three");
    strList.add("four");

    strList.replaceAll((s)->"number : "+s);

    strList.forEach((s)-> System.out.println(s));
}
```

위와 같이 내가 List에 모든 아이템을 변경할때와 모든 아이템을 출력 한다고 가정하면

replaceAll과 forEach문을 사용을 안한다면 일일이 모든 아이템을 꺼내서 작업을 해야 할 것이다.

하지만 위와같이 정말 내가 필요한 부분만 구현하여 빠르고 간결하게 사용 가능하다.

공부하면서 느낀 바로는 jdk 1.8 부터 interface의 default method + lambda + collection framework의 조합으로 상당히

편하고 간결해졌다고 생각한다.

#### 2.2.3 default method

java 1.8부터 인터페이스에 default method와 static method가 추가되었다. 간단히 설명하면

인터페이스에 default 또는 static으로 메소드의 구현부를 추가할 수 있다.

함수형 인터페이스는 하나의 메소드만 선언할 수가 있지만 이러한 default, static 메소드는 따로 제약 없이 여러개 추가가 가능하다.

이러한 특성 때문에 사용할 땐 마치 함수를 넘겨주고 내부적으로는 객체로 사용하는 듯한 느낌이다.

`Function`과 `Predicate`에는 아래 표와 같이 각각 default method가 존재한다.

### Function class

| 구분 | method | 설명 |
| ------------- | ------------- | ------------- |
| default | Function<V, R> <br/> compose(Function<? super V, ? extends T> before) | before Function을 실행 후, 자기 자신 Function 실행 |
| default | Function<T, V> <br/> andThen(Function<? super R, ? extends V> after) | 자기자신 Function을 실행 후, after Function 실행 |
| static  | Function<T, T> identity()  | 항등 함수를 반환 t->t |

솔직히 딱히 설명할께 없다...

```java
public void funcCombine(){
    Function<String, String> before = (str)-> {
        System.out.println("before");
        return "before"+str;
    };

    Function<String, String> after = (str)-> {
        System.out.println("after");
        return str+"after";
    };

    Function<String, String> combine = before.andThen(after);
    String resultStr = combine.apply("문자열");

    System.out.println(resultStr);
    /*
    before
    after
    before문자열after
    */
}
```

Function class를 활용하여 함수를 합성하여 새로운 함수를 만들어 낼 수가 있다.

compose와 andthen의 차이는 그저 어떤게 먼저 실행 될 지 차이고, 소스 자체가 몇줄 되지 않아 소스 까보는것도 괜찮은 방법이다.

### Predicate class

| 구분 | method | 설명 |
| ------------- | ------------- | ------------- |
| default | Predicate&lt;T&gt; and(Predicate<? super T> other) | 자기 자신 결과와 other Predicate 결과 and 연산 |
| default | Predicate&lt;T&gt; negate() | 자기자신 결과를 not 연산 |
| default  | Predicate&lt;T&gt; or(Predicate<? super T> other)  | 자기 자신 결과와 other Predicate 결과 or 연산 |
| static | Predicate&lt;T&gt; isEqual(Object targetRef) | 입력받은 object와 같은지 비교하는 Predicate을 반환한다 |


```java
public void funcCombine(){
    Predicate<String> isTrue = (str)->str.equals(Boolean.toString(true));
    Predicate<String> isFalse = (str)->str.equals(Boolean.toString(false));

    Predicate<String> onlyFalse = isTrue.and(isFalse);
    Predicate<String> onlyTrue = onlyFalse.negate();
    Predicate<String> mayBeTrue = isTrue.or(isFalse);

    boolean onlyFalseResult = onlyFalse.test("true");
    boolean onlyTrueResult = onlyTrue.test("true");
    boolean byInputResult = mayBeTrue.test("false");

    System.out.println("only false : "+onlyFalseResult);
    System.out.println("only true : "+onlyTrueResult);
    System.out.println("may be true : "+byInputResult);
    /*
    only false : false
    only true : true
    by input : true
    */
}
```
Predicate를 활용해서 함수를 만들고, and, or not 연산을 실행할 수가 있다.

이것도 간단하게 구현이 되어 있어서 혹시나마 이해가 안된다면 소스 까보는것도 괜찮다.


    아무튼 이런식으로 함수형 인터페이스를 사용함으로써 꽤나 유용하고,
    
    javascript 디자인 패턴에서 커링(currying) 같은것도 충분히 구현이 가능할꺼 라고 본다.

# 3 주의할점 및 기타 활용
### 3.1 외부 변수는 별다른 선언이 없어도 final하다. 아래 소스는 1.8 버전 기준
    
```java
public void lambdaBase(){
    int num = 5;

    callMethod(() -> {
        //num = 10;  ERROR!
    });

    callMethod(new LambdaInterface() {
        @Override
        public void doSomeThing() {
            //num = 10;  ERROR!
        }
    });
}
```

다음과 같은 소스가 있다고 했을떄, 내부에서 num을 바꾸는 행위(num=10)는 할수 없다. 이는 내부적으로

변수가 final로 선언 되어서 그러는데, 암시적으로 fianl로 처리하는 이유는 thread safe 문제 때문이라고 한다.

해당 메소드의 실행 시점(또는 순서)을 알 수가 없기에, 아예 내부적으로도 final로 입력 받는다고 한다.

따라서 공통된 resource(위 소스에서 num)를 어디서 요청 되든 공통된 값으로 사용 가능하다.

추가적으로 자세히 알고 싶을 경우, side effect, effectively final, thread safe 등의 키워드로 검색!

참고 자료 : http://wonwoo.ml/index.php/post/1125

### 3.2 closure
java에서 closure를 사용할 수 있는데, 다른 쪽에서 설명하기도 뭐해서 람다와 같이 설명함.

혹시나 closure 개념을 모른다면 javascript를 참고하자.
```java
public static Function<Integer, Integer> getFunction(){
    int num = 10;

    return n ->  n*num;
}
```
위 static method는 Function(Interface이다)의 구현체를 반환하는 메소드가 되겠다.

Funtion은 단일 메소드의 함수형 인터페이스 이므로, 이러한 형태가 가능하다.

아무튼 반환 된 메소드를 사용시, 내부의 num값 범위를 기억(마치 javascript의 lexical scope)

하고 있다는 점에서 closure와 비슷하다고 볼수 있다. 문제점은 역시 반환하는 메소드에서 num값을

바꿀수 없다는 제한 사항이 존재한다.

혹시나 소스가 잘 이해가 안간다면 `Function`은 `interface`라는 점을 잘 기억하고, 추상팩토리 패턴(design pattern)을 공부하자.

### 3.3 Method Reference

메소드 참조는 정말 순수 하고 최소화된 소스만 작성하는 목적으로 사용된다.

```java
public void methodReference(){
    Consumer<String> notUseReference = (s)->{
        System.out.println(s);
    };

    Consumer<String> useReference = System.out::println;

    notUseReference.accept("only Lambda!");

    useReference.accept("use Method Reference!");
}
```

소스 자체는 이해하는데 무리는 없을 꺼라고 생각된다.

`ClassName::MethodName` 형태로 작성하고, 메소드는 static이건 아니건 상관없다.

참고로 생성자는 `ClassName::new(String::new)` 이런식으로 사용한다.

위 소스를 보면 `useReference` 메소드에서 넘겨받는 파라미터는 Cusumer의 generics에 의해 개수와 타입이

제한되어 맵핑(유추 가능)되는 것을 알수 있다. 근데 개인적으로 메소드 참조는 뭔가

엄청 유용하다! 간결하다! 혁신이다! 라는 느낌보단 익숙하지 않아 헤깔리기만 하여 잘 사용은 안할꺼 같다.