import React from "react";

import * as styles from "./Tags.module.scss";

interface Props {
  children: React.ReactNode;
}

const TagBox: React.FC<Props> = ({ children }) => (
  <div className={styles.tags}>{children}</div>
);

export default TagBox;
