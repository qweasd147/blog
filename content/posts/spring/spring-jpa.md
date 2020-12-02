---
title: 'JPA'
date: '2020-11-27T03:08:42.258Z'
template: 'post'
draft: false
category: 'spring'
tags:
  - 'spring'
  - 'jpa'
  - 'orm'
description: 'Spring DATA JPA & QueryDSL를 써보면서 느낀 주의점 & 고난'
---

여기서 설명할 내용 및 샘플은 [JPA 샘플](https://github.com/qweasd147/springboot-jpa) 여기서 확인 가능

목차

1. 2차 캐싱 시 주의점
2. N + 1 문제
3. OneToOne Lazy Loading
4. 연관 관계 없을 시 조인
5. bulk insert

## 1. 2차 캐싱 시 주의점

1차 캐싱은 캐싱 주기가 매우 짧기도 하고 각 스레드에 종속되어 문제되는 경우는 거의 없다고 생각된다(근데 1차 캐시로 성능상 이득보기는 정말 힘들다). 하지만 2차 캐시의 경우 어플리케이션에 캐싱 해두고 사용하는것으로 종종 문제점이 발생하기도 한다.

#### Entity

상황 설명을 위해 `JPA 샘플`에 `Entity`와 2개의 API를 만들어 두었다.

Article.java

```java
@Entity
@NoArgsConstructor
@Getter
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idx;

    ...

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "article_idx")
    @OrderBy("idx ASC ")
    @BatchSize(size = 20)
    private List<Tag> tags = new ArrayList<>();

    ...
}
```

Tag.java

```java
@NoArgsConstructor
@Getter
@Entity
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idx;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="article_idx", nullable = false)
    @BatchSize(size = 20)
    private Article article;

    private String tag;

    ...
}
```

> 1 대 N 양방향 으로 맵핑된 `Article`, `Tag` entity

#### API(소스는 샘플 참고)

1. 어플리케이션에 `Article`을 조회 후, 3초 동안 캐싱 해두는 API

   > POST : `http://localhost:8080/api/article/cache/5`

2. `Article`을 캐시에서 조회, 없으면 db에서 값을 찾고 `Tag`를 `Lazy Loading`하는 API
   > GET : `http://localhost:8080/api/article/cache/5`

먼저 `GET` 요청을 하면 정상적으로 결과 값이 반환된다. 하지만 `POST`로 요청 후, 3초 이내에 `GET`으로 요청하면 에러가 발생한다.

에러 내용

```
- ERROR : failed to lazily initialize a collection of role: com.example.model.Article.tags, could not initialize proxy - no Session
- WARN : Resolved [org.hibernate.LazyInitializationException: failed to lazily initialize a collection of role: com.example.model.Article.tags, could not initialize proxy - no Session]
```

에러 내용은 대충 '`Tag` Entity를 지연 조회(`lazily initialize`)를 실패 했다.'라는 내용이다. 에러 발생 과정을 나열해보면

1. `POST` API에서 `Article`만 조회 하고, `Tag`값은 조회 하지 않고 캐싱 해둔다.
2. `GET` API에서 캐싱 된 `Article`을 가져온다. 이때 `Article`은 **준영속성 상태**이다.
3. `Article`에서 `Tag`를 조회 하려고 한다. -> 에러 발생!

> 간단히 말하면 캐싱 해둔 데이터를 다른 스레드에서 가져와 `lazy loading`을 시도해 발생한 문제이다. `EntityManager`와 `Persistence Context`는 각각의 스레드에 종속되어 있다. 그래서 다른 스레드에 의해 캐싱 된 데이터를 꺼내오더라도 현재 스레드에선 `준영속성 상태`가 된다.

이런 문제를 막기 위해 캐싱 할 데이터는 필요한 정보를 다 초기화 시키고 저장되도록 유도하던가, 다 초기화 시키기 부담스러우면 필요 데이터를 초기화 시키고 dto 형태로 변환하여 저장 되도록 관리되어야 한다.

## 2. N + 1 문제

`N + 1 문제` 설명 자체는 생략 하고 바로 해결법 부터 설명

`Entity`의 연관 관계들은 기본옵션으로 `Lazy Loading`이 되도록 설정 해놓고(`FetchType.LAZY`), 사용 시 필요에 맞춰 즉시 실행 or 지연실행이 되도록 유도해야한다. 적당히 `Entity` 연관 관계에 `@BatchSize`를 걸어놓고, `FetchJoin`이나 `Repository`에 `@EntityGraph`등을 쓰면 쉽게 해결이 가능하다.

상당히 불친절한 설명이라고 생각할 수 있지만 사실 `N + 1`문제는 당장 해결이 어렵다기 보다는 쌓여가는 레거시 코드들을 상대로 얼마나 안전하게, 또 재사용을 높이면서 관리하는게 힘들 뿐이다. 그래서 개인적으로 `Service`클래스는 왠만하면 순수한 형태(`Lazy Loading`만 하도록)로 사용하고 `Facade`클래스를 만들어 필요에 따라 연관 `entity`들을 추가로 초기화 시키는 형태로 하는게 좋은것 같다.

```java
@Transactional
@RequiredArgsConstructor
@Service
public class ArticleServiceFacade {

    private final ArticleService articleService;

    public List<Article> searchAllWithInfo(){

        List<Article> articles = this.articleService.searchAll();
        articles.forEach((article)-> Hibernate.initialize(article.getTags()));

        return articles;
    }
}
```

이런식으로 사용하는게 재사용성도 높이고, 필요한 정보만 딱딱 조회 하고 처리 할 수 있어 좋은것 같다. `facade`클래스 자체가 애매하다고 생각되면 `service`에서 다 처리해도 상관은 없을꺼 같긴한데 `service`클래스가 비지니스 로직을 처리하는 부분이라 시간이 지나면 규모가 너무 커져, `facade`를 만드는것도 좋은 선택이라고 생각된다.

## 3. OneToOne Lazy Loading

`Entity`조회 시, 필요에 맞춰 즉시 실행 or 지연실행을 선택해서 쓰는게 좋다고 하였다. 하지만 `Lazy Loading`을 유도해도 안되는 케이스가 존재한다.

다시 상황 설명을 위한 `Entity` 관계 설명

Article.java

```java
@Entity
@NoArgsConstructor
@Getter
public class Article {

    ...

    @OneToOne(mappedBy = "article", fetch = FetchType.LAZY)
    private ArticleDetail articleDetail;

    ...
}
```

ArticleDetail.java

```java
@Entity
@NoArgsConstructor
@Getter
public class ArticleDetail {

    ...

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_idx", nullable = false)
    private Article article;

    ...
}

```

1대1 양방향 맵핑 된 관계로, 연관관계의 주인(`FK`를 갖는 쪽)은 `ArticleDetail`이다.

보이는 바와 같이 연관된 `Entity`들은 Lazy 로딩 되도록 설정을 해 놓았고, 각각 db에서 조회 시 아래와 같은 결과가 나온다.

#### pk를 통해 `Article`조회 시 표출되는 Log

```
Hibernate:
    select
        article0_.idx as idx1_0_0_,
        article0_.contents as contents2_0_0_,
        article0_.count as count3_0_0_,
        article0_.subject as subject4_0_0_
    from
        article article0_
    where
        article0_.idx=?
Hibernate:
    select
        articledet0_.idx as idx1_1_0_,
        articledet0_.article_idx as article_3_1_0_,
        articledet0_.data as data2_1_0_
    from
        article_detail articledet0_
    where
        articledet0_.article_idx=?
```

의도하지도 않은 `ArticleDetail`도 함께 조회되는 것을 확인 할 수 있다. 이렇게 즉시 실행되는것은 `N+1문제` 원인이 되기 때문에 막아놓는게 좋다.

일단 의도한 Lazy Loading이 되지 않은 이유는 프록시 객체를 가질 수 없기 때문이다.

> 프록시 객체가 사용되는 이유는 예를 들어 `OneToMany`관계에서 `Collection`객체는 순수 `Collection` 객체가 아니라 `Collection` 객체를 확장한 프록시 객체를 갖는다(가져오는 클래스 정보를 보면 확인할 수가 있다). 그래서 해당 `Collection`에 접근하려고 하면 초기화 여부를 판별 후 최초 접근 시, DB에 접근 하여 데이터 조회(`lazy loading`)하여 해당 `entity`들을 반환하는 형태다.

하지만 `OneToOne`관계에선 조회 시점에 널값 인지 아니면 연관 entity(`ArticleDetail`)가 있는지 몰라, 일단 DB에서 조회하는 형태라 `Lazy Loading`자체를 지원 안해준다. 찾아보면 서드파티를 추가해서 `Optional`로 한번 감싸서 사용하거나 추가 셋팅하면 지원이 가능한것 같지만 개인적으로 필드값에 연관 `Entity` 자체를 없애서 단방향 연관관계로 사용한다(`Article`에 `ArticleDetail` 필드를 없애버린다.).

참고 사항으로 `Article`을 조회 시, `ArticleDetail`이 즉시 실행 되는 것이고, 연관관계의 주인인 `ArticleDetail`은 정상적으로 지연실행을 지원한다.

#### pk를 통해 `ArticleDetail`조회 시 표출되는 Log

```
Hibernate:
    select
        articledet0_.idx as idx1_1_0_,
        articledet0_.article_idx as article_3_1_0_,
        articledet0_.data as data2_1_0_
    from
        article_detail articledet0_
    where
        articledet0_.idx=?
```

연관관계의 주인은 `FK`값을 가지니까 이거 자체로 null 값 여부를 판별할 수 있어 지연실행이 가능하다.

## 4. 연관 관계 없을 시 조인

연관관계 정의 없이 조인할 때, 개인적으로 `QuerydslRepositorySupport`클래스를 자주 사용한다.

```java
    @Override
    public ArticleDto.WithArticleInfo findByIdxWithArticleInfo(Long articleIdx) {

        Map<Article, List<ArticleInfo>> articleListMap = getQuerydsl().createQuery()
                .from(article)
                .innerJoin(articleInfo)
                    .on(article.idx.eq(articleInfo.article.idx))
                .where(article.idx.eq(articleIdx))
                .transform(groupBy(article).as(list(articleInfo)));

        return articleListMap.entrySet().stream()
                .map(entry-> new ArticleDto.WithArticleInfo(entry.getKey(), entry.getValue()))
                .findFirst()
                .orElse(null);
    }
```

1 대 N 관계에 연관관계가 없을 시, 이런식으로 조회 후 Dto로 감싸서 관리한다. 참고로 `Projections.constructor`이나 `Projections.bean` 같은걸 써서 조회한 데이터를 내가 직접 핸들링 하지 않고 알아서 처리 할 수도 있겠지만 이런건 내부적으로 리플렉션 기반으로 하는거라 개인적으로 싫어하는 방식이라, 조회 후 직접 내가 코드로 처리하는 방법을 많이 쓴다.

> 리플렉션을 쓰면 컴파일 레벨은 통과되도 런타임 시 버그가 발생 될 수 있어서 개인적으로 싫어한다.

## 5. bulk insert

개발 하다 보면 대량의 데이터를 `Insert`하고 싶을때가 있다.

`Spring data jpa`를 쓰다보면 제공되는 repository에 `saveAll`이라는 메소드가 있는데 얼핏보면 이 메소드를 통해 `bulk insert`를 하면 되겠구나, 생각 할 수가 있다. 물론 그런 용도로 만들어지긴 했는데 막상 출력되는 로그를 보면 전부 하나씩 쿼리가 실행되는 것을 볼 수가 있다.

원인은 PK 생성 전략을 `IDENTITY`를 써서 그런데, 영속성 하기 위해서는 `PK`값이 필수이지만 `PK`를 알고 싶으면 DB에 저장하는 방법밖에 없어서 저장 대상인 Entity들을 저장과 동시에 영속성을 지원하기 위해 `Bulk insert` 자체를 지원 안한다고 한다(시퀀스나 pk값을 자체적으로 프로그래밍 내에서 만들면 지원을 하긴 한다).

지원안한다고 하니 뭐 어떻게 해결할 방법이 없고 어쩔수 없이 차선책으로 `bulk insert` 해야할 때만 JDBC template를 쓰도록 하고 있다.
