---
title: "JVM Heap 구조 및 GC"
date: "2022-02-03T09:47:11.834Z"
template: "post"
draft: false
category: "java"
tags:
  - "jvm"
  - "java"
  - "heap"
  - "GC"
description: "JVM에서 Heap & Metaspace, GC(Garbage Collector) 이해와 종류"
---

개발 하면서 메모리 구조를 알면 좋을 때가 종종 있다. 개인적으로 일하면서 서버가 터져 버렸을 때(...) 어디서 어떻게 터진지 알아야 빠르게 원인 및 대처가 가능한데 이러한 구조를 몰랐을 땐 `Heap`이 왜 터지는지, `Metaspace`는 또 뭔지 당황했었던 기억이 있다. 물론 알아도 당황스럽긴 하지만 빠른 원인 파악에 도움되고 추가로 이러한 것도 알야야 메모리 튜닝이 가능하니까 한번쯤 공부해보고 추가로 GC가 무엇인지, 자바 버전별 어떤 GC를 쓰고 있는지 아는게 꽤 도움이 되는거 같다(운영중인 서비스의 java 버전업 동기부여로 좋은거 같다)

# 1. JVM 메모리 구조

![img1](/blog/media/java/jvm_memory.png)

> 이미지 참조 https://deepu.tech/memory-management-in-jvm/

JVM 메모리 구조는 위의 이미지로 생각하면 된다.

## Heap Memory

객체 인스턴스 등이 생성되면 저장되는 공간이다. `java8` 이후 부턴 `static object`도 Heap에 저장되기 시작했다.

> 사실 난 개발을 java8부터 써서 직접 겪은적은 없는데 그 이하 버전에선 class의 static 변수값도 `method area(PermGen)`에 저장되어서 문제가 많았었다고 한다.

## Metaspace

`java8` 이후부터 생겨났고, 이름 그대로 class의 메타데이터 (메소드 정보 포함) 등이 저장되는 공간이다. heap과 별개로 `native memory`에서 관리되며, 별다른 설정값을 안넣으면 최대 메모리 용량 만큼이나 늘어날 수가 있다.

## Thread Stack

각 메소드 등을 실행&결과 값과 지역변수 등이 저장된다. 이 영역은 스레드 마다 하나씩 생성되는데, 위의 `Heap & Metaspace`의 정보를 가져와 사용하기도 한다.

중요한 특징들을 다시한번 나열하면

1. stack은 스레드 당 하나씩 할당(생성) 된다
2. 객체(reference 타입)은 heap에 저장되고 그 연결 정보(변수)를 stack에 저장한다.
3. 생성된 객체는 heap에 저장되고 여러 스레드에서 공유하는 형태로 관리된다.
4. primitive type(원시타입)은 그냥 값으로써 stack에 저장된다.

아래 링크는 코드에 따라 heap, stack에 순차적으로 쌓이는 구조를 확인 할 수 있다.

> https://speakerdeck.com/deepu105/jvm-memory-usage-stack-vs-heap

## Code cache

`JVM`이 네이티브 코드로 컴파일 된 바이트 코드를 저장하는 영역이다. `JIT` 컴파일러가 가장 많이 사용한다(자주 사용되는 컴파일 된 코드를 저장한다).

## Shared Library

어플리케이션에서 사용할 공유 라이브러리들(with jni)

# 2. Garbage Collector

먼저 `Garbage Collector`(줄여서 GC)란 메모리에서 더 이상 접근 할 일이 없는 객체(`unreachable`)를 찾은 후, 이전 객체를 없애버리는 작업을 말한다. 이 과정을 순서대로 나열하면 아래와 같다.

1. GC Roots에 의해 접근 할 수도 있는(`reachable`) 객체/접근 할 수 없는(`unreachable`) 객체를 구분한다.
2. 더 이상 접근 할 수 없는 객체를 수거한다(메모리 상에서 없애버린다)
3. GC에 따라 `Compaction` 과정. 메모리 파편화&관리 때문에 object 위치를 이동 시킨다(새로운 메모리 할당이 쉽고 빠르게 가능하다).

gc 알고리즘에 따라 차이는 있지만 기본적으로 이러한 방식으로 이루어 진다. 여기서 gc가 작동하면서 gc 과정 중 부분적(선택 된 알고리즘에 따라 다르다)으로 `Applicatin` 전체가 순간적으로 멈춰지게 되는데 이러한 현상을 `Stop the world`라고 말한다(줄여서 `stw`라고도 한다). 역시 gc 동작 방식(gc 알고리즘)에 따라 이런 `stw` 차이가 나고, 장단점이 있지만 대체로 java 버전업 하면서 더욱 성능 좋은 gc가 붙지만, 이거 또한 필수는 아니며 이런 `stw` 시간을 최소화하고 gc로 인한 오버헤드를 줄이는걸 `GC 튜닝`이라고 한다(=java 개발자의 관리 포인트이다...)

## Minor GC & Major GC

