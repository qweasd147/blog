import { ShouldUpdateScrollArgs } from "gatsby";

import "./src/assets/scss/main.scss";

export const shouldUpdateScroll = ({
  routerProps,
}: ShouldUpdateScrollArgs): boolean => {
  const { shouldUpdateScroll: shouldUpdate } = routerProps.location.state;

  return shouldUpdate;
};
