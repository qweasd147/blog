---
title: "Hibernate - 벌크연산과 flush"
date: "2024-01-10T09:00:24.113Z"
template: "post"
draft: false
category: "spring"
tags:
  - "jpa"
  - "hibernate"
description: "hibernate에서 벌크연산 시 주의할 점, flush와 FlushMode"
---

### 사전 지식

#### 1. 벌크연산 주의점

`Hibernate`에서 벌크연산(`update` or `delete`)을 하게 되면 해당 entity의 영속성 컨텍스트는 깨지게 된다. 이유는 지금 영속성 컨텍스트에서 관리되는 객체가 해당 벌크연산에 영향을 받았는지, 안받았는지 정확히 알 수 없고, 괜히 나중에 `flush`(DB 동기화) 했다가 버그만 만들어 질 수가 있어 그렇게 만들어졌다.

#### 2. 영속성 컨텍스트 flush

영속성 컨텍스트의 변경 내용을 DB와 동기화 하는 것을 말한다. JPA에서 지원해주는 모드는 2가지가 있다.

1. `FlushModeType.AUTO` - 커밋이나 쿼리를 실행 할 떄 `flush`가 이루어진다(default)
2. `FlushModeType.COMMIT` - 커밋 할 때만 `flush`가 실행

두 개 모두 장단점이 있지만 1번은 `flush`가 2번보다 상대적으로 많이 이뤄질 수 있다는 점, 2번은 잘못하다간 영속성 컨텍스트가 다 꼬여 원하는 시점에 id(auto generate. pk)값을 알 수 없을 수도 있다는 단점이 있다. 일반적으로 2번은 크리티컬하고 귀찮은 문제가 발생 할 수 잇어서 1번을 디폴트로 쓰고, 혹시나마 오버헤드로 인한 성능 이슈가 있을 때만 2번을 사용하기도 한다.

#### 3. 영속성 컨텍스트 clear

영속성 컨텍스트를 비워주는것을 말한다. 영속성 컨텍스트는 영속성 컨텍스트는 `id(pk)`으로 조회 한 후, 나중에 똑같은 id로 조회 하면 DB에 직접 조회하는게 아닌 1차 캐시에서 가져다 반환한다. 하지만 clear를 통해 영속성 컨텍스트를 초기화 하면 1차 캐시가 비워지니 DB에 직접 조회하게 된다
주의할 점은 clear이후엔 이미 불러와

진 데이터는 전부 **준영속성 상태**가 된다는 점을 기억 해야한다(읽기 용으로만 사용)

#### 4. 영속성 컨텍스트 범위

이 글에 직접적인 연관은 없지만 보다보면 그럼 영속성 컨텍스트는 언제 생성되고 없어지는지 궁금 할 수가 있다. 영속성 컨텍스트는 기본적으로 `reuqest`가 들어오고 `Spring Interceptor`에서 만들어진다고 보면 되고, `dirty check`는 `Transaction` 영역 내에서만, osiv 옵션이 켜져있다면 view까지 영속성 컨텍스트가 살아있게 된다.

> `OSVI` 옵션을 키면 view 영역에선 데이터는 조회만 가능하며 `nonTransactional Reads`로 처리된다.

---

이번에 분석할 것은 정확히 따지면 `@Modifying`이다. 이 어노테이션은 `@Query`중, 벌크 연산을 사용하는걸 명시적으로 나타낸다.

```java
public interface ArticleRepository extends JpaRepository<Article, Long> {

  @Modifying
  @Query("UPDATE Article article SET article.subject = :subject, article.contents = :contents WHERE article.idx = :idx")
  void updateArticle(@Param("idx") Long idx, @Param("subject") String subject, @Param("contents") String contents);
}
```

이런식으로 사용되며, 쉽게 `update`쿼리를 실행 시킬 수가 있다. 근데 이런 update/delete 연산은 영속성 컨텍스트를 깨뜨린다고 하였는데, 이 메소드 실행 전후에 `flush/clear`를 실행 해야만 안전하게 프로그래밍이 가능하다. 그걸 간편하게 하기 위해 `@Modifying`어노테이션에 2가지 attribute를 제공 해주고 있다.

### flushAutomatically(Boolean)

쿼리문 실행 직전에 `flush`를 실행 할지 여부를 지정한다. 일단 용도는 true값이면 해당 메소드(`update` 쿼리)가 실행 직전에 `flush`를 실행하고 false라면 별도로 실행 시키지 않는다.

그런데 false 값이라도 flush가 호출 될 수도 있다(높은 확률로 그냥 flush 된다) 이유는 밑에서 후술함

### clearAutomatically(Boolean)

해당 메소드(`update` 쿼리)실행 직후에 영속성 컨텍스트를 `clear` 여부를 지정한다.

예제

