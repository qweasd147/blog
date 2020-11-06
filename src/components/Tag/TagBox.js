import React from 'react';
import styles from './Tag.module.scss';

const TagBox = ({ children }) => (
  <div className={styles['tags']}>{children}</div>
);

export default TagBox;
