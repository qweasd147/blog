---
title: 'Java OOME 종류'
date: '2022-02-10T05:55:23.624Z'
template: 'post'
draft: false
category: 'java'
tags:
  - 'jvm'
  - 'java'
  - 'heap'
  - 'GC'
description: 'OOME(Out Of Memory Error) 종류 및 발생 조건'
---

미리 말하면 샘플 코드들은 OOME 발생을 쉽게 하기 위해 힙/메타스페이스 메모리 공간을 상당히 적게 만들고 테스트 하였다

## 1. Java heap space

```java
public class OOME {

    public static void main(String[] args) {

        new OOME().heap();
    }
    public void heap() {

        List<Integer> list = new LinkedList<>();
        int i=0;
        while (true){
            list.add(++i);
        }
    }
}
```

그냥 위 코드를 실행 시키면 언젠가 heap 메모리가 터지게 된다.

```
java.lang.OutOfMemoryError: Java heap space
	at java.base/java.lang.Class.forName0(Native Method)
	at java.base/java.lang.Class.forName(Class.java:315)
  ...
  ...
  ...
```

가장 많이 볼 것이라 예상되는 `OOME` 이다. 발생 이유는 `heap` 메모리가 부족해서 발생하는것인데, 발생했다고 heap 메모리만 늘리다보면 답이 없다. 메모리 누수는 없었는지, 현재 차지하고 있는 heap memory가 어느 정도인지 파악하고 `heap` 메모리를 늘리던가 경우에 따라 `java application`을 `scale down` 하는게 더 나은지 생각하고 작업하는걸 추천한다.

`heap` 영역에는 생성된 객체가 저장되는 공간인데, 생성된 객체가 heap 영역에 저장할 공간이 없다고 바로 `OOME`가 발생하는게 아니라 일단 `GC`를 돌려보고(필요에 따라 `yong/old/full`이 돌아간다) 그래도 메모리가 부족하면 `OOME`가 발생하는 것이다. 즉, 기회를 줬는데도(GC 돌아가는거) 터졌다는건 메모리 누수 여부도 반드시 확인 해볼 사항이다(물론 진짜 물리적으로 heap이 너무 부족 해서 발생 할 수도 있다).

> GC 로그를 보다보면 GC가 돌아가는 이유도 알 수 있는데, 메모리 할당 실패(`Allocation Failure`) 시에도 GC가 돌아가는것을 확인 할 수 있다.

## 2. GC overhead limit exceeded

발생 조건을 적어보자면

- cpu 사용량 중 98%를 GC 돌리는데 사용
- GC 돌렸는데도 heap의 2% 이하면 확보

이름 그대로 GC로 인한 오버헤드가 너무 크면 발생한다. 현재 내 환경을 기준으로 당장 위의 `Java heap space`에서 설명한 코드를 자바 버전만 8로 바꿔서 실행 해봤더니 발생하였고, 발생 근본적인 원인은 **똑같은 이유** 일 가능성이 높다. 즉, 결국엔 `heap` 메모리가 부족해서 인데 일시적으로 메모리가 큰 작업, 메모리 누수 등이 발생 이유 일 수도 있다. 또한 limit조건을 없앨수도 있지만 그런식으로 해결하는건 별로 좋은 방법은 아니다.

> 자바 8의 기본 GC는 `Parallel GC` 이다.

> 혹시나마 오버헤드 제한을 끄고 싶으면 `-XX:-UseGCOverheadLimit` 옵션을 주면 된다. (비추천)

```
Exception in thread "main" java.lang.OutOfMemoryError: GC overhead limit exceeded
	at java.lang.Integer.valueOf(Integer.java:832)
  ...
  ...
```

## 3. Requested array size exceeds VM limit

힙보다 더 큰 Array가 요청되는 경우 발생한다.

```java
public class OOME {

    public void array() {

        Integer[] arr = new Integer[Integer.MAX_VALUE];
    }
}
```

```
Exception in thread "main" java.lang.OutOfMemoryError: Requested array size exceeds VM limit
  ...
  ...
```

이건 그냥 코드가 잘못된 케이스라고 봐야한다. break 없이 동적으로 배열 크기를 늘리는게 아닌지 확인해봐야한다.

## 4. Metaspace

`Metaspace`는 `Class` 관련 메타데이터가 저장되는 공간이라고 하였다. 즉, 너무 많은 `Class` 정보를 로드하면 발생하게 되지만, 물론 이 `metaspace`로 GC 대상이며 해당 클래스에 대한 참조 및 인스턴스가 없을때 GC에 의해 회수된다.

```java
public class OOME {

    public void metaspace() {

        ClassPool cp = ClassPool.getDefault();
        for (int i = 0; i < 1000000000; i++) {
            try {
                Class<?> clazz = cp.makeClass("dummy clazz " + i).toClass();

                System.out.println("created " + clazz.getSimpleName());
            } catch (CannotCompileException e) {
                throw new RuntimeException("make clazz error", e);
            }
        }
    }
}
```

참고로 동적으로 클래스를 만들기 위해 외부 라이브러리를 사용하였고, 해당 `OOME`를 쉽게 발생하기 위해 상대적으로 Heap 메모리는 크게, metaspace(`MaxMetaspaceSize`)는 적게 셋팅하고 실행하여야 한다. TMI로 GC 로그를 보면 metaspace를 확보 하려하고 해도 실패하는거 봐선 이 라이브러리에 동적으로 만들어진 클래스를 참조&관리하는 로직이 있을것이라 생각된다.

> https://github.com/jboss-javassist/javassist

```
Exception in thread "main" java.lang.OutOfMemoryError: Metaspace
  ...
  ...
```

## 5. 그 외 OOME

그 외에도 발생 이유가 있지만 정말 보기 힘든 에러들이며, 일반적인 상황에선 볼 일이 없는 에러들이 있다. 추가로 쓰는것 말고도 몇가지가 있는데 그건 더더욱 보기 힘들꺼라 생각된다.

### request size bytes for reason. Out of swap space?

런타임 시에 가상 메모리(swap memory)를 추가로 확보 할 수 없을 경우 발생한다.

### Compressed class space

class의 정보가 저장되는 크기가 부족하면 발생한다.

이 공간에 대해 요약해서 설명하자면 기본적으로 `UseCompressedClassPointers`라는 옵션을 사용하면 `metaspace`는 2개의 context로 분리되는데, 클래스 정보 일부분이 `Compressed class space`라는 곳에 저장된다(기본 옵션으로 활성화 되어 있음).

> java 클래스의 내부 정보(`internal representation of Java classes`)는 `class space (Compressed class space)` 안에, 그 외 `method`, `constant pools`, `anotation` 등이 `non class metaspace` 저장된다. 궁극적으로 이렇게 하는 이유는 32/64 bit로 차이로 인한 메모리 최적화를 위해 설계되었으며, 이런 두 공간의 합은 최대 metaspace(`MaxMetaspaceSize`) 공간보다 클 수 없다.

- [compressed 옵션에 따른 metaspace context 설명](https://wiki.openjdk.java.net/display/HotSpot/Metaspace)
- [Compressed Class Space 관련 질답(Stack overflow)](https://stackoverflow.com/questions/54250638/is-compressedclassspacesize-area-contains-maxmetaspacesize-area)
- [class area + non class area + metaspace 설명](https://stuefe.de/posts/metaspace/sizing-metaspace/)
- [jvm Compressed References 관련 설명](https://shipilev.net/jvm/anatomy-quarks/23-compressed-references/)
