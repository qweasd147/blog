---
title: "Terraform으로 구축하는 AWS Aurora DB"
date: "2024-08-14T08:11:14.437Z"
template: "post"
draft: false
category: "aws"
tags:
  - "aws"
  - "db"
  - "auroradb"
description: "Terraform으로 aurora DB 구축 및 주요 옵션 설명"
---

DB 구축을 주제로 blog를 쓰게 될 줄은 몰랐는데, 여지것 남이 구축 or 구축 된 환경에서만 개발하다가 막연히 어려울 것이 없을 줄 알고 딱히 관심도 없었는데 이번에 막상 구축해보니 생각보다 어렵고 삽질도 많이하게 되어 정리할 겸 쓰게 되었다. 역시 해봐야 깨닫게 되는거 같다(물론 다음에 한다면 훨씬 쉽게 구축이 가능 하리라 생각된다).

## 사전 준비

- terraform
- awscli(계정 & credentials 셋팅 포함)
- aws key pair

> key pair는 베스천 서버 구축을 위한 것으로(ec2 접속을 비밀번호가 아닌 ssh로 접속) 셋팅이 안되어 있다면 [여기](https://github.com/qweasd147/StudyNote/tree/master/terraform/key_pair) 를 참고해서 privacy key를 aws에 등록 시켜놓는다.

# 구성

실행은 [terraform auroradb(Mysql 8.0)](https://github.com/qweasd147/StudyNote/tree/master/terraform/db)에 다운로드 및 terraform init, apply 순서로 실행 시킨다.

```sh
$ terraform init
$ terraform apply
```

최초 계정은 `admin`/`admin1234!` 로 생성 되며 필요에 따라 바꾸던가 `terraform`의 `random_password`를 사용해서 개선하여 사용하는것도 좋은 방법이다.

프로비저닝이 끝나면 아래와 같은 구조로 클러스터가 만들어지는데
![multi-az-cluster](/media/multi-az-db-cluster.png)

대표적으로 하나의 `Writer DB Instance`와 여러 `Reader DB Instance`가 각자 다른 `AZ`에 구축이 된다. 이는 `subnet group`에 영향을 받는 점 참고 하면 된다.

```
resource "aws_db_subnet_group" "db-subnet-group" {
  name        = "db-pri-subnet-group"
  subnet_ids  = var.pri-subnets-id
  description = "Private DB Subnet Group"
}
```

이런식으로 여러 서브넷을 그룹으로 묶은 다음, `cluster`에 지정하면 알아서 Mutli AZ 구성이 끝나게 된다.

> 물론 subnet들의 az는 여러개로 구성되게 만들고, private subnet에 구성 하는걸 추천한다.

![aws-az-cluster](/media/aws-cluster.png)
비용 문제로 `instance2`는 코드 상에 주석 처리 되어 있는데 주석을 풀고 배포하면 위와 같이 2개의 인스턴스가 각자 다른 AZ에 Writer/Reader로 구분되어 배포되는것을 확인 할 수 있다.

> 인스턴스를 늘리면 나머지 AZ에 자동으로 할당 되고, 반대로 인스턴스를 하나로 줄이면 한대로 하나의 인스턴스가 reader, writer 역할을 다 하게 된다. 하나의 인스턴스로 구성 할 경우, 이때 생성 된 `reader-endpoint`로도 쓰기 작업이 가능했던걸로 기억하고 있다.

이런 DB cluster에 외부에서 접근 할 수 있게 `public subnet`에 베스천 서버(ec2)를 올리고 elastic ip를 꽂아 터널링하여 접근하는 방식이다.

## 주요 옵션 설명

### Cluster 버전 및 인스턴스 타입

서브넷 그룹은 위에서 `다중 AZ`를 구성하면서 설명했으니 넘어가고 서버 인스턴스 타입은 `db.t3.medium`로 구성하였는데, 제약사항이 존재하다. 해당 db는 테스트 용도니까 당연히 `micro`나 `small`로 구성하고 싶었지만 엔진 버전이 3이상 쓸려면 `medium` 버전을 써야만 한다.

![aws-az-cluster](/media/db-support-type.png)

[인스턴스 클래스별 지원 버전](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/AuroraUserGuide/Concepts.DBInstanceClass.html)

[mysql 버전 및 auroradb 버전 정보](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraMySQLReleaseNotes/AuroraMySQL.Updates.30Updates.html)

> 첫번째 링크에서 `DB 인스턴스 클래스에 지원되는 DB 엔진`에서 확인 가능하고, 엔진 버전이 2를 쓰면 small도 사용가능하지만 구지 이전 버전을 테스트 용도라도 별로 쓰고 싶진 않았다. 근데 `db.t3.medium` 타입은 performance insight를 사용 못하니깐 현업에서 실제로 구축 해야한다면 더 높은 타입을 써야한다.

### Cluster parameter group

`parameger group`은 `cluster`에 적용 할수도 있고, `cluster`의 `instance`에 적용 할 수 있다. 일단 `cluster`의 파라미터만 지정하였고, 일반적으로 자주 사용되고 언급되는 옵션은 아래와 같다

- `time_zone` -> DB time zone 지정.
- `long_query_time` -> slow query 기준 시간(단위 초)
- `slow_query_log` -> slow query를 log로 남길지 여부(0 비활성화, 1 활성화)
- `performance_schema` -> performance schema 활성화 여부. 활성화 하면 성능저하가 조금 있다
- `innodb_print_all_deadlocks` -> dead lock 쿼리를 error log로 남길지 여부

개인적으론 위 옵션을 다 활성화 하는게 좋다고 생각되고 `performance_schema`는 조금 고민해 볼 필요가 있다고 생각된다.

### slow query

`long_query_time`와 `slow_query_log`를 지정하면 slow query가 기록 되지만 이건 instance의 로그파일에서나 볼 수 있다. 좀더 범용적으로 보기 위해선 `cloudwatch`로 보내는게 좋고, cluster에 `enabled_cloudwatch_logs_exports`를 설정해야 `slow query` 나 `error` 로그들이 cloudwatch로 전송된다.

### Performance insight

`performance_insights_enabled`이 옵션으로 활성화/비활성화가 가능하고, 이건 무조건 키는게 좋지만 (보존 기간 설정이 7일 까지는 무료) 인스턴스 타입에 따라 지원이 불가능 할 수도 있다. 실제 운영환경에선 성능이 좋은 타입을 선택 할 테니까 무조건 활성화 하고, 추가로 `향상된 모니터링(Enhanced Monitoring)`도 돈이 더 들지만 운영 환경은 활성화 시키는걸 추천한다
