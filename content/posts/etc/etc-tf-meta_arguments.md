---
title: 'Terraform - Meta-Arguments'
date: '2022-06-14T13:38:51.206Z'
template: 'post'
draft: false
category: 'etc'
tags:
  - 'terraform'
  - 'iac'
description: '테라폼 대부분에 넣을 수 있는 기본 argument들'
---

# Meta-Arguments

모든 `Resource` 에서 기본적으로 사용 할 수 있는 `arguments` 들로, 바꿔말하면 특정 리소스에 종속 되지 않고 제공되는 기본적인 arguments 이다

## 1. depends_on

각 resource 들의 생성 되는 순서, 의존관계를 명시하기 위해 사용된다.

예를 들어, `EC2` 와 거기에 붙일 `EBS` 를 생성해야 한다면 먼저 `EBS` 를 먼저 생성하고, `ec2` 에 연결을 해 줘야 할 것이다. 그럴 때 아래와 같이 사용 할 수가 있다.

```
resource "aws_volume_attachment" "ebs_att" {
  device_name = "/dev/sdh"
  volume_id   = aws_ebs_volume.ec2_volume.id
  instance_id = aws_instance.server.id

  depends_on = [
    aws_ebs_volume.ec2_volume,
  ]
}

resource "aws_instance" "server" {
  ami               = "ami-014009fa4a1467d53"
  instance_type     = "t2.micro"
  availability_zone = "ap-northeast-2a"

  depends_on = [
    aws_ebs_volume.ec2_volume,
  ]
}

resource "aws_ebs_volume" "ec2_volume" {
  availability_zone = "ap-northeast-2a"
  size              = 30
}
```

`depends_on` 를 붙여 의존관계가 있는거, 즉 먼저 생성 되어야 하는 resource를 지정 할 수가 있다.

> 여기선 구지 예시를 들고 싶어서 이런식으로 resource를 따로 만들고 `depends_on` 을 붙였지만 `aws_instance`의 arguments로 `root_block_device` 가 있으니까 구지 이렇게 만들 필요까진 없다. 또한 기본적으로 의존관계를 명시 안해줘도 테라폼이 알아서 잘 생성해준다.

## 2. count

동일한 인스턴스를 여러개 생성하고 싶을때 사용한다. 예를 들어 동일한 타입의 `ec2` 를 여러개 만들고 싶을때가 있을 것이다. 그럴 때 여러 resource를 만들어 내는 방법도 있겠지만 count 를 쓰면 더 편하고 쉽게 생성&관리가 가능하다.

```
resource "aws_instance" "server" {
  ami               = "ami-014009fa4a1467d53"
  instance_type     = "t2.micro"
  availability_zone = "ap-northeast-2a"

  # 똑같은 ec2를 2개 만들어 낸다.
  count = 2
  tags = {
    Name = "Server ${count.index}"
  }
}
```

이러고 `plan` 결과를 보면 아래와 같이 나온다

```
aws_instance.web[0] will be created
  + resource "aws_instance" "web" {
 ... argument 정보
 tags = {
        + "Name" = "Server 0"
 }
}
aws_instance.web[1] will be created
  + resource "aws_instance" "web" {
 ... argument 정보
 tags = {
        + "Name" = "Server 1"
 }
}
Plan: 2 to add, 0 to change, 0 to destroy.
```

`${count.index}` 는 고유 index 정보를 의미한다.

## 3. for_each

목적은 `count` 와 동일하지만, count는 단순 개수에 대한 정보이지만 `for_each` 는 map, set 형태의 데이터 구조로 활용이 가능하다.

**Map**

```
resource "aws_instance" "server" {
  ami               = "ami-014009fa4a1467d53"
  instance_type     = "t2.micro"
  availability_zone = "ap-northeast-2a"

  for_each = {
    web_server : "nginx"
    was : "java"
  }

  tags = {
    "${each.key}" = each.value
  }
}
```

`plan` 결과

```
# aws_instance.server["nginx"] will be created
  + resource "aws_instance" "server" {
 ... argument 정보
 tags = {
        + "nginx" = "nginx"
 }
# aws_instance.server["was"] will be created
  + resource "aws_instance" "server" {
 ... argument 정보
 tags = {
        + "was" = "java"
 }
Plan: 2 to add, 0 to change, 0 to destroy.
```

**Set**

```
resource "aws_instance" "server" {
  ami               = "ami-014009fa4a1467d53"
  instance_type     = "t2.micro"
  availability_zone = "ap-northeast-2a"

  for_each = toset(["was", "web_server"])
  tags = {
    Name = "${each.key}"
  }
}
```

`plan` 결과

```
# aws_instance.server["was"] will be created
  + resource "aws_instance" "server" {
 ... argument 정보
 tags = {
        + "Name" = "was"
 }
# aws_instance.server["web_server"] will be created
  + resource "aws_instance" "server" {
 ... argument 정보
 tags = {
        + "Name" = "web_server"
 }
Plan: 2 to add, 0 to change, 0 to destroy.
```

생성되는 리소스들의 인덱스값도 한번쯤 참고하면서 보면 좋다.

**주의!**

각 `resource`에는 `count` or `for_each` 둘 중 하나만 사용이 가능하다.

