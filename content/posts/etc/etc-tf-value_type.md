---
title: 'Terraform - value/type'
date: '2022-05-03T05:29:50.878Z'
template: 'post'
draft: false
category: 'etc'
tags:
  - 'terraform'
  - 'iac'
  - 'provider'
description: '테라폼 입력/출력값 및 type 종류'
---

테라폼에서 사용되는 값(입출력 값)들을 기반으로 인프라를 구성 할 수가 있고, 생성 된 리소스를 기반으로 또 다른 리소스를 구성 할 수가 있다.

## variable(input value)

입력 값을 기반으로 인프라를 구성하기 위해 사용된다. 즉, 소스 베이스는 그대로 인데 몇가지 값을 입력받아 구성하려고 할때 사용된다.

```
variable "ec2-ami" {
  type        = string
  description = "ec2 ami value"
  default     = "ami-014009fa4a1467d53"
}

resource "aws_instance" "test-ec2" {
  ami           = var.ec2-ami
  instance_type = "t2.micro"
}
```

`ec2`를 만들기 위한 `ami` 값을 외부에서 받기위해 `variable`로 분리해서 받고 있고, `var.ec2-ami`로 접근해서 입력 된 변수에 접근하고 있다.
`variable`은 type과 default value를 지정 할 수가 있다. 위 처럼 default value로 처리 할 수도 있지만 외부에서 값을 입력받는 대표적인 방법은 입력값들을 모아놓은 별도의 `file`로 분리하던가, 아님 cli를 통해 값을 입력 받을 수도 있다.

### 1. cli 명령어를 통한 variable 입력

```
variable "ec2-ami1" {
  type = string
  description = "ec2 ami value"
}

variable "ec2-ami2" {
  type        = string
  description = "ec2 ami value"
}

resource "aws_instance" "test-ec2-1" {
  ami           = var.ec2-ami1
  instance_type = "t2.micro"
}

resource "aws_instance" "test-ec2-2" {
  ami           = var.ec2-ami2
  instance_type = "t2.micro"
}
```

이러한 형태의 resource를 구성 한 후, cli를 통해 아래와 같이 입력하면 지정된 variable값을 입력 할 수가 있다.

```sh
$ terraform plan -var ec2-ami1="ami-014009fa4a1467d53" -var ec2-ami2="ami-014009fa4a1467d53"
```

### 2. 파일을 통합 variable 입력

`terraform` 파일이 있는 동일한 위치에 `terraform.tfvars` 파일을 위치 시킨후, 명령어를 실행하면 자동으로 해당 파일을 읽어들인다.

terraform.tfvars

```
ec2-ami1 = "ami-014009fa4a1467d53"
ec2-ami2 = "ami-014009fa4a1467d53"
```

일반 key-value 형태의 `json` 형태로 관리하기 위해 `terraform.tfvars.json` 파일을 만든 후, 그 안에 json 형태로 관리 할 수도 있지만 이런 json 파일은 주석이 안되서 개인적으로 그냥 파일로 입력하는걸 선호하고 있다. 일반 텍스트 파일이지만 `variable` 구조가 `map` 이어도 정상적으로 입력이 가능하다.

```
test-map = {
  "test1" : "test2",
  "test3" : "test4"
}
```

이런식으로 입력해도 map형태의 `test-map`라는 `variable`을 입력 할 수가 있다.

### validation

입력값 검증이 필요할 때 사용된다.

```
variable "val_1" {
  type        = string
  description = "값 테스트1"

  validation {
    condition     = length(var.val_1) > 10
    error_message = "10자 이상만 가능"
  }
}
```

위와 같이 구성하고 cli로 `terraform plan -var val_1="테스트값 1"` 를 입력하면 아래와 같이 validation 결과를 볼 수 있다.

```
│ Error: Invalid validation error message
│
│   on main.tf line 23, in variable "val_1":
│   23:     error_message = "10자 이상만 가능"
```

validation 하는 방법은 여러가지가 존재하고 그 중엔 정규 식도 가능하다 `can(regex(정규식_조건, 검사_대상))`,

## output

값을 출력 할때 사용된다. 생성 된 `resource`의 `arn`을 확인하기 위해 사용하거나 차후 이 `output` 값을 기반으로 다른 모듈을 구성하기 위해 참조용으로 사용된다.

### 기본 사용법

```
variable "test-value" {
  type    = string
  default = "test-value"
}

resource "aws_instance" "tf-ec2" {
  ami           = "ami-014009fa4a1467d53"
  instance_type = "t2.micro"
}

output "output-map" {

  value = var.test-value
}

output "created-ec2" {
  value = aws_instance.tf-ec2.arn
}
```

출력 샘플

```
Changes to Outputs:
  + created-ec2 = (known after apply)
  + output-map  = "test-value"
```

이런식으로 resource를 생성(위 샘플은 plan)시, arn 값 등을 알 수가 있다.

### sensitive

혹시나 생성 되는 값 노출을 숨겨야하지만 다른곳에서 참조해야 할 경우가 있을때, `sensitive` 값을 줘서 화면에 노출되는 것을 막을 수가 있다.

