import React, { useEffect, useRef } from "react";

import { Link } from "gatsby";

import Content from "./Content";

import * as styles from "./Skills.module.scss";

interface Props {
  mainName: String;
  mainTrees?: {
    subName: String;
    subTrees?: String[];
  }[];
}

const skillData: Props[] = [
  {
    mainName: "BackEnd",
    mainTrees: [
      { subName: "Java", subTrees: ["Java 8", "RxJava(현재 공부중)"] },
      {
        subName: "Spring",
        subTrees: [
          "Spring boot",
          "Spring Security",
          "Spring Security OAuth2",
          "Spring Cloud",
          "Web Flux(현재 공부중)",
        ],
      },
      {
        subName: "NodeJS",
        subTrees: ["Express", "Koa", "ES8"],
      },
    ],
  },
  {
    mainName: "DB",
    mainTrees: [
      { subName: "SQL", subTrees: ["Oracle", "MySQL", "MariaDB"] },
      {
        subName: "NoSQL",
        subTrees: ["DynamoDB(AWS)", "MongoDB", "ElasticSearch", "Redis"],
      },
    ],
  },
  {
    mainName: "AWS",
    mainTrees: [
      { subName: "EC2" },
      { subName: "S3" },
      { subName: "SES" },
      { subName: "DynamoDB" },
      { subName: "ECR" },
      { subName: "CloudFront" },
    ],
  },
  {
    mainName: "Serverless Framework",
    mainTrees: [
      {
        subName: "AWS",
        subTrees: ["Lambda", "CloudWatch", "API Gateway", "X-Ray"],
      },
    ],
  },
  {
    mainName: "FrontEnd",
    mainTrees: [
      { subName: "React", subTrees: ["코드만 읽을 수 있는 수준"] },
      { subName: "JQuery" },
    ],
  },
  {
    mainName: "Etc",
    mainTrees: [
      { subName: "docker", subTrees: ["docker-compose"] },
      {
        subName: "버전관리",
        subTrees: ["Git", "Git flow", "SVN", "bitbucket(git)"],
      },
      { subName: "slack" },
    ],
  },
];

const toSkillComponent = (mainProps: Props[]) =>
  mainProps.map(({ mainName, mainTrees }, mainIdx) => (
    <div className={styles.skills} key={`${mainName}-${mainIdx}`}>
      <h3 className={styles.skills__header}>{mainName}</h3>
      <div className={styles.skills__container}>
        {mainTrees?.map(({ subName, subTrees }, mainModuleIdx) => (
          <div key={`${subName}-${mainModuleIdx}`}>
            <h5 className={styles.skills__subtitle}>{subName}</h5>
            {subTrees && (
              <ul>
                {subTrees.map((subModule, subModuleIdx) => (
                  <li key={`${subModule}-${subModuleIdx}`}>
                    <span>{subModule}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  ));

const Skills = () => {
  const skillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    skillRef?.current?.scrollIntoView();
  });

  return (
    <div className={styles.skillsLayout} ref={skillRef}>
      <Link className={styles.skillsLayout__backButton} to="/">
        전체
      </Link>
      <div>
        <div>
          <Content title="Skills">
            <div className={styles.skillsWrap}>
              {toSkillComponent(skillData)}
            </div>
          </Content>
        </div>
      </div>
    </div>
  );
};

export default Skills;
