import React, { CSSProperties } from "react";

import { ICONS } from "@/constants";

import * as styles from "./Icon.module.scss";

interface Props {
  name: keyof typeof ICONS;
  icon: {
    viewBox?: string;
    path?: string;
  };
  textStyle?: CSSProperties;
}

const Icon: React.FC<Props> = ({ name, icon, textStyle }: Props) => (
  <svg className={styles.icon} viewBox={icon.viewBox} style={textStyle}>
    <title>{name}</title>
    <path d={icon.path} />
  </svg>
);

export default Icon;
