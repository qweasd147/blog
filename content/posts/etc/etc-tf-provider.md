---
title: 'Terraform - 기본'
date: '2022-03-30T05:56:58.276Z'
template: 'post'
draft: false
category: 'etc'
tags:
  - 'terraform'
  - 'iac'
  - 'provider'
description: '테라폼 기본 설명 + Provider 역할'
---

예전엔 인프라 구성이라고 해봤자 그냥 리눅스 서버 한대 올리고 그곳에 모든 어플리케이션(웹서버, db, was 등등)을 설치하고 사용해서 프로비저닝에 대한 별다른 불편함을 느끼지 못했다. 근데 요즘엔 클라우드 서비스 중에서 `IaaS`를 제공해 주는곳도 많고 그 종류도 다양해져서, 그 사이 연관관계의 복잡함, 한번 설치하고 다른곳에 똑같이 설치하는데에도 실수나 시간도 많이 걸리는 단점이 눈에 띄게 생겨났다. 이런 서비스들 설치와 연관관계 등을 소스코드로 관리하고 설치 할 수 있다면 휴먼에러나 시간을 줄일 수가 있는데, 이런 방식을 IaC(`Infrastructure as Code`)라고 하며, `Terraform`은 `IaC`를 위한 도구로 사용된다.

# 1. Terraform 구성 요소

## provider

`Infrastructure`를 제공해주는 곳을 말한다. 대표적으로 `aws` , `GCP` , `Azure` 가 있지만 다른것들은 사실 관심없고 앞으로 다룰 모든 예제는 `aws`로만 할꺼다.

> 테라폼은 `IaC` 도구일 뿐이지 특정 서비스(`aws`, `CGP` 등등)에 종속적인 기술이 아니다.

## resource

인프라 resource 종류라고 생각하면 된다. `ec2`나 `s3`, `RDS` 등 그냥 `provider`에서 제공 해주는 서비스들이라 생각하면 편하다.

## values

input/output values 랑 local values를 통칭해서 적어봤는데 연관된 리소스들을 하나의 모듈 단위로 만들었을 때 필요한 값들(arguments), 또 이 모듈을 참조 하여 다른곳에서 사용할 때 필요한 값들(output)을 말한다.

## module

위에서 설명한 대로 여러 resource들을 소스 코드를 통해 하나로 묶어 모듈단위로 만들어 관리하는걸 의미한다. 예를들어 `cloud front` + `s3`를 기반으로 `CDN Server` 라는 모듈을 구성 할 수도 있고, `ec2` + `vpc` + `security group` 를 기반으로 `Worker Node` 라는 모듈을 구성한다고 생각하면 이해가 될 것이다. input values를 통해 필요한 파라미터를 받도록 구성이 가능하다.

## state

테라폼을 통해 인프라를 구성하고 끝나는게 아니라, 이 인프라 구성요소들(resource 들) 관리하는 하는 역할 까지(추가, 수정, 삭제 등등) 가능하다. 그러기 위해 현재 배포 된 resource 들의 상태 값들을 따로 저장/관리 해주는 역할까지 지원해준다. 이런 state값들을 그냥 local에서 관리 할 수도 있지만 다른 원격지(backend라고 한다)로 저장도 가능하여 여러 관리자가 동일한 서비스를 관리 할 수도 있다.

> 그냥 git 같은 버전 관리나 별도의 ec2 + cloud9, 아님 terraform cloud 또는 aws 저장소(s3& dynamodb ) 등등을 통해 여러 사람이 관리 할 수 있게 도와주고 있으며, 인프라 구성 중 다른 사람과 충돌을 방지하기 위해 lock 같은 상태값도 존재한다. 이런 내용은 나중에 다시 실습을 하며 살펴 볼 예정이다.

# 2. Terraform 명령어

## init

그냥 `git init` 같은거라고 생각하면 된다. 필요한 plugin 들을 설치 하는 과정으로, 현재 위치를 기준으로 xxx.tf 파일을 확인하여 필요한 플러그인을 설치한다. 주의 할 점으로 설치되는 것들은 provider에 종속적이니까 {파일명}.tf 파일을 만든 후, provider를 구성한 후에 init을 통해 필요한 plugin들이 설치되도록 유도해줘야 한다.

## plan

