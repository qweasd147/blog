// @flow strict
import React from 'react';
import { Link } from 'gatsby';
import styles from './Menu.module.scss';

type Props = {
  menu: {
    label: string,
    path: string,
    count?: number,
    isCategory: boolean,
  }[],
};

const Menu = ({ menu }: Props) => (
  <nav className={styles['menu']}>
    <ul className={styles['menu__list']}>
      {menu.map(({ path, label, isCategory, count }) => (
        <li className={styles['menu__list-item']} key={path}>
          <Link
            to={path}
            className={styles['menu__list-item-link']}
            activeClassName={styles['menu__list-item-link--active']}
          >
            {isCategory ? `${label} (${count})` : `${label}`}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

export default Menu;
