---
title: generic
date: "2016-12-01T22:40:32.169Z"
template: "post"
draft: false
category: "java"
description: "타입의 정확성과 유연함을 갖춰야 할때"
socialImage: "/media/image-3.jpg"
---

# Generics.

# 1. Generics ? 
    메소드 또는 collection class에 컴파일 시 타입 체크를 해주는 기능. 컴파일 시 체크하기 때문에
    타입 안정성을 높이고 형변환 번거로움을 줄임.
    
# 2. 장점

### 2.1 형변환을 줄이고, 안정성을 높임
```java
public void safeNunSafe(){
    SubGenerics unsafeSub = new SubGenerics();

    unsafeSub.setItem("unsafe");

    String unSafeitem = (String)unsafeSub.getItem();    // warning. String 이라는 보장이 안됨

    SubGenerics<String> safeSub = new SubGenerics<String>();

    String safeItem = safeSub.getItem();                //String 이라는게 보장이 됨

    SubGenerics<String> safeSub2 = new SubGenerics<>(); //컴파일 시, String 라는걸 유추(추론) 가능하여서 생략가능.
}
```
이런식으로 가져올떄 형변환을 할 필요가 없다(객체 타입이 보장됨).

### 2.2 와일드 카드를 사용함으로써 코드 확장성을 자유롭게 함
    '?', 'super', 'extends'를 써서 확장성을 높임
    
    첨부된 소스 코드를 보자(mainInstance.wildCard 실행)

### 2.3 제너릭 메소드의 사용
    중복된 소스를 줄이고 제너릭 클래스 여부와 상관없이 사용가능

# 3. 주요 사용법

### 3.1 기본 사용법
```java
public class SuperGenerics<T> {
    private T item;

    public T getItem() {
        return item;
    }

    public void setItem(T item) {
        this.item = item;
    }
}
```

제너릭을 사용하는 이유는 타입을 자유롭게 받아 처리할 수 있다는 점이다. 기본적으로 클래스 명 옆에 사용할 타입들을

선언해 놓고(여러개 가능) 그 타입을 맞춰 각 필드, 메소드에서 지정된 타입을 매칭 시켜 사용하면 된다.


### 3.2 와일드 카드 확장
```java
public void handleSubWildCard(List<? extends SuperSomeThingClass> someThingList) {
    //some thing...
}

public void handleSuperWildCard(List<? super SuperSomeThingClass> someThingList) {
    //some thing...
}
```
? extends A -> A와 A를 확장한 class만 허용(child class)

? super A -> A와 A의 super class만 허용

? -> 아무거나. 사실상 ? extends Object

### 3.3 타입 추론이 가능함
```java
    SubGenerics<String> safeSub2 = new SubGenerics<>();    
    SubGenerics<String> safeSub2 = new SubGenerics<String>();
```
위의 두 줄은 서로 같다. 컴파일 시, String 라는걸 유추 가능함(생략 가능). jdk 1.7 이상만 가능
### 3.4 제너릭 메소드
#### 3.4.1 제너릭 클래스와 상관없이 독립적으로 사용가능
```java
private static <T extends SubSomeThingClass> boolean isEquals1(T s1, T s2){

    int s1Code = s1.hashCode();
    int s2Code = s2.hashCode();

    return s1Code == s2Code;
}
```
위의 isEquals1 메소드는 제너릭 클래스에서 사용한 메소드도 아니지만 T를 사용이 가능하다. 이는 제너릭 메소드를 선언하여 사용하기에 가능.

추가로 제너릭을 사용 시, 원래는 static하게 만들 수 없지만 제너릭 메소드는 완전 독립적으로 사용이 가능하며, 제너릭 클래스에서 사용한다

하더라도 위에서 T는 클래스에서 선언한 T와 별개의 타입이 된다.

#### 3.4.2 중복된 소스를 줄여줌
```java
private static <T extends SubSomeThingClass> boolean isEquals2(SubGenerics<T> s1, SubGenerics<T> s2){

    int s1Code = s1.hashCode();
    int s2Code = s2.hashCode();

    return s1Code == s2Code;
}
```

