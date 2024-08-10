---
title: "Terraform으로 구축하는 eks"
date: "2024-08-10T16:27:52.350Z"
template: "post"
draft: false
category: "aws"
tags:
  - "aws"
  - "eks"
  - "kubernetes"
description: "Terraform으로 eks 구축 및 배포 실습, 자주 쓰는 명령어들 모음"
---

`terraform`으로 구현한 내용은 [eks 예제](https://github.com/qweasd147/StudyNote/tree/master/terraform/eks_module) 에서 확인 가능하다

> 외부 모듈을 안쓰고 바닐라로 구현하고 싶었는데 잘 안되서 포기

## 사전 준비

1. 필요 도구

- terraform
- docker
- awscli
- helm

2. aws credentials 셋팅

terraform에서 구축한건 기본적으로 profile이 `joo`로 셋팅 되어 있다. 필요에 따라 profile을 바꾸던가 지우고 profile에 맞는 aws의 `config`파일과 `credentials` 파일을 셋팅해주자

#### 샘플

~/.aws/config

```
[default]
output=json
region=ap-northeast-2
```

~/.aws/credentails

```
[joo]
aws_access_key_id     = xxxxxx
aws_secret_access_key = xxxxxx
```

3. account 정보 확인

자신의 `account id`를 사전에 알고 있는게 좋다. 아래 명령어를 통해 확인 가능하고, 샘플 코드에 필요한 부분은 전부 `{accountId}` 로 대체

```sh
$ aws sts get-caller-identity --profile joo
```

```
{
    "UserId": "{userId}",
    "Account": "{accountId}",
    "Arn": "arn:aws:iam::{accountId}:user/{userName}"
}
```

참고로 코드 내 리전 셋팅은 다 그냥 `ap-northeast-2`로 하드코딩 되어 있다.

# 실습

## 1. terraform으로 eks 구축.

```sh
$ cd ./eks_module
$ terraform init
$ terraform apply
```

> vpc부터 생성하기 때문에 혹시나 `cidr block` 값이 문제된다면 알아서 잘 수정해주자

> 여기서 `aws load balancer controller` 설치까지 프로비저닝 된다

> `aws load balancer controller`란 aws에서 관리형 k8s가 eks이라서(의존관계가 `eks` -> `k8s`) 일반적으로 k8s에서 elb를 만들 수가 없지만 이를 가능하게 해주는게 `aws load balancer controller`로, eks 위에 설치하면 `ingress`나 `service`를 만들때 `elb`도 자동으로 프로비저닝 되도록 구축 할 수가 있다(`alb`도 가능)

## 2. kubectl 셋팅 및 확인

### 2.1 eks context 업데이트

```sh
# kubectl에서 대상이 되는 eks 지정. 지금은 eks 이름이 'test_eks'이지만 필요에 따라 수정이 필요함
$ aws eks update-kubeconfig --region ap-northeast-2 --profile joo --name test_eks --alias test_eks
```

### 2.2 현재 지정 된 k8s 확인

```sh
$ cat ~/.kube/config
$ kubectl config current-context # 현재 클러스터 확인
```

## 3. terraform으로 생성 된 ecr에 로컬에서 빌드 & 빌드한 이미지 push

### 3.1 docker build

```sh
# download nginx image
$ docker pull nginx:1.23.3
# build
$ cd ./nginx
# mac에서 빌드 해서 platform 추가됨
$ docker build --platform linux/amd64 -t aws-container-nginx:1.0.0 .
```

### 3.2 ecr login

```sh
# ecr 로그인(도커 허브 로그인이라고 생각하면 된다)
$ aws ecr get-login-password --region ap-northeast-2 --profile joo | docker login --username AWS --password-stdin {accountId}.dkr.ecr.ap-northeast-2.amazonaws.com/test_eks-aws-container-nginx
# 로그인 확인
$ cat ~/.docker/config.json
# ecr 정보 확인
$ aws ecr describe-repositories --region ap-northeast-2 --profile joo
```

### 3.3 ecr로 image push

```sh
$ docker tag aws-container-nginx:1.0.0 {accountId}.dkr.ecr.ap-northeast-2.amazonaws.com/test_eks-aws-container-nginx:1.0.0
$ docker push {accountId}.dkr.ecr.ap-northeast-2.amazonaws.com/test_eks-aws-container-nginx:1.0.0
```

> 생성된 하나의 ecr마다 각 하나의 image repository가 된다는점 참고 하자

## 4. eks에 namespace, depoyment(pod) 배포

### 4.1 namespace 배포 및 default namespace 변경(kubectl 사용 시)

```sh
$ kubectl apply -f objects/namespace.yaml
$ kubectl config set-context --current --namespace joo
```

### 4.2 deployment 적용

**주의!** `objects/deployment.yaml`파일의 image 경로는 자기 `accountId`에 맞게 바꿔 놓고 배포 한다

```sh
$ kubectl apply -f objects/deployment.yaml
```

## 5. eks에 service, ingress 배포

`Service` 타입이 LoadBalancer로 배포 하면 `elb` 생성(`nlb`로 생성 됨)되고, ingress로 생성 하면 `alb`가 생성되도록 셋팅 하였다.
여기선 그냥 `ingress` & `alb`로 설치

```sh
$ kubectl apply -f objects/service-ingress.yaml
$ kubectl apply -f objects/alb-ingress.yaml
```

> serivce 타입을 NodePort타입으로 하였지만 worker node로 생성된 NodePort 번호로는 직접 접근이 불가능하고, ingress(alb)를 거쳐야만 접근이 가능하다.

여기까지 하고 aws에서 리소스 프로비저닝(`alb` 생성)까지 끝나면 접근이 가능하다

### 5.1 배포 된 앱 확인

```sh
# 설치된 ingress 확인
$ kubectl get ingress
```

`ADDRESS` 주소가 생성 된 `alb` 주소가 된다.

# 기본적인 명령어

### 1. k8s 리소스 정보 확인

```sh
$ kubectl get {pod, deployment, svc, ingress 등등} -n joo -o wide # namespace(-n)는 생략 가능
```

- -n : namespace
- -o wide : 상세 정보 확인

### 2. pod 접근 및 url 요청

get 명령어로 pod name 및 private id 확인

```sh
$ kubectl get pods -o wide
```

특정 pod 직접 접근

```sh
$ kubectl exec -it {pod_name} -- /bin/sh
```

특정 pod로 url 요청

```sh
$ kubectl exec -it {pod_name} -- curl http://{pod_ip}
```

### 3. k8s 리소스 자세한 설명(에러 날 때 유용)

설치 된 ingress인 'aws-container-nginx-ingress' 확인 예시

```sh
$ kubectl describe ingress aws-container-nginx-ingress
```

당연히 다른 resource 들도 가능함

### 4. eks에 설치 가능한 addon 확인

k8s 명령어는 아니지만 설치해야할 addon 버전 확인할때 유용하다. 아래 명령어는 'aws-ebs-csi-driver' 에드온을 k8s 버전 `1.30`에 설치 할 때 설치 가능한 버전들을 보여준다.

```sh
$ aws eks describe-addon-versions --addon-name aws-ebs-csi-driver --kubernetes-version 1.30 --profile joo --region ap-northeast-2
```

### 5. 설치 된 resource 삭제

아래와 같이 `apply` 대신 `delete`로 바꿔서 실행하면 된다.

```sh
$ kubectl delete -f objects/service.yaml
```

## 실습 종료(설치 된 aws resource 들 삭제)

### 1. ecr 로그아웃

```sh
$ docker logout {account-id}.dkr.ecr.ap-northeast-2.amazonaws.com
```

### 2. kubeconfig clear context

현재 클러스터 확인 및 context clear

```sh
# 현재 활성화 된 context 확인
kubectl config get-contexts
kubectl config delete-context test_eks
```

생성 된 resource 정리는 `iac` 답게 `$ terraform destroy` 한방이면 되지만 alb는 terraform이 생성 한게 아닌 자신이 실습 과정에서 만든 resource 이므로 테라폼이 삭제를 못해서 에러 또는 타임아웃이 발생한다.
그래서 다른 k8s resource는 상관없지만 `ingress`는 삭제 처리해서 `elb`도 같이 지워줘야 한다

```sh
$ kubectl apply -f objects/alb-ingress.yaml
```

또 ecr에 저장된 image가 있으면 삭제가 안된다. 이걸 무시하는 옵션이 있긴하지만 에러 내용도 볼겸 구지 추가하진 않았다.
(image 삭제는 귀찮으니까 aws 콘솔에서 직접 삭제 처리)

그 외 terraform resource들은 destroy 하면 끝난다.

```sh
$ terraform destroy
```
