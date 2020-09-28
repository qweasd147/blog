---
title: 'Stream'
date: '2016-02-03T22:40:32.169Z'
template: 'post'
draft: false
category: 'java'
tags:
  - 'stream'
  - 'java'
  - 'functional'
description: '많은 데이터를 손쉽게 처리'
---

# Stream.

# 1. 장점

### 1.1 내부 반복처리를 진행하고, 직관적이라 이해하기 쉽다.

### 1.2 손쉬운 병렬처리

### 1.3 최종 연산이 실행될때 중간연산들을 실행한다. (지연 실행)

이 부분이 좋은 점이 불필요한 연산을 줄여준다는 점이다. 밑에 2.1에서 좀 더 자세히 설명

# 2. Stream 기본 사용법

### 2.1 중간연산, 최종연산

스트림 사용 시 중간연산, 최종 연산이 존재 하며, 최종 연산이 실행되면 해당 스트림은 더이상 사용 할 수가 없다.

일단 표부터 확인!

<table>
  <thead>
    <tr><th>중간연산</th><th>설명</th></tr>
  </thead>
  <tbody>
    <tr><td>Stream&lt;T&gt; distinct()</td><td>중복을 제거</td></tr>
    <tr><td>Stream&lt;T&gt; filter(Predicate&lt;T&gt; predicate)</td><td>조건에 안맞는 요소 제외</td></tr>
    <tr><td>Stream&lt;T&gt; limit(long maxSize)</td><td>스트림의 일부를 제한(개수 제한)한다.</td></tr>
    <tr><td>Stream&lt;T&gt; skip(long n)</td><td>스트림의 일부를 skip한다.</td></tr>
    <tr><td>Stream&lt;T&gt; peek(Consumer&lt;T&gt; action)</td><td>스트림의 요소에 작업을 수행한다.</td></tr>
    <tr><td>Stream&lt;T&gt; sorted()</td><td rowspan="2">스트림의 요소를 정렬한다.</td></tr>
    <tr><td>Stream&lt;T&gt; sorted(Conparator&lt;T&gt; comparator)</td></tr>
    <tr><td>Stream&lt;R&gt; map(Function&lt;T, R&gt; mapper)</td><td rowspan="8">스트림의 요소를 변환한다.</td></tr>
    <tr><td>DoubleStream mapToDouble(ToDoubleFunction&lt;T&gt; mapper</td></tr>
    <tr><td>IntStream mapToInt(ToIntFunction&lt;T&gt; mapper)</td></tr>
    <tr><td>LongStream mapToLong(ToLongFunction&lt;T&gt; mapper)</td></tr>
    <tr><td>Stream&lt;R&gt; flatMap(Function&lt;T, Stream&lt;R&gt;&gt; mapper)</td></tr>
    <tr><td>DoubleStream flatMapToDouble(Function&lt;T, DoubleStream&gt; m)</td></tr>
    <tr><td>IntStream flatMapToInt(Function&lt;T, IntStream&gt; m)</td></tr>
    <tr><td>LongStream flatMapToLong(Function&lt;T, LongStream&gt; m)</td></tr>
  </tbody>
</table>

<table>
  <thead>
    <tr><th>최종연산</th><th>설명</th></tr>
  </thead>
  <tbody>
    <tr><td>void forEach(Consumer&lt;? super T&gt; action)</td><td>각 요소에 지정된 작업 수행</td></tr>
    <tr><td>void forEachOrdered(Consumer&lt;? super T&gt; action)</td><td>각 요소에 지정된 작업 수행</td></tr>
    <tr><td>long count()</td><td>스트림의 요소의 개수 반환</td></tr>
    <tr><td>Optional&lt;T&gt; max(Comparator&lt;? super T&gt; comparator)</td><td>스트림의 최대값 반환</td></tr>
    <tr><td>Optional&lt;T&gt; min(Comparator&lt;? super T&gt; comparator)</td><td>스트림의 최소값 반환</td></tr>
    <tr><td>Optional&lt;T&gt; findAny()</td><td>스트림의 아무거나 하나 반환</td></tr>
    <tr><td>Optional&lt;T&gt; findFirst()</td><td>스트림의 첫번째 요소 반환</td></tr>
    <tr><td>boolean allMatch(Predicate&lt;T&gt; p)</td><td>조건에 모든 요소가 만족하는지</td></tr>
    <tr><td>boolean anyMatch(Predicate&lt;T&gt; p)</td><td>조건에 하나라도 만족하는지</td></tr>
    <tr><td>boolean noneMatch(Predicate&lt;T&gt; p)</td><td>조건에 모두 만족하지 않는지</td></tr>
    <tr><td>Object[] toArray()</td><td>스트림의 모든 요소를 배열로 반환</td></tr>
    <tr><td>A[] toArray(IntFunction&lt;A[]&gt; generator)</td><td>스트림의 모든 요소를 배열로 반환</td></tr>
    <tr><td>Optional&lt;T&gt; reduce(BinaryOperator&lt;T&gt; accumulator)</td><td rowspan="4">스트림의 요소를 하나씩 줄여 가면서 계산한다.</td></tr>
    <tr><td>T reduce(T identity, BinaryOperator&lt;T&gt; accumulator)</td></tr>
    <tr><td>U reduce(U identity, BinaryOperator&lt;U, T, U&gt; accumulator)</td></tr>
    <tr><td>BinaryOperator&lt;U&gt; combiner</td></tr>
    <tr><td>R collect(Collector&lt;T, A, R&gt; collector)</td><td rowspan="2">스트림의 요소를 수집한다.<br/>주로 요소를 그룹화 하거나 분할한<br/>결과를 컬렉션에 담아 반환하는데 사용한다.</td></tr>
    <tr><td>R collect(Supplier&lt;R&gt; supplier<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ,BiConsumer&lt;T, R&gt; accumulator<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;, BiConsumer&lt;R, T&gt; Combiner)</td></tr>
  </tbody>
</table>

미리 말하면 '자바의 정석' 보고 배꼇다... 그래도 markdown + table 조합때문에 작성이 힘들었다....

아무튼 중간연산은 항상 stream을 반환하는 것을 확인 할 수가 있다. 이러한 점을 활용하여 각 중간 연산을

chaining 하여 편하게 사용이 가능하다. 또한 중간연산은 최종 연산을 하여야 의미가 있으므로, 최종적으로 최종 연산

을 하지 않으면 실행되지 않는다(바꿔 말하면 최종 연산이 될때 중간연산을 실행함).

```java
public void streamOperator(){

  //중간연산만 단독으로 실행 시, 실행되지 않는다.
  Stream<UserVo> userVoStream = getMockUserList().stream();

  userVoStream.peek(System.out::println);
}
```

위의 소스와 표를 보면 peek 메소드는 각 요소에 일정한 작업을 하기위한 '중간 연산'이다.

하지만 중간연산이라 화면에 표출되는 것은 아무것도 없다. 최종연산인 forEach로 바꾸던가

아니면 peek 이후에 최종연산 메소드를 체이닝 하여야한다.

이러한 점이 좋은 점이유는 불필요한 연산을 줄여준다는 점이다. 예를들어 스트림 요소가 무한 스트림이고

그 중 중간연산에서 limit을 사용 후 중간연산 처리시 무한한 데이터를 전부 핸들링하는게 아니라 limit만큼

제한 후 핸들링 하는 점이라 효율적이라고 말할 수 있다.

### 2.2 병렬처리

병렬처리는 스레드를 사용 해야 할것이고 그럴때 생각 해야 할 것이 많을 것이다.

하지만 stream을 사용하여 병렬 처리 시 사용자(프로그래머)는 그냥 일반 stream 사용 시 사용하면 된다.

```java
public void parallelStream(){
    IntStream forParallelStream = IntStream.range(1, 10);

    forParallelStream
            .parallel()
            .forEach((n)->System.out.println("parallel numbering : "+n));

  }
```

위 소스와 같이 스트림을 병렬처리 스트림으로 변경(parallel) 후 일반 스트림 같이 사용하면 된다.

### 2.2 collect

가공 및 처리한 데이터를 수집. 간단히 stream을 array, collection framework 등으로 형변환 한다고 생각하면 된다.

```java
public void streamCollect(){

  List<UserVo> userList = getMockUserList();

  //stream -> array
  Stream<UserVo> toArrayStream = userList.stream();
  UserVo[] resultArray = toArrayStream.toArray(UserVo[]::new);
}
```

array로 변환 시, 그냥 toArray() 메소드를 호출하면된다. 하지만 여기서 Object 배열이 아닌 지정된 배열로 반환하기

위해서는 toArray() 메소드에 IntFunction 인터페이스를 구현해서 넘겨줘야한다.

번외로 메소드 참조에 관련해서 꽤나 부정적인 인식이 있었는데 이렇게 보니까 깔끔한것 같기는하다.

```java
public void streamCollect(){
  List<UserVo> userList = getMockUserList();

  Stream<UserVo> toMapStream = userList.stream();

  Map<String, UserVo> resultMap = toMapStream.collect(Collectors.toMap(userVo -> userVo.getName(), userVo -> userVo));
}
```

collection framework로 변환 시, Stream.collect를 사용하고, 인자값(함수 같은 메소드)으로 toMap을 넘겨주면 된다.

여기서 주의점으로 map은 (key, value)로 존재하므로 key값을 구하기 위한 Function interface, value값을 구하기 위한

Function interface를 구현해서 넘겨줘야 한다. 소스를 보면 key 값으로 user name, 값으로 vo객체 그대로 넘겨주는 것을

확인 할 수 있다.

```java
public void streamCollect(){
  List<UserVo> userList = getMockUserList();

  Stream<UserVo> toListStream = userList.stream();

  List<UserVo> resultList = toListStream.collect(Collectors.toList());
}
```

list로 변환은 간단하다. 다른 쪽도 마찬가지지만 현재 스트림을 통해 타입 유추가 가능하므로, 그냥 리스트로 받겠다는 명령만 하면 된다.

### 2.3 map

각 스트림마다 동일한 작업을 수행한다.

```java
public void streamMap(){
  Stream<String> strArrStream = Stream.of(
    "1_1", "1_2", "1_3", "1_4", "1_5", "1_6"
    , "2_1", "2_2", "2_3", "2_4", "2_5", "2_6"
    , "3_1", "3_2", "3_3", "3_4", "3_5", "3_6"
  );

  strArrStream
    .map((s)->"prefix_"+s))
    .forEach(System.out::println);
}
```

### 2.4 flatMap

스트림의 타입이 배열 등인 경우, 핸들링 하기가 불편한 경우가 있을 수 있다. 예를 들어 Stream<String[]> 같이 배열로

스트림이 구성 된 경우 각 배열을 꺼내 모든 아이템을 문자열로 직렬화 하여 핸들링하는 경우가 더 편하게 느껴질 수도 있다.

(개인 차에 따라 무조건 편하지 않을 수도 있다.) 그런 경우 flatMap을 사용하여 말그대로 스트림의 배열을 평평하게? 만들어 줄 수도 있다.

```java
public void flatStream(){
  Stream<String[]> strArrStream = Stream.of(
    new String[]{"1_1", "1_2", "1_3", "1_4", "1_5", "1_6"}
      , new String[]{"2_1", "2_2", "2_3", "2_4", "2_5", "2_6"}
      , new String[]{"3_1", "3_2", "3_3", "3_4", "3_5", "3_6"}
  );

  strArrStream
    .flatMap(Arrays::stream)
    .forEach(System.out::println);
}
```

flatMap을 사용하여 스트림 내 배열(또는 객체)로 구성된 된 아이템을 단일 원소로 구성 할 수가 있다.

### 2.5 reduce

처음 부터 마지막 원소까지 하나씩 처리하면서 하나의 원소로 줄여가는 작업을 수행한다.

```java
public void streamReduce(){
  Integer[] numberArr = new Integer[]{1, 2, 3, 4, 5, 6, 7, 8, 10};

  Stream<Integer> numberStream1 = Arrays.stream(new Integer[]{1, 2, 3, 4, 5, 6, 7, 8, 10});

  Integer intReuslt = numberStream1.reduce(0, (integer1, integer2) -> integer1 + integer2);

  System.out.println("integer Sum : "+intReuslt);
}
```

위 소스에서 reduce 메소드에 넘겨주는 첫번째 인자값은 저장될 변수(Stream의 제너릭 타입을 따라간다)와

두번째 인자로 함수를 받아 어떻게 줄여갈지를 결정한다. 위 소스는 각 원소를 순회하면서 모든 값을 더해가는 형태이다.

참고로
첫번째 사이클 : 0+1
두번째 사이클 : 1+2
세번째 사이클 : 3+3
....

### 2.6 Collector 구현

스트림의 최종 연산 메소드 중 하나인 Stream.collect()를 사용하여 map, list, set 등의 형태로 수집하여

반환하고 싶을 경우도 있겠지만, 경우에 따라서 내가 원하는 형태의 결과로 수집되어 받고 싶은 경우도 있을 것이다.

이런 경우에 Stream.collect() 메소드의 인자값으로 Collector를 구현한 인스턴스를 넘겨주면 된다. 이것만 구현하면

내부적으로 병렬 처리 시 생각해야 할 부분을 내부적으로 해결이 되므로 꽤나 편하다고 생각된다.

소스가 길어지므로 collectorImpl 메소드와 CollectorImpl 클래스를 참고!

참고로 CollectorImpl 클래스는 메소드(정확히 함수형 인터페이스) 표현 방법은 여러가지로 써놓았다. 모르거나

어디서 무조건 배껴온거 아니다.

위에서 말한 두 부분을 보기만하면 얼추 이해는 갈것이라고 생각되고, 추가로 내부적으로는 reduce를 사용한다는 점도

같이 기억하면 될것이다.

# 3. Optional<T> OptionalInt

java 1.8에 추가된 Optional은 제너릭 타입을 한번 wrap한 레퍼 클래스라고 생각하면 된다. 장점으로는 데이터를

핸들링하다 null값 처리를 유연하게 해주는 유틸성 클래스 정도라고 생각하면 된다.

참고로 Stream과는 큰 연관성은 없지만 Stream 사용시 유용하게 사용하므로 Optional을 껴놓았다.

```java
public final class Optional<T> {

    ...

    private final T value;

    private Optional(T value) {
        this.value = Objects.requireNonNull(value);
    }

    public static <T> Optional<T> of(T value) {
        return new Optional<>(value);
    }
    ...
}
```

위 소스는 `Optional` Class의 일부분으로 정말 제너릭 타입(T)을 랩핑한 클래스이다.

```java
  private void handleOptional1(){
        Optional<Integer> wrapIntVal = Optional.of(new Integer(5));
        Integer intVal = wrapIntVal.get();      //intVal == 5
    }
```

보는 바와 같이 사용법은 간단하고 `Optional` 클래스를 살펴보면 다른 유틸성 메소드가 많긴 많이 있다...

아무튼 스트림과 연계하여 사용하면 편리한점이 많이 있다.

```java
  private void safeValWithOptional(){

      Map<String, Integer> mockupMap = new HashMap<>();

      final String findKey = "data10"; //찾으려는 키값

      //mock data
      mockupMap.put("data1", 1);
      mockupMap.put("data2", 2);
      mockupMap.put("data3", 3);

      Integer findVal = mockupMap.entrySet().stream()
              .filter(entry -> findKey.equals(entry.getKey()))
              .map(entry -> entry.getValue())
              .findAny()              //Optional 객체가 반환된다.
              .orElse(-1);

      System.out.println("검색된 값 : "+findVal.toString());
  }
```

데이터 스트림 값중 아무 값이나 한가지를 반환(`findAny`)하고, 만약 조건에 맞는 값이 없을 시, -1을

반환하도록 짜여져 있다.

OptionalInt 같은 얘들은 IntStream 처럼 불필요한 형변환으로 인한 성능저하를 막기 위하여 사용된다.

# 4. 주의점

### 4.1 데이터 원본을 변경하지 않음

```java
public void streamOperator(){

    List<UserVo> mockUserList = getMockUserList();

    Stream<UserVo> userListStream = mockUserList.stream();


    userListStream
      .filter(userVo -> userVo.getAge()>20)
      //.peek(System.out::println)
      .filter(userVo -> userVo.getAuth().contains("master"))
      .forEach(userVo -> System.out.println(userVo.getName()));

    //스트림 연산을 하여도 원본은 변경되지 않는다.
    mockUserList.forEach((userVo)->{System.out.println(userVo.getName());});
}
```

위 소스를 보면 stream으로 변경하여 User List를 필터링 작업을 수행했다. 하지만 mockUserList의 내용을 보면

그대로 변함없이 출력 되는 것을 확인 할 수 있다.

### 4.2 일회용

```java
public void baseStream(){
    //create stream
    Stream<String> strToStream = Stream.of("one", "two", "three", "four");

    strToStream
      .filter(s->s.equals("one"))
      .forEach(System.out::println);


    //strToStream.forEach(System.out::println); ERROR!! 스트림은 소모성
}
```

스트림은 최종 연산을 수행하며 다시 재사용이 불가능하다.

재사용은 불가능하지만 그래도 요청할때마다 일관된 스트림을 얻기 위해 `Supplier` 함수형 인터페이스를 사용하기도 한다.

```java
public void baseStream(){
    //함수를 저장
    Supplier<Stream<String>> getListStream = () -> list.stream();

    getListStream.get()
        .forEach(System.out::println);

    getListStream.get()
        .forEach(System.out::println);
}
```

이런식으로 list의 stream을 얻는 함수(`Functional interface`)를 사용한다. 하지만 보는바와 같이 같은 스트림을

재사용하는게 아니라 각각 새로운 스트림을 얻는점은 변함이 없다.

### 4.3 내부 작업을 반복으로 처리

주의점이라기 보단 3.2에 있는 소스를 보면 forEach문을 사용하여 스트림에 반복된 작업 수행이 가능하다.

이는 for문을 사용하여 직접 데이터를 가져와서 작업하는 방법이 아니라, 더 간결하고 빠르게 작업이 가능하다.

### 4.4 병렬처리 thread safe

아무리 병렬 처리가 쉽다고 해도, 결국엔 병렬 처리이다. 순서가 보장 되지 않으므로 이에 따른 문제가 발생 할 수도 있다.

당장 2.2에 있는 소스만 봐도 순서가 보장 되지 않는 것을 확인 할 수가 있다.

병렬 처리 시 thread safe 관련 해서 항상 유의해야 한다(thread safe 관련 설명은 생략).

참고로 공부하면서 `ArrayList`가 경우에 따라서 thread-safe하지 않을 수도 있다는 점도 알게되었다.

참고. Array List(Collections)를 thread-safe하게 사용하기

https://beginnersbook.com/2013/12/how-to-synchronize-arraylist-in-java-with-example/

### 4.5 병렬처리 시 sort

```java
public void streamSort(){
    IntStream intsStream = new Random().ints(30, 0, 100);

    //intsStream.sorted().forEach(System.out::println);
    intsStream.parallel().filter(value -> value>30).sorted().forEach(System.out::println);
}
```

병렬처리의 문제점이다. 위 소스에서 filter 후 sort 시, sort는 모든 처리가 종료 된 후 마지막에 정렬이 되야 하지만

병렬처리라서 실행 순서를 보장 할 수가 없다. 따라서 위 소스는 filter는 정상적으로 작동 해도, sort는 정상 작동하지 않는다.

하지만 'forEach'메소드 대신 'forEachOrdered' 사용 시, 병렬 처리 여부에 상관없이 처리가 가능하지만

병렬처리로서의 이점(속도)은 줄어든다고 한다.

### 4.6 callback hell

스트림안에 스트림을 처리해야 하는 경우, 이럴때 생각나는건 javascript의 callback hell이 생각이 난다.

flatMap으로 해결 할 수 있으면 좋겠지만 상황이 그렇게 좋지 않을 때 개인적으로는 딱히 해결법이 떠오르지 않는다.

아쉬운데로 그냥 함수(`Functional interface`)를 넘겨줘, 그나마 가독성을 해결하려고 하고 있다.

```java
public void streamSort(){
    Map<String, List<String>> map = new HashMap<>();
    String[] strArr = {"key1","key2","key3","key4","key5","key6","key7"};

    //더미 데이터 입력
    Stream.of(strArr).forEach(key -> map.put(key, Arrays.asList(strArr)));

    List<Set<String>> itemSetList = map.keySet()
        .stream()
        .map(key -> map.get(key))
        .map(itemList ->
                itemList
                    .stream()
                    .map(item -> "update" + item)
                    .collect(Collectors.toSet()))
        .collect(Collectors.toList());
}
```

위 소스에서 2번째 `map`에서 다시한번 스트림을 불러와 처리를 하고 있다. 이런식으로 내부적으로 연속해서 stream을

처리하다 보면 가독성이 그리 좋을꺼 같지 않다고 생각하고 있다. 그래서 2번째 `map`에 인자값으로 함수를 반환하는

메소드로 대체하여 사용하였다.

```java
public void streamSort(){
    Map<String, List<String>> map = new HashMap<>();
    String[] strArr = {"key1","key2","key3","key4","key5","key6","key7"};

    //더미 데이터 입력
    Stream.of(strArr).forEach(key -> map.put(key, Arrays.asList(strArr)));

    List<Set<String>> itemSetList = map.keySet()
        .stream()
        .map(key -> map.get(key))
        .map(itemList -> handleItemList(itemList).get())
        .collect(Collectors.toList());
}

private Supplier<Set<String>> handleItemList(List<String> itemList){
    return () -> itemList
        .stream()
        .map(item -> "update" + item)
        .collect(Collectors.toSet());
}
```

이런식으로 하면 그나마 가독성이 좋아졌다고 생각하고 있다.

함수형 언어나 javascript에서 많이 들어본 thunk, currying이 생각나게 하고 있다.

### 4.6 auto close

아무래도 Stream을 사용하다보면 자원을 사용 후, 닫는것에 대해 예민하게 생각할 것이다.

일반적으로 사용하는 `Stream`은 대부분 `AutoCloseable`를 구현하여 알아서 자원을 닫아준다.

하지만 `Files.lines()` 등의 io channel을 사용하는 메소드는 주의해야 한다. 그냥 `try-with-resource` 구문을 사용

시 편하게 할 수가 있다.(소스는 흔하니까 생략!)

참고로 `Stream`의 하위`flatMap`, `concat`등의 메소드도 알아서 잘 닫아준다(새로운 스트림을 만들고, 이전 스트림은 close).

- https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html#flatMap-java.util.function.Function-

flatMap

    Each mapped stream is closed after its contents have been placed into this stream.

concat

    When the resulting stream is closed, the close handlers for both input streams are invoked.

### 4.7 병렬 처리 시, 내부적으로 Fork Join Framework를 사용한다.

주의사항이라기 보단 참고사항인데, 병렬처리 시 기본적으로 내부에서 Fork Join Framework를 사용해서 처리한다.

스레드 개수 또한 알아서 정해져 있고(기본 코어 개수) 변경은 가능하지만 추천하지는 않는다. 아무튼 이러한 방법으로

내가(개발자가) 아닌 시스템이 알아서 처리하는 고수준 코딩이 가능하다.

### 4.8 Checked Exception 처리 불가

스트림 처리중엔 `Checked Exception`은 밖으로 던질 수가 없다.

```java
    public static String encodeWithEx(String str) throws UnsupportedEncodingException {

        return URLEncoder.encode(str, "utf-8");
    }
```

위와 같은 메소드가 있을 때 스트림에서 Exception을 상위로 던지는걸 유도하고 싶을 수도 있지만 불가능하다.

```java
        strs.stream()
            .map(WithCheckedEx::encodeWithEx)   //ERROR!
            .collect(Collectors.toList());
```

내부적인 이유는 잘 모르겠지만 설계상 미스 or `Checked Exception`은 사실상 버려진 ? 그런 평가를 스택오버플로우에서 종종 봤다.

아무튼 `Checked Exception`은 한번 랩핑해서 `RunTime Exception`으로 던지도록 할수밖에 없다.

```java
    public static String encodeWithoutEx(String str){

        try {
            return URLEncoder.encode(str, "utf-8");
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    public static void main(String[] args) {

        List<String> strs = Arrays.asList("첫번째", "두번째", "세번째");

        strs.stream()
                .map(WithCheckedEx::encodeWithoutEx)
                .collect(Collectors.toList());
    }
```