```java
private static boolean isEquals3(
        SubGenerics<? extends SubSomeThingClass> s1
        , SubGenerics<? extends SubSomeThingClass> s2){

    int s1Code = s1.hashCode();
    int s2Code = s2.hashCode();

    return s1Code == s2Code;
}
```
위의 두 소스는 같은 역할을 한다. 차이점은 매개변수 타입을 제너릭 메소드로 선언해서 한곳에서 관리하느냐(위에꺼)

매개변수 타입을 매개변수를 나열할 때 쓰느냐(밑에 소스) 차이점이 된다.

### 3.5 중첩된 제한 가능

```java
public static <T extends Enum & DummyForEnum> void multipleGenerics(T enumClass){
    enumClass.testMethod();
}
```

```java
public static void main(String[] args) {
    multipleGenerics(EnumExtend.DUMMY_ENUM);  //제너릭 제한
}
```

위 소스에서 보는 바와 같이 제너릭 타입 제한을 `&` 통해 중첩된 제한이 가능하다. 위 소스는 제너릭 타입 `T`의

제한을 `Enum`, interface `DummyForEnum`를 확장한 형태만 받을 수 있게 제한하고 있다.

# 4. 주의할점

#### 4.1 extends, super 사용 시 주의 점
```java
    List<? extends SuperSomeThingClass> list = new ArrayList<>();
    
    list.add(new SuperSomeThingClass());   //ERROR!
```
참고 사항으로 이런 방식으로는 안된다. 될꺼 같지만 list에 각 아이템 요소가 무엇으로 처리해야 할지 보장이 안된다.

쫌더 자세히 설명하면 만약 저게 가능하다고 가정하면
```java
    List<? extends SuperSomeThingClass> list = new ArrayList<>();
    
    list.add(new SuperSomeThingClass());
    list.add(new SubSomeThingClass());

    ??? someThing= list.get(0);
```
이런식으로 someThing의 클래스가 어떤것인지 몰라서 내부적으로 문제가 발생한다고 한다. 클래스의 안정성을 위해서라도 이런방식은 막아두었다고 한다.

참고 https://stackoverflow.com/questions/24861758/difference-for-super-extends-string-in-method-and-variable-declaration?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa

#### 4.2 Exception을 확장한 클래스에서는 사용 불가

Exception(정확히 Throwable)을 확장한 클래스에서는 사용이 불가능하다.

```java
    //ERROR! Generic class may not extend 'java.lang.Throwable'
    public class BusinessException<T> extends RuntimeException{
    }
```

제너릭을 설명하면서 빠뜨린 부분이 있는데, 제너릭을 사용하더라도 내부적으로 컴파일 되면서

동적으로 제너릭 부분을 없애준다.

```java
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        
        // after compile ==> List list = new ArrayList<>();
    }
```

꼭 이렇게 바꾸는게 아니라 제너릭 타입만 없애준다는 사실만 기억 하고, 자세한건 아래 링크 참고! 

참고 : https://stackoverflow.com/questions/19253174/are-generics-removed-by-the-compiler-at-compile-time

컴파일 과정중에서 제너릭 타입이 제거되면서, exception catch 과정 중에 문제가 발생하게 된다.

```java
    public static void main(String[] args) {
        try {
           throw new BusinessException<String>();
        } catch (BusinessException<Integer> e) {
           //handle exception ...
        } catch (BusinessException<String> e) {
           //handle exception ...
        }
    }
```
위와 같은 소스가 아래와 같이 변한다.
```java
    public static void main(String[] args) {
        try {
           throw new BusinessException<String>();
        } catch (BusinessException e) {
           // ???
        } catch (BusinessException e) {
           // ???
        }
    }
```

제너릭이 제거되면서 exception이 어디서 catch 하는지 알 수 없게 되어 막아놓았다고 한다.

참고 : https://stackoverflow.com/questions/501277/why-doesnt-java-allow-generic-subclasses-of-throwable