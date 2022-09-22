import React, { RefObject, useEffect, useState } from "react";

import classNames from "classnames/bind";

import * as styles from "./SideButton.module.scss";

interface Props {
  buttonText: string;
  docTarget: RefObject<HTMLElement>;
  observeTarget: RefObject<HTMLElement>;
}

const toTop = (docTarget: RefObject<HTMLElement>): void => {
  docTarget.current?.scrollIntoView({ behavior: "smooth" });
};

/**
 * 문서가 너무 짧은지 여부
 * @param {*} docHeight window와 비교할 문서 높이
 */
const isTooShortDoc = (docHeight: number): boolean => {
  if (!docHeight) return false;

  /*
   * 현재 스크롤 위치 + view port height
   * const windowBottomY = window?.scrollY + window?.innerHeight;
   */
  const viewPortHeight = window?.innerHeight;

  if (!Number.isInteger(viewPortHeight)) return false;
  const viewPortPercent = (viewPortHeight / docHeight) * 100;

  // viewport보다 문서 길이가 너무 짧으면 true
  if (viewPortPercent < 80) {
    return false;
  }

  return true;
};

const SideButton = ({ buttonText, docTarget, observeTarget }: Props) => {
  const [isShow, setIsShow] = useState(false);
  const [isShowingMask, setIsShowingMask] = useState(false);
  const [isTooShort, setIsTooShort] = useState(false);

  useEffect(() => {
    const observer: IntersectionObserver = new IntersectionObserver(
      ([btnEntry]) => {
        setIsShowingMask(btnEntry.isIntersecting);
      },
    );

    if (observeTarget?.current) observer?.observe(observeTarget.current);

    return () => observer?.disconnect();
  }, [observeTarget.current]);

  useEffect(() => {
    const observer: ResizeObserver = new ResizeObserver(([docEntry]) => {
      const {
        contentRect: { height },
      } = docEntry;

      setIsTooShort(isTooShortDoc(height));
    });

    if (docTarget?.current) observer.observe(docTarget?.current);

    return () => observer?.disconnect();
  }, [docTarget.current]);

  useEffect(() => {
    if (isTooShort) {
      setIsShow(false);
    } else {
      setIsShow(isShowingMask);
    }
  }, [isTooShort, isShowingMask]);

  return (
    <div className={styles.sides}>
      <a
        className={classNames(styles.sidesButton, {
          [styles.sidesButtonHide]: !isShow,
        })}
        onClick={(e: React.MouseEvent): void => {
          e.preventDefault();
          toTop(docTarget);
        }}
      >
        {buttonText}
      </a>
    </div>
  );
};

export default SideButton;
