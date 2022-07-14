import React from "react";

import { useCategoriesList, useSiteMetadata } from "@/hooks";

import { Author } from "./Author";
import { Contacts } from "./Contacts";
import { Copyright } from "./Copyright";
import { Menu } from "./Menu";

import * as styles from "./Sidebar.module.scss";

type Props = {
  isIndex?: boolean;
};

const Sidebar = ({ isIndex }: Props) => {
  const { author, copyright, menu } = useSiteMetadata();
  const categories: {
    fieldValue: string;
    totalCount: number;
  }[] = useCategoriesList();

  const categoryMap: {
    [key: string]: number;
  } = categories.reduce(
    (acc, { fieldValue, totalCount }) => ({
      ...acc,
      [fieldValue]: totalCount,
    }),
    {},
  );

  const menuWithCategoryInfo: {
    label: string;
    path: string;
    count: number;
    isCategory: boolean;
  }[] = menu.map((item: { label: string; path: string }) => {
    const lowerCaseLabel = item.label.toLocaleLowerCase();

    const isCategory =
      item.path.startsWith("/category") && lowerCaseLabel in categoryMap;

    return {
      ...item,
      isCategory,
      count: isCategory ? categoryMap[lowerCaseLabel] : 0,
    };
  });

  return (
    <div className={styles.sidebar}>
      <div className={styles.inner}>
        <Author author={author} isIndex={isIndex} />
        <Menu menu={menuWithCategoryInfo} />
        <Contacts contacts={author.contacts} />
        <Copyright copyright={copyright} />
      </div>
    </div>
  );
};

export default Sidebar;