## 4. provider

각 `resource`의 `provider`를 명시적으로 지정해 준다. 예를 들어 다른 `resource`는 다 서울 리전을 쓰는데 특정 `resource`만 도쿄 리전을 사용해야한다던가 할때 유용하다(멀티 리전).

## 5. lifecycle

`resource` 의 `lifecycle` 관련된 설정 값으로 resource가 생성, 변경, 삭제 관련해서 추가로 지정 된 액션을 하도록 설정 할 수 있다.

### `create_before_destroy` (true or false)

기본적으로 terraform은 resource를 수정 해야하는데 만약 해당 resource를 업데이트를 못한다면 삭제 후, 다시 생성한다.

Case 1.

만약 이렇게 설정을 걸어놨다가 보안관련 리소스(security group 같은거)를 수정하다가 해당 role이 삭제되는 짧은 순간 보안적으로 문제가 생길 수도 있다. 이런 상황을 대비하여 이 옵션을 걸어놓으면

1. 보안 관련 리소스 생성
2. 해당 resource에 적용
3. 이전 보안 관련 리소스 삭제

이런 식으로 안전하게 처리가 가능하다.

Case 2.

ELB를 재생성 해야 할때 이 옵션을 주면 먼저 생성 후, 삭제 해버리니까 중간에 딜레이 없이 무중단으로 변경이 가능하다고 한다. → route53 과 연관지어 생각하면 elb를 바꾸거나 할땐 가중치분산 을 활용하는게 정석으로 알고 있는데, 이 옵션만으로도 잘 작동 할 지는 확인 해봐야겠다.

### `Prevent_destroy`

리소스가 삭제되는 걸 방지한다.

```
resource "aws_instance" "server" {
  ami               = "ami-014009fa4a1467d53"
  instance_type     = "t2.micro"

  lifecycle {
    prevent_destroy = true
  }
}
```

이런식으로 삭제 방지 옵션을 주고 `terraform destroy` 를 하면

```
aws_instance.server: Refreshing state... [id=i-xxxxxxxxxx]
╷
│ Error: Instance cannot be destroyed
│
│   on ec2.tf line 98:
│   98: resource "aws_instance" "server" {
│
│ Resource aws_instance.server has lifecycle.prevent_destroy set, but the plan calls for this resource to be destroyed. To avoid this error and continue with the
│ plan, either disable lifecycle.prevent_destroy or reduce the scope of the plan using the -target flag.
```

만약 충분히 다 인지하고 진짜로 resource를 삭제하고 싶으면 `prevent_destroy` 옵션을 주석 처리하고 destroy 하면 된다.

### Ignore_changes

최초 apply 시에만 적용 하고, 그 이후의 변화는 ignore 할때 사용된다.

```
resource "aws_instance" "server" {
  ami               = "ami-014009fa4a1467d53"
  instance_type     = "t2.micro"
  availability_zone = "ap-northeast-2a"

  lifecycle {
    ignore_changes = [무시할_argument_목록]
  }
}
```

이게 사용되어야 하는 케이스는 아직 잘 와닿지는 않는다

### Provisioner

해당 리소스에 특정 작업을 수행하기 위해 리소스 로컬에서 or 원격 시스템에서 스크립트를 실행하고 싶을때 사용된다.

- local-exec : 내 로컬(ex macbook)에서 실행되는 명령어

```
resource "aws_instance" "server" {
  ami               = "ami-014009fa4a1467d53"
  instance_type     = "t2.micro"

  provisioner "local-exec" {
    command = "hostname"
  }
}
```

- hostname 명령어 실행 결과
  aws_instance.server: Creating...
  aws_instance.server: Still creating... [10s elapsed]
  aws_instance.server: Still creating... [20s elapsed]
  aws_instance.server: Provisioning with 'local-exec'...
  aws_instance.server (local-exec): Executing: ["/bin/sh" "-c" "hostname"]
  aws_instance.server (local-exec): kimjoohyung-ui-MacBookPro.local
  aws_instance.server: Creation complete after 27s [id=i-0f2157fc11e6ba5a9]

실행한 컴퓨터의 로컬 hostname이 출력되는걸 확인 할 수 있다.

- remote-exec

해당 리소스에서 직접 실행되는 명령어다. ec2라면 `connection` 정보를 줘서 ssh로 접근 한 후, 명령어를 실행 시킬 수가 있다.

또한 `when` 옵션을 줘서 실행 주기를 바꿀 수가 있다.

```
provisioner "local-exec" {
    when    = destroy
    command = "echo 'Destroy-time provisioner'"
  }
```

이렇게 하면 리소스가 삭제 되는 시기에 명령어가 실행된다. 명령어 실행이 실패를 대비한 옵션 (`on_failure`) 옵션도 제공해준다.

> **Note:** Provisioners should only be used as a last resort. For most common situations there are better alternatives.

왠만하면 쓰지 말라고 한다.... ec2에는 비슷한 역할을 하는 `user_data` 라는 얘도 있으니 참고하자

- 공식 문서
  [https://www.terraform.io/language/resources/syntax#meta-arguments](https://www.terraform.io/language/resources/syntax#meta-arguments)
