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
    const currentY = window?.scrollY;

    if (!Number.isInteger(currentY)) return;

    const documentY = refTarget.current.clientHeight;
    const currentPercent = (currentY / documentY) * 100;

    if (currentPercent > 80) {
      setIsShow(true);
    } else {
      setIsShow(false);
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
