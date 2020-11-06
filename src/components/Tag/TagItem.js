import React from 'react';
import { navigate } from 'gatsby';
import styles from './Tag.module.scss';

type Props = {
  to: string,
  name: string,
  count: number,
};

const tagOnClick = (e: React.MouseEvent<HTMLElement>, link: string) => {
  e.preventDefault();
  navigate(link);
};

const TagItem = ({ to, name, count }: Props) => (
  <a className={styles['tags__tag']} onClick={e => tagOnClick(e, to)}>
    {name} ({count})
  </a>
);

export default TagItem;
