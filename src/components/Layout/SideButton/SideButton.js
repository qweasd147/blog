// @flow strict
import React, { useState, useEffect } from 'react';
import styles from './SideButton.module.scss';
import classNames from 'classnames/bind';

type Props = {
  buttonText: string,
  refTarget: RefObject<HTMLDivElement>,
};

const cx = classNames.bind(styles);

const toTop = (refTarget: RefObject<HTMLDivElement>) => {
  refTarget.current.scrollIntoView({ behavior: 'smooth' });
};

const SideButton = ({ buttonText, refTarget }: Props) => {
  const [isShow, setIsShow] = useState(false);

  const handleScroll = () => {
    const windowBottomY = window?.scrollY + window?.innerHeight;

    if (!Number.isInteger(windowBottomY)) return;

    const documentY = refTarget.current.clientHeight;
    const currentPercent = (windowBottomY / documentY) * 100;

    // 전체 문서 길이가 너무 짧으면 버튼 그냥 생략
    if (currentPercent < 20 || currentPercent < 80) {
      setIsShow(false);
    } else {
      setIsShow(true);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const buttonClassName = cx({
    'sides-button': true,
    'sides-button-hide': !isShow,
  });

  return (
    <div className={styles['sides']}>
      <a
        className={buttonClassName}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          toTop(refTarget);
        }}
      >
        {buttonText}
      </a>
    </div>
  );
};

export default SideButton;
