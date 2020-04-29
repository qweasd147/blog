---
title: "Promise"
date: "2020-04-28T00:44:36.019Z"
template: "post"
draft: false
category: "javascript"
tags:
  - "thenable"
  - "js"
  - "async"
description: "비동기 처리를 깔끔하고 가독성 높게 처리 + 순서를 보장하고 싶을때"
---

여기서 설명한 모든 샘플 코드는 [note-promise](https://github.com/qweasd147/StudyNote/tree/master/javascript/promise) 여기서 확인 가능

# Promise.

# 1. 정의

비동기 작업일지라도 현재 처리할 작업과 나중에 처리할 작업을 보장해주고 완벽하진 않더라도 

callback hell을 벗어게 해주는데 많은 도움을 준다. 최초 `Promise` 객체는 `pending`이며,

차후 비동기 작업이 완료되어 `resolved(성공)`, `rejected(실패)` 상태로 변경되면 해당 연관

작업을 실행하는 구조이다.


# 2. 주요 내용
### 2.1 Promise 기본 형태 with resolve

```javascript
function after2sec(){
    return new Promise(function(resolve){
       //비동기 작업
       setTimeout(function(){
          console.log("첫번째 비동기 작업 완료");
          resolve("첫번째 결과물");
       },2000);
    })
 }

after2sec()
.then(function(data){
    console.log(data);

    //첫번째 비동기 작업 완료
    //첫번째 결과물
});
```

가장 기본적인 형태로 setTimeout을 사용하여 비동기 작업을 할지라도 그 이후에 결과값을 받아 처리가 가능하다.

정상적인 처리는 `resolve`를 실행 하여 인자로 값을 넘기면 `then`의 첫번째 함수에서 callback을 구현하여 데이터를 받을 수 있다.

### 2.2 Promise 기본 형태 with reject

```javascript
function after2sec(){
    return new Promise(function(resolve, reject){
       //비동기 작업
       setTimeout(function(){
          console.log("첫번째 비동기 작업 완료");

          reject("첫번째 결과물 에러");
       },2000);
    })
 }

after2sec()
.then(function(data){
    console.log('then');    //실행x
    console.log(data);      //실행x
})
.catch(function(err){
    console.log('catch');   //catch
    console.log(err);       //첫번째 결과물 에러
});
```

`resolve`는 정상적인 처리라면 `reject`는 명시적으로 에러를 발생시킨다고 생각하면 된다. `resolve`가 아닌 `reject`를 호출 시

`then`의 callbaclk이 아닌 catch의 callback이 실행된다.

```javascript
function after2sec(){
    return new Promise(function(resolve, reject){
       //비동기 작업
       setTimeout(function(){
          console.log("첫번째 비동기 작업 완료");

          reject("첫번째 결과물 에러");
       },2000);
    })
 }

after2sec()
.then(function(data){
    console.log('then');    //실행x
    console.log(data);      //실행x
},function(err){
    console.log('catch');   //catch
    console.log(err);       //첫번째 결과물 에러
});
```
위 소스처럼 `catch`를 사용하지 않고 then 함수의 두번째 인자값으로 callback함수를 넘겨주고, `reject`를 실행시키면

동일한 결과를 얻을 수 있지만, 직관적으로 알 수도 있고 잡히지 않는 에러도 처리할 수 있어서 대부분의 개발자들은

`catch`를 사용하는것을 추천하고 있다. 에러 관련해는 주의사항 참고!

### 2.3 Promise.all

`Promise.all` static method는 인자값으로 promise 배열(또는 `thenable` 한 객체)를 받아 모든 `promise`가 `resolve` 또는

`reject` 상태, 즉 처리가 완료되어 pending 상태가 아닐때까지 기다린다.

```javascript
function after2sec(){
    return new Promise(function(resolve, reject){
       //비동기 작업
       setTimeout(function(){
            resolve("after2sec 결과물");
       },2000);
    });
}

function after4sec(){
    return new Promise(function(resolve, reject){
       //비동기 작업
       setTimeout(function(){
           resolve("after4sec 결과물");
       },4000);
    });
}

Promise.all([after2sec(), after4sec()])
.then(function(arrResult){
    //약 4초후 실행

    Array.isArray(arrResult) // ==> true

    arrResult.forEach(function(result){
        console.log(result);
    });
});
```

`promise.all`을 사용 시, 비동기 작업 순서를 정하지 않고 동시에 처리되며, 단지 모든 promise가 끝날때까지 기다린다.

위 소스를 보면 2초, 4초의 작업이 걸리는 비동기 작업 시, 두개의 비동기 작업을 같이 처리하여 두 작업이 끝나면 `then`으로

넘어가게 된다. `then`에서 `resolve`를 처리하는 첫번째 callback함수의 매개변수는 항상 배열 형태로 받게된다.

```javascript
after2sec()
.then(after4sec)
.then(function(result){
    //약 6초 후 실행
    console.log(result);
});
```
당연히 위 소스는 `after2sec` 작업이 끝나고 `after4sec`을 실행하므로 약 6초가 걸리게 된다.

에러 날 때를 대비하여, 똑같이 `catch`를 체이닝 하여 사용 할 수 있다.

### 2.4 Promise.race

`Promise.race` static method는 all과 반대로 모든 promise가 처리 완료가 아닌 가장 첫번째로 처리 완료가 된

promise를 처리하게 된다.

```javascript
function after2sec(){
    return new Promise(function(resolve, reject){
       //비동기 작업
       setTimeout(function(){
           resolve("after2sec 결과물");
       },2000);
    });
}

function after4sec(){
    return new Promise(function(resolve, reject){
       //비동기 작업
       setTimeout(function(){
           console.log('실행은 하지만 결과물은 무시된다.');
           resolve("after4sec 결과물");
       }, 8000);
    });
}

Promise.race([after2sec(), after4sec()])
.then(function(result){
    console.log(result);
});

//after2sec 결과물
//실행은 하지만 결과물은 무시된다.
```

위 소스는 항상 `after2sec`의 `resolve`만 실행된다. 주의할 점은 race에 밀린 `promise`의 `resolve`는

조용히 무시된다. 위 소스에서는 `after4sec`의 `setTimeout`은 실행 되도, `resolve`는 실행되지 않는다.

이러한 특징을 이용하여 ajax 요청 timeout을 거는 경우가 많다.

```javascript
//타임아웃 구현
function timeoutWithPromise(time){
    time = time || 3000;
    return new Promise(function(resolve, reject){
        setTimeout(function(){
            reject("타임 아웃!");
        }, time)
    });
}

Promise.race([callAjax(), timeoutWithPromise(1000)])
.then(handleResponse, handleTimeout);
```

이런식으로 요청 시간(위 소스에선 1초)내 ajax 응답이 오는지 여부에 따라 핸들링이 가능하다.

하지만 백단에서 connection or read timeout을 거는게 더 좋을꺼 같다는게 개인적인 생각이다...


### 2.5 Promise.resolve, Promise.reject

두 static method는 무조건 `resolved` 또는 `rejected` 상태인 `promise` 생성을 간단하게 만들 수가 있다.

```javascript
Promise.resolve("무조건 resolve")
.then(function(data){
    console.log(data);
});

Promise.reject("무조건 reject")
.catch(function(data){
    console.log(data);
});
```

primitive한 값들을 간단하게 `promise` 객체로 만들어서 처리가 가능하지만 유용할꺼 같으면서도 어디에 써야할지

잘 감은 안잡힌다....

# 3. 체이닝하여 사용

`promise`는 순서를 보장하기 위하여 여러 함수를 체이닝하여 사용이 가능하다.

```javascript

promise1()
.then(promise2)
.then(promise3)

...

```

### 3.1 에러 발생 시 실행 순서

에러 발생 시, 가장 첫번째 `catch`에서 에러를 처리 후, 정상적인 `then`으로 돌아와서 다시 처리를 시작한다.

```javascript
Promise.resolve("start")
.then(function first(data){

    //console.log(data);  //start

    throw new Error("first ERROR");  //jump catch

    return "end first";
})
.then(function second(data){
    //second 함수는 무시된다.


    //console.log(data);  //end first
    return "end second"
})
.catch(function(data){
    console.log(data.message);
})
.then(function(){
    console.log('end');
});

//first ERROR
//end

```

위 소스에서 `second` 함수는 실행되지 않는다. `first`에서 발생된 에러가 `catch`를 통해 가기 때문이다.

그 이후에는 `catch` 이후 다음 `then`으로 돌아가 처리를 시작한다. 물론 `first` 함수는 정상 처리되고,

`second` 함수에서 에러가 발생 시 `catch`에서 에러 처리 후, 다음 `then`으로 넘어간다.

### 3.2 체이닝 하여 사용시 항상 새로운 promise를 생성

`then` 또는 `catch`를 통해 반환 된 `promise` 객체는 항상 새롭게 생성된 `promise` 객체를 반환한다.

```javascript
var p1 = Promise.resolve("test");

var p2 = p1.then(function(){});
var p3 = p1.catch(function(){});

console.log(p1 === p2);     //false
console.log(p1 === p3);     //false
```

`promise`는 최초 `pending` 상태에서 비동기 작업이 완료 시, `resolved` 또는 `rejected` 상태로 바뀌게 되고, `then`을 통해

걸려있는 함수가 있을 시, 해당 함수를 실행시키는 구조이다. 이러한 구조에서 만약 `then`에서 새로운 pending 상태인 `promise` 객체를

생성하지 않으면 체이닝 하여 순서를 보장하는 일을 할수가 없게된다.

(만약 기존의 `promise` 객체를 반환 시 최초 `then`의 callback 함수를 제외한 모든 `then`에 걸려있는 callback 함수는 동시에

실행 될 것이다.)

# 4. es8 async & await

### 4.1 기본 사용
Promise는 callback hell을 완화 시킬 수 있지만 근본적으로 해결은 힘들다. 그래서 나온것이 es8의 `async`, `await`가 나와

비동기 로직일 지라도 동기적으로 처리가 가능하게 되었다.

    비동기 작업을 호출 시 'await' 키워드를 붙여주면 해당 비동기 작업이 완료될 때까지 다음 구분 실행을 멈추게 된다.
    또한 await를 사용하기 위해선 함수를 정의 할때 앞에다가 'async'키워드를 붙여주어야만 사용이 가능하며, 이 키워드를
    붙여주게 되면 해당 함수는 비동기 함수로 처리된다.

참고로 아래 소스들은 arrow function, 함수 선언식, 표현식 골고루 사용하였다. 물론 헤깔리게 할 목적은 아님!

```javascript
function promise1(text){
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            return resolve(text+" END");
        },2000);
    });
}

function promise2(text){
	return new Promise((resolve, reject)=>{
		setTimeout(()=>{
			return resolve(text+" END");
		},3000);
	});
}

const after5sec = async ()=>{
    const p1Result = await promise1("첫번째 결과물");
    const p2Result = await promise2("두번째 결과물");
	
	//5초 후
	console.log("after5sec 전체 끝");
}
```

`after5sec`함수를 실행하여 `await`를 만나면 해당 비동기 작업 처리가 완료 될때까지 대기 하게 된다. 따라서 위 소스는

`promise1` 처리가 완료 후, `promise2`가 실행되므로 전체 처리하는데 약 5초가 걸리게된다.

```javascript
const after3sec = async ()=>{
	
    const resultArr = await Promise.all([promise1("첫번째 결과물"), promise2("두번째 결과물")]);
    console.log("after3sec 끝..."+resultArr.toString());
}
```

`Promise.all`을 사용 시 똑같이 `await`를 붙여주며, 반환값은 기존 `Promise.all`과 똑같이 배열 형태로 받게된다.

위 소스는 비동기 작업을 같이 처리하게 되므로 약 3초 이후에 결과값을 받게 된다.

    주의할 점은 비동기 함수는 기존 이벤트 루프를 배울 시, 특정 함수가 실행 중일 시 다른 함수는 절대로 실행되지
    않는다고 하였다. 하지만 이 비동기 함수는 실행 중 특정 비동기 처리 완료를 대기 중이면 다른 함수가 실행이 가능하다.
    얼추 어떤식으로 돌아가는지 알꺼 같지만 추측만 하는거라서 조금 더 공부가 필요할꺼 같다...


참고로 `async`, `await`를 사용하여 error 처리를 할 시에는 그냥 `try`, `catch`문을 사용하여 처리하는걸 권장하고 있다.

`promise`객체를 체이닝하여 `catch`문만 보다가 쓰려니까 어색하기도 하지만 애초에 비동기 코드를 동기식 코드로 사용하기

위하여 나온것이기 때문에 `try`, `catch`문을 사용하여 에러를 잡게 된다.


```javascript
try{
	await Promise.reject("ERROR!");
}catch(e){
	console.log(e); //ERROR!
}
```

### 4.2 callback function with promise
순수 `Promise` 함수를 써서 callback 함수를 사용하는 비동기 함수를 동기식으로 만들어 사용이 가능하다.

예를 들어 아래와 같은 `API Request`를 요청하고 결과값을 처리하는 callback 함수를 요구하는 함수가 있다고 가정. 
```javascript
request(url, function(err, result){
    if(err){
        //TODO : 에러 처리
        return;
    }
    
    //TODO : handle result data
});
```

당연히 callback 함수는 언제 실행 될지 모른다. 하지만 `Promise`로 한번 감싸고, `await`를 사용해서 결과값을 받을 때 까지 대기가 가능하다.
```javascript
function waitUntilRequestEnd(url){
    return new Promise((resolve, reject)=>{
        request(url, function(err, result){
            if(err)
                reject(err);
            else
                resolve(result);
        });
    });
}

//시용 시점
try{
    const result = await waitUntilRequestEnd(url);
}catch(e){
    //TODO : 에러 처리
}
```


# 5. 주의사항

### 5.1 pending 상태 이후,  resolved 또는 rejected 상태로 변경 시 다른 상태로 변경되지 않는다.

`promise`객체는 최초 생성 시 `pending` 상태이며, 비동기 작업이 완료 시 에러 발생 여부에 따라 `resolved` 또는

`rejected` 상태로 바뀌게 된다. 이후로는 다른 상태로는 절대 바뀌지 않게 된다. 따라서

```javascript

var pResolved = Promise.resolve("12345");

pResolved.catch(function(){
    //....
});

```

위 소스의 `catch`는 절대로 발생할 수가 없다. 이후에 어떠한 변화를 주게 된다 하더라도 `pResolved`의 상태값이

`resolved`에서 `rejected`으로 바뀔일은 절대 없기 때문이다.

### 5.2 파라미터는 단일값
```javascript
Promise.resolve(1,2,3,4,5)
.then(function(...args){
    console.log(args);      //[1]
});

```

아무리 많은 값을 넘기고 싶어도 then에서 받을수 있는 파라미터는 하나밖에 받을 수가 없다. 따라서 여러값들을 넘겨주고

싶은 경우에는 배열또는 json형태로 값을 넘겨주어야만 한다.

### 5.3 잡히지 않는 에러

`Promise`를 체이닝을 통한 에러 처리 시, 의도와는 다른 에러를 케치하지 못하는 상황이 올 수가 있다.

```javascript
function throwErr(){
    throw new Error("ERROR!");
}

function handleError(err){
    console.log(err.message);
}


//에러 처리를 handleError에서 잡지 못한다.
Promise.resolve("start")
.then(throwErr, handleError);
```

만약 `then`의 첫번째 콜백함수 파라미터에서 에러가 발생하게 되면 두번째 콜백함수에 잡을 수가 없다. 위 소스에서 `handleError`

는 오직 상위 `Promise`의 처리 결과 중 에러가 발생하면 이에 호출되기 때문이다.

(사실상 `Promise.resolve`를 호출하므로 왠만하면 에러를 낼 수도 없다.)

따라서 `throwErr`에서 발생한 에러를 처리하기 위해서는 아래와 같은 소스로 변경해야 한다.

```javascript
Promise.resolve("start")
.then(throwErr)
.catch(handleError);
```

물론 상위 `Promise`객체의 에러를 캐치하기 위해 `then`을 아래와 같이 체이닝 하여 사용 할 수도 있지만 직관적으로 봐도

의도를 파악하기가 힘들 수도 있어서 잘 사용하지는 않는다.

```javascript
//에러를 handleError에서 케치 할 수 있지만 차라리 catch를 쓰는게 더 낫다
Promise.resolve("start")
.then(throwErr)
.then(null, handleError);
```

### 5.4 thenable

`Promise.resolve` 또는 `Promise.reject`에서 `then`을 구현하여 사용 할 수 있는 함수(말 그대로 thenable)를 넣을 시

`Promise` 객체로 변환하여 사용이 가능하다. 일종의 인터페이스 구현으로 보통 `Promise` 객체가 아닌 비동기 함수의 콜백 함수

등에서 필요에 따라 `Promise`처럼 사용 또는 callback 형태로 사용 하기 위하여 자주 사용한다고 한다(사실 필요성을 잘 못 느끼겠다).

```javascript
function fnThenAble(data){
    return {
        then : function(resolve, reject){
            if(data){
                resolve(data);
            }else{
                reject("data is falsely");
            }
        }
    }
}

//resolved로 처리
Promise.resolve(fnThenAble("data"))
.then(function(data){
    console.log(data);      //data
})
.catch(function(data){
    console.log(data);
});

//rejected로 처리
Promise.resolve(fnThenAble())
.then(function(data){
    console.log(data);
})
.catch(function(data){
    console.log(data);      //data is falsely
});
```

### 5.5 항상 비동기 처리

`resolve` 또는 `reject`함수는 항상 비동기로써 처리된다.

```javascript
var p1 = new Promise(function(resolve){
    console.log("first message");

    resolve("last message");
});

p1.then(function(data){
    console.log(data);
});

console.log("second message");

//first Message
//second Message
//last Message
```

맨 처음 `Promise`객체를 생성 시 'first message'가 표출되고, 그 다음 'last message'가 아닌 'second message'가 표출된다.

이는 동기적으로 실행 되어 first -> last -> second 순으로 출력될 것이라 예상할수도 있겠지만 `resolve`, `reject` 함수는

항상 비동기로 호출하고 있다. 혹시나 이게 왜 비동기 호출의 증거인지 궁금하면 event loop 참고!