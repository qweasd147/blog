import React, { useRef, useEffect } from 'react';
import { Link } from 'gatsby';
import styles from './Skills.module.scss';
import Content from './Content';

const Skills = () => {
  const skillRef = useRef();

  useEffect(() => {
    skillRef.current.scrollIntoView();
  });

  return (
    <div className={styles['skills-layout']} ref={skillRef}>
      <Link className={styles['skills-layout__home-button']} to="/">
        전체
      </Link>
      <div>
        <div className={styles['post__content']}>
          <Content title="Skills">
            <div className={styles['skills-wrap']}>
              <div className={styles['skills']}>
                <h3 className={styles['skills__header']}>BackEnd</h3>
                <ul>
                  <h5 className={styles['skills__subtitle']}>Java</h5>
                  <li>
                    <span>Java 8</span>
                  </li>
                  <li>
                    <span>RxJava(현재 공부중)</span>
                  </li>
                  <h5 className={styles['skills__subtitle']}>Spring</h5>
                  <li>
                    <span>Spring boot</span>
                  </li>
                  <li>
                    <span>Spring Security</span>
                  </li>
                  <li>
                    <span>Spring Security OAuth2</span>
                  </li>
                  <li>
                    <span>Web Flux(현재 공부중)</span>
                  </li>
                  <h5 className={styles['skills__subtitle']}>NodeJS</h5>
                  <li>
                    <span>es8</span>
                  </li>
                </ul>
              </div>
              <div className={styles['skills']}>
                <h3 className={styles['skills__header']}>DB</h3>
                <ul>
                  <h5 className={styles['skills__subtitle']}>SQL</h5>
                  <li>
                    <span>Oracle</span>
                  </li>
                  <li>
                    <span>My SQL</span>
                  </li>
                  <li>
                    <span>mariaDB</span>
                  </li>
                </ul>
                <ul>
                  <h5 className={styles['skills__subtitle']}>NO SQL</h5>
                  <li>
                    <span>DynamoDB(AWS)</span>
                  </li>
                  <li>
                    <span>Mongo DB</span>
                  </li>
                  <li>
                    <span>ElasticSearch</span>
                  </li>
                  <li>
                    <span>Redis</span>
                  </li>
                </ul>
              </div>
              <div className={styles['skills']}>
                <h3 className={styles['skills__header']}>AWS</h3>
                <ul>
                  <h5 className={styles['skills__subtitle']}>EC2</h5>
                  <h5 className={styles['skills__subtitle']}>S3</h5>
                  <h5 className={styles['skills__subtitle']}>SES</h5>
                  <h5 className={styles['skills__subtitle']}>DynamoDB</h5>
                </ul>
              </div>
              <div className={styles['skills']}>
                <h3 className={styles['skills__header']}>
                  Serverless Framework
                </h3>
                <ul>
                  <h5 className={styles['skills__subtitle']}>AWS</h5>
                  <li>
                    <span>Lambda</span>
                  </li>
                  <li>
                    <span>CloudWatch</span>
                  </li>
                  <li>
                    <span>API Gateway</span>
                  </li>
                </ul>
              </div>
              <div className={styles['skills']}>
                <h3 className={styles['skills__header']}>Etc</h3>
                <ul>
                  <h5 className={styles['skills__subtitle']}>docker</h5>
                  <h5 className={styles['skills__subtitle']}>버전관리</h5>
                  <li>
                    <span>Git</span>
                  </li>
                  <li>
                    <span>Git flow</span>
                  </li>
                  <li>
                    <span>SVN</span>
                  </li>
                  <li>
                    <span>bitbucket(git)</span>
                  </li>
                  <h5 className={styles['skills__subtitle']}>slack</h5>
                </ul>
              </div>
            </div>
          </Content>
        </div>
      </div>
    </div>
  );
};

export default Skills;