위에서 설명한 GC 과정은 정말 간단하게 설명한거고 실질적으로 튜닝을 위해서라면 더욱 많은 지식이 필요하다. 그 중 `GC`도 종류가 있는데(알고리즘 or 방법이 아니라 분류 정도라고 이해 해야한다) `Young generation`에서 발생하는 GC를 `Minor GC`, `Old generation`에서 발생하는 GC는 `Major GC`라고 한다. 둘다 돌리는건 `Full GC`라고 한다.

참고로 객체가 생성되면 `Young generation`에 배치되고 gc 이후로도 계속해서 살아남는 objects들은 `Old generation`으로 이동하게 된다.

### Minor GC

위에서 `Young generation`을 대상으로 하는 gc라고 하였다 이런 식으로 구분하는 이유는 새롭게 생긴 객체는 빠르게 `unreachable`하게 바뀔 확률이 높다. 이런 `unreachable`한 객체들이 많아서 매우 빠르게 수집이 가능하다고 한다

> A young generation full of dead objects is collected very quickly (https://www.oracle.com/webfolder/technetwork/tutorials/obe/java/gc01/index.html)

참고 사항으로 객체가 새롭게 생성되면 `Eden`에 배치되고, `Eden`이 꽉차면 `Minor GC`가 발생하면서 `Eden`에 있는 객체는 `S0`으로 이동하고(죽은 객체 빼고) `Eden`은 clear 된다(메모리 파편화에도 용이하다) 이런식으로 `Eden` -> `S0` <-> `S1` (`Survivor`은 서로 왔다갔다 하기도 한다.) 옮겨지면서 이전 공간은 clear되고, 옮겨지는 객체는 age값이 증가하고 이 값이 계속 올라가다 일정 수준으로 올라가면 `Old generation`으로 옮겨지게 된다.

### Major GC

`Major GC`관련해선 필요한 내용은 다 설명 했고, 과정도 딱히 뭐 특별한건 없다. 발동 조건은 `Old generation` 영역이 지정된 메모리 이상 차이하거나 꽉차면 실행된다.

참고로 `Major or Full GC`는 수행 시간이 길고, 그에따라 `stw`도 길어져서 어플리케이션에 영향을 줄 수도 있는데 `GC` 빈도수를 줄이려면 `Old generation` 크기를 늘리고, `GC` 수행 시간을 줄이려면 `Old generation` 크기를 줄여야 한다. 적당히 타협점을 찾던가 아님 서버 `scale down`을 고려해야 한다(그냥 gc가 발생해도 물리적으로 서버 부담을 줄이자는거).

# 3. GC 알고리즘 종류

### Serial GC

`Mark Sweep Compact` 알고리즘을 쓰고 `Minor GC`, `Major GC` 순으로(연속적으로) 실행된다. 이름부터가 serial이다.

그냥 쓸일이 없는 GC. 싱글코어에선 써도 괜찮다고 한다. java 5,6 기본 GC

### Parallel (Old)GC

`parallel GC`랑 `parallel Old GC`는 다르지만 그냥 묶어서 설명. `Yong/Old generation`을 병렬로 처리한다. 만약 싱글코어 환경이라면 의미가 없어지고, 기본 GC의 스레드 개수는 cpu 개수만큼 지정 된다(설정값으로 변경 할 수가 있다.)

java 7,8 기본 GC

### Concurrent Mark-Sweep Collector (CMS GC)

`stw` 시간이 위에서 설명한 gc보다 짧다. 특이한 점은 `Compaction` 과정((메모리가 중간중간 빈 공간을 없애기 위해 object를 옮기는 작업))이 없다는건데 다른 GC에선 이 작업에 많은 시간이 소모 되는데 `CMS GC`에선 `Compaction` 작업이 없어 GC 과정이 빠른것도 있다. 하지만 메모리 파편화가 심해지면 `Full GC`가 발생 할수도 있다. `Parallel GC` 대비 메모리&CPU 리소스도 더 많이 사용된다.

### Garbage First GC (G1 GC)

Heap 영역을 여러개의 region으로 나누고 각 region을 `yong(eden, survivor)`, `old`를 동적으로 부여하여 사용하는 방식이다. GC 시간이 짧다는 장점이 있다.
![img2](/blog/media/java/g1_gc.png)

GC과정은 먼저 살아있는 객체를 마킹하고 죽은 객체가 많은 영역부터 먼저 수집을 시작한다. 이런 우선순위로 계산되서 `Garbage First` 라고 한다.

> After the mark phase completes, G1 knows which regions are mostly empty. It collects in these regions first, which usually yields a large amount of free space. This is why this method of garbage collection is called Garbage-First (https://www.oracle.com/technetwork/tutorials/tutorials-1876574.html)

java 9부터 기본 GC

### ZGC

Heap 용량에 상관없이 GC 수행 시간이 10ms 이하로 처리된다. 모든 객체의 포인터에 64bit를 사용하는데 이 중 4bit를 mark(`Colored pointers`)를 위해 사용되며 재배치 여부, 참조 여부를 알 수 있다. 그렇기 때문에 64bit 운영체제에서만 사용 가능하고 재배치 과정에서 `stw`가 발생하지 않는게 큰 장점이다.

java 15부터 정식으로 사용할 수 있지만(이전버전들은 실험적 ZGC이다) default GC는 바뀌지 않았다(G1 그대로)
