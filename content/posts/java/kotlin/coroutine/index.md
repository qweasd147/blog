---
title: "Coroutine 기초 설명"
date: "2024-03-30T18:16:07.113Z"
template: "post"
draft: false
category: "etc"
tags:
  - "kotlin"
  - "coroutine"
description: "Coroutine 사용이유 및 장점, 기초 설명"
---

해당 내용은 `인프런`에서 `2시간으로 끝내는 코루틴`강의를 참고하여 작성하였습니다.

# Coroutine

단어 뜻 먼저 설명하자면 `co-routine`은 co는 '협력'이라는 뜻으로, **협력하는 루틴**이라는 의미를 가진다. 여기서 루틴은 그냥 단어 그대로 '특정 작업을 실행하기 위한 일련의 명령' 그 자체로 이해하면 된다.
즉, `coroutine`은 routine 간의 협력 하며 이루어지는 코드, 처리 방식이라고 이해하면 된다.

## 1. 사용 하는 이유

```kotlin
fun main() = runBlocking {
    println("start")
    launch {
        newRoutine()
    }
    println("end")
}

suspend fun newRoutine() {
    println("newRoutine")
}
// 출력 순서
// start
// end
// newRoutine
```

`launch`함수는 일단 넘어가더라도 `start, newRoutine, end`순서로 출력 되어야 할 것 같지만, 실제로는 그렇지 않다.

비동기 프로그래밍이 익숙하거나 javascript의 `event loop`를 아는 사람이라면 어느 정도 이해가 갈 수 있는데, 이는 `newRoutine` 함수를 비동기 방식으로 나중에 호출 되도록 유도하여 이와 같은 순서로 출력되게 한다.

`launch` 함수가 단순 `lazy` 함수라고 의심 될 수도 있지만 만약 그렇게 생각 된다면 아래 코드를 보면 또 다르게 생각 될 것이다.

```kotlin
fun main() = runBlocking {
    println("start")
    launch {
        newRoutine()
    }
    yield()
    println("end")
}

suspend fun newRoutine() {
    println("newRoutine")
}
// 출력 순서
// start
// newRoutine
// end
```

이해 해야할 처리 과정을 순서대로 나열하면 아래와 같다.

1. runBlocking 함수를 통해 새로운 `coroutine scope` 함수를 만든다.
2. `launch`함수를 통해 자식 `coroutine scope`함수를 만들고, 그 안에서 suspend 함수를 호출한다.
3. `yield`함수를 호출 하여, 다른 `suspend` 함수가 처리 되도록 양보한다.

중간에 `yield` 함수를 호출하여 다른 `coroutine scope` 함수(`newRoutine`)가 먼저 처리 되도록 **양보** 하였다.
즉, 특정 루틴(`newRoutine`)을 비동기 처리를 유도 할 수 있고, 처리 중간에 다른곳으로 리소스 할당을 양보(`yield`)하는 등 비동기 프로그래밍을 call-back 방식이 아닌 위와 같이 `top down` 방식으로 개발 할 수 있다는게 가장 큰 특징이다.

참고로 이는 `javascript`의 `generator`와 `event loop`를 아는 사람이라면 바로 이해가 갈 것이고, 처리방식도 위와 같은 코드라면 똑같다고 봐도 된다.

> event loop는 web api를 통해 멀티 스레드로 처리 되지만(일반적인 환경이라면 멀티 스레드) coroutine은 단순 싱글 스레드로도 처리 된다. 이런 특징은 밑에서 추가로 설명 예정.

> suspend 함수는 이름 그대로 **잠시 중단이 가능한 함수**를 말한다. 이는 resume/suspend 패턴이 가능하다는 말인데, 함수가 처리 되다가 중간에 멈추고 다른 suspend 함수를 처리하고, 또 조건에 따라 다시 재개하여 처리가 가능한 함수를 말한다. 이런 suspend 함수는 `coroutien scope`안에서만 호출이 가능하고 이에 종속된다고 이해하면 된다.

> corutine scope는 너무 어렵게 이해하지 말고 말그대로 코루틴 영역, 코루틴을 사용 가능하게 해주는 영역이라고만 이해하자.

## 2. 스레드와 Coroutine

### 2.1 Coroutine은 특정 스레드에 종속 되지 않는다.

coroutine은 실행 될때나 잠시 멈추고 다시 재기 될 때, 특정 스레드에 종속되지 않는다. 즉 1번 스레드에서 실행되고 멈추었다 다시 실행 될때, 2번 스레드에서 실행 될 수도 있다는 말이다.

```kotlin
// jvm옵션에 '-Dkotlinx.coroutines.debug'를 추가하여 코루틴 scope를 디버깅할 수 있다.
fun main() {
    val executorService = Executors.newFixedThreadPool(10)
    runBlocking(executorService.asCoroutineDispatcher()) {
        (1..5).forEach {
            println("[${Thread.currentThread().name}] before - $it")
            delay(50)
            println("[${Thread.currentThread().name}] after - $it")
        }
    }

    executorService.shutdown()
    executorService.awaitTermination(5, TimeUnit.SECONDS)
}
// 실행 결과.
// [pool-1-thread-1 @coroutine#1] before - 1
// [pool-1-thread-2 @coroutine#1] after - 1
// [pool-1-thread-2 @coroutine#1] before - 2
// [pool-1-thread-3 @coroutine#1] after - 2
// [pool-1-thread-3 @coroutine#1] before - 3
// [pool-1-thread-4 @coroutine#1] after - 3
// [pool-1-thread-4 @coroutine#1] before - 4
// [pool-1-thread-5 @coroutine#1] after - 4
// [pool-1-thread-5 @coroutine#1] before - 5
// [pool-1-thread-6 @coroutine#1] after - 5
```

