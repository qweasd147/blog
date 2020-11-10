// @flow strict
import React from 'react';
import Author from './Author';
import Contacts from './Contacts';
import Copyright from './Copyright';
import Menu from './Menu';
import styles from './Sidebar.module.scss';
import { useSiteMetadata, useCategoriesList } from '../../hooks';

type Props = {
  isIndex?: boolean,
};

const Sidebar = ({ isIndex }: Props) => {
  const { author, copyright, menu } = useSiteMetadata();
  const categories = useCategoriesList();

  const categoryMap = categories.reduce((acc, { fieldValue, totalCount }) => {
    return {
      ...acc,
      [fieldValue]: totalCount,
    };
  }, {});

  const menuWithCategoryInfo = menu.map(item => {
    const lowerCaseLabel = item.label.toLocaleLowerCase();

    const isCategory =
      item.path.startsWith('/category') && [lowerCaseLabel] in categoryMap;

    return {
      ...item,
      isCategory,
      count: isCategory ? categoryMap[lowerCaseLabel] : 0,
    };
  });

  return (
    <div className={styles['sidebar']}>
      <div className={styles['sidebar__inner']}>
        <Author author={author} isIndex={isIndex} />
        <Menu menu={menuWithCategoryInfo} />
        <Contacts contacts={author.contacts} />
        <Copyright copyright={copyright} />
      </div>
    </div>
  );
};

export default Sidebar;
