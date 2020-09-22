---
title: 'Thread'
date: '2016-02-05T22:40:32.169Z'
template: 'post'
draft: false
category: 'java'
tags:
  - 'thread'
  - 'java'
description: 'Thread'
---

# Thread

# 1. 정의

하나의 어플리케이션 안에서 여러가지 작업을 동시에 하는것을 의미. 각각의 작업을

thread라고 불린다. 컴퓨터에서 프로세스(process)와 thread라는 2가지의 실행 단위가 있는데,

차이점은 프로세스는 자신 만의 데이터를 가지지만 스레드들은 동일한 데이터를 공유한다.

### 1.1 스레드 상태, 라이프 사이클

| 상태                          | 설명                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| NEW                           | 스레드가 생성되고 아직 start()가 호출되지 않은 상태                                                                                        |
| RUNNABLE                      | 실행 중 또는 실행 가능한 상태                                                                                                              |
| BLOCKED                       | 동기화 블럭에 의해서 일시정지된 생태(lock이 풀릴 때까지 기다리는 상태)                                                                     |
| WAITING, <br /> TIMED_WAITING | 스레드의 작업이 종료되지는 않았지만 실행가능하지 않은(unrunnable) 일시정지 상태. <br /> TIMED_WAITING은 일시정지 시간이 지정된 경우를 의미 |
| TERMINATED                    | 스레드의 작업이 종료된 상태                                                                                                                |

# 2. 장점

# 3. 주요 사용법

### 3.1 Thread 하위 메소드

| Method                               | 설명                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Thread                               | 매개변수가 없는 기본 생성자                                             |
| Thread(String name)                  | 이름이 name인 thread 객체 생성                                          |
| Thread(Runnable target, String name) | Runnable을 구현하는 객체로 부터 스레드를 생성                           |
| static int activeCount()             | 현재 활동 중인 스레드의 개수를 반환                                     |
| String getName()                     | 스레드의 이름을 반환                                                    |
| int getPriority()                    | 스레드의 우선순위를 반환                                                |
| void interrupt()                     | 현재의 스레드를 중단                                                    |
| boolean isInterrupted()              | 현재의 스레드가 중단될 수 있는지를 검사                                 |
| void setPriority(int priority)       | 스레드의 우선순위를 지정                                                |
| void setName(String name)            | 스레드의 이름을 지정한다.                                               |
| static void sleep(int milliseconds)  | 현재 스레드를 지정된 시간만큼 재운다.                                   |
| void run()                           | 스레드가 시작될 때 이 메소드가 호출. 스레드가 해야하는 작업을 구현한다. |
| void start()                         | 스레드를 시작한다.                                                      |
| static void yield()                  | 현재 스레드를 다른 스레드에 양보하게 만든다.                            |
| void join()                          | 해당 스레드가 소멸될때까지 기다리게 한다.                               |

### 3.2 우선순위

어떠한 스레드에 더 많은 양의 실행시간이 주어져, 결과적으로 더 빨리 완료 될지 설정하는 값.

최소 우선순위(1) 부터 보통 우선순위(5), 최대 우선순위(10)까지 설정 가능하고, 메인스레드는 5이다.

또한 메인스레드 내에서 생성하는 스레드의 우선순위는 별다른 입력이 없을 시, 우선순위를 상속 받아,

자동으로 5가 된다. 또한 우선순위 변경은 스레드를 실행 하기 전에만 우선순위 변경이 가능.

    멀티코어라고 해도 프로세서 환경에서 작업 시, 실행시간과 실행 기회를 더 많이 갖게 될 것이라고 기대할 수는 없다.
    이는 os 레벨에서 다른 방식으로 스케쥴링 하기 때문에 어떠한 os에 따라 다른 결과를 얻을 수 있다.
    따라서 os 별 스케쥴링 정책과 jvm 구현을 확인해야 한다. 따라서 환경에 상관없이 처리를 하고 싶으면
    PriorityQueue 등에 우선순위를 저장해 놓고 작업을 처리하는게 나을 수 있다.

### 3.3 데몬 스레드

    다른 일반 스레드의 작업을 돕는 보조적인 역할을 수행하는 스레드.
    일반 스레드가 모두 종료되면 데몬 스레드는 강제적으로 자동 종료됨.
    이유는 보조적인 스레드라 종속된 일반 스레드가 종료되면 의미가 없어지게 된다. 이러한
    점만 빼면 일반 스레드와 다른점이 없음. 또한 setDaemon 메소드는 start 이전에 설정해야함

### 3.4 join(다른 쓰레드의 작업을 기다린다)

    쓰레드 자신이 하던 작업을 잠시 멈추고 다른 쓰레드가 지정된 시간동안 작업을 수행하도록
    할때 join()을 사용한다. 현재 쓰레드가 아닌 특정 쓰레드에 대해 동작하는점이 sleep()과 다르다.

