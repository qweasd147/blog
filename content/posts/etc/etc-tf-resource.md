---
title: 'Terraform - Resource'
date: '2022-04-15T01:28:28.137Z'
template: 'post'
draft: false
category: 'etc'
tags:
  - 'terraform'
  - 'iac'
  - 'aws'
description: '테라폼으로 provider(aws) 서비스를 사용하려고 할때 + Meta-Arguments'
---

## 1. Resource

실질적으로 aws 서비스(ec2, s3, rds 등등)들을 프로비저닝 할 수 있는 코드들이 된다.

기본 문법으로는 아래와 같다.

```
resource "aws_resource_name" "tf_고유_이름" {

   # TODO : 각 resource에 필요한 arguments 들
}
```

주의 할 점으로는 여기서 말하는 `tf_고유_이름`은 테라폼이 내부적으로 리소스를 구분하기 위한 고유 key값이 된다. 즉, 동일한 종류의 `resource` 중에선 유니크 해야하며, 이 이름이 aws에서 표기되는 이름과는 연관이 없다(리소스 종류별로 조금씩 다르긴 하다)

ec2 인스턴스 한대를 올리기 위한 샘플은 아래와 같이 작성하면 된다.

```
resource "aws_instance" "test-ec2-instance" {
  ami           = "ami-014009fa4a1467d53"
  instance_type = "t2.micro"
}
```

결국엔 필요한 `arguments`와 각 리소스 간의 특징을 잘 알아야하는데 그 말은 `terraform`만 알면 안되고 `aws`로 잘 해야 한다는 점이다.
aws는 그냥 꾸준히 공부하고 구성에 필요한 내용은 테라폼 공식 문서를 참고해서 구현하면 된다

> https://registry.terraform.io/providers/hashicorp/aws/latest/docs

## 2. Meta-Arguments

모든 `Resource`에 기본적으로 적용할 수가 있는 `arguments`들이 있다. 바꺼 ㅁㄹ하면 특정 리소스에 종속되지 않고 제공되는 가장 기본적인 `arguments` 이다.

### 2.1 depends_on

프로비저닝을 위해 각 resource 간에 생성되는 순서를 명시 해야하거나 참조되는 `attribute`를 위해 의존관계를 명시하기 위해 사용된다.

예를들어 `ec2`와 거기에 붙일 `EBS`가 필요하다면 `EBS`를 먼저 생성하고 `ec2`에 연결을 해 줘야 할것이다. 그럴 때 아래와 같이 사용 할 수가 있다.

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

`depends_on`를 붙여 먼저 생성되어야 하는 resource를 지정 할 수가 있다.

> 여기선 구지 예시를 들고 싶어서 이런식으로 구성하였지만 `aws_instance`의 arguments로 `root_block_device`가 있으니 이렇게 구지 따로 만들 필요까진 없고, 기본적으로 의존관계를 명시 안해줘도 테라폼이 알아서 필요한 순서대로 생성해준다.

### 2.2 count

동일한 `resource`를 여러개 생성하고 싶을 때 사용한다. 예를들어 동일한 타입의 `ec2`를 여러개 만들고 싶을때 `resource`를 여러번 정의 할 수도 있겠지만 그냥 `count`를 쓰면 더 편하고 쉽게 생성이 가능하다.

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

plan또는 apply를 해보면 아래와같이 2개의 인스턴스가 생성되고, 이 리소스의 고유한 key값으로 `web[0]`과 `web[1]`가 생성되는 것도 함께 기억해야한다(count는 index기반으로 키가 생성된다)

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

### 2.3 for_each

목적은 count 와 동일하지만, count는 단순 개수에 대한 정보이지만 for_each 는 map, set 형태의 데이터 구조로 활용이 가능하다.

#### 2.3.1 Map

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
        + "web_server" = "nginx"
 }
