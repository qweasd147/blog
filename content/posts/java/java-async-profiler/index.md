---
title: "IntelliJ Async Profiler"
date: "2025-12-30T14:57:49.541Z"
template: "post"
draft: false
category: "java"
tags:
  - "java"
  - "profiler"
description: "IntelliJ에서 Async Profiler(IntelliJ Profiler)를 통한 성능 측정"
---

# Async Profiler

서비스를 운영하다 보면 병목이나 특정 메소드에서 서버 리소스를 많이 사용하는 부분이 생길 수도 있다. 이러한 지점을 찾기 위한 도구로, 어느 구간에서 cpu를 많이 사용하는지, 어느 구간에서 메모리(`heap`, `native memory`)를 많이 쓰는지를 시각화 하여 보여준다.
[해당 서비스](https://github.com/async-profiler/async-profiler)에선 아래와 같은 항목들 추적이 가능하다.

> What can be profiled:
>
> - CPU time
> - Allocations in Java Heap
> - Native memory allocations and leaks
> - Contended locks
> - Hardware and software performance counters like cache misses, page faults, context switches

이러한 항목들을 샘플링 방식으로 스레드 단위로 수집하여 어떠한 스레드가 리소스를 많이 사용한건지 확인 가능하며, 오버헤드도 상당히 낮은 수준으로 수집하여 필요하면 운영환경에서도 사용하도록 제공해주고 있다.

# IntelliJ Profiler

`IntelliJ`에서 `Async Profiler` 비스무리하게 만들어 제공해주는 기능으로 앞서 소개한 항목에 추가로 `total time`도 함께 제공해주고 있어, 병목지점까지 한눈에 볼 수 있게 제공해주고 있다.

## 1. CPU 사용량을 통한 병목지점 확인

예를들어 아래와 같은 예시가 있다.

```kotlin
// CpuTest.kt
fun main() {
    val first = IntArray(100_000) { Random.nextInt() }.toList()
    val seconds = IntArray(50_000) { Random.nextInt() }.toList()

    countSameNumberUsingList(first, seconds)
}

fun countSameNumberUsingList(first: List<Int>, seconds: List<Int>) {
    val elapsed = measureTimeMillis {
        var count = 0
        for (x in first) {
            if (x in seconds) {
                count++
            }
        }
        println("공통 숫자 개수=$count")
    }

    println("List 걸린시간(ms)=$elapsed")
}
```

두 리스트 `first`, `seconds`에서 랜덤하게 숫자를 채우고, 같은 숫자 개수를 구하는 내용이다.
![intellij-profile1](/media/intellij-profiler1.png) 버튼을 누르면 해당 프로그램을 `IntelliJ Profiler`로 실행 된다.

> 주황색 아이콘은 VisualVM 버튼으로 IntelliJ와 연동해서 사용하고 있는데, AsyncProfiler와 무관하니 무시

```
Profiling started
공통 숫자 개수=2
List 걸린시간(ms)=2443
```

프로그램이 종료 되고, `Show Results` 버튼을 누르면 아래와 같은 화면이 출력된다.
![intellij-profile2](/media/intellij-profiler2.png)

### 왼쪽 상단 메뉴

1. Flame Graph

왼쪽엔 실행 된 스레드명을 나열하고 오른쪽엔 호출된 call stack별로 메소드들을 확인 할 수 있다. x축이 넓을수록 리소스를 많이 사용한 부분이고, y축은 call stack기준으로 메소드들을 보여준다. 갈색은 java 코딩한 메소드, 회색은 라이브러리를 보여준다.

이미지를 기준으로 보자면 `DestroyJavaVM`이란 스레드가 대부분의 cpu를 사용했고, `countSameNumberUsingList` -> `measureTimeMillis` -> `ArrayList.contains` 메소드가 대부분의 cpu를 사용했다는 점을 확인 할 수 있다.
![intellij-profile3](/media/intellij-profiler3.png) 그래프 우클릭을 통해 해당 코드로 이동하거나 선택한 메소드를 기준으로 하위 메소드들만 `Call tree`, `Method List`을 볼 수가 있다.

2. Call Tree

![intellij-profile4](/media/intellij-profiler4.png)
말 그대로 메소드에서 호출한 구조를 계층형으로 보여준다. 퍼센트 단위로 어느 구간에서 cpu를 많이 썻는지 직관적으로 확인이 가능하며 `Flame Graph`에서 원하는 메소드를 우클릭 -> `Focus on method in Call Tree`를 개인적으로 가장 많이 사용하고 있다.

> 선택한 메소드를 기준으로 Call Tree를 보여준다

그 외 항목들은 다 직관적이고 위 두 기능만 알면 얼추 감이 잡혀 써보면 바로 이해할 것이다.

결과적으로 위 코드에선 List를 이중으로 순회하면서 값을 찾는 부분(`ArrayList.contains`)에서 가장 많은 리소스를 사용하고 있다. 이를 아래와 같이 `HashSet`을 사용하여 해시키 기반으로 찾도록 개선이 가능하다.

> 해시키 기반으로 찾으므로 훨씬 더 효율적으로 검색이 가능하다.

```kotlin
fun countSameNumberUsingSet(first: List<Int>, seconds: List<Int>) {
    val secondsSet = seconds.toHashSet()

    val elapsed = measureTimeMillis {
        var count = 0
        for (x in first) {
            if (x in secondsSet) {
                count++
            }
        }
        println("공통 숫자 개수=$count")
    }

    println("Set 걸린시간(ms)=$elapsed")
}
```

두 메소드들을 아래와 같이 병렬로 실행하고 결과를 보면

```kotlin
fun main() {
    val threadPool = Executors.newFixedThreadPool(10)

    val first = IntArray(100_000) { Random.nextInt() }.toList()
    val seconds = IntArray(50_000) { Random.nextInt() }.toList()

    threadPool.submit {
        countSameNumberUsingList(first, seconds)
    }

    threadPool.submit {
        countSameNumberUsingSet(first, seconds)
    }

    threadPool.shutdown()
    threadPool.awaitTermination(30L, TimeUnit.SECONDS)
}
// Profiling started
// 공통 숫자 개수=2
// Set 걸린시간(ms)=7
// 공통 숫자 개수=2
// List 걸린시간(ms)=2458
```

![intellij-profile5](/media/intellij-profiler5.png)

오른쪽에 `pool-1-thread-1`, `pool-1-thread-2` 두 스레드 단위로 얼마나 리소스를 사용했는지 or 원하는 스레드만 선택하여 확인도 가능하다.

> 단순 두 방법이 얼마나 큰차이가 생기는지만 보여주고 각 방법 별로 왜 개선 된 건지는 그냥 자료구조이므로 자세한 설명은 생략한다.

## 2. Total time 통한 병목지점 확인

또 다른 예시로 아래와 같은 전체코드가 있다.

```kotlin
fun main() {
    val increaseBySynchronized = IncreaseBySynchronized()
    val increaseByLongAdder = IncreaseByLongAdder()

    incrementCheck(increaseBySynchronized)
    incrementCheck(increaseByLongAdder)
}

fun incrementCheck(increaseTest: IncreaseTest) {
    val threads = 10
    val pool = Executors.newFixedThreadPool(threads)
    val latch = CountDownLatch(threads)
    val elapsed = measureTimeMillis {
        repeat(threads) {
            pool.submit {
                repeat(2_000_000) {
                    increaseTest.increase()
                }
                latch.countDown()
            }
        }
        latch.await()
    }

    pool.shutdown()
    println("counter=${increaseTest.get()}, elapsed(ms)=$elapsed, className=${increaseTest.javaClass.simpleName}")
}

interface IncreaseTest {
    fun increase()
    fun get(): Long
}

class IncreaseBySynchronized : IncreaseTest {
    private var counter = 0L
    private var lock: Any = Any()

    override fun increase() {
        synchronized(lock) {
            counter++
        }
    }

    override fun get(): Long = counter
}

class IncreaseByLongAdder : IncreaseTest {
    private val counter = LongAdder()

    override fun increase() {
        counter.increment()
    }

    override fun get(): Long = counter.sum()
}
// counter=20000000, elapsed(ms)=819, className=IncreaseBySynchronized
// counter=20000000, elapsed(ms)=54, className=IncreaseByLongAdder
```

10개의 스레드가 동시에 공통변수의 숫자를 하나씩 2,000,000번 증가시키는 코드인데 thread safe를 보장하기 위해 첫번째 방법은 `synchronized`을 사용하고 두번째 방법은 `LongAdder`를 사용해서 thread safe를 보장하였다. 앞서 사용한 방식과 동일하게 `IntelliJ Profiler`를 돌리면 `Intellij` 코드에 아래와 같이 메소드별 걸린 시간도 표기해준다.

![intellij-profile9](/media/intellij-profiler9.png)

이 상태에서 화면 아래 우측에 `Show`를 Total Time으로 바꾸면 아래와 같이 출력 된다.

### 2.1 total time - Flame Graph

![intellij-profile6](/media/intellij-profiler6.png)
메소드별 걸린 시간을 그래프로 표현

### 2.2 total time - Call Tree

![intellij-profile7](/media/intellij-profiler7.png)
메소드별 걸린 시간을 계층 구조로 표현

### 2.3 total time - Method List

![intellij-profile8](/media/intellij-profiler8.png)
메소드별 걸린 시간을 표현(한번 메소드 이름으로 정렬하였다)

이런식으로 두가지 방법(`synchronized`, `LongAdder`)을 그래프, call tree, 메소드별 걸린 시간을 구간구간 확인하여 개선 포인트를 찾는게 훨씬 쉬워진다.

---

`IntelliJ Profiler`를 사용해서 대표적으로 `cpu 사용시간`/`total time`을 프로파일링하여 하나씩 확인하였다.

하지만 실제 운영 환경에서 고려해야 할 점은 사실 서버는 cpu를 많이 안쓴다는 점이다. 설명한 예시 두개 다 외부 연동없이 java 코드만 돌리는 것이라 `total time`이 `cpu time`과 크게 연관 있지만 서버에선 `DB`, 외부 api, `redis` 등등 요청하고 대기하는 로직이 많아 실제 cpu는 얼마 안쓰는데 걸린시간은 길 수도 있고, 아님 `GC` 오버헤드로 인해 엉뚱한 곳에서 `total time`이 크게 늘어 날 수도 있다.

> 서버에서 cpu를 과도하게 많이 사용된다면 먼저 파일처리, GC 퍼포먼스를 의심해보자

마지막으로 `Spring`을 쓰면 상상 이상으로 `call stack`이 길어 질 수 있는데 어차피 다 자바 코드이고 하나씩 천천히 따라가면 다 똑같으니 괜히 겁먹을 필요는 없다.