```
resource "aws_instance" "tf-ec2" {
  ami           = "ami-014009fa4a1467d53"
  instance_type = "t2.micro"
}

output "created-ec2" {
  value     = aws_instance.tf-ec2.arn
  sensitive = true
}
```

plan 결과

```
Changes to Outputs:
  + created-ec2 = (sensitive value)
```

이런식으로 값이 숨겨져서 출력된다.

## locals

`locals`는 입/출력 용도가 아닌 테라폼을 구성할 때 사용 할 임시 변수용도로 사용된다. 말 그대로 로컬용 변수값 이다.

```
locals {
  test_1 = "test1"
  test_2 = "test1"
  test_3 = {
    test_3_1 : "tesst-3-1"
    test_3_2 : "tesst-3-2"
  }
}

output "test_local_1" {
  value = local.test_1
}

output "test_local_2" {
  value = local.test_2
}

output "test_local_3" {
  value = local.test_3
}
```

plan 결과

```
Changes to Outputs:
  + test_local_1 = "test1"
  + test_local_2 = "test1"
  + test_local_3 = {
      + test_3_1 = "tesst-3-1"
      + test_3_2 = "tesst-3-2"
    }
```

주의 할 점은 `locals.key`가 아니라 `local.key`로 접근 해야 한다는 점이고, 보통 가독성을 위해 한번 거쳐가는 변수로 많이 사용된다

> 지금은 변수가 단순한 형태로 사용해서 별 필요성을 못느끼지만 값이 점점 복잡해지면 가독성을 위해서라도 많이 쓰게 된다.

#### locals를 활용한 공통 tags 샘플

```
locals {
  common_tags = {
    type = "web"
    env  = "dev"
  }
}

resource "aws_instance" "test_ec2" {
  ami               = "ami-014009fa4a1467d53"
  instance_type     = "t2.micro"

  #tags = local.ec2_common_tags # 이런식으로 직접 대입해서 사용도 가능하다.
  tags = merge(local.common_tags, {
    type       = "worker"
    size       = "small"
    department = "department1"
  })
}
```

이런식으로도 활용 할 수가 있다. 참고로 merge를 통해 나중에 추가 된 `type="worker"` 가 최종 type이 된다.

```
+ tags                                 = {
    + "department" = "department1"
    + "env"        = "dev"
    + "size"       = "small"
    + "type"       = "worker"
  }
```

## Type

테라폼에선 기본 타입(`string`, `number`, `bool` 등)으로 타입을 지정 할 수도 있지만 `collection` 타입도 사용이 가능하다.

- `list<type>`
- `set<type>`
- `map<type>`
- `object({key = name, ...})`
- `tuple(type...)`

여기서 `type`을 collection을 중첩해서 사용도 가능하다. 위 `collection` 타입들은 다른 언어에서도 많이 쓰이는 직관적인 타입이니까 구지 하나하나 설명하기 보단 그냥 결과 값을 보는게 더 빠를 것이라 생각된다.

```

variable "list_string" {
  type    = list(string)
  default = ["list", "string", "value"]
}

variable "set_string" {
  type    = set(string)
  default = ["list", "list", "string", "string", "value"]
}

variable "map_num" {
  type = map(number)
  default = {
    "val1" = 1
    "val2" = 2
    "val3" = 3
    "val4" = 4
  }
}

variable "object_key_val" {
  type = object({
    type   = string
    length = number
    is     = bool
  })
  default = {
    type   = "type1"
    length = 5
    is     = false
  }
}

variable "map_object" {
  type = map(object({
    type    = string
    count   = number
    private = bool
  }))

  default = {
    "private_ec2" = {
      count   = 2
      private = true
      type    = "smal"
    }
    "public_ec2" = {
      count   = 3
      private = false
      type    = "large"
    }
  }
}

variable "tuple_test" {
  type = tuple([string, number, bool])

  default = ["test", 1, false]
}

output "list_string" {
  value = var.list_string
}

output "set_string" {
  value = var.set_string

}

output "map_num" {
  value = var.map_num
}

output "map_num_val1" {
  value = var.map_num.val1
}

output "object_key_val" {
  value = var.object_key_val
}

output "object_key_val_type" {
  value = var.object_key_val.type
}

output "map_object" {
  value = var.map_object
}

output "tuple_test" {
  value = var.tuple_test
}

output "tuple_first" {
  value = var.tuple_test[0]
}
```

plan 결과

```
Changes to Outputs:
  + list_string         = [
      + "list",
      + "string",
      + "value",
    ]
  + map_num             = {
      + "val1" = 1
      + "val2" = 2
      + "val3" = 3
      + "val4" = 4
    }
  + map_num_val1        = 1
  + map_object          = {
      + "private_ec2" = {
          + count   = 2
          + private = true
          + type    = "smal"
        }
      + "public_ec2"  = {
          + count   = 3
          + private = false
          + type    = "large"
        }
    }
  + object_key_val      = {
      + is     = false
      + length = 5
      + type   = "type1"
    }
  + object_key_val_type = "type1"
  + set_string          = [
      + "list",
      + "string",
      + "value",
    ]
  + tuple_first         = "test"
  + tuple_test          = [
      + "test",
      + 1,
      + false,
    ]
```