코드를 쓰고 실행 계획을 보고 싶을 때 사용되는데, 현재 state를 기준으로 `resource` 등이 어떻게 변하는지(추가/수정/삭제 되는 `resource`)와 각 `argumetns` 값들을 확인 할 수가 있다.

## apply

plan을 통해 예상되는 내용을 확인하고 apply로 진짜 실행 되도록 명령한다.

## destroy

실제 배포된 `resource`들을 제거 할때 사용된다. 리소스들의 삭제 방지 옵션을 줄 수도 있다(라이브 인프라 `resource`들을 실수로 다 날려먹으면 안되니까).

## import

이건 역으로 이미 배포 된 사항을 state로 옮겨주는 역할을 수행한다. 먼저 웹으로 구성 후, 소스코드로 똑같이 작성였다고 하더라도, 내부 `state`값이 다를 때 동기화를 위해 사용된다.

# 3. Provider

앞서 설명 했듯이, 인프라 서비스를 제공해주는 cloud 서비스(`IaaS`)를 제공해주는 곳은 많다. 대표적으로 `AWS` 부터 Naver Cloud(`ncloud`)도 있는데 terraform은 이런 특정 플랫폼에 종속되는것이 아니다.

> 물론 그렇다고 완벽하게 추상화 되어 소스 코드는 그대로 인데 provider만 바꿔 사용할 수 있다거나 하는건 전혀 아니다.

테라폼에서 `Provider`는 이런 서비스들의 정보를 지정하고, 사용되는 플러그인 등의 정보, 버전을 관리하는 역할을 한다.

```
# 1. terraform 버전 정보와 provider 상세 정보 명시.
# 옵션값인데 안쓰면 현재 terraform version과 연결된 provider 기본 버전 정보로 셋팅된다.
terraform {
  required_version = ">= 0.14.3"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.50.0"
    }
  }
}

# 2. aws default region + credentials 값 지정
provider "aws" {
  region = "ap-northeast-2"
  shared_credentials_files = ["~/.aws/credentials"]
}
```

## 3.1 terraform 버전 정보

terraform도 꾸준히 버전이 올라가고, 그에따라 기존 코드들은 deprecated 될 수도 있다. 주의 할 점은 이 테라폼 버전 정보는 옵션값으로 필수값이 아닌데, 명시해주지 않으면 로컬 버전을 그대로 따라게가 된다. 이전에 `Serverless framework` 를 오래동안 써보면서 버전을 별로 신경쓰지 않았다가(`Serverless frameowrk` 도 버전 명시 안해주면 로컬 버전 따라간다) 로컬 환경에 메이저 버전 올리면서 기존 코드에서 호환되지 않은 부분이 많이 생겨 문제가 됬던 기억이 있는데, 테라폼을 쓸 땐 이런 버전 정보는 무조건 명시하면서 공부 할 예정이다.

> 뭐 state 값들도 함께 버전 관리 하면 알아서 이런것도 관리해주니까 구지 필요는 없겠지만 진짜 이 코드를 항상 똑같은 환경에서 실행한다는 보장이 없으니까 적어주는게 좋다고 생각된다.

### required_providers

서비스 provider를 명시하는 block이다. 기본적인 구성요소로는

- source : provider 대상 정보. 보통 (namespace)/(type)으로 구성된다.
- version : provider 의 버전 정보

참고로 `Official` tier는 `hashicorp` 라는 namespace를 갖는다.

> Official providers are owned and maintained by HashiCorp.

## 3.2 aws default region + credentials 값 지정

기본 aws 리전 + access&secret key(`credentials`) 값 지정한다(직접 명시 할 수 있고, 위 처럼 `credentials` +@로 profile 도 활용 할 수 있다). 이걸 명시하면 기본적인 모든 resource들은 다 aws를 provider로 인식하고 기본 리전 값을 기반으로 셋팅된다. 혹시나 몇몇 resource 들은 특정 리전값으로 바꿔서 활용하고 싶으면 multi provider로 구성하여 사용하면 된다.

```
provider "aws" {
   region  = "us-east-1"
   alias   = "east"
}
```

이런식으로 provider를 하나 더 추가하고(alias는 필수값이 된다) resource를 만들 때 provider로 해당 alias 값을 연결하면 해당 리소스만 `us-east-1` 으로 사용이 가능하다.
