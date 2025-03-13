---
title: "멀티모듈 환경에서 동적 Bean 생성"
date: "2023-12-06T07:42:12.783Z"
template: "post"
draft: false
category: "spring"
tags:
  - "multi-module"
  - "spring"
description: "DeferredImportSelector를 사용하여 각 모듈마다 필요한 Bean 동적으로 생성"
---

`Spring`에서 동적으로 `Bean`을 생성하는 것은 몇가지 방법이 있다. 대표적으로

1. `ConditionalOnProperty`

   해당 어노테이션을 사용해서 `application.yml`에 지정된 설정을 기반으로 생성 가능

2. `ConditionalOnBean` / `ConditionalOnMissingBean`

   지정 된 `Bean(Class)`이 등록 되었을때 or 등록 되지 않았을 때 해당 `Bean`을 생성 가능

이러한 어노테이션만 잘 사용해도 불필요한 `Bean`은 구지 생성하지 않고 사용이 가능하다. 하지만 이러한 종류는 단점이 있는데, 모듈을 사용하는 입장이라면 어떠한 기능들이 있는지 파악하기가 어렵고, 컴파일 레벨에서 내가 어떠한 기능들을 사용할 껀지 체크하기가 힘들어 실수할 여지도 존재한다.

그 외에 다른 방식으로 `@Lazy` 어노테이션을 사용해서 실제로 필요하기 전 까지 `Bean` 생성을 막는것도 괜찮은 방식이긴 하지만 막상 사용할려고 할때 객체 생성에 실패 할 수가 있어서 개인적으로 좋아하진 않는다.

> 초기 Bean을 생성하는 방식도 에러를 컴파일 단계가 아닌 `Runtime`이긴 하지만 적어도 배포 단계에서 실패 할 테니까 개발자가 인지하기가 쉽다

---

# DeferredImportSelector

그래서 이번에 다룰 `DeferredImportSelector`를 활용하여 초기 셋팅만 잘 갖춰진다면 위에서 말한 `선택 가능한 기능 파악 불가`, `컴파일 레벨에서 원하는 기능 지정 불가` 이 두가지 문제를 해결 할 수가 있다.

아래와 같은 멀티모듈 구조를 가지는 프로젝트가 있다고 가정. `api-server`는 독립적으로 가능한 어플리케이션이고 `module-core`는 단독으로 실행은 불가능한 여러 기능들을 담은 모듈이다

```
.
├── api-server
│   ├── build
│   ├── build.gradle.kts
│   └── src
├── build.gradle.kts
├── module-core
│   └── src
│       └── main
│           └── kotlin
│               └── com.core
│                   ├── EnableModuleCore.kt
│                   ├── module_one
│                   │   ├── ModuleOneConfig.kt
│                   │   └── core
│                   │       └── ModuleOneComponent.kt
│                   └── module_two
│                       ├── ModuleTwoConfig.kt
│                       └── core
│                           └── ModuleTwoComponent.kt
└── settings.gradle.kts
```

`module-core` 모듈 하위에 `ModuleOne`이라는 기능, `ModuleTwo`기능이 존재하는데 이 기능 중 선택하여 초기화 싶다면 아래와 같이 하면 된다.

## 1. 원하는 모듈 Flag로 사용 할 Enum 분류

```kotlin
/**
 * 초기화 하는 대상(경로)을 마킹하는 interface
 */
interface ModuleConfiguration

enum class ConfigModules(
    val configClass: KClass<out ModuleConfiguration>
) {

    ModuleOneCore(ModuleOneConfig::class),
    ModuleTwoCore(ModuleTwoConfig::class),
}
```

`Enum` 값 자체는 원하는 모듈을 선택하기 위한 값이 되고, `ModuleOneConfig.kt`, `ModuleTwoConfig.kt`는 위에서 나열한 프로젝트 구조에서 원하는 모듈 config를 지정해주는 방식이다.

## 2. 하위 컴포넌트 초기화

```kotlin
// ModuleOneConfig.kt
@Configuration
@ComponentScan(basePackageClasses = [ModuleOneConfig::class])
class ModuleOneConfig: ModuleConfiguration

// ModuleTwoConfig.kt
@Configuration
@ComponentScan(basePackageClasses = [ModuleTwoConfig::class])
class ModuleTwoConfig: ModuleConfiguration
```
