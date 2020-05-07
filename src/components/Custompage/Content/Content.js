// @flow strict
import React from 'react';
import type { Node as ReactNode } from 'react';
import styles from './Content.module.scss';

type Props = {
  title: string,
  children: ReactNode,
};

const Content = ({ children, title }: Props) => (
  <div className={styles['content']}>
    <h1 className={styles['content__title']}>{title}</h1>
    {children}
  </div>
);

export default Content;