```java
    public void baseThread2() throws InterruptedException {

        int triesCount = 0;

        Thread threadForSleep = new Thread(new ConcreteInterface1());
        threadForSleep.start();

        while(threadForSleep.isAlive()){
            printMsg("threadForSleep 아직 살아있음");
            triesCount++;
            threadForSleep.join(3000);  //3초간 스레드 종료를 기다리고, 3초가 지나면 넘어감.

            if(triesCount > 2){
                printMsg("강제 인터럽트");
                threadForSleep.interrupt();
                threadForSleep.join();          //스레드가 종료할때까지 무한 대기
            }
        }

        System.out.println("threadForSleep 스레드 종료");
    }
```

위 소스에서 `join`은 다른 스레드가 종료할때 까지 기다리게 된다. 참고로 sleep과 마찬가지로 대기 중

interrupt가 들어올 수 있으며, interrupt가 들어올 시, exception이 발동된다(위 소스에선 그런거 고려안함)

# 4. 동기화

### 4.1 synchronized()

lock, transaction, thread-safe 등의 관련 설명은 패스!

```java
public class Buffer {
    private int data;
    private boolean empty = true;

    public synchronized int get(){
        while (empty){
            try {
                wait(); //생산될 때 까지 기다린다.
            } catch (InterruptedException e) {  e.printStackTrace(); }
        }

        empty = true;
        notifyAll();

        return data;
    }

    public synchronized void put(int data){
        while (!empty){
            try {
                wait(); //소비 될 때까지 기다린다.
            } catch (InterruptedException e) { e.printStackTrace(); }
        }

        empty = false;
        this.data = data;

        notifyAll();
    }
}
```

여러 스레드 안에서도 안전하게 데이터를 핸들링하기 위해서 `synchronized`를 사용한다.

즉, thread-safe를 위하여 공통된 임계구역을 지정하고 특정 메소드 또는 블럭을 지정하여 `synchronized`사용하면 항상

일관된 데이터를 얻을 수가 있다.

참고로 특정 블럭에 `synchronized`적용 시

```java
synchronized(this){
    //TODO : handle critical data
}
```

위 소스에서 this는 critical한 data를 지정하고(보통 this이지만 아닐수도 있음) 내부 블록에서 lock을 얻어 사용해야할

처리를 정의해주기만 하면 된다. 또한 메소드 통째로가 아닌 블록으로 지정하여 동기화 하였을 시, 특정 블록만 lock을 걸어서

아무래도 메소드 전체보다는 빠를수 밖에 없다. 참고로 `synchronized` 안에서 예외가 발생하여도 lock은 자동적으로 풀린다.

### 4.2 wait(), notify()

- Object에 정의되어 있다(따로 import x)
- 동기화 블록(synchronized)내에서만 사용할 수 있다.
- wait는 lock을 반납하고 대기
- notify를 호출하면 작업을 중단했던 스레드가 다시 락을 얻어 작업을 진행

위 `4.1` 소스에서 `synchronized`안에 `wait()`, `notifyAll()`를 사용하고 있다.

`get`, `put` 메소드 내부에서는 임계구역(`synchronized`)이므로 lock을 얻은 뒤, 다른 작업 처리를 기다리기

위해 현재 스레드의 lock을 반납하고 대기(`wait()`) 하고 있다가, `notify` 또는 `notifyAll`에 의해 다시 처리가

계속 진행되게 된다.

    notify()와 notifyAll()의 차이점은 notify()는 waiting pool에서 대기 중인 스레드 중 하나를 임의로 선택하여
    그 스레드한테만 알려주지만, notifyAll()은 모든 waiting pool에 대기중은 스레드에게 알려준다. 따라서 notify()는
    경우에따라서 원하는 스레드에게 알림이 안갈 수도 있고, notifyAll()은 모든 스레드에게 알림이 가지만 프로세서를 할당
    받지 못한 스레드는 다시 waiting pool로 들어가게 된다.

### 4.3 volatile

스레드 환경에서 각 프로세서에서 특정 필드 데이터를 캐싱하여 사용하면 캐시와 메모리 간 데이터가 불일치 하고, 따라서

여러 프로세서에서 값이 불일치 하는 경우가 발생할 수도 있다. 이러한 케이스를 방지하기 위해 `volatile` 키워드를 사용하여

변수 선언 시, '이 변수에 값은 캐시가 아닌 항상 메모리에서 읽어들이겠다' 라는 뜻이 된다. 따라서 항상 프로세서 별로 동일한

값이 보장되게 된다. `synchronized`를 사용해도 값이 보장되지 않는다면 위 내용을 의심해봐야 한다.

```java
public ThreadTest {
    public volatile int inMemoryData = 0;

    ...
}
```

위의 `inMemoryData` 값은 항상 캐시에 저장되지 않고 오로지 메모리에서만 저장되므로, 여러 스레드에서 프로세서 별로

캐싱된 데이터로 사용하지 않고 항상 메모리에서 읽어들이게 된다.

### 4.4 lock, condition을 이용한 동기화

