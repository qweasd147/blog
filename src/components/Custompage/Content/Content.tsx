import React from "react";

import * as styles from "./Content.module.scss";

interface Props {
  title: string;
  children: React.ReactNode;
}

const Content = ({ children, title }: Props) => (
  <div className={styles.content}>
    <h1 className={styles.content__title}>{title}</h1>
    {children}
  </div>
);

export default Content;
