---
title: Enum
date: "2016-09-01T23:46:37.121Z"
template: "post"
draft: false
category: "java"
tags:
  - "java"
  - "enum"
description: "enum 정의"
socialImage: "/media/image-2.jpg"
---

# enum.

# 1. enum ?

    타입관리까지 가능한 열거형 상수. 값이라기 보단 클래스에 가깝다.

# 2. 장점

### 2.1 타입에 안전한 열거형(typesafe enum).

```java
public void enumBase(){

    //Card.Kind.CLOVER == Card.Value.FOUR;  //ERROR 내부적으로 값이 다름. 안전하게 값 비교 가능

    Card.Kind.CLOVER == Card.Kind.HEART     //false
}
```

만약 상수값을 `int` 형태로 관리한다면 경우에따라 값을 비교 시, 원하지 않는 결과가 반환될 수도 있다.

하지만 enum을 사용 시, 이러한 부분은 안전하게 비교가 가능하다.

### 2.2 각 서드파티에 원하는 형태의 데이터 관리가 편함

```java
public void enumStatus(){

    Status.ProcessStatus thirdPartyResult = null;

    try{
        someThirdPartyProcess();                        //구현은 자유!!
        thirdPartyResult = Status.ProcessStatus.SUCCESS;
    }catch (RuntimeException e){
        thirdPartyResult = Status.ProcessStatus.FAIL;
    }

    각 서드파티에 맞는 데이터 관리가 쉬워진다.
    insertFile(thirdPartyResult.getNumberStatus()); //파일에는 숫자형태로 기록
    insertDB(thirdPartyResult.getStrStatus());      //DB에는 문자 형태로 기록
}
```

처리 결과를 파일, RDB, NoSQL에 각각 저장하고, 저장 되는 정보는 다 다르다고 가정.

이럴땐 성공 여부와 데이터 정보를 각각 따로 관리를 하게 되서 꽤나 지저분하고 한번에 눈에 안들어 올 가능성이 크다.

```java
public void enumStatus(){

    String SUCCESS = "SUCCESS";
    String FAIL = "FAIL";

    String SUCCESS_FILE="success";
    String FAIL_FILE="fail";

    int SUCCESS_DB = 0;
    int FAIL_DB = 1;

    String thirdPartyResult = null;

    try{
        someThirdPartyProcess();                        //구현은 자유!!
        thirdPartyResult = SUCCESS;
    }catch (RuntimeException e){
        thirdPartyResult = FAIL;
    }

    if(SUCCESS.equals(thirdPartyResult)){
        insertFile(SUCCESS_FILE);
        insertDB(SUCCESS_DB);
    }else{
        insertFile(FAIL_FILE);
        insertDB(SUCCESS_DB);
    }

}
```

대충 이런식이 될 것이다. 이해하는데 큰 문제는 없을 지라도 뭔가 쫌 아쉽게 보인다.

물론 적당한 디자인 패턴을 적용 할 수도 있겠지만 enum보다 좋은 형태로 적용하기는 쉽지 않을 것이다.

### 2.3 `==`를 사용하여 동등 여부 계산이 빠르다.

문자열 비교 시, `equals`를 사용 할 것이다. 하지만 enum의 동등 비교는 `==`를 사용 하므로써 더욱 빠르게 연산된다.

# 3. 주요 사용법

### 3.1 기본 사용법

```java
public void enumBase(){

    //Card.Kind.CLOVER == Card.Value.FOUR;          //ERROR 내부적으로 값이 다름. 안전하게 값 비교 가능

    if(Card.Kind.CLOVER == Card.Kind.HEART){}   //equals가 아닌 '=='를 통해 비교하여 빠르게 연산 가능

    Card.Kind val = Card.Kind.valueOf("CLOVER"); //문자열로 선언값 가져올 수 있음
    System.out.println("name : "+val.name());

    Card.Kind[] cardKinds = Card.Kind.values();     //선언된 값 배열을 물러옴

    System.out.println("CLOVER name : "+Card.Kind.CLOVER.name());
    System.out.println("CLOVER toString : "+Card.Kind.CLOVER.toString());   //toString은 어디서 override 할수 잇어서 사용을 권장안함

    //Card.Value.FOUR.val;            //필드는 private, public하게 선언 가능
}
```

| 구분          | method                                     | 설명                                                            |
| ------------- | ------------------------------------------ | --------------------------------------------------------------- |
| public final  | String name()                              | enum 선언 시 똑같은 선언명을 돌려준다.                          |
| public final  | int ordinal()                              | 0부터 시작하여 선언 된 순서를 반환한다.                         |
| public final  | int compareTo(E o)                         | 비교 결과를 반환한다. o 보다 작을 시 음수, 같을 시 0, 크면 양수 |
| public static | <T extends Enum<T>> T valueOf(String name) | 지정된 열거형의 이름(선언명)을 찾아 반환한다.                   |
| public static | <T extends Enum<T>> T[] values             | 지정된 열거형 전체를 배열형태로 반환한다.                       |

### 3.2 추상 메소드 사용 가능

```java
public enum WithAbstract{
    ADD {
        @Override
        public double handleData(double aDouble1, double aDouble2) {
            return aDouble1 + aDouble2;
        }
    };

    public abstract double handleData(double aDouble1, double aDouble2);
}
```

이런식으로 추상 메소드를 선언 시, enum 생성 시에 구현체를 구현 해준다. 또한 functional interface도 가능하다.

```java
public enum WithLamda {

    ADD((aDouble1, aDouble2) -> aDouble1 + aDouble2);

    private BiFunction<Double, Double, Double> expression;

    WithLamda(BiFunction<Double, Double, Double> expression) {
        this.expression = expression;
    }

    public double handleData(Double aDouble1, Double aDouble2){
        return expression.apply(aDouble1, aDouble2);
    }
}
```

사실상 똑같은 로직을 추상 클래스가 아닌 생성자 + lambda + functional interface를 사용하여 구현한 것이다.

이런식으로 사용할 시 장점이 enum을 통해 상태값과 연관된 메소드를 함께 관리 할 수 있다는 점이다.

```java
public void handleEnumWithLamda(){
    double handleResult = HandleEnum.WithLamda.ADD.handleData(10.0, 5.0);
    System.out.println("add result : "+handleResult);

    handleResult = HandleEnum.WithLamda.MINUS.handleData(10.0, 5.0);
    System.out.println("minus result : "+handleResult);
}
```

위 소스에서 보는바와 같이 상태(ADD, MINUS)에 따른 메소드(더하기 또는 빼기)도 함께 관리 할수가 있다.

# 4. 주의할점

#### 4.1 값을 사용 시 직접 정의된 값 사용 권장

    Enum class에 정의된 ordinal()이 열거형 상수가 정의된 순서를 반환하지만, 이 값은
    자바 내부적인 용도로 사용되기 위한 값으로, 열거형 상수의 값으로 사용하지 않는걸 추천

#### 4.2 생성자는 기본적으로 private

enum의 생성자는 무조건 private하다. 오직 클래스 정의 내에서만 생성이 가능하다.

```java
public void enumBase(){

    //Card.Kind data = new Card.Kind();     //ERROR!

    }
}
```

#### 4.3 value는 final 권장

열거형의 인스턴스 변수는 반드시 final이어야 한다는 제약은 없지만, value는 열거형 상수의 값을

저장하기 위한 것이므로 final을 붙이는것을 권장. 따라서 setter와 getter가 큰 의미를 갖지는 않는다.

(물론 필요하면 쓰는것이 맞음)
