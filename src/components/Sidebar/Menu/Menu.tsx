import React from "react";

import { Link } from "gatsby";

import * as styles from "./Menu.module.scss";

type Props = {
  menu: Array<{
    label: string;
    path: string;
    count?: number;
    isCategory: boolean;
  }>;
};

const Menu: React.FC<Props> = ({ menu }: Props) => (
  <nav className={styles.menu}>
    <ul className={styles.list}>
      {menu.map(({ path, label, isCategory, count }) => (
        <li className={styles.item} key={path}>
          <Link
            to={path}
            className={styles.link}
            activeClassName={styles.active}
          >
            {isCategory ? `${label} (${count})` : `${label}`}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

export default Menu;