```java
public interface ArticleRepository extends JpaRepository<Article, Long> {

    @Modifying
    @Query("UPDATE Article article SET article.subject = :subject, article.contents = :contents WHERE article.idx = :idx")
    void updateByQuery(@Param("idx") Long idx
                        , @Param("subject") String subject
                        , @Param("contents") String contents);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Article article SET article.subject = :subject, article.contents = :contents WHERE article.idx = :idx")
    void updateByQueryAndAutoClear(@Param("idx") Long idx
            , @Param("subject") String subject
            , @Param("contents") String contents);
}
```

이런 repository가 있어서 테스트를 돌려보면

```java
@Test
@DisplayName("벌크 연산 후, clear를 안하고 조회하면 기존 영속성 컨텍스트는 실제랑 안맞음")
public void contextTest1(){

    //1차 캐싱 유도
    articleRepository.findById(6L).get();

    //벌크 연산을 통해 영속성 컨텍스트를 깨트림
    articleRepository.updateByQuery(6L, "update subject", "update contents");

    //실제 db가 아닌 영속성 컨텍스트에서 값조회(정확하지가 않음)
    Article afterBulk = articleRepository.findById(6L).get();

    //잘못된 영속성 컨텍스트에서 조회해서 값이 정확하지가 않다.
    then(afterBulk.getSubject())
            .isNotEqualTo("update subject");
    then(afterBulk.getContents())
            .isNotEqualTo("update contents");
}

@Test
@DisplayName("벌크 연산 후, clear하고 재조회 하면 정확한 값을 얻을 수가 있다.")
public void contextTest2(){

    //1차 캐싱 유도
    articleRepository.findById(7L).get();

    //벌크 연산을 통해 영속성 컨텍스트를 깨뜨리고 clear한다.
    articleRepository.updateByQueryAndAutoClear(7L, "update subject", "update contents");

    //실제 db에서 재조회 한다.
    Article afterBulkAndClear = articleRepository.findById(7L).get();

    //최신 데이터를 조회하므로 값이 정확하다
    then(afterBulkAndClear.getSubject())
            .isEqualTo("update subject");
    then(afterBulkAndClear.getContents())
            .isEqualTo("update contents");
}
```

주의 점은 앞서 말한데로 clear는 기존 불러온 데이터는 전부 준영속성 상태로 바꾼다고 하였다. 그니까 트랜잭션이 종료되도 `dirty check & save`대상이 아니라는 말이다.

### Tip.1

`JpaQueryExecution`클래스 안에 `ModifyingExecution`이라는 inner class가 있고, 여기 코드를 보면 `modifying`쿼리 실행 직후에 `flush & clear` 실행 되는 로직을 확인 할 수가 있다.

```java
static class ModifyingExecution extends JpaQueryExecution {

  public ModifyingExecution(JpaQueryMethod method, EntityManager em) {
    //불필요한거 생략
    this.em = em;
    this.flush = method.getFlushAutomatically();
    this.clear = method.getClearAutomatically();
  }

  @Override
  protected Object doExecute(AbstractJpaQuery query, JpaParametersParameterAccessor accessor) {

    if (flush) {
      em.flush();
    }

    int result = query.createQuery(accessor).executeUpdate();

    if (clear) {
      em.clear();
    }

    return result;
  }
}
```

이런식으로 아주 명확하게 구현된걸 볼 수 있다.

### Tip.2

자신이 jpa(hibernate)를 공부하는 과정에 여러가지 테스트 해보고 있는 중이라면

```yaml
logging:
  level:
    org.hibernate.event: trace
```

이 옵션을 키고 보면 공부하는데 많은 도움이 된다. flush 실행 log나 지연실행, 캐시에서 꺼내오는 log를 직접 확인이 가능하다(단순 로그긴 하지만)

---

위에서 `flushAutomatically`를 설명하면서, 이 옵션 `true/false` 여부에 상관없이 `flush`되는 것을 확인 될 수도(...?) 있다. 그건 애초에 영속성 컨텍스트에 `FlushModeType` 또는 `FlushMode`에 의해 `flush` 조건이 고정되어 있어서 더 높은 우선순위를 가지기 때문이다. 이 값을 바꿔서 테스트 해보겠다면 `setFlushMode`를 통해 모드 값을 바꾸고 테스트 해보면 된다.

또한 참고할 점으로 맨 위에서 `jpa`에선 2가지 `FlushModeType`을 제공 해준다고 하였다. 근데 `hibernate`는 여기서 더 확장하여 총 4가지 모드를 지원 해주고 있다.

### FlushMode

- `AUTO(default)` - 쿼리가 실행되면 쿼리 결과가 영속성 컨텍스트에 영향을 미칠때 or 커밋이나 `flush` 호출 할때
- `ALWAYS` - 모든 쿼리 실행 직전에 flush 호출
  > The Session is flushed before every query. This is almost always unnecessary and inefficient. 대놓고 비효율 적이라고 말하고 있다.
- `MANUAL` - 명시적으로 `flush` 호출 할 때만 `flush` 호출
- `COMMIT` - 트랜잭션에서 커밋 호출 직전에 `flush`

`AUTO`, `ALWAYS`는 그래도 flush 모드를 잘 몰라도 얼추 의도한대로 실행 되지만 다른 두가지는 조심해서 사용해야 한다.