#### 4.4.1 lock

#### 4.4.2 condition

`wait()`와 `notify()`, `notifyAll()`은 특정 스레드를 대기, 알림 통지하지 못한다는 한계점이 있다.

이에 `Condition`은 스레드를 그룹화 하고 그 그룹에게만 알림을 보낼 수가 있다.

| Object                   | Condotion                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| void wait()              | void await() <br /> void awaitUninterruptibly()                                                                            |
| void await(long timeout) | boolean await(long time, TimeUnit unit) <br /> long awaitNanos(long nanosTimeout) <br /> boolean awaitUntil(Date deadline) |
| void notify()            | void signal()                                                                                                              |
| void notifyAll()         | void signalAll()                                                                                                           |

```java
    @Override
    public int get() {
        lock.lock();
        try{
            while(empty){
                putCond.await();
            }
            empty = true;
            getCond.signal();

        } catch (InterruptedException e) {  System.out.println("인터럽트 감지. "+e.getMessage());
        } finally {
            lock.unlock();
        }

        return data;
    }

    @Override
    public void put(int data) {
        lock.lock();
        try{
            while(!empty){
                getCond.await();
            }
            empty = false;
            this.data = data;

            putCond.signal();

        } catch (InterruptedException e) {  System.out.println("인터럽트 감지. "+e.getMessage());
        } finally {
            lock.unlock();
        }
    }
```

핵심은 `Condition`의 인스턴스인 `getCond`객체와 `putCond`객체이다. 각 인스턴스는 특정 객체를 대기, 알림을 받을 수가 있어서

소스에선 `put`과 `get`메소드는 크로스 형태로 대기, 알림을 직접적으로 알려줄 수가 있다. 물론 이런 형태는 인터럽트를 발생 시

오히려 무한루프에 빠질수 있는 취약한 구조이므로 실무에서 써먹을려면 잘 생각해야한다.(물론 `condition`의 단점이라기보단 스레드가 그렇다)

### 4.5 fork, join 프레임워크

fork, join 프레임워크는 하나의 작업을 작은 작업으로 분할하여 큐에 담은 다음, 각 스레드에서 큐에 담긴 작업을 하나씩 잡고

처리하도록 설계되어 있다. 따라서 특정 스레드가 따로 노는 일이 없으므로 빠른 처리가 가능하다. 물론 선행, 후행 작업이

있으므로 오버헤드가 나는 케이스도 발생할 수 있다. 아무튼 그래서 작업을 나누는(fork) 처리와 다시 합치는(join) 부분(compute)

을 구현해야한다.

# 5. 주의할점

### 5.1 독립적인 stack에서 실행됨

    stack trace를 사용시 확인 가능. 따라서 한 스레드가 예외가 발생해서 종료되어도 다른 스레드의 실행에는
    영향을 미치지 않는다. run, start 메소드에 따라 호출 스택이 달라짐

- 소스 내 `checkCallStack`메소드를 스레드 `run`으로 호출 시 call stack

```
java.lang.Exception: Exception
at thread.items.CheckCallStack.throwException(CheckCallStack.java:12)
at thread.items.CheckCallStack.run(CheckCallStack.java:7)
at java.lang.Thread.run(Thread.java:745)
at thread.ThreadMain.checkCallStack(ThreadMain.java:133)
at thread.ThreadMain.main(ThreadMain.java:26)
Picked up JAVA_TOOL_OPTIONS: -Djava.net.preferIPv4Stack=true
```

- 소스내 `checkCallStack`메소드를 스레드 `start()`으로 호출 시 call stack

```
java.lang.Exception: Exception
at thread.items.CheckCallStack.throwException(CheckCallStack.java:12)
at thread.items.CheckCallStack.run(CheckCallStack.java:7)
at java.lang.Thread.run(Thread.java:745)
```

`run`을 통해 새로운 스레드 환경이 아닌 일반 메소드로 호출 시, callstack 최하단에 `main` 메소드에서 부터 callstack이 쌓이는 것을 확인 할 수가

있다. 하지만 `start`를 써서 새로운 스레드 환경에서 호출 시, 독립적인 stack으로 옮겨 실행 되므로 callstack의 최하단에는 `main`메소드가 아닌

`Thread`에서 부터 시작하는 것을 확인 할 수가 있다.

### 5.2 한번 실행이 종료된 스레드는 다시 실행 할 수 없다.

### 5.3 sleep은 항상 현재 실행 중인 쓰레드에 대해 작동한다.

`sleep` 메소드는 현재 실행 중인 스레드에 대해서만 반응한다.

따라서 인스턴스에서 호출하는건 의미가 없다 (태생이 static method 이다)

### 6. 참고자료

- 스레드, 스레드 풀 관련 설명 : http://hamait.tistory.com/612

- 병렬처리 관련 설명. ForkJoin프레임워크 포함 : https://www.popit.kr/java8-stream%EC%9D%98-parallel-%EC%B2%98%EB%A6%AC/