위의 실행 된 coroutine은 `@coroutine#1`로 전부 동일하지만, thread는 여러 스레드 다 골고루 실행 되며, 특히 resume/suspend 전후로도 다른 스레드가 할당 될 수도 있다는걸 볼 수있다.

### 2.2 동시성과 병렬성

#### 2.2.1 병렬성

```kotlin
fun main() {
    val executorService = Executors.newFixedThreadPool(10)
    val seconds = measureTimeMillis {
        runBlocking {
            (1..5).forEach {
                launch(executorService.asCoroutineDispatcher()) {
                    println("[${Thread.currentThread().name}] - first - $it")
                    delay(500)
                }

                launch(executorService.asCoroutineDispatcher()) {
                    println("[${Thread.currentThread().name}] - second - $it")
                    delay(500)
                }
            }
        }
    }.toDuration(DurationUnit.MILLISECONDS).toDouble(DurationUnit.SECONDS)

    println("전체 걸린 시간 ${seconds}초")
    executorService.shutdown()
    executorService.awaitTermination(5, TimeUnit.SECONDS)
}
// [pool-1-thread-6 @coroutine#7] - second - 3
// [pool-1-thread-3 @coroutine#4] - first - 2
// [pool-1-thread-10 @coroutine#11] - second - 5
// [pool-1-thread-5 @coroutine#6] - first - 3
// [pool-1-thread-1 @coroutine#2] - first - 1
// [pool-1-thread-4 @coroutine#5] - second - 2
// [pool-1-thread-2 @coroutine#3] - second - 1
// [pool-1-thread-9 @coroutine#10] - first - 5
// [pool-1-thread-8 @coroutine#9] - second - 4
// [pool-1-thread-7 @coroutine#8] - first - 4
// 전체 걸린 시간 0.553초
```

코루틴 scope를 만들때 thread pool을 넘겨줘서 멀티스레드로 돌릴 수도 있다. 여러 스레드가 각각의 작업을 나누어 처리하는걸 확인 할 수가 있다.

물론 이런방식의 병렬성이야 구지 코루틴을 안쓰고도 얼마든지 쉽고 간단하게 구현 가능하다.

#### 2.2.2 동시성

코루틴의 핵심은 동시성에 있다고 생각한다. 위에서 멀티스레드가 아닌 단순 싱글 스레드로 넘겨줘도 실질적인 처리 시간은 차이가 없다는걸 확인 할 수가 있다.

```kotlin
fun main() {
    val executorService = Executors.newSingleThreadExecutor()
    val seconds = measureTimeMillis {
        runBlocking {
            (1..5).forEach {
                launch(executorService.asCoroutineDispatcher()) {
                    println("[${Thread.currentThread().name}] - first - $it")
                    delay(500)
                }

                launch(executorService.asCoroutineDispatcher()) {
                    println("[${Thread.currentThread().name}] - second - $it")
                    delay(500)
                }
            }
        }
    }.toDuration(DurationUnit.MILLISECONDS).toDouble(DurationUnit.SECONDS)

    println("전체 걸린 시간 ${seconds}초")
    executorService.shutdown()
    executorService.awaitTermination(5, TimeUnit.SECONDS)
}
// [pool-1-thread-1 @coroutine#2] - first - 1
// [pool-1-thread-1 @coroutine#3] - second - 1
// [pool-1-thread-1 @coroutine#4] - first - 2
// [pool-1-thread-1 @coroutine#5] - second - 2
// [pool-1-thread-1 @coroutine#6] - first - 3
// [pool-1-thread-1 @coroutine#7] - second - 3
// [pool-1-thread-1 @coroutine#8] - first - 4
// [pool-1-thread-1 @coroutine#9] - second - 4
// [pool-1-thread-1 @coroutine#10] - first - 5
// [pool-1-thread-1 @coroutine#11] - second - 5
// 전체 걸린 시간 0.548초
```

`newSingleThreadExecutor`함수를 써서, 싱글스레드로 환경을 제공 해도 실행 시간은 차이가 없다는걸 알 수 있다. 이는 delay 함수를 만나면 잠시 멈추고 다른 작업을 처리하고, delay시간이 끝나면 다시 돌아와 처리하는 방식이라 가능하다. 또한 추가로 설명하자면 delay 함수가 `non-blocking`을 지원하기 때문에 이게 가능하다.
(`delay` 함수는 `suspend` 함수이다)

> 스레드 풀을 넘겨주지 않으면 현재 스레드를 기본으로 사용되는데, 위의 코드에선 스레드풀(`newSingleThreadExecutor`)로 Dispatcher로 지정하였지만 그냥 명시하지 않아도 똑같은 결과가 나오게 된다.

만약 `delay` 함수가 아닌 `Thread.sleep`를 사용한다면 대략적으로 `5 * 0.5초 * 2` 라는 시간이 걸리게 된다.

> `Thread.sleep`은 `block` 방식으로 처리 되며, 당연히 `suspend` 함수가 아니다.
> `Dispatcher`는 어느 스레드 환경에서 실행 될 지, 결정 할 수 있는데 차후에 추가로 설명 예정.