# aws_instance.server["was"] will be created
  + resource "aws_instance" "server" {
 ... argument 정보
 tags = {
        + "was" = "java"
 }
Plan: 2 to add, 0 to change, 0 to destroy.
```

#### 2.3.2 Set

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

plan 결과

```
# aws_instance.server["was"] will be created
  + resource "aws_instance" "server" {
  ... argument 정보

  tags_all                             = {
    + "was" = "java"
  }
# aws_instance.server["web_server"] will be created
  + resource "aws_instance" "server" {
  ... argument 정보
  tags_all                             = {
    + "web_server" = "nginx"
  }
Plan: 2 to add, 0 to change, 0 to destroy.
```

꼭꼭 기억해야할 점으로 `count`와 다르게 map이나 set으로 구성하면 리소스 구분 키값으로 `server["was"]`, `server["web_server"]` 이런식으로 key값이 그대로 유니크 키로 적용 된다는 점이다.

또한 각 `resource`에는 `count` or `for_each` 둘 중 하나만 사용이 가능하다.

### 2.4 provider

각 `resource`의 `provider`를 명시적으로 지정 해준다. 예를 들어 다른 `resource`는 다 서울 리전을 쓰는데 특정 `resource`만 도쿄 리전을 사용해야한다던가 할때 유용하다(멀티 리전).

### 2.5 lifecycle

`resource`의 `lifecycle` 관련된 설정 값으로 `resource`가 생성, 변경, 삭제 관련해서 추가로 지정 된 액션을 하도록 설정 할 수 있다.

#### 2.5.1 create_before_destroy

기본적으로 `terraform`은 `resource`를 수정 해야하는데 만약 해당 `resource`가 무중단 업데이트가 불가능하다고 판단되면 삭제 후 다시 생성한다.

예를 들어 만약 보안관련 리소스(`security group` 같은거)를 수정하다가 해당 `role`이 삭제되는 짧은 순간 보안적으로 문제가 생길 수도 있다. 이런상황을 대비하여 이 옵션을 걸어두면 `old 조건`이 삭제 전 `new 조건`이 추가되니까 특별히 문제가 될 것이 없다

1. 보안 관련 리소스 생성
2. 해당 resource에 적용
3. 이전 보안 관련 리소스 삭제

이런식으로 안전하게 처리가 가능하다.

#### 2.5.2 prevent_destroy

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

이런식으로 삭제 방지 옵션을 주고 terraform destroy를 하면

```
╷
│ Error: Instance cannot be destroyed
│
│   on main.tf line 44:
│   44: resource "aws_instance" "server" {
│
│ Resource aws_instance.server has lifecycle.prevent_destroy set, but the plan calls for this resource to be destroyed. To avoid this error
│ and continue with the plan, either disable lifecycle.prevent_destroy or reduce the scope of the plan using the -target flag.
```

만약 충분히 다 인지하고 진짜로 resource를 삭제하고 싶으면 `prevent_destroy`옵션을 주석 처리하고 destroy 하면 된다.

#### 2.5.3 Ignore_changes

최초 apply 시에만 적용하고, 그 이후의 변화는 무시할 때 사용된다.

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

### 2.6 Provisioner

해당 리소스에 특정 작업을 수행하기 위해 리소스 로컬 ㄸ는 원격 시스템에서 스크립트를 실행 하고 싶을때 사용된다.

#### 2.6.1 local-exec

내 로컬에서 실행되는 명령어를 정의한다.

```
resource "aws_instance" "server" {
  ami               = "ami-014009fa4a1467d53"
  instance_type     = "t2.micro"

  provisioner "local-exec" {
    command = "hostname"
  }
}
```

apply하면 아래처럼 표출된다.

```
aws_instance.server: Creating...
aws_instance.server: Still creating... [10s elapsed]
aws_instance.server: Still creating... [20s elapsed]
aws_instance.server: Provisioning with 'local-exec'...
aws_instance.server (local-exec): Executing: ["/bin/sh" "-c" "hostname"]
aws_instance.server (local-exec): 내꺼_개인_컴퓨터_hostname
aws_instance.server: Creation complete after 27s [id=i-0f2157fc11e6ba5a9]
```

또한 `when` 옵션을 줘서 실행 주기를 바꿀 수가 있다.

```
provisioner "local-exec" {
  when    = destroy
  command = "echo 'Destroy-time provisioner'"
}
```

이렇게 하면 리소스가 삭제되는 시기에 명령어가 실행된다. 명령어 실행이 실패를 대비한 옵션(`on_failure`) 옵션도 제공해준다.

#### 2.6.2 remote-exec

해당 리소스에서 직접 실행되는 명령어이다. ec2라면 `connection` 정보를 줘서 ssh로 접근 한 후, 명령어를 실행 시킬 수가 있다.

**주의!**

> Note: Provisioners should only be used as a last resort. For most common situations there are better alternatives.

왠만하면 쓰지 말라고 한다... `ec2`는 비슷한 역할을 하는 `user_data`라는 옵션도 있으니 필요하면 이 옵션을 사용하면 될 것이다.

> https://www.terraform.io/language/resources/syntax#meta-arguments
