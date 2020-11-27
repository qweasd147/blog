// @flow strict
import React, { RefObject, useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './SideButton.module.scss';

type Props = {
  buttonText: string,
  docTarget: RefObject<HTMLDivElement>,
  observeTarget: RefObject<HTMLDivElement>,
};

const cx = classNames.bind(styles);

const toTop = (docTarget: RefObject<HTMLDivElement>): void => {
  docTarget.current.scrollIntoView({ behavior: 'smooth' });
};

/**
 * 문서가 너무 짧은지 여부
 * @param {*} docHeight window와 비교할 문서 높이
 */
const isTooShortDoc = (docHeight: number): boolean => {
  if (!docHeight) return false;

  const windowBottomY = window?.scrollY + window?.innerHeight;

  if (!Number.isInteger(windowBottomY)) return false;
  const currentPercent = (windowBottomY / docHeight) * 100;

  // 전체 문서 길이가 너무 짧으면 버튼 그냥 생략
  if (currentPercent < 20 || currentPercent < 80) {
    return false;
  }

  return true;
};

const SideButton = ({ buttonText, docTarget, observeTarget }: Props) => {
  const [isShow, setIsShow] = useState(false);
  const [isShowingMask, setIsShowingMask] = useState(false);
  const [isTooShort, setIsTooShort] = useState(false);

  useEffect(() => {
    const observeEl = observeTarget?.current;
    const observer: IntersectionObserver = new IntersectionObserver(
      ([btnEntry]) => {
        setIsShowingMask(btnEntry.isIntersecting);
      },
    );

    observer.observe(observeEl);

    return () => observer?.disconnect();
  }, []);

  useEffect(() => {
    const docObserveEl = docTarget?.current;

    const observer: ResizeObserver = new ResizeObserver(
      ([{ contentRect: { height } } = docEntry]) => {
        setIsTooShort(isTooShortDoc(height));
      },
    );

    observer.observe(docObserveEl);

    return () => observer?.disconnect();
  }, []);

  useEffect(() => {
    if (isTooShort) {
      setIsShow(false);
    } else {
      setIsShow(isShowingMask);
    }
  }, [isTooShort, isShowingMask]);

  return (
    <div className={styles['sides']}>
      <a
        className={cx({
          'sides-button': true,
          'sides-button-hide': !isShow,
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
