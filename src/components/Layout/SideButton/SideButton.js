// @flow strict
import React, { useState, useEffect } from 'react';
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
 * @param {*} docTarget window와 비교할 문서
 */
const isTooShort = (docTarget: RefObject<HTMLDivElement>): boolean => {
  const windowBottomY = window?.scrollY + window?.innerHeight;

  if (!Number.isInteger(windowBottomY)) return false;

  const documentY = docTarget.current.clientHeight;
  const currentPercent = (windowBottomY / documentY) * 100;

  // 전체 문서 길이가 너무 짧으면 버튼 그냥 생략
  if (currentPercent < 20 || currentPercent < 80) {
    return false;
  }

  return true;
};

const SideButton = ({ buttonText, docTarget, observeTarget }: Props) => {
  const [isShow, setIsShow] = useState(false);
  const [isInitObserver, setIsInitObserver] = useState(false);

  useEffect(() => {
    const observeEl = observeTarget?.current;
    let observer: IntersectionObserver;

    if (!isInitObserver && observeEl) {
      setIsInitObserver(true);
      observer = new IntersectionObserver(
        ([btnEntry]) => {
          if (isTooShort(docTarget)) {
            setIsShow(false);
          } else {
            setIsShow(btnEntry.isIntersecting);
          }
        },
        /*
        {
          threshold: 0.1,
        },
        */
      );

      observer.observe(observeEl);
    }
    return () => observer?.disconnect();
  }, []);

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
